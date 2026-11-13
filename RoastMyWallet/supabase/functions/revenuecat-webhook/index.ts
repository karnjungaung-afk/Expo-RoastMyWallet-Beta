import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  entitlement_ids?: string[] | null;
  product_id?: string | null;
  store?: string | null;
  period_type?: string | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function safeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  const receivedAuth = request.headers.get("authorization") ?? "";
  if (!expectedAuth || !safeEqual(receivedAuth, expectedAuth)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[revenuecat-webhook] Supabase server environment is missing");
    return json({ error: "Server configuration error" }, 500);
  }

  let payload: { event?: RevenueCatEvent };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const event = payload.event;
  if (!event || typeof event.type !== "string" || typeof event.id !== "string") {
    return json({ error: "Invalid RevenueCat event" }, 400);
  }

  const entitlementIds = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];
  if (!entitlementIds.includes("pro")) {
    return json({ ok: true, ignored: "event does not include the pro entitlement" });
  }

  const appUserId = event.app_user_id ?? "";
  if (!isUuid(appUserId)) {
    console.warn("[revenuecat-webhook] Ignoring event with non-UUID app_user_id", event.id);
    return json({ ok: true, ignored: "app_user_id is not a Supabase user UUID" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventTime = new Date(event.event_timestamp_ms ?? Date.now()).toISOString();
  const { data: current, error: readError } = await supabase
    .from("user_subscriptions")
    .select("last_event_id,last_event_at")
    .eq("user_id", appUserId)
    .maybeSingle();

  if (readError) {
    console.error("[revenuecat-webhook] Could not read current subscription", readError.message);
    return json({ error: "Could not read subscription state" }, 500);
  }

  if (current?.last_event_id === event.id) {
    return json({ ok: true, duplicate: true });
  }

  if (current?.last_event_at && new Date(current.last_event_at).getTime() > new Date(eventTime).getTime()) {
    return json({ ok: true, stale: true });
  }

  const expirationAt = typeof event.expiration_at_ms === "number"
    ? new Date(event.expiration_at_ms).toISOString()
    : null;
  const terminalEvent = event.type === "EXPIRATION" || event.type === "REFUND";
  const isActive = !terminalEvent && (expirationAt === null || new Date(expirationAt).getTime() > Date.now());
  const plan = isActive
    ? (event.period_type === "TRIAL" ? "trial" : "pro")
    : "free";

  const { error: writeError } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: appUserId,
      plan,
      expires_at: expirationAt,
      revenuecat_app_user_id: appUserId,
      product_id: event.product_id ?? null,
      store: event.store ?? null,
      entitlement_id: "pro",
      last_event_id: event.id,
      last_event_at: eventTime,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (writeError) {
    console.error("[revenuecat-webhook] Could not persist subscription", writeError.message);
    return json({ error: "Could not persist subscription state" }, 500);
  }

  return json({ ok: true, user_id: appUserId, plan });
});
