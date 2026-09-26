import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppTheme, Currency, Language, SpendingLimits } from '@/types';

const STORAGE_KEY = '@pausebuy:settings';

interface SettingsState {
  theme: AppTheme;
  currency: Currency;
  language: Language;
  defaultWaitingHours: number;
  spendingLimits: SpendingLimits | null;
  isLoaded: boolean;

  // Actions
  load: () => Promise<void>;
  setTheme: (theme: AppTheme) => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  setDefaultWaitingHours: (hours: number) => void;
  setSpendingLimits: (limits: Partial<SpendingLimits>) => void;
}

const DEFAULTS: Pick<
  SettingsState,
  'theme' | 'currency' | 'language' | 'defaultWaitingHours' | 'spendingLimits'
> = {
  theme: 'cozy_minimal',
  currency: 'THB',
  language: 'th',
  defaultWaitingHours: 24,
  spendingLimits: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ ...DEFAULTS, ...parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },

  setCurrency: (currency) => {
    set({ currency });
    persist(get());
  },

  setLanguage: (language) => {
    set({ language });
    persist(get());
  },

  setDefaultWaitingHours: (defaultWaitingHours) => {
    set({ defaultWaitingHours });
    persist(get());
  },

  setSpendingLimits: (limits) => {
    const current = get().spendingLimits;
    const updated: SpendingLimits = {
      userId: limits.userId ?? current?.userId ?? '',
      daily: limits.daily ?? current?.daily ?? null,
      weekly: limits.weekly ?? current?.weekly ?? null,
      monthly: limits.monthly ?? current?.monthly ?? null,
      impulseOnly: limits.impulseOnly ?? current?.impulseOnly ?? false,
    };
    set({ spendingLimits: updated });
    persist(get());
  },
}));

async function persist(state: SettingsState) {
  try {
    const { isLoaded, load, setTheme, setCurrency, setLanguage, setDefaultWaitingHours, setSpendingLimits, ...persisted } = state;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (err) {
    console.error('[SettingsStore] Persist failed:', err);
  }
}
