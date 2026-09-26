# RoastMyWallet

> **An AI-powered impulse-buying prevention system.**
> Spend tens to save thousands.

---

## What Is This

RoastMyWallet interrupts the impulse purchase loop. When a user sees something they want to buy — on TikTok Shop, Shopee, Instagram, anywhere — they add it to RoastMyWallet instead of buying it immediately. The app scores the purchase, gives it a waiting period, and asks: *still want it?*

Most of the time, they don't.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile/Web | Expo + React Native + TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand (feature-scoped stores) |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, Realtime) |
| AI | Anthropic Claude (server-side only, via Edge Function) |
| Subscriptions | RevenueCat (abstracted behind `ISubscriptionService`) |
| Notifications | Expo Notifications |

---

## Architecture Principles

### 1. AI is an enhancement, never a dependency
The `calculateNeedScore()` function in `src/utils/scoring.ts` is fully deterministic and works without any network call. The AI adds explanation, personality, and personalization on top. If the Edge Function fails, the app continues working — the core experience is unaffected.

### 2. Subscription is abstracted
`ISubscriptionService` in `src/features/subscription/SubscriptionService.ts` is the only interface the app knows about. `MockSubscriptionService` is used in development. `RevenueCatSubscriptionService` (stubbed, see the file) is swapped in for production. UI components never call RevenueCat directly.

### 3. API keys never leave the server
The mobile app **never** calls any AI API directly. All AI requests go through `supabase/functions/analyze-purchase/index.ts`, which runs on Supabase's server. The AI API key is a Supabase secret (`supabase secrets set AI_API_KEY=...`), never in client code or `.env` files committed to git.

### 4. Interception is platform-realistic
`src/features/intercept/` has separate implementations for Android, iOS, and Web, behind a common `IInterceptService` interface. Each file documents exactly what's possible on that platform (and what isn't). No fake capabilities.

### 5. Local-first, optimistic UI
Purchases are added to the local Zustand store before the network call completes. If the save fails, the optimistic entry is removed. The app should never feel slow to respond.

### 6. Row Level Security is mandatory
Every table has RLS enabled. Every policy is explicit. Users cannot access other users' data — not through the client SDK, not through any other means. The service role key (used only in Edge Functions) is the only way to bypass RLS, and it never leaves the server.

---

## Project Structure

```
RoastMyWallet/
├── app/                    # Expo Router file-based navigation
│   ├── _layout.tsx         # Root layout, auth guard, store init
│   ├── (auth)/             # Unauthenticated routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/             # Main app (tab navigator)
│   │   ├── index.tsx       # Home dashboard
│   │   ├── waiting.tsx     # Pause list
│   │   ├── insights.tsx    # Analytics
│   │   ├── squad.tsx       # Squad roasting
│   │   └── profile.tsx     # Settings & account
│   └── purchase/
│       └── [id].tsx        # Purchase detail + decision
│
├── src/
│   ├── theme/              # Design tokens (colors, type, spacing)
│   │   ├── tokens.ts       # Raw palette + semantic tokens
│   │   └── index.ts        # buildTheme(), useTheme export
│   ├── types/
│   │   └── index.ts        # All TypeScript types
│   ├── config/
│   │   └── env.ts          # Environment variable access
│   ├── services/
│   │   ├── supabase.ts     # Supabase client singleton
│   │   └── database.types.ts
│   ├── store/              # Zustand stores (feature-scoped)
│   │   ├── authStore.ts
│   │   ├── purchaseStore.ts
│   │   ├── subscriptionStore.ts
│   │   └── settingsStore.ts
│   ├── features/
│   │   ├── purchases/      # Purchase card, add sheet, service
│   │   ├── ai/             # AI service (routes through backend)
│   │   ├── subscription/   # ISubscriptionService + implementations
│   │   ├── notifications/  # NotificationService
│   │   └── intercept/      # Platform-specific intercept (Android/iOS/Web)
│   ├── components/
│   │   └── ui/             # Base components (Button, Input, Badge, etc.)
│   ├── hooks/
│   │   └── useTheme.ts
│   └── utils/
│       ├── scoring.ts      # Deterministic need score calculation
│       └── formatting.ts   # Currency, date, text formatting
│
├── supabase/
│   ├── functions/
│   │   └── analyze-purchase/  # AI Edge Function (server-side)
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── .env.example            # Copy to .env.local, fill in values
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI: `npm install -g expo`
- Supabase CLI: `brew install supabase/tap/supabase`
- iOS Simulator or Android emulator (or Expo Go)

### 1. Clone and install

```bash
git clone https://github.com/you/RoastMyWallet.git
cd RoastMyWallet 
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key
```

### 3. Set up Supabase

```bash
# Start local Supabase (or use cloud)
supabase start

# Run migrations
supabase db push

# Deploy the AI Edge Function
supabase functions deploy analyze-purchase

# Set the AI API key (server-side only)
supabase secrets set AI_API_KEY=your-anthropic-key
```

### 4. Run the app

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## Design System

The design is built on a precise token system (`src/theme/tokens.ts`):

- **Base**: Warm off-white `#F2F0EB` — not the generic cream
- **Primary**: Deep navy `#1B3557` — authoritative without being cold
- **Risk high/medium/low**: Muted red / warm amber / forest green
- **Mecha texture**: 1–2px left-accent lines on cards, corner glyphs, `◆◆◆ HIGH` risk indicators, monospace labels — seasoning, not decoration
- **No gradient carpets**: Gradients only on the hero card background
- **Icons**: Lucide React Native throughout — consistent, never mixed

Dark mode is supported via automatic color scheme detection. Both palettes are defined in `tokens.ts`.

---

## Free vs Pro

| Feature | Free | Pro |
|---|---|---|
| Add purchases | ✓ | ✓ |
| Need Score | Basic | Advanced |
| Waiting timer | ✓ | ✓ + smart defaults |
| AI roast | Short | Personalized + history-aware |
| Purchase history | 30 days | Unlimited |
| Insights | Basic | Full + ROI dashboard |
| Spending limits | 1 limit | Daily / Weekly / Monthly |
| Squad Roasting | — | ✓ |
| Auto-Intercept | — | ✓ |
| Notifications | Basic | Advanced |
| Cloud sync | — | ✓ |

**Price**: ฿39/month or ฿349/year

The subscription is positioned as a savings tool, not a feature paywall. The dashboard shows: *You spent ฿39. You avoided ฿1,790. Net gain: ฿1,751.*

---

## Platform Notes

### Android
Auto-Intercept via Share Intents. User shares a product URL → PauseBuy opens with pre-filled form. No Accessibility API usage (Play Store policy).

### iOS
Auto-Intercept via Share Extension (separate Xcode target) + Universal Links. The extension communicates with the main app via App Groups.

### Web
PWA + URL parameter detection (`?url=<product_url>`). Full browser extension available as a separate project (`/extension`).

---

## Adding RevenueCat

1. Install: `npx expo install react-native-purchases`
2. Uncomment `RevenueCatSubscriptionService` in `src/features/subscription/MockSubscriptionService.ts`
3. Update `src/store/subscriptionStore.ts` to use `RevenueCatSubscriptionService`
4. Set `EXPO_PUBLIC_REVENUECAT_API_KEY` in `.env.local`
5. Configure products in RevenueCat dashboard: `pro_monthly`, `pro_yearly`
6. Set entitlement ID: `pro`

---

## Security Checklist

- [ ] Supabase RLS enabled on all tables ✓
- [ ] AI API key stored as Supabase secret, never in client code ✓
- [ ] RevenueCat key only in `EXPO_PUBLIC_*` (read-only, expected to be public) ✓
- [ ] Supabase service role key never in client code ✓
- [ ] `.env.local` in `.gitignore` ✓
- [ ] Input validated with Zod on form submission ✓
- [ ] No client-side plan elevation (backend verifies entitlements) ✓
- [ ] Rate limiting on AI Edge Function ✓
- [ ] Squad messages limited to 500 chars in DB constraint ✓

---

## License

MIT — see LICENSE
