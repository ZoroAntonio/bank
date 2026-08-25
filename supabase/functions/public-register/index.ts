import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Registration service is not configured" }, 500);
    }

    const payload = await req.json();
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    const loginPin = typeof payload.login_pin === "string" ? payload.login_pin : "";
    const fullName =
      typeof payload.full_name === "string" ? payload.full_name.trim() : "";

    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "Enter an email-shaped login, such as name@example.com" }, 400);
    }

    if (password.length < 6) {
      return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
    }

    if (!/^\d{4}$/.test(loginPin)) {
      return jsonResponse({ error: "PIN must contain exactly 4 digits" }, 400);
    }

    if (!fullName) {
      return jsonResponse({ error: "Full name is required" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: createdAuthData, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      const status = error.message.toLowerCase().includes("already") ? 409 : 400;
      return jsonResponse({ error: error.message }, status);
    }

    const createdUser = createdAuthData.user;
    if (!createdUser) {
      return jsonResponse({ error: "Account creation did not return a user" }, 500);
    }

    const { error: pinError } = await adminClient.rpc("set_client_login_pin", {
      p_user_id: createdUser.id,
      p_pin: loginPin,
    });

    if (pinError) {
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(createdUser.id, false);
      return jsonResponse({
        error: `Account PIN setup failed: ${pinError.message}`,
        rollback_warning: rollbackError?.message ?? null,
      }, 500);
    }

    return jsonResponse({ success: true }, 201);
  } catch {
    return jsonResponse({ error: "Unable to create account" }, 500);
  }
});
