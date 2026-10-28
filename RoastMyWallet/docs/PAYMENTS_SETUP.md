# RoastMyWallet payments: production setup checklist

This PR adds payment-verification backend scaffolding. It does NOT enable live billing by itself. Do not launch until provider accounts, product IDs, secrets, the Android purchase SDK, website UI integration, and end-to-end tests are complete. A client callback or checkout redirect never grants Pro; entitlement updates are provider-webhook-driven.

## Recommended payment routes

- Android app: Google Play Billing via RevenueCat. Digital Pro features sold inside a Play-distributed Android app must use Google Play Billing unless a documented Play policy exception/program applies. Do not route Android users to Stripe checkout as a workaround.
- Website: Stripe Checkout subscriptions using hosted checkout. For Thailand, cards are the best default for monthly/yearly recurring subscriptions. PromptPay is useful for one-time payments but Stripe does not support PromptPay for recurring subscriptions.

## 1. Supabase

1. Review and apply supabase/migrations/20261028090000_secure_subscription_payments.sql through the normal migration workflow.
2. Configure Edge Function secrets:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server-only)
   - PAYMENTS_ALLOWED_ORIGIN (exact production web origin)
   - STRIPE_SECRET_KEY (test key in staging, live key in production)
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PRICE_PRO_MONTHLY
   - STRIPE_PRICE_PRO_YEARLY
   - STRIPE_CHECKOUT_SUCCESS_URL
   - STRIPE_CHECKOUT_CANCEL_URL
   - REVENUECAT_WEBHOOK_AUTHORIZATION (long random shared secret)
3. Deploy create-web-checkout, stripe-webhook, and revenuecat-webhook only after setting secrets.
4. Stripe endpoint: https://PROJECT_REF.supabase.co/functions/v1/stripe-webhook
5. RevenueCat endpoint: https://PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook
6. Never put secret keys in GitHub, source files, Expo public environment variables, the browser, or chat.

## 2. Stripe website setup

1. Activate the Stripe merchant account and confirm subscriptions, identity checks, and settlement details.
2. Create two recurring prices in Stripe Dashboard (monthly and yearly). Store their price IDs in STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_YEARLY. The client can select only monthly/yearly; the server chooses the price.
3. Add a webhook for checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid, and invoice.payment_failed.
4. Set success/cancel URLs to real trusted pages on the site. The success page must never unlock Pro based on a URL; it should refresh the authenticated subscription row.
5. Website sends POST /functions/v1/create-web-checkout with Supabase user's Authorization bearer token and JSON body { "plan": "monthly" } or { "plan": "yearly" }, then redirects to the returned URL. Never send an amount, Stripe price ID, user ID, or entitlement from the client.

## 3. Android / RevenueCat / Google Play

1. In Play Console, create and activate monthly/yearly subscription products and base plans, set pricing, add license testers, and finish merchant profile requirements.
2. In RevenueCat, create the Android app for package com.roastmywallet.app, connect the Google Play service account, import both products, create entitlement exactly named pro, and configure offering packages pro_monthly and pro_yearly.
3. Configure RevenueCat webhook to the endpoint above and set the Authorization header to the exact value of REVENUECAT_WEBHOOK_AUTHORIZATION.
4. RevenueCat App User ID must be the authenticated Supabase user UUID. Client must call logIn(user.id), show actual store packages, use the native purchase flow, restore purchases, then refresh entitlement from the server. The native RevenueCat SDK integration is intentionally not included in this backend scaffold; do not expose a working Android purchase button until it is implemented.
5. Use an EAS development/preview build and Play internal testing track. Expo Go cannot test native Google Play Billing SDK flows.

## 4. Required acceptance tests

- Unauthenticated checkout returns 401.
- Invalid plan/arbitrary price returns 400; server selects the configured price ID only.
- Missing secrets returns 503 and never changes entitlement.
- Invalid/missing/old Stripe signature returns 400; duplicate webhook is idempotent.
- Checkout completed but unpaid or without subscription ID grants no Pro.
- A canonical active/trialing subscription webhook grants Pro only for the matching Supabase user UUID.
- Cancellation, expiry, refund, failed renewal, grace period and out-of-order/retried webhooks are tested against real provider payloads.
- Wrong RevenueCat authorization, non-UUID App User ID, absent pro entitlement, and duplicate event must not grant Pro.
- Authenticated client cannot insert/update/delete its own user_subscriptions row.
- Test renewal, cancellation, restore purchases, refund, webhook retries, and multiple accounts on one device.

## Important limitations before launch

- The app subscription store has been changed to read server-owned entitlement state and fail closed; purchase intentionally returns an error until the native RevenueCat SDK is configured. No mock Pro grant remains in the active store.
- Website checkout backend exists, but the website purchase UI still needs to call it and refresh the database entitlement.
- RevenueCat client SDK integration and provider sandbox/live testing have not been performed.
- Webhook event ordering, retries, refunds and subscription grace periods require verification before production.
- This PR has not run app typecheck/build or real provider sandbox tests. No live payment is claimed or enabled by these changes.
