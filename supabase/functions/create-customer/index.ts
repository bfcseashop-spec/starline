import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

function jsonResponse(body: { success?: boolean; user_id?: string; error?: string }, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? serviceRoleKey);
    const { data: { user: caller } } = await callerClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleCheck) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { email, password, full_name, phone, address, project_name, total_amount, down_payment, paid_amount, installment_amount } = body;

    if (!email || typeof email !== "string" || email.length > 255) {
      return jsonResponse({ error: "Valid email is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6 || password.length > 72) {
      return jsonResponse({ error: "Password must be 6-72 characters" }, 400);
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: (full_name || "").trim() },
    });

    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }

    // Update profile with extra info (trigger already creates profile + customer role)
    if (phone || address) {
      await supabase.from("profiles").update({
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      }).eq("user_id", newUser.user.id);
    }

    // Create project if project_name is provided
    if (project_name && typeof project_name === "string" && project_name.trim()) {
      const totalAmt = Number(total_amount) || 0;
      const downPay = Number(down_payment) || 0;
      const paidAmt = Number(paid_amount) || 0;
      const totalPaid = downPay + paidAmt;
      const installmentAmt = Number(installment_amount) || 0;

      await supabase.from("customer_projects").insert({
        user_id: newUser.user.id,
        project_name: project_name.trim(),
        total_amount: totalAmt,
        paid_amount: totalPaid,
        monthly_installment: installmentAmt,
        status: "in_progress",
      });

      // Record down payment as a payment entry if > 0
      if (downPay > 0) {
        await supabase.from("payments").insert({
          user_id: newUser.user.id,
          amount: downPay,
          payment_method: "cash",
          status: "completed",
          notes: "Down payment",
        });
      }
      // Record paid amount as a separate payment entry if > 0
      if (paidAmt > 0) {
        await supabase.from("payments").insert({
          user_id: newUser.user.id,
          amount: paidAmt,
          payment_method: "cash",
          status: "completed",
          notes: "Initial payment",
        });
      }
    }

    return jsonResponse({ success: true, user_id: newUser.user.id }, 200);
  } catch (err) {
    console.error("create-customer error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
