import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

type CrmRole = "customer" | "agent" | "superior_manager" | "admin";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCrmRole(value: unknown, isAdmin: boolean): CrmRole {
  if (isAdmin) return "admin";

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["customer", "agent", "superior_manager", "admin"].includes(normalized)) {
      return normalized as CrmRole;
    }
  }

  return "customer";
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

function getClientIp(req: Request) {
  // Supabase's edge gateway populates X-Forwarded-For. Do not fall back to
  // client-controlled forwarding headers for this authorization decision.
  return cleanIpAddress(req.headers.get("x-forwarded-for"));
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
    const serviceRoleKey =
      Deno.env.get("SB_SECRET_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SERVICE_ROLE_KEY");

    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: "IP access service is not configured" }, 500);
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("crm_role, is_admin")
      .eq("id", caller.id)
      .maybeSingle();

    const callerRole = normalizeCrmRole(
      callerProfile?.crm_role,
      Boolean(callerProfile?.is_admin),
    );

    if (profileError || !["admin", "superior_manager", "agent"].includes(callerRole)) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const clientIp = getClientIp(req);
    const { data: accessSettings, error: settingsError } = await adminClient
      .from("crm_ip_access_settings")
      .select("enabled")
      .eq("id", true)
      .maybeSingle();

    if (settingsError) {
      return jsonResponse({ error: `Could not load IP access settings: ${settingsError.message}` }, 500);
    }

    const { count, error: countError } = await adminClient
      .from("crm_ip_whitelist")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return jsonResponse({ error: `Could not check the IP whitelist: ${countError.message}` }, 500);
    }

    const ipCheckEnabled = accessSettings?.enabled ?? true;
    const whitelistConfigured = (count ?? 0) > 0;
    const enforcementEnabled = ipCheckEnabled && whitelistConfigured;
    let allowed = !enforcementEnabled;
    let matchingEntryId: string | null = null;

    if (whitelistConfigured && clientIp) {
      const { data: matchingEntry, error: matchError } = await adminClient
        .from("crm_ip_whitelist")
        .select("id")
        .eq("ip_address", clientIp)
        .maybeSingle();

      if (matchError) {
        return jsonResponse({ error: `Could not verify this IP address: ${matchError.message}` }, 500);
      }

      matchingEntryId = matchingEntry?.id ?? null;
      if (enforcementEnabled) allowed = Boolean(matchingEntryId);
    }

    const requestBody = await req.json().catch(() => ({}));
    const action = typeof requestBody.action === "string" ? requestBody.action : "status";

    if (action === "status") {
      return jsonResponse({
        allowed,
        current_ip: clientIp,
        ip_check_enabled: ipCheckEnabled,
        enforcement_enabled: enforcementEnabled,
      });
    }

    if (callerRole !== "admin") {
      return jsonResponse({ error: "Only CRM administrators can manage the IP whitelist" }, 403);
    }

    if (!allowed) {
      return jsonResponse({ error: "This IP address is not allowed to manage the CRM" }, 403);
    }

    if (action === "set_enabled") {
      if (typeof requestBody.enabled !== "boolean") {
        return jsonResponse({ error: "enabled must be true or false" }, 400);
      }

      if (requestBody.enabled && !whitelistConfigured) {
        return jsonResponse({ error: "Add at least one IP address before turning on IP checks" }, 409);
      }

      if (requestBody.enabled && !matchingEntryId) {
        return jsonResponse(
          { error: "Add your current IP address before turning on IP checks" },
          409,
        );
      }

      const { data, error } = await adminClient
        .from("crm_ip_access_settings")
        .upsert({
          id: true,
          enabled: requestBody.enabled,
          updated_by: caller.id,
          updated_at: new Date().toISOString(),
        })
        .select("enabled, updated_at")
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({
        success: true,
        ip_check_enabled: data.enabled,
        enforcement_enabled: data.enabled && whitelistConfigured,
      });
    }

    if (action === "list") {
      const { data, error } = await adminClient
        .from("crm_ip_whitelist")
        .select("id, ip_address, label, created_at, created_by")
        .order("created_at", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({
        entries: data ?? [],
        current_ip: clientIp,
        ip_check_enabled: ipCheckEnabled,
        enforcement_enabled: enforcementEnabled,
      });
    }

    if (action === "add") {
      const requestedIp = cleanIpAddress(
        typeof requestBody.ip_address === "string" ? requestBody.ip_address : null,
      );
      const label = typeof requestBody.label === "string"
        ? requestBody.label.trim().slice(0, 100)
        : "";

      if (!requestedIp) {
        return jsonResponse({ error: "Enter a valid IPv4 or IPv6 address" }, 400);
      }

      if (!whitelistConfigured && (!clientIp || requestedIp !== clientIp)) {
        return jsonResponse(
          { error: "The first whitelist entry must be your current IP address" },
          409,
        );
      }

      const { data, error } = await adminClient
        .from("crm_ip_whitelist")
        .insert({ ip_address: requestedIp, label, created_by: caller.id })
        .select("id, ip_address, label, created_at, created_by")
        .single();

      if (error) {
        const duplicate = error.code === "23505";
        return jsonResponse(
          { error: duplicate ? "That IP address is already allowed" : error.message },
          duplicate ? 409 : 400,
        );
      }

      return jsonResponse({ entry: data }, 201);
    }

    if (action === "delete") {
      const entryId = typeof requestBody.id === "string" ? requestBody.id.trim() : "";
      if (!entryId) return jsonResponse({ error: "Whitelist entry ID is required" }, 400);

      const { data: entry, error: entryError } = await adminClient
        .from("crm_ip_whitelist")
        .select("id, ip_address")
        .eq("id", entryId)
        .maybeSingle();

      if (entryError) return jsonResponse({ error: entryError.message }, 500);
      if (!entry) return jsonResponse({ error: "Whitelist entry not found" }, 404);

      if (ipCheckEnabled && entry.id === matchingEntryId) {
        return jsonResponse(
          { error: "You cannot remove the IP address used by your current session" },
          409,
        );
      }

      const { error } = await adminClient
        .from("crm_ip_whitelist")
        .delete()
        .eq("id", entryId);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 500);
  }
});
