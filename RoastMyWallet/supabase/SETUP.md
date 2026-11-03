# RoastMyWallet — Supabase Setup Guide

## 1. Apply the database schema

Go to **Supabase Dashboard → SQL Editor**, paste and run:
```
supabase/migrations/001_initial_schema.sql
```

## 2. Configure Authentication

**Dashboard → Authentication → Providers → Email:**
- ✅ Enable Email provider
- For quick testing: disable "Confirm email" (re-enable before production)

**Dashboard → Authentication → URL Configuration:**
- Site URL: `roastmywallet://`
- Redirect URLs (add all four):
  ```
  roastmywallet://
  roastmywallet://confirm
  roastmywallet://reset-password
  exp+roastmywallet://expo-development-client
  ```

## 3. EAS Secrets (production only)

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://your-project.supabase.co"

eas secret:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  --value "sb_publishable_..."

# Only if using in-app purchases:
eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY \
  --value "appl_..."
```

## 4. EAS Project setup

```bash
npm install -g eas-cli
eas login
eas init                  # creates project ID in app.json automatically
eas build --profile development --platform all
```

## 5. Run locally

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and key
npx expo start -c
```

## 6. Database tables checklist

After running the migration, confirm these exist in Table Editor:
- [ ] profiles
- [ ] purchases
- [ ] user_subscriptions
- [ ] spending_limits
- [ ] squads / squad_members / squad_messages
- [ ] ai_interactions
- [ ] push_tokens

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Missing required config value: supabaseUrl" | Fill EXPO_PUBLIC_SUPABASE_URL in .env.local |
| Email confirmation link not working | Add `roastmywallet://confirm` to Supabase Redirect URLs |
| Push tokens fail on Android Expo Go | Expected — use `eas build --profile development` for push |
| "Something went wrong" in Expo Go | Check Metro terminal for `[GlobalError]` logs |

## 7. Social login (Google / Apple)

The app already contains the buttons and the client flow
(`src/features/auth/oauth.ts`). They show a clear Thai message until the
providers below are enabled — nothing else in the code needs to change.

### 7.1 Redirect URLs (Supabase → Authentication → URL Configuration → Redirect URLs)
Add all that apply:
```
roastmywallet://auth-callback                 # dev build / production app
exp://<your-LAN-IP>:8081/--/auth-callback     # Expo Go (the exact URL is printed by Linking.createURL('auth-callback'))
https://<your-web-domain>                     # web build
```

### 7.2 Google
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → type **Web application**.
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Copy the Client ID + Client secret into Supabase → Authentication → Providers → **Google** → Enable.

### 7.3 Apple (required by App Store guideline 4.8 when Google login is offered on iOS)
1. Apple Developer → Identifiers → create an **App ID** (Sign in with Apple enabled) and a **Services ID** (this is the "client id").
2. Services ID → Configure → Return URL: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Create a **Key** with Sign in with Apple, then generate the client secret (a JWT, valid max 6 months — set a reminder to rotate it).
4. Supabase → Authentication → Providers → **Apple** → Enable and paste Services ID + secret.

### 7.4 Quick check
Tap the button: "ยังไม่ได้เปิดใช้การเข้าสู่ระบบด้วย …" = provider not enabled yet;
"Redirect URL ยังไม่ได้ตั้งค่า" = step 7.1 is missing the URL for the platform you are testing.
