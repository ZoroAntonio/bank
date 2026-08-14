import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

type CrmRole = "customer" | "agent" | "superior_manager" | "admin";
type KycStatus = "pending" | "submitted" | "approved" | "rejected";
type AdminClient = ReturnType<typeof createClient>;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCrmRole(value: unknown, isAdmin: boolean): CrmRole {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["customer", "agent", "superior_manager", "admin"].includes(normalized)) {
      return normalized as CrmRole;
    }
  }

  return isAdmin ? "admin" : "customer";
}

function normalizeKycStatus(value: unknown): KycStatus {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["pending", "submitted", "approved", "rejected"].includes(normalized)) {
      return normalized as KycStatus;
    }
  }

  return "pending";
}

function normalizeOptionalUuid(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : undefined;
}

function cleanIpAddress(value: string | null) {
  if (!value) return null;

  let address = value.split(",")[0]?.trim() ?? "";
  if (!address) return null;

  if (address.startsWith("[") && address.includes("]")) {
    address = address.slice(1, address.indexOf("]"));
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(address)) {
    address = address.slice(0, address.lastIndexOf(":"));
  }

  address = address.split("%")[0].toLowerCase();
  if (address.startsWith("::ffff:")) address = address.slice(7);

  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(address) &&
    address.split(".").every((part) => Number(part) <= 255);
  const isIpv6 = address.includes(":") && /^[0-9a-f:]+$/.test(address);

  return isIpv4 || isIpv6 ? address : null;
}

async function removeKycDocuments(adminClient: AdminClient, userId: string) {
  const bucket = adminClient.storage.from("kyc-documents");
  const paths: string[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await bucket.list(userId, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) return error.message;

    const entries = data ?? [];
    paths.push(
      ...entries
        .filter((entry) => entry.name && entry.name !== ".emptyFolderPlaceholder")
        .map((entry) => `${userId}/${entry.name}`),
    );

    if (entries.length < pageSize) break;
    offset += pageSize;
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await bucket.remove(paths.slice(index, index + 100));
    if (error) return error.message;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SB_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey =
      Deno.env.get("SB_SECRET_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SERVICE_ROLE_KEY");
    const missingEnv = [
      !supabaseUrl ? "SUPABASE_URL" : null,
      !supabaseAnonKey ? "SUPABASE_ANON_KEY" : null,
      !supabaseServiceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);

    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    if (missingEnv.length > 0) {
      return jsonResponse(
        { error: `Missing function environment configuration: ${missingEnv.join(", ")}` },
        500,
      );
    }

    const callerClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("crm_role, is_admin, assigned_manager_id")
      .eq("id", caller.id)
      .maybeSingle();

    const callerRole = normalizeCrmRole(
      callerProfile?.crm_role,
      Boolean(callerProfile?.is_admin),
    );

    if (callerProfileError || !["admin", "superior_manager", "agent"].includes(callerRole)) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const clientIp = cleanIpAddress(req.headers.get("x-forwarded-for"));
    const { data: accessSettings, error: accessSettingsError } = await adminClient
      .from("crm_ip_access_settings")
      .select("enabled")
      .eq("id", true)
      .maybeSingle();

    if (accessSettingsError) {
      return jsonResponse(
        { error: `Could not load CRM IP access settings: ${accessSettingsError.message}` },
        500,
      );
    }

    const { count: whitelistCount, error: whitelistCountError } = await adminClient
      .from("crm_ip_whitelist")
      .select("id", { count: "exact", head: true });

    if (whitelistCountError) {
      return jsonResponse(
        { error: `Could not check the CRM IP whitelist: ${whitelistCountError.message}` },
        500,
      );
    }

    const ipCheckEnabled = accessSettings?.enabled ?? true;

    if (ipCheckEnabled && (whitelistCount ?? 0) > 0) {
      if (!clientIp) {
        return jsonResponse({ error: "This IP address is not allowed to access the CRM" }, 403);
      }

      const { data: matchingIp, error: matchingIpError } = await adminClient
        .from("crm_ip_whitelist")
        .select("id")
        .eq("ip_address", clientIp)
        .maybeSingle();

      if (matchingIpError) {
        return jsonResponse(
          { error: `Could not verify the CRM IP whitelist: ${matchingIpError.message}` },
          500,
        );
      }

      if (!matchingIp) {
        return jsonResponse({ error: "This IP address is not allowed to access the CRM" }, 403);
      }
    }

    const payload = await req.json();
    const action = typeof payload.action === "string" ? payload.action : "update";

    if (action === "create") {
      const email = typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : "";
      const password = typeof payload.password === "string" ? payload.password : "";
      const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
      const accountIban = typeof payload.account_iban === "string"
        ? payload.account_iban.trim().toUpperCase()
        : "";
      const crmRole = normalizeCrmRole(payload.crm_role, false);
      const kycStatus = normalizeKycStatus(payload.kyc_status);
      const emailConfirmed = payload.email_confirm !== false;
      const requestedAccountCreatedAt = typeof payload.account_created_at === "string"
        ? payload.account_created_at.trim()
        : "";
      const accountCreatedAt = requestedAccountCreatedAt || new Date().toISOString();
      const showAccountCreatedAt = payload.show_account_created_at !== false;
      let assignedManagerId = normalizeOptionalUuid(payload.assigned_manager_id);
      let assignedAgentId = normalizeOptionalUuid(payload.assigned_agent_id);

      if (callerRole === "agent" && crmRole !== "customer") {
        return jsonResponse({ error: "Agents can create customer accounts only" }, 403);
      }

      if (
        callerRole === "superior_manager" &&
        crmRole !== "customer" &&
        crmRole !== "agent"
      ) {
        return jsonResponse({ error: "Superior managers can create agents and customers only" }, 403);
      }

      if (!fullName) {
        return jsonResponse({ error: "Full name is required" }, 400);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: "Enter a valid email address" }, 400);
      }

      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      if (Number.isNaN(Date.parse(accountCreatedAt))) {
        return jsonResponse({ error: "Choose a valid account creation date" }, 400);
      }

      if (assignedManagerId === undefined || assignedAgentId === undefined) {
        return jsonResponse({ error: "A hierarchy assignment contains an invalid user ID" }, 400);
      }

      // Staff-created accounts are always attached to the caller's scope. Do
      // not trust hierarchy IDs supplied by the browser for these roles.
      if (callerRole === "agent") {
        assignedManagerId = callerProfile?.assigned_manager_id ?? null;
        assignedAgentId = caller.id;
      } else if (callerRole === "superior_manager") {
        assignedManagerId = caller.id;
        assignedAgentId = crmRole === "customer" ? assignedAgentId : null;
      } else if (crmRole === "admin" || crmRole === "superior_manager") {
        assignedManagerId = null;
        assignedAgentId = null;
      } else if (crmRole === "agent") {
        assignedAgentId = null;
      }

      const assignmentIds = Array.from(
        new Set([assignedManagerId, assignedAgentId].filter((value): value is string => Boolean(value))),
      );
      const assignmentProfiles = new Map<string, {
        crm_role: unknown;
        is_admin: boolean | null;
        assigned_manager_id: string | null;
      }>();

      if (assignmentIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await adminClient
          .from("profiles")
          .select("id, crm_role, is_admin, assigned_manager_id")
          .in("id", assignmentIds);

        if (assignmentsError) {
          return jsonResponse({ error: `Could not validate CRM assignments: ${assignmentsError.message}` }, 400);
        }

        for (const assignment of assignments ?? []) {
          assignmentProfiles.set(assignment.id, assignment);
        }

        if (assignmentProfiles.size !== assignmentIds.length) {
          return jsonResponse({ error: "One or more CRM assignments no longer exist" }, 400);
        }
      }

      if (assignedManagerId) {
        const manager = assignmentProfiles.get(assignedManagerId);
        const managerRole = normalizeCrmRole(manager?.crm_role, Boolean(manager?.is_admin));
        if (managerRole !== "superior_manager") {
          return jsonResponse({ error: "The assigned manager must have the Superior Manager role" }, 400);
        }
      }

      if (assignedAgentId) {
        const agent = assignmentProfiles.get(assignedAgentId);
        const agentRole = normalizeCrmRole(agent?.crm_role, Boolean(agent?.is_admin));
        if (agentRole !== "agent") {
          return jsonResponse({ error: "The assigned agent must have the Agent role" }, 400);
        }

        if (!assignedManagerId && agent?.assigned_manager_id) {
          assignedManagerId = agent.assigned_manager_id;
        } else if (
          assignedManagerId &&
          agent?.assigned_manager_id &&
          assignedManagerId !== agent.assigned_manager_id
        ) {
          return jsonResponse({ error: "The assigned agent belongs to a different superior manager" }, 400);
        }

        if (
          callerRole === "superior_manager" &&
          agent?.assigned_manager_id !== caller.id
        ) {
          return jsonResponse({ error: "Superior managers can assign only their own agents" }, 403);
        }
      }

      const { data: createdAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: emailConfirmed,
        user_metadata: {
          full_name: fullName,
          crm_role: crmRole,
        },
      });

      if (createAuthError || !createdAuthData.user) {
        const message = createAuthError?.message || "Supabase Auth did not return the created user";
        const status = message.toLowerCase().includes("already") ? 409 : 400;
        return jsonResponse({ error: message }, status);
      }

      const createdUser = createdAuthData.user;
      const { data: createdProfile, error: profileError } = await adminClient
        .from("profiles")
        .upsert({
          id: createdUser.id,
          full_name: fullName,
          email,
          account_iban: accountIban,
          kyc_status: kycStatus,
          crm_role: crmRole,
          is_admin: crmRole === "admin",
          assigned_manager_id: assignedManagerId,
          assigned_agent_id: assignedAgentId,
          plain_password: password,
          created_at: accountCreatedAt,
          show_account_created_at: showAccountCreatedAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select("id, full_name, email, account_iban, created_at, updated_at, kyc_status, crm_role, is_admin, assigned_manager_id, assigned_agent_id, plain_password, show_account_created_at")
        .single();

      if (profileError || !createdProfile) {
        const { error: rollbackError } = await adminClient.auth.admin.deleteUser(createdUser.id, false);
        return jsonResponse({
          error: `User profile creation failed: ${profileError?.message || "No profile was returned"}`,
          rollback_warning: rollbackError?.message || null,
        }, 500);
      }

      return jsonResponse({
        success: true,
        action: "create",
        user: {
          id: createdUser.id,
          email: createdUser.email,
          email_confirmed: Boolean(createdUser.email_confirmed_at),
        },
        profile: createdProfile,
      }, 201);
    }

    const targetUserId = typeof payload.user_id === "string" ? payload.user_id.trim() : "";

    if (!targetUserId) {
      return jsonResponse({ error: "user_id is required" }, 400);
    }

    const { data: visibleTarget, error: visibleTargetError } = await callerClient
      .from("profiles")
      .select("id, email, full_name, crm_role, is_admin")
      .eq("id", targetUserId)
      .maybeSingle();

    if (visibleTargetError || !visibleTarget) {
      return jsonResponse({ error: "You do not have access to that user" }, 403);
    }

    if (action === "delete") {
      if (callerRole !== "admin") {
        return jsonResponse({ error: "Only CRM administrators can permanently delete users" }, 403);
      }

      if (targetUserId === caller.id) {
        return jsonResponse({ error: "You cannot delete your own administrator account" }, 409);
      }

      const confirmation = typeof payload.confirm_email === "string"
        ? payload.confirm_email.trim().toLowerCase()
        : "";
      const expectedConfirmation = String(visibleTarget.email || visibleTarget.id)
        .trim()
        .toLowerCase();

      if (!confirmation || confirmation !== expectedConfirmation) {
        return jsonResponse({ error: "The deletion confirmation does not match the selected user" }, 400);
      }

      const targetRole = normalizeCrmRole(
        visibleTarget.crm_role,
        Boolean(visibleTarget.is_admin),
      );

      if (targetRole === "admin") {
        const { data: profiles, error: profilesError } = await adminClient
          .from("profiles")
          .select("crm_role, is_admin");

        if (profilesError) {
          return jsonResponse({ error: `Could not verify administrator coverage: ${profilesError.message}` }, 500);
        }

        const administratorCount = (profiles ?? []).filter(
          (profile) => normalizeCrmRole(profile.crm_role, Boolean(profile.is_admin)) === "admin",
        ).length;

        if (administratorCount <= 1) {
          return jsonResponse({ error: "The last CRM administrator cannot be deleted" }, 409);
        }
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        targetUserId,
        false,
      );

      if (deleteError) {
        return jsonResponse(
          {
            error: `User deletion failed: ${deleteError.message}`,
            hint: "Apply the cascade-user-account-deletion migration before retrying.",
          },
          409,
        );
      }

      const storageCleanupWarning = await removeKycDocuments(adminClient, targetUserId);

      return jsonResponse({
        success: true,
        action: "delete",
        storage_cleanup_warning: storageCleanupWarning,
        deleted_user: {
          id: targetUserId,
          email: visibleTarget.email,
          full_name: visibleTarget.full_name,
        },
      });
    }

    if (action !== "update") {
      return jsonResponse({ error: "Unsupported user-management action" }, 400);
    }

    const email = typeof payload.email === "string" ? payload.email.trim() : undefined;
    const password = typeof payload.password === "string" ? payload.password : undefined;
    const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : undefined;
    const updatePayload: {
      email?: string;
      password?: string;
      user_metadata?: { full_name?: string };
    } = {};

    if (email) updatePayload.email = email;
    if (password && password.trim().length > 0) updatePayload.password = password;
    if (fullName) updatePayload.user_metadata = { full_name: fullName };

    if (Object.keys(updatePayload).length === 0) {
      return jsonResponse({ error: "No auth fields supplied for update" }, 400);
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      updatePayload,
    );

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    let profileSyncWarning: string | null = null;

    if (password && password.trim().length > 0) {
      const { error: profileSyncError } = await adminClient
        .from("profiles")
        .update({
          plain_password: password,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (profileSyncError) {
        profileSyncWarning = profileSyncError.message;
        console.error("Failed to sync profiles.plain_password", profileSyncError);
      }
    }

    return jsonResponse({
      success: true,
      action: "update",
      profile_sync_warning: profileSyncWarning,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 500);
  }
});
