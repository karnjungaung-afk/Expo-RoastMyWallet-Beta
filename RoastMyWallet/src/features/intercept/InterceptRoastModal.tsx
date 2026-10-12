import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useInterceptStore } from '@/store/interceptStore';
import { PLATFORM_META } from '@/features/intercept/InterceptService';
import { useTheme } from '@/hooks/useTheme';
import { RoastMascot } from '@/components/icons/RoastMascot';
import { ShieldIcon, ArrowRightIcon, PlusIcon } from '@/components/icons/RmwIcons';
import type { ShoppingPlatform } from '@/types';
import { spacing, typography } from '@/theme/tokens';

export function InterceptRoastModal() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { isVisible, pendingEvent, roastMessage, dismiss, confirmSaved } = useInterceptStore();

  const slideAnim   = useRef(new Animated.Value(420)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 420, duration: 160, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  if (!pendingEvent && !isVisible) return null;

  const platform = (pendingEvent?.platform ?? 'unknown') as ShoppingPlatform;
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.unknown;

  const handleAddToWaitList = () => {
    confirmSaved();
    if (pendingEvent?.url) {
      router.push({ pathname: '/(tabs)', params: { interceptUrl: pendingEvent.url } });
    } else {
      router.push('/(tabs)');
    }
  };

  const handleProceed = () => {
    dismiss();
    if (pendingEvent?.url && Platform.OS !== 'web') {
      import('expo-linking').then(({ openURL }) => openURL(pendingEvent.url!));
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismiss} />

        <Animated.View style={[styles.sheet, { backgroundColor: isDark ? '#141927' : '#FFFFFF', transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Platform tag */}
          <View style={[styles.platformTag, { backgroundColor: meta.color + '15', borderColor: meta.color + '30', borderWidth: 1 }]}>
            <View style={[styles.platformDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.platformName, { color: meta.color }]}>{meta.name}</Text>
          </View>

          {/* Mascot */}
          <View style={styles.mascotWrap}>
            <RoastMascot size={100} mode="roasting" />
          </View>

          {/* Header */}
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>หยุดก่อน!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>ระบบตรวจพบว่าคุณกำลังช้อปปิ้ง</Text>
          </View>

          {/* Roast message */}
          <View style={[styles.roastBubble, { backgroundColor: isDark ? '#1E2A3A' : '#F4F6F9', borderColor: isDark ? '#2A3D52' : '#E0E8F0' }]}>
            <Text style={[styles.roastText, { color: colors.textPrimary }]}>{roastMessage}</Text>
          </View>

          {/* Wait time reminder */}
          <View style={[styles.waitReminder, { backgroundColor: colors.primarySubtle }]}>
            <ShieldIcon size={14} color={colors.primary} />
            <Text style={[styles.waitReminderText, { color: colors.primary }]}>
              รอ 24 ชั่วโมง — ถ้ายังอยากได้อยู่ ค่อยซื้อ
            </Text>
          </View>

          {/* Primary CTA */}
          <LinearGradient
            colors={['#1B3557', '#22487A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}
          >
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddToWaitList} activeOpacity={0.85}>
              <PlusIcon size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>เพิ่มใน Waiting List</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Secondary */}
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleProceed} activeOpacity={0.7}>
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>ซื้อเลย (ฉันมั่นใจแล้ว)</Text>
            <ArrowRightIcon size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity onPress={dismiss} style={styles.dismissBtn}>
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>ปิด</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center', gap: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 4 },

  platformTag: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100,
  },
  platformDot: { width: 7, height: 7, borderRadius: 4 },
  platformName: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  mascotWrap: { marginVertical: 4 },

  textBlock: { alignItems: 'center', gap: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14 },

  roastBubble: {
    width: '100%', borderRadius: 16, padding: 16, borderWidth: 1,
  },
  roastText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  waitReminder: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '100%', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  waitReminderText: { fontSize: 13, fontWeight: '600' },

  primaryGradient: { width: '100%', borderRadius: 16, marginTop: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  secondaryBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500' },

  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 13 },
});
