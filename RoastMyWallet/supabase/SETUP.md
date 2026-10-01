# Supabase Setup Guide

## 1. Apply the database schema

Go to your Supabase project → **SQL Editor** → paste and run the entire contents of:
```
supabase/migrations/001_initial_schema.sql
```

Or run with Supabase CLI:
```bash
npx supabase db push
```

## 2. Configure Authentication

Go to **Authentication → Settings**:
- ✅ Enable Email provider
- Set **Site URL** to your app's deep link scheme: `pausebuy://`
- Add to **Redirect URLs**: `pausebuy://reset-password`
- For testing: turn OFF **Email Confirmations** (Auth → Providers → Email → Disable email confirmations)
  - Or turn ON and check the email confirmation flow

## 3. Environment variables (optional)

The app ships with working default credentials in `app.config.js`.
If you want to use your own project, copy `.env.local.example` → `.env.local`:

```bash
cp .env.local.example .env.local
```

Then fill in your own values from: Supabase Dashboard → Project Settings → API

## 4. Run the app

```bash
npm install
npx expo start -c          # LAN (same WiFi)
npx expo start -c --tunnel # Tunnel (different networks, requires @expo/ngrok)
```

## 5. Verify database tables exist

After running the migration, check in Supabase Table Editor that these tables exist:
- `profiles`
- `purchases`
- `user_subscriptions`
- `spending_limits`
- `squads`
- `squad_members`
- `squad_messages`
- `ai_interactions`
- `push_tokens`

## Troubleshooting

**"Port not found" when using --tunnel**
```bash
npx kill-port 8081   # free the Metro port
npx expo start -c --tunnel
```

**Auth errors after login**
- Check that the `profiles` table exists and RLS policies are applied
- Make sure Email provider is enabled in Supabase Auth settings
- Verify the anon key in `app.config.js` matches your Supabase project

**"Missing environment variable"**
- This is non-fatal — the app uses hardcoded defaults from `app.config.js`
- For your own Supabase project, use `.env.local`
