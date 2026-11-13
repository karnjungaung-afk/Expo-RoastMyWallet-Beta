# RevenueCat setup

The Expo app already initializes RevenueCat through `RevenueCatSubscriptionService`.
This webhook keeps `public.user_subscriptions` synchronized for server-side feature
checks. The Supabase table remains read-only to app clients; only the Edge Function
uses the service-role key.

## RevenueCat dashboard

1. Create/configure Android products and attach them to the `pro` entitlement.
2. Create a Current Offering with monthly and annual packages.
3. Configure the Android public SDK key in the app environment.
4. For web subscriptions, create a RevenueCat Billing app, configure web products,
   and use its separate public web SDK key. Web purchases use RevenueCat Billing,
   not Google Play Billing.
5. Configure a webhook URL:
   `https://hqezoifilosvaxsvrbwf.supabase.co/functions/v1/revenuecat-webhook`
6. Set the webhook's Authorization header to a long random value prefixed with
   `Bearer ` (for example, `Bearer <random-secret>`).

## Supabase secrets

Set `REVENUECAT_WEBHOOK_AUTH` in Supabase Edge Function secrets to exactly the
same Authorization header value configured in RevenueCat. Do not commit this
value or send it in a client-side environment variable. Supabase supplies
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

## App environment

For local development, add these to the ignored `.env.local` file:

- `EXPO_PUBLIC_REVENUECAT_API_KEY`: Android public SDK key
- `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY`: RevenueCat Billing public web SDK key

For EAS builds, configure the same variables as EAS environment variables/secrets.
Only use RevenueCat public SDK keys in the app. Never place a RevenueCat secret API
key or Supabase service-role/secret key in the app.

## Testing

- Android real purchases require an Expo development build, not Expo Go.
- Verify monthly/yearly packages appear in the paywall.
- Complete a Google Play test purchase and confirm the `pro` entitlement is active.
- Confirm the webhook updates `user_subscriptions` and a cancellation remains active
  until the actual expiration event.
- Web purchases require RevenueCat Billing setup and should be tested separately.
