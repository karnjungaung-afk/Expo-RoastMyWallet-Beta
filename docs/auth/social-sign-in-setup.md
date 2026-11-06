# Social sign-in setup (Supabase Auth)

The app already contains Google and Apple sign-in buttons and an OAuth browser flow. The app uses Supabase Auth as the identity provider; do not put provider client secrets or Apple private keys in the Expo app.

## Supabase redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add these redirect URLs:

- `roastmywallet://auth-callback` — native Google/Apple OAuth callback
- `roastmywallet://confirm` — email confirmation
- `roastmywallet://reset-password` — password recovery
- `https://YOUR-WEB-DOMAIN` — deployed web callback (replace with the real Vercel/custom domain)
- `http://localhost:8081` — local Expo web, if used

Set the Site URL to the deployed web origin when web is the primary app. Do not add a wildcard redirect for production.

## Google

1. Create/select a project in Google Cloud Console and configure the OAuth consent screen.
2. Create a **Web application** OAuth client.
3. Add the deployed web origin and local web origin to Authorized JavaScript origins.
4. Add the Supabase callback URL shown in Supabase → Authentication → Providers → Google to Authorized redirect URIs. It is typically `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
5. Copy the Google Client ID and Client Secret into the Google provider settings in Supabase, then enable the provider.

## Apple

1. In Apple Developer, configure Sign in with Apple for the app's Bundle ID `com.roastmywallet.app`.
2. Create the Services ID and configure its domain and return URL using the Supabase Apple provider instructions.
3. Create the Sign in with Apple key and note the Team ID, Key ID, and Services ID.
4. Enter the required Apple credentials in Supabase → Authentication → Providers → Apple, then enable the provider.

Apple credentials and signing configuration are managed by Apple/Supabase; never commit the private key to GitHub or bundle it in the app. Apple sign-in is shown on iOS and web; it is intentionally not shown on Android.

## Verification

After enabling providers, test:
- Web: Google and Apple sign-in, refresh, and sign-out.
- Android: Google sign-in, app callback, session persistence, and sign-out.
- iOS: Apple sign-in, app callback, session persistence, and sign-out.

The app uses Supabase PKCE flow for OAuth. The native callback must remain `roastmywallet://auth-callback`.
