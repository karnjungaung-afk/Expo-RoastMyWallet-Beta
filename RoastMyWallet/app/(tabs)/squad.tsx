import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { SquadService } from '@/features/squad/SquadService';
import { SquadIcon, FlameIcon, ShieldIcon, PlusIcon, ArrowRightIcon } from '@/components/icons/RmwIcons';
import type { Squad, SquadMessage } from '@/types';

export default function SquadScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPro } = useSubscriptionStore();

  if (!isPro()) return <ProGate colors={colors} isDark={isDark} insets={insets} />;
  return <SquadMain colors={colors} isDark={isDark} insets={insets} />;
}

// ── Pro Gate ──────────────────────────────────────────────────────────────────

function ProGate({ colors, isDark, insets }: any) {
  const perks = [
    { icon: <SquadIcon size={18} color="#8B5CF6" />, text: 'เชิญเพื่อนเข้า Squad ส่วนตัว' },
    { icon: <FlameIcon size={18} color="#E8A030" />, text: 'เห็นว่าเพื่อนรอซื้ออะไรอยู่' },
    { icon: <ShieldIcon size={18} color="#52B57D" />, text: 'ช่วยกันตัดสินใจและประหยัดด้วยกัน' },
  ];
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#211C24', colors.background] : ['#FF6B4A', '#7139D5']}
        style={[styles.gateHeader, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.gateIconWrap}>
          <SquadIcon size={36} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.gateTitle}>Squad</Text>
        <Text style={styles.gateSub}>หยุดซื้อของไม่จำเป็นพร้อมกับเพื่อน</Text>
      </LinearGradient>

      <View style={[styles.gateContent, { paddingHorizontal: 24 }]}>
        {perks.map((p, i) => (
          <View key={i} style={[styles.perkRow, { borderColor: colors.border, backgroundColor: isDark ? '#14110F' : '#FAFAFA' }]}>
            <View style={[styles.perkIcon, { backgroundColor: colors.primarySubtle }]}>{p.icon}</View>
            <Text style={[styles.perkText, { color: colors.textPrimary }]}>{p.text}</Text>
          </View>
        ))}

        <LinearGradient colors={['#F7CE43', '#FF6B4A']} style={styles.upgradeGrad}>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
            <FlameIcon size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>อัพเกรดเป็น Pro</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={[styles.gateNote, { color: colors.textMuted }]}>
          Pro · ฿39/เดือน · ยกเลิกได้ทุกเมื่อ
        </Text>
      </View>
    </View>
  );
}

// ── Squad Main ────────────────────────────────────────────────────────────────

function SquadMain({ colors, isDark, insets }: any) {
  const { user } = useAuthStore();
  const [squad, setSquad]       = useState<Squad | null>(null);
  const [messages, setMessages] = useState<SquadMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [mode, setMode]         = useState<'idle' | 'create' | 'join'>('idle');
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const msgListRef = useRef<FlatList>(null);
  const unsubRef   = useRef<(() => void) | null>(null);

  const loadSquad = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await SquadService.getUserSquads(user.id);
      if (r.data && r.data.length > 0) {
        const s = r.data[0];
        setSquad(s);
        const msgR = await SquadService.getMessages(s.id, 50);
        if (msgR.data) setMessages(msgR.data.reverse());
        unsubRef.current?.();
        unsubRef.current = SquadService.subscribeToMessages(s.id, msg =>
          setMessages(prev => [...prev, msg])
        );
      }
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadSquad(); return () => { unsubRef.current?.(); }; }, []);

  const handleSend = async () => {
    if (!text.trim() || !squad || !user || sending) return;
    const t = text.trim(); setText('');
    setSending(true);
    try { await SquadService.sendMessage(squad.id, user.id, t, 'support'); }
    catch {}
    finally { setSending(false); }
  };

  const handleCreate = async () => {
    if (!squadName.trim() || !user) return;
    try {
      const r = await SquadService.createSquad(squadName.trim(), user.id);
      if (r.data) { setSquad(r.data); setMode('idle'); }
    } catch {}
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return;
    try {
      const r = await SquadService.joinByInviteCode(joinCode.trim().toUpperCase(), user.id);
      if (r.data) { setSquad(r.data); loadSquad(); setMode('idle'); }
    } catch {}
  };

  // No squad yet — show create/join UI
  if (!squad && !loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#14110F', colors.background] : ['#8B5CF6', colors.background]}
          style={[styles.gateHeader, { paddingTop: insets.top + 24 }]}
        >
          <Text style={styles.gateTitle}>Squad ของฉัน</Text>
          <Text style={styles.gateSub}>ยังไม่ได้เป็นสมาชิก Squad ใด</Text>
        </LinearGradient>

        {mode === 'idle' && (
          <View style={[styles.noSquadContent, { paddingHorizontal: 24 }]}>
            <TouchableOpacity
              style={[styles.squadActionCard, { backgroundColor: isDark ? '#14110F' : '#fff', borderColor: colors.border }]}
              onPress={() => setMode('create')}
            >
              <LinearGradient colors={['#7139D5', '#31B9CE']} style={styles.squadActionIcon}>
                <PlusIcon size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.squadActionTitle, { color: colors.textPrimary }]}>สร้าง Squad ใหม่</Text>
                <Text style={[styles.squadActionSub, { color: colors.textSecondary }]}>เชิญเพื่อนด้วย invite code</Text>
              </View>
              <ArrowRightIcon size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.squadActionCard, { backgroundColor: isDark ? '#14110F' : '#fff', borderColor: colors.border }]}
              onPress={() => setMode('join')}
            >
              <LinearGradient colors={['#218B62', '#31B9CE']} style={styles.squadActionIcon}>
                <SquadIcon size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.squadActionTitle, { color: colors.textPrimary }]}>เข้าร่วม Squad</Text>
                <Text style={[styles.squadActionSub, { color: colors.textSecondary }]}>ใส่ invite code จากเพื่อน</Text>
              </View>
              <ArrowRightIcon size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && (
          <View style={[styles.noSquadContent, { paddingHorizontal: 24, gap: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ชื่อ Squad</Text>
            <TextInput
              style={[styles.codeInput, { borderColor: colors.border, backgroundColor: isDark ? '#14110F' : '#fff', color: colors.textPrimary }]}
              value={squadName} onChangeText={setSquadName}
              placeholder="เช่น ทีมประหยัดเงิน 2025"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <LinearGradient colors={['#8B5CF6', '#8B5CF6']} style={styles.codeSubmitGrad}>
              <TouchableOpacity style={styles.codeSubmit} onPress={handleCreate}>
                <Text style={styles.codeSubmitText}>สร้าง Squad</Text>
              </TouchableOpacity>
            </LinearGradient>
            <TouchableOpacity onPress={() => setMode('idle')} style={{ alignItems: 'center' }}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View style={[styles.noSquadContent, { paddingHorizontal: 24, gap: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Invite Code</Text>
            <TextInput
              style={[styles.codeInput, { borderColor: colors.border, backgroundColor: isDark ? '#14110F' : '#fff', color: colors.textPrimary }]}
              value={joinCode} onChangeText={setJoinCode}
              placeholder="ใส่ code 6 ตัวอักษร"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters" autoFocus
            />
            <LinearGradient colors={['#235E3B', '#3A9960']} style={styles.codeSubmitGrad}>
              <TouchableOpacity style={styles.codeSubmit} onPress={handleJoin}>
                <Text style={styles.codeSubmitText}>เข้าร่วม</Text>
              </TouchableOpacity>
            </LinearGradient>
            <TouchableOpacity onPress={() => setMode('idle')} style={{ alignItems: 'center' }}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Has squad — show chat
  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#211C24', '#342A38'] : ['#FF6B4A', '#7139D5']}
        style={[styles.chatHeader, { paddingTop: insets.top + 14 }]}
      >
        <View>
          <Text style={styles.chatName}>{squad?.name ?? 'Squad'}</Text>
          <Text style={styles.chatMembers}>{squad?.members?.length ?? 0} สมาชิก</Text>
        </View>
        <TouchableOpacity
          onPress={async () => { await Clipboard.setStringAsync(squad?.inviteCode ?? ''); }}
          style={styles.inviteCodePill}
        >
          <Text style={styles.inviteCodeText}>{squad?.inviteCode}</Text>
          <Text style={styles.inviteCodeCopy}>คัดลอก</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={msgListRef}
        data={messages}
        keyExtractor={m => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 8 }}
        onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item: m }) => {
          const isMe = m.userId === user?.id;
          return (
            <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
              {!isMe && <View style={[styles.msgAvatar, { backgroundColor: colors.primarySubtle }]}><Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'Prompt_700Bold' }}>{(m.userDisplayName ?? '?').charAt(0).toUpperCase()}</Text></View>}
              <View style={[styles.msgBubble, { backgroundColor: isMe ? colors.primary : (isDark ? '#14110F' : '#F0F2F5') }]}>
                {!isMe && <Text style={[styles.msgSender, { color: colors.textMuted }]}>{m.userDisplayName}</Text>}
                <Text style={[styles.msgText, { color: isMe ? '#fff' : colors.textPrimary }]}>{m.content}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: isDark ? '#14110F' : '#fff', paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.msgInput, { borderColor: colors.border, backgroundColor: isDark ? '#14110F' : '#FFF4DC', color: colors.textPrimary }]}
          value={text} onChangeText={setText}
          placeholder="พิมพ์ข้อความ..." placeholderTextColor={colors.textMuted}
          multiline returnKeyType="send" onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend} disabled={!text.trim() || sending}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.skeleton }]}
        >
          <ArrowRightIcon size={18} color={text.trim() ? '#fff' : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gateHeader: { paddingHorizontal: 24, paddingBottom: 28, alignItems: 'center', gap: 8 },
  gateIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  gateTitle: { fontSize: 28, fontFamily: 'Prompt_800ExtraBold', color: '#fff', letterSpacing: -0.8 },
  gateSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  gateContent: { flex: 1, paddingTop: 24, gap: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, borderWidth: 1 },
  perkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  perkText: { flex: 1, fontSize: 14, fontFamily: 'Prompt_500Medium', lineHeight: 20 },
  upgradeGrad: { borderRadius: 16, marginTop: 8 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Prompt_700Bold' },
  gateNote: { textAlign: 'center', fontSize: 12 },
  noSquadContent: { paddingTop: 24, gap: 12 },
  squadActionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  squadActionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  squadActionTitle: { fontSize: 15, fontFamily: 'Prompt_700Bold' },
  squadActionSub: { fontSize: 12, marginTop: 2 },
  inputLabel: { fontSize: 13, fontFamily: 'Prompt_600SemiBold', letterSpacing: 0.2 },
  codeInput: { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16 },
  codeSubmitGrad: { borderRadius: 14 },
  codeSubmit: { paddingVertical: 15, alignItems: 'center' },
  codeSubmitText: { color: '#fff', fontSize: 15, fontFamily: 'Prompt_700Bold' },
  cancelText: { fontSize: 14, paddingVertical: 8 },
  chatHeader: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { fontSize: 20, fontFamily: 'Prompt_800ExtraBold', color: '#fff' },
  chatMembers: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  inviteCodePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  inviteCodeText: { color: '#fff', fontSize: 14, fontFamily: 'Prompt_800ExtraBold', letterSpacing: 2 },
  inviteCodeCopy: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  msgBubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 3 },
  msgSender: { fontSize: 11, fontFamily: 'Prompt_600SemiBold' },
  msgText: { fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  msgInput: { flex: 1, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
