/**
 * InterceptRoastModal
 *
 * Full-screen modal that appears when a shopping intercept is detected.
 * Shows:
 *   - Platform name + emoji
 *   - Roast message (randomised per platform)
 *   - CTA: "เพิ่มใน Waiting List" OR "ซื้อเลย" (user chose to proceed)
 *
 * Rendered once inside the root _layout.tsx so it overlays everything.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInterceptStore } from '@/store/interceptStore';
import { PLATFORM_META } from '@/features/intercept/InterceptService';
import { useTheme } from '@/hooks/useTheme';
import type { ShoppingPlatform } from '@/types';

export function InterceptRoastModal() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isVisible, pendingEvent, roastMessage, dismiss, confirmSaved } = useInterceptStore();

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!pendingEvent && !isVisible) return null;

  const platform = (pendingEvent?.platform ?? 'unknown') as ShoppingPlatform;
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.unknown;

  const handleAddToWaitList = () => {
    confirmSaved();
    // Navigate to add purchase screen with pre-filled URL
    const url = pendingEvent?.url;
    if (url) {
      router.push({ pathname: '/(tabs)', params: { interceptUrl: url } });
    } else {
      router.push('/(tabs)');
    }
  };

  const handleProceed = () => {
    dismiss();
    // If we have the URL, open it
    if (pendingEvent?.url && Platform.OS !== 'web') {
      import('expo-linking').then(({ openURL }) => openURL(pendingEvent.url!));
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismiss} />

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors?.surface ?? '#FFFFFF', transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors?.border ?? '#E0E0E0' }]} />

          {/* Platform badge */}
          <View style={[styles.platformBadge, { backgroundColor: meta.color + '18' }]}>
            <Text style={styles.platformEmoji}>{meta.emoji}</Text>
            <Text style={[styles.platformName, { color: meta.color }]}>{meta.name}</Text>
          </View>

          {/* Roast header */}
          <Text style={[styles.header, { color: colors?.textPrimary ?? '#18191C' }]}>
            เดี๋ยวก่อน! 🔥
          </Text>

          {/* Roast message */}
          <View style={[styles.roastBubble, { backgroundColor: colors?.background ?? '#F2F0EB' }]}>
            <Text style={[styles.roastText, { color: colors?.textPrimary ?? '#18191C' }]}>
              {roastMessage}
            </Text>
          </View>

          {/* Spending reminder */}
          <Text style={[styles.subtext, { color: colors?.textSecondary ?? '#7E7B75' }]}>
            หยุดคิดแค่ 24 ชั่วโมง — ถ้ายังอยากได้อยู่ ค่อยซื้อก็ได้
          </Text>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors?.primary ?? '#1B3557' }]}
            onPress={handleAddToWaitList}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>⏸ เพิ่มใน Waiting List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors?.border ?? '#DEDBD4' }]}
            onPress={handleProceed}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: colors?.textSecondary ?? '#7E7B75' }]}>
              ซื้อเลย (ฉันมั่นใจแล้ว)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={dismiss} style={styles.dismissLink}>
            <Text style={[styles.dismissText, { color: colors?.textSecondary ?? '#A8A59E' }]}>
              ปิด
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  platformEmoji: { fontSize: 18 },
  platformName: { fontSize: 14, fontWeight: '600' },
  header: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  roastBubble: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  roastText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dismissLink: { paddingVertical: 8 },
  dismissText: { fontSize: 14 },
});
