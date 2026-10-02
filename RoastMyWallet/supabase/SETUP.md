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
