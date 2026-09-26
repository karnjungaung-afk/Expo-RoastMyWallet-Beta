import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, MessageCircle, Shield, Plus, Copy, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { SquadService } from '@/features/squad/SquadService';
import { MechaCard } from '@/components/ui/MechaCard';
import { Button } from '@/components/ui/Button';
import { TechnicalDivider, ProGateBadge, StatusBadge } from '@/components/ui/Badge';
import { spacing, typography, radius } from '@/theme/tokens';
import type { Squad, SquadMessage } from '@/types';

// ─── ROOT ──────────────────────────────────────────────────────────────────────

export default function SquadScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPro } = useSubscriptionStore();

  if (!isPro()) {
    return <SquadProGate colors={colors} insets={insets} />;
  }

  return <SquadMain colors={colors} insets={insets} />;
}

// ─── SQUAD MAIN ───────────────────────────────────────────────────────────────

function SquadMain({ colors, insets }: { colors: any; insets: any }) {
  const { user } = useAuthStore();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [messages, setMessages] = useState<SquadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const unsubRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await SquadService.getUserSquads(user.id);
      if (result.data && result.data.length > 0) {
        const s = result.data[0];
        setSquad(s);
        // load messages
        const msgResult = await SquadService.getMessages(s.id);
        if (msgResult.data) setMessages(msgResult.data);
        // subscribe to realtime
        unsubRef.current?.();
        const unsub = SquadService.subscribeToMessages(s.id, (msg) => {
          setMessages(prev => [...prev, msg]);
        });
        unsubRef.current = unsub;
      } else {
        setSquad(null);
      }
    } catch (e) {
      // network/db error — leave squad null, show empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    return () => { unsubRef.current?.(); };
  }, [load]);

  const handleCreateSquad = async () => {
    if (!user || !newSquadName.trim()) return;
    const result = await SquadService.createSquad(newSquadName.trim(), user.id);
    if (result.data) {
      setSquad(result.data);
      setCreateMode(false);
      setNewSquadName('');
      const msgResult = await SquadService.getMessages(result.data.id);
      if (msgResult.data) setMessages(msgResult.data);
    } else {
      Alert.alert('Error', result.error ?? 'Could not create squad.');
    }
  };

  const handleJoinSquad = async () => {
    if (!user || !joinCode.trim()) return;
    const result = await SquadService.joinByInviteCode(joinCode.trim().toUpperCase(), user.id);
    if (result.data) {
      setSquad(result.data);
      setJoinMode(false);
      setJoinCode('');
      const msgResult = await SquadService.getMessages(result.data.id);
      if (msgResult.data) setMessages(msgResult.data);
    } else {
      Alert.alert('Error', result.error ?? 'Invalid invite code.');
    }
  };

  const handleSendMessage = async () => {
    if (!user || !squad || !inputText.trim()) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    const result = await SquadService.sendMessage(squad.id, user.id, text, 'roast');
    if (!result.data) {
      // restore text on failure
      setInputText(text);
      Alert.alert('Error', result.error ?? 'Message failed to send.');
    }
    setSending(false);
  };

  const copyInviteCode = () => {
    if (!squad) return;
    Clipboard.setStringAsync(squad.inviteCode).catch(() => {});
    Alert.alert('Copied!', `Invite code ${squad.inviteCode} copied to clipboard.`);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!squad) {
    // No squad — show create/join UI
    if (createMode) {
      return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>New Squad</Text>
          </View>
          <View style={[styles.formContent, { paddingTop: spacing[6] }]}>
            <TextInput
              style={[styles.formInput, { color: colors.textPrimary, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={newSquadName}
              onChangeText={setNewSquadName}
              placeholder="Squad name..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Button label="Create Squad" variant="primary" fullWidth onPress={handleCreateSquad} />
            <Button label="Cancel" variant="ghost" fullWidth onPress={() => setCreateMode(false)} />
          </View>
        </View>
      );
    }

    if (joinMode) {
      return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Join Squad</Text>
          </View>
          <View style={[styles.formContent, { paddingTop: spacing[6] }]}>
            <TextInput
              style={[styles.formInput, { color: colors.textPrimary, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="PAUSE-XXXX"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoFocus
            />
            <Button label="Join Squad" variant="primary" fullWidth onPress={handleJoinSquad} />
            <Button label="Cancel" variant="ghost" fullWidth onPress={() => setJoinMode(false)} />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Squad</Text>
          <StatusBadge variant="pro" />
        </View>
        <View style={[styles.centered, { flex: 1 }]}>
          <Users size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No squad yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Create a squad or join one with an invite code.
          </Text>
          <View style={styles.emptyActions}>
            <Button label="Create Squad" variant="primary" onPress={() => setCreateMode(true)} />
            <Button label="Join with Code" variant="secondary" onPress={() => setJoinMode(true)} />
          </View>
        </View>
      </View>
    );
  }

  // Has squad
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{squad.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {squad.members.length} members
          </Text>
        </View>
        <View style={styles.headerRight}>
          <StatusBadge variant="pro" />
          <TouchableOpacity onPress={load} accessibilityRole="button" accessibilityLabel="Refresh">
            <RefreshCw size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Members */}
        <TechnicalDivider label="MEMBERS" />
        <MechaCard accent="primary" showAccentLine>
          <View style={styles.membersGrid}>
            {squad.members.map(member => (
              <MemberChip key={member.userId} member={member} colors={colors} />
            ))}
            <TouchableOpacity
              style={[styles.inviteChip, { borderColor: colors.border }]}
              onPress={() => Alert.alert('Invite', `Share code: ${squad.inviteCode}`)}
              accessibilityRole="button"
              accessibilityLabel="Invite member"
            >
              <Plus size={14} color={colors.textMuted} />
              <Text style={[styles.inviteLabel, { color: colors.textMuted }]}>Invite</Text>
            </TouchableOpacity>
          </View>

          {/* Invite code */}
          <View style={[styles.inviteSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.inviteCodeLabel, { color: colors.textMuted }]}>Share code</Text>
            <TouchableOpacity
              style={[styles.inviteCodePill, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}
              onPress={copyInviteCode}
              accessibilityRole="button"
              accessibilityLabel={`Copy invite code ${squad.inviteCode}`}
            >
              <Text style={[styles.inviteCode, { color: colors.primary }]}>{squad.inviteCode}</Text>
              <Copy size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </MechaCard>

        {/* Roast feed */}
        <TechnicalDivider label="ROAST FEED" showStatusDot />

        {messages.length === 0 ? (
          <Text style={[styles.emptyFeed, { color: colors.textMuted }]}>
            No messages yet. Be the first to roast!
          </Text>
        ) : (
          <View style={styles.feed}>
            {messages.map(msg => (
              <RoastMessage key={msg.id} message={msg} colors={colors} />
            ))}
          </View>
        )}

        {/* Squad rules */}
        <MechaCard accent="muted" showAccentLine>
          <View style={styles.rulesHeader}>
            <Shield size={14} color={colors.textMuted} />
            <Text style={[styles.rulesTitle, { color: colors.textMuted }]}>Squad rules</Text>
          </View>
          <View style={styles.rulesList}>
            {[
              'Roast the decision, not the person.',
              'No shaming finances, appearance, or income.',
              'Be playful. Be kind. Be honest.',
              'You can block or remove anyone at any time.',
            ].map((rule, i) => (
              <Text key={i} style={[styles.rule, { color: colors.textSecondary }]}>
                {i + 1}. {rule}
              </Text>
            ))}
          </View>
        </MechaCard>
      </ScrollView>

      {/* Message input */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing[3] }]}>
        <TextInput
          style={[styles.messageInput, { color: colors.textPrimary, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Add a roast or support..."
          placeholderTextColor={colors.textMuted}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: inputText.trim() && !sending ? colors.primary : colors.border }]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <MessageCircle size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MEMBER CHIP ─────────────────────────────────────────────────────────────

function MemberChip({ member, colors }: { member: Squad['members'][0]; colors: any }) {
  return (
    <View style={styles.memberChip}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {member.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.memberName, { color: colors.textSecondary }]} numberOfLines={1}>
        {member.displayName}
      </Text>
      {member.role === 'owner' && (
        <Text style={[styles.ownerBadge, { color: colors.primary }]}>★</Text>
      )}
    </View>
  );
}

// ─── ROAST MESSAGE ────────────────────────────────────────────────────────────

function RoastMessage({ message, colors }: { message: SquadMessage; colors: any }) {
  if (message.type === 'system') {
    return (
      <Text style={[styles.systemMsg, { color: colors.textMuted }]}>{message.content}</Text>
    );
  }

  const timeLabel = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.roastMsg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.roastBody}>
        <View style={[styles.roastAvatar, { backgroundColor: colors.primarySubtle }]}>
          <Text style={[styles.roastAvatarText, { color: colors.primary }]}>
            {message.author.displayName.charAt(0)}
          </Text>
        </View>
        <View style={styles.roastText}>
          <Text style={[styles.roastAuthor, { color: colors.textSecondary }]}>
            {message.author.displayName}
            <Text style={[styles.roastTime, { color: colors.textMuted }]}>  {timeLabel}</Text>
          </Text>
          <Text style={[styles.roastContent, { color: colors.textPrimary }]}>{message.content}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── PRO GATE ─────────────────────────────────────────────────────────────────

function SquadProGate({ colors, insets }: { colors: any; insets: any }) {
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Squad</Text>
        <ProGateBadge />
      </View>

      <ScrollView
        contentContainerStyle={[styles.gateContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gateHero}>
          <Users size={48} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.gateTitle, { color: colors.textPrimary }]}>Squad Roasting</Text>
          <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
            Invite friends to keep each other accountable — with humor. Your squad roasts your impulse buys so you don't regret them later.
          </Text>
        </View>

        <View style={styles.featureList}>
          {[
            { title: 'Private squad', desc: 'Only people you invite can join.' },
            { title: 'Spend limit alerts', desc: 'Squad gets notified when you\'re about to go over.' },
            { title: 'Roast controls', desc: 'You control what they can see and who can comment.' },
            { title: 'Moderation tools', desc: 'Block, remove, or report at any time.' },
          ].map((f, i) => (
            <View key={i} style={[styles.feature, { borderLeftColor: colors.primary }]}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Upgrade to Pro — ฿39/month"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => {}}
        />

        <Text style={[styles.gateNote, { color: colors.textMuted }]}>
          Cancel any time. Estimated avoided spending usually exceeds the subscription cost.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, letterSpacing: -0.8 },
  subtitle: { fontSize: typography.size.xs, fontFamily: 'Courier New', marginTop: 2 },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[4], gap: spacing[4] },
  membersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[3] },
  memberChip: { alignItems: 'center', gap: spacing[1], width: 52 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.size.base, fontWeight: typography.weight.bold },
  memberName: { fontSize: typography.size.xs, textAlign: 'center', maxWidth: 52 },
  ownerBadge: { fontSize: 9 },
  inviteChip: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
  },
  inviteLabel: { fontSize: 9, fontFamily: 'Courier New' },
  inviteSection: { borderTopWidth: 1, paddingTop: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  inviteCodeLabel: { fontSize: typography.size.xs },
  inviteCodePill: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.md, borderWidth: 1 },
  inviteCode: { fontFamily: 'Courier New', fontSize: typography.size.base, fontWeight: typography.weight.bold, letterSpacing: 1.5 },
  feed: { gap: spacing[2] },
  emptyFeed: { textAlign: 'center', fontSize: typography.size.sm, fontFamily: 'Courier New', paddingVertical: spacing[4] },
  systemMsg: { fontSize: typography.size.xs, textAlign: 'center', paddingVertical: spacing[2], fontFamily: 'Courier New' },
  roastMsg: { borderRadius: radius.lg, borderWidth: 1, padding: spacing[3] },
  roastBody: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  roastAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roastAvatarText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  roastText: { flex: 1, gap: 3 },
  roastAuthor: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  roastTime: { fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  roastContent: { fontSize: typography.size.base, lineHeight: 22 },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginBottom: spacing[2] },
  rulesTitle: { fontSize: typography.size.xs, fontFamily: 'Courier New', letterSpacing: 0.5 },
  rulesList: { gap: spacing[1.5] },
  rule: { fontSize: typography.size.sm, lineHeight: 18 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[4], paddingTop: spacing[3], borderTopWidth: 1 },
  messageInput: { flex: 1, height: 44, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing[4], fontSize: typography.size.base },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  // No squad
  emptyTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  emptyDesc: { fontSize: typography.size.sm, textAlign: 'center', paddingHorizontal: spacing[6], lineHeight: 20 },
  emptyActions: { flexDirection: 'row', gap: spacing[3] },
  formContent: { paddingHorizontal: spacing[6], gap: spacing[4] },
  formInput: { height: 48, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing[4], fontSize: typography.size.base },
  // Pro gate
  gateContent: { paddingHorizontal: spacing[6], paddingTop: spacing[8], gap: spacing[6], alignItems: 'center' },
  gateHero: { alignItems: 'center', gap: spacing[3] },
  gateTitle: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, letterSpacing: -0.5, textAlign: 'center' },
  gateDesc: { fontSize: typography.size.base, lineHeight: 24, textAlign: 'center' },
  featureList: { width: '100%', gap: spacing[3] },
  feature: { paddingLeft: spacing[3], borderLeftWidth: 2, gap: 3 },
  featureTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  featureDesc: { fontSize: typography.size.sm, lineHeight: 18 },
  gateNote: { fontSize: typography.size.xs, textAlign: 'center', lineHeight: 16, paddingHorizontal: spacing[4] },
});
