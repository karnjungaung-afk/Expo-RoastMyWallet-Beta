import { create } from 'zustand';
import type { User, UserProfile } from '@/types';
import { supabase } from '@/services/supabase';

// ─── PRIVATE HELPERS (module-scoped, not part of store state) ─────────────────

async function loadProfileForUser(userId: string): Promise<UserProfile | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data ? mapSupabaseProfile(data as Record<string, unknown>) : null;
}

// ─── AUTH STORE ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        const profile = await loadProfileForUser(user.id);
        set({ user, profile, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = mapSupabaseUser(session.user);
          const profile = await loadProfileForUser(user.id);
          set({ user, profile });
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      set({ isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const user = mapSupabaseUser(data.user);
        const profile = await loadProfileForUser(user.id);
        set({ user, profile });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (error) throw error;

      // CASE 1: Email confirmation required (Supabase project setting)
      // data.user exists but data.session is null.
      // The user will be logged in automatically after clicking the confirm link.
      if (data.user && !data.session) {
        // Pre-create the profile row so it's ready when they confirm.
        // This will silently fail if the user isn't confirmed yet — that's fine,
        // the trigger on auth.users can also create it.
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('profiles').upsert({
            user_id: data.user.id, display_name: displayName, currency: 'THB',
            language: 'th', timezone: 'Asia/Bangkok', theme: 'cozy_minimal',
            ai_enabled: true, ai_personality: 'balanced', default_waiting_hours: 24,
            notifications_enabled: true, squad_enabled: false,
            monthly_budget: null, weekly_budget: null, daily_budget: null,
          });
        } catch { /* Profile creation may fail if RLS blocks unconfirmed users */ }

        // Throw a structured error the UI can distinguish from a real failure
        throw Object.assign(
          new Error('Please check your email and click the confirmation link to complete registration.'),
          { code: 'email_confirmation_required' }
        );
      }

      // CASE 2: Auto-confirm enabled (development / disabled confirmation)
      if (data.user && data.session) {
        const user = mapSupabaseUser(data.user);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('profiles').upsert({
          user_id: user.id, display_name: displayName, currency: 'THB',
          language: 'th', timezone: 'Asia/Bangkok', theme: 'cozy_minimal',
          ai_enabled: true, ai_personality: 'balanced', default_waiting_hours: 24,
          notifications_enabled: true, squad_enabled: false,
          monthly_budget: null, weekly_budget: null, daily_budget: null,
        });
        const profile = await loadProfileForUser(user.id);
        set({ user, profile });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'roastmywallet://reset-password',
    });
    if (error) throw error;
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (!error) {
      set(state => ({ profile: state.profile ? { ...state.profile, ...updates } : null }));
    }
  },
}));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function mapSupabaseUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at: string }): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: (supabaseUser.user_metadata?.display_name as string | undefined) ?? null,
    avatarUrl: (supabaseUser.user_metadata?.avatar_url as string | undefined) ?? null,
    createdAt: supabaseUser.created_at,
  };
}

function mapSupabaseProfile(data: Record<string, unknown>): UserProfile {
  return {
    userId: data.user_id as string,
    displayName: data.display_name as string,
    currency: data.currency as UserProfile['currency'],
    language: data.language as UserProfile['language'],
    timezone: data.timezone as string,
    monthlyBudget: data.monthly_budget as number | null,
    weeklyBudget: data.weekly_budget as number | null,
    dailyBudget: data.daily_budget as number | null,
    theme: data.theme as UserProfile['theme'],
    aiEnabled: data.ai_enabled as boolean,
    aiPersonality: data.ai_personality as UserProfile['aiPersonality'],
    defaultWaitingHours: data.default_waiting_hours as number,
    notificationsEnabled: data.notifications_enabled as boolean,
    squadEnabled: data.squad_enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ─── SELECTORS ────────────────────────────────────────────────────────────────

export const selectUser = (state: AuthState) => state.user;
export const selectProfile = (state: AuthState) => state.profile;
export const selectIsAuthenticated = (state: AuthState) => state.user !== null;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
