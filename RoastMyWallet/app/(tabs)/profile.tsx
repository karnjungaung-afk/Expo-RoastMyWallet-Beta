import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Download,
  Trash2,
  ChevronRight,
  LogOut,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore, selectUser, selectProfile } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { MechaCard } from '@/components/ui/MechaCard';
import { StatusBadge, TechnicalDivider } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { spacing, typography, radius } from '@/theme/tokens';
import { formatCurrency } from '@/utils/formatting';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const { status, isPro } = useSubscriptionStore();
  const { signOut } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ?? true
  );
  const [aiEnabled, setAiEnabled] = useState(profile?.aiEnabled ?? true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { /* implement */ } },
      ]
    );
  };

  const currency = profile?.currency ?? 'THB';
  const isProUser = isPro();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account header ─────────────────────────────────────────── */}
        <View style={styles.accountHeader}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primarySubtle }]}>
            <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
              {(profile?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: colors.textPrimary }]}>
              {profile?.displayName ?? 'No name set'}
            </Text>
            <Text style={[styles.accountEmail, { color: colors.textMuted }]}>
              {user?.email ?? ''}
            </Text>
            <StatusBadge
              variant={isProUser ? 'pro' : 'free'}
              label={isProUser ? 'Pro Member' : 'Free Plan'}
            />
          </View>
        </View>

        {/* ── Subscription ────────────────────────────────────────────── */}
        <TechnicalDivider label="SUBSCRIPTION" />

        {isProUser ? (
          <MechaCard accent="primary" showAccentLine showCornerMark>
            <View style={styles.subscriptionRow}>
              <Zap size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.subTitle, { color: colors.textPrimary }]}>
                  RoastMyWallet Pro
                </Text>
                <Text style={[styles.subNote, { color: colors.textMuted }]}>
                  All features unlocked
                </Text>
              </View>
              <StatusBadge variant="pro" />
            </View>
            <TouchableOpacity style={styles.manageSubLink}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Manage subscription →
              </Text>
            </TouchableOpacity>
          </MechaCard>
        ) : (
          <MechaCard accent="muted" showAccentLine>
            <Text style={[styles.upgradeTitle, { color: colors.textPrimary }]}>
              Upgrade to Pro
            </Text>
            <Text style={[styles.upgradeDesc, { color: colors.textSecondary }]}>
              Unlock AI analysis, Squad Roasting, advanced insights, and more. Starting at {formatCurrency(39, currency as any)}/month.
            </Text>
            <Button
              label="Upgrade — ฿39/month"
              variant="primary"
              size="md"
              fullWidth
              style={{ marginTop: spacing[3] }}
              onPress={() => { /* Navigate to upgrade */ }}
            />
          </MechaCard>
        )}

        {/* ── Spending Limits ─────────────────────────────────────────── */}
        <TechnicalDivider label="SPENDING LIMITS" />
        <SettingsGroup colors={colors}>
          <LimitRow
            label="Monthly limit"
            value={profile?.monthlyBudget ? formatCurrency(profile.monthlyBudget, currency as any) : 'Not set'}
            onPress={() => { /* open edit sheet */ }}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <LimitRow
            label="Weekly limit"
            value={profile?.weeklyBudget ? formatCurrency(profile.weeklyBudget, currency as any) : 'Not set'}
            onPress={() => { /* open edit sheet */ }}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <LimitRow
            label="Daily limit"
            value={profile?.dailyBudget ? formatCurrency(profile.dailyBudget, currency as any) : 'Not set'}
            onPress={() => { /* open edit sheet */ }}
            colors={colors}
          />
        </SettingsGroup>

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <TechnicalDivider label="PREFERENCES" />
        <SettingsGroup colors={colors}>
          <ToggleRow
            label="Notifications"
            hint="Decision reminders, limit alerts"
            icon={<Bell size={16} color={colors.textMuted} />}
            value={notificationsEnabled}
            onChange={setNotificationsEnabled}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <ToggleRow
            label="AI analysis"
            hint="AI roasting and insights"
            icon={<Zap size={16} color={colors.textMuted} />}
            value={aiEnabled}
            onChange={setAiEnabled}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <NavRow
            label="Default wait time"
            value={`${profile?.defaultWaitingHours ?? 24}h`}
            onPress={() => { }}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <NavRow
            label="Currency"
            value={profile?.currency ?? 'THB'}
            onPress={() => { }}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <NavRow
            label="Theme"
            value="Cozy Minimal"
            onPress={() => { }}
            colors={colors}
          />
        </SettingsGroup>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <TechnicalDivider label="ACCOUNT" />
        <SettingsGroup colors={colors}>
          <NavRow
            label="Privacy settings"
            icon={<Shield size={16} color={colors.textMuted} />}
            onPress={() => { }}
            colors={colors}
          />
          <SettingsDivider colors={colors} />
          <NavRow
            label="Export my data"
            icon={<Download size={16} color={colors.textMuted} />}
            onPress={() => { }}
            colors={colors}
          />
        </SettingsGroup>

        {/* ── Danger zone ─────────────────────────────────────────────── */}
        <SettingsGroup colors={colors}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleSignOut}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <LogOut size={16} color={colors.danger} />
            <Text style={[styles.dangerLabel, { color: colors.danger }]}>
              Sign out
            </Text>
          </TouchableOpacity>
          <SettingsDivider colors={colors} />
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.danger} />
            <Text style={[styles.dangerLabel, { color: colors.danger }]}>
              Delete account
            </Text>
          </TouchableOpacity>
        </SettingsGroup>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          RoastMyWallet v1.0.0 · Build 1
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── SETTINGS GROUP ───────────────────────────────────────────────────────────

function SettingsGroup({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

function SettingsDivider({ colors }: { colors: any }) {
  return (
    <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />
  );
}

// ─── ROW TYPES ────────────────────────────────────────────────────────────────

function NavRow({ label, value, icon, onPress, colors }: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
        )}
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, hint, icon, value, onChange, colors }: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <View style={styles.settingsRow}>
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: colors.textMuted }]}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        accessibilityLabel={label}
      />
    </View>
  );
}

function LimitRow({ label, value, onPress, colors }: {
  label: string;
  value: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.rowValue,
            {
              color: value === 'Not set' ? colors.textMuted : colors.primary,
              fontWeight: value !== 'Not set' ? typography.weight.semibold : typography.weight.regular,
            },
          ]}
        >
          {value}
        </Text>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },

  // Account header
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingBottom: spacing[2],
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  accountInfo: {
    flex: 1,
    gap: spacing[1],
  },
  accountName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  accountEmail: {
    fontSize: typography.size.sm,
  },

  // Subscription card
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  subTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  subNote: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  manageSubLink: {
    marginTop: spacing[1],
  },
  linkText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  upgradeTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
  },
  upgradeDesc: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },

  // Settings group
  settingsGroup: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsDivider: {
    height: 1,
    marginLeft: spacing[4],
  },

  // Row types
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    minHeight: 52,
    gap: spacing[3],
  },
  rowIcon: {},
  rowLabel: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
  },
  rowHint: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowValue: {
    fontSize: typography.size.sm,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    gap: spacing[3],
    minHeight: 52,
  },
  dangerLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
    paddingBottom: spacing[4],
  },
});
