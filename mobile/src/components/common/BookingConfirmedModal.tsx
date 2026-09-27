// ==============================================================================
// FLIPKART & AMAZON STYLE ORDER CONFIRMED ANIMATED MODAL
// Celebratory green checkmark with spring overshoot bounce, expanding pulse
// ripples, radial celebratory confetti burst, live 4-step order stepper,
// worker summary & cooperative fair wage transparency.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  Send,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import type { Booking } from '../../types';
import { ApiClient } from '../../services/apiClient';

interface BookingConfirmedModalProps {
  visible: boolean;
  booking: Booking | null;
  worker?: any;
  onClose: () => void;
  onViewBookings: () => void;
}

// 12 radial confetti particles (burst angles, colors, and symbols)
const CONFETTI_PARTICLES = [
  { angle: 0, distance: 75, color: '#FF9933', symbol: '✦', size: 16 },
  { angle: 30, distance: 88, color: '#10B981', symbol: '●', size: 10 },
  { angle: 65, distance: 70, color: '#F59E0B', symbol: '★', size: 14 },
  { angle: 100, distance: 82, color: '#4F46E5', symbol: '◆', size: 12 },
  { angle: 135, distance: 78, color: '#EC4899', symbol: '✦', size: 15 },
  { angle: 165, distance: 85, color: '#06B6D4', symbol: '●', size: 11 },
  { angle: 195, distance: 72, color: '#FF9933', symbol: '★', size: 14 },
  { angle: 225, distance: 86, color: '#10B981', symbol: '◆', size: 13 },
  { angle: 260, distance: 80, color: '#F59E0B', symbol: '✦', size: 15 },
  { angle: 295, distance: 76, color: '#4F46E5', symbol: '●', size: 10 },
  { angle: 320, distance: 84, color: '#EC4899', symbol: '★', size: 13 },
  { angle: 345, distance: 74, color: '#06B6D4', symbol: '◆', size: 12 },
];

export const BookingConfirmedModal: React.FC<BookingConfirmedModalProps> = ({
  visible,
  booking,
  worker,
  onClose,
  onViewBookings,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Animation values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.85)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;

  const ripple1Scale = useRef(new Animated.Value(0.6)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.8)).current;

  const ripple2Scale = useRef(new Animated.Value(0.6)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.6)).current;

  const confettiBurst = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(15)).current;

  const stepperPulse = useRef(new Animated.Value(1)).current;

  const isEmergency = !!booking?.is_emergency;
  const isAdvance = !!booking?.is_advance_scheduled;
  const isConfirmed = booking?.status === 'accepted' || booking?.status === 'in_progress' || booking?.status === 'completed';
  const bookingCode = booking?.booking_code || (isConfirmed ? 'BK-2026-CONFIRMED' : 'BK-2026-REQUESTED');
  const workerName = worker?.name || booking?.worker?.profile?.full_name || (booking?.worker as any)?.name || 'Assigned Professional';
  const workerTrade = worker?.service || worker?.skill_category || booking?.service_description || 'Home Service';
  const workerRating = worker?.rating || worker?.average_rating || 4.9;
  const bookingDate = booking?.booking_date || 'Today';
  const bookingTime = booking?.booking_time || '10:00 AM';
  const autoDispatchLead = booking?.auto_dispatch_time || ApiClient.calculate3HoursPrior(bookingTime);
  const finalAmount = booking?.final_amount || worker?.hourly_rate || 249;
  const workerCut = Math.round(finalAmount * 0.85);

  const rotateInterpolation = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  useEffect(() => {
    if (visible) {
      // Reset values
      backdropAnim.setValue(0);
      cardScaleAnim.setValue(0.88);
      cardTranslateY.setValue(25);
      checkScale.setValue(0);
      checkRotate.setValue(0);
      ripple1Scale.setValue(0.6);
      ripple1Opacity.setValue(0.8);
      ripple2Scale.setValue(0.6);
      ripple2Opacity.setValue(0.6);
      confettiBurst.setValue(0);
      contentFadeAnim.setValue(0);
      contentTranslateY.setValue(15);
      stepperPulse.setValue(1);

      // Trigger tailored haptic feedback
      if (isConfirmed) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      }
      const hapticTimer = setTimeout(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }, 240);

      // 1. Entrance backdrop and card
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // 2. Flipkart/Amazon bounce scale on badge circle (0 -> 1.25 -> 1.0)
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 4.5,
            tension: 80,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(checkRotate, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // 3. Concentric radar ripples
      let radarLoop: Animated.CompositeAnimation | null = null;
      if (!isConfirmed) {
        // Continuous gentle radar ripples loop for requested/dispatching state
        radarLoop = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(ripple1Scale, {
                toValue: 2.3,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(ripple1Scale, {
                toValue: 0.6,
                duration: 0,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
            Animated.sequence([
              Animated.timing(ripple1Opacity, {
                toValue: 0,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(ripple1Opacity, {
                toValue: 0.7,
                duration: 0,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
          ])
        );
        radarLoop.start();
      } else {
        Animated.sequence([
          Animated.delay(160),
          Animated.parallel([
            Animated.timing(ripple1Scale, {
              toValue: 2.3,
              duration: 1100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(ripple1Opacity, {
              toValue: 0,
              duration: 1100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ]).start();

        Animated.sequence([
          Animated.delay(320),
          Animated.parallel([
            Animated.timing(ripple2Scale, {
              toValue: 2.7,
              duration: 1100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(ripple2Opacity, {
              toValue: 0,
              duration: 1100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ]).start();

        // Confetti burst (only when confirmed)
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(confettiBurst, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      }

      // 4. Order details and stepper reveal
      Animated.sequence([
        Animated.delay(260),
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // 5. Stepper pulse loop
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(stepperPulse, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(stepperPulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        clearTimeout(hapticTimer);
        pulseLoop.stop();
        if (radarLoop) radarLoop.stop();
      };
    }
  }, [visible, isConfirmed]);

  if (!visible && !booking) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Animated backdrop with tap-outside dismiss */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.72],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Modal Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: cardScaleAnim },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close confirmation modal"
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ============================================================== */}
            {/* CELEBRATORY TOP ANIMATION (Checkmark / Clock Icon + Ripple + Confetti) */}
            {/* ============================================================== */}
            <View style={styles.celebrationArea}>
              {/* Ripple Ring 1 */}
              <Animated.View
                style={[
                  styles.rippleRing,
                  isEmergency
                    ? styles.rippleRingEmergency
                    : !isConfirmed && styles.rippleRingRequested,
                  {
                    transform: [{ scale: ripple1Scale }],
                    opacity: ripple1Opacity,
                  },
                ]}
              />

              {/* Ripple Ring 2 */}
              <Animated.View
                style={[
                  styles.rippleRing,
                  styles.rippleRingSecondary,
                  isEmergency
                    ? styles.rippleRingEmergencySecondary
                    : !isConfirmed && styles.rippleRingRequestedSecondary,
                  {
                    transform: [{ scale: ripple2Scale }],
                    opacity: ripple2Opacity,
                  },
                ]}
              />

              {/* Radial Confetti Particles — only shown for Confirmed state */}
              {isConfirmed &&
                CONFETTI_PARTICLES.map((p, idx) => {
                  const rad = (p.angle * Math.PI) / 180;
                  const targetX = Math.cos(rad) * p.distance;
                  const targetY = Math.sin(rad) * p.distance;

                  const translateX = confettiBurst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetX],
                  });
                  const translateY = confettiBurst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetY],
                  });
                  const scale = confettiBurst.interpolate({
                    inputRange: [0, 0.4, 0.8, 1],
                    outputRange: [0.1, 1.3, 1.0, 0.3],
                  });
                  const opacity = confettiBurst.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0, 1, 0.9, 0],
                  });

                  return (
                    <Animated.View
                      key={idx}
                      style={[
                        styles.confettiParticle,
                        {
                          transform: [{ translateX }, { translateY }, { scale }],
                          opacity,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={{ fontSize: p.size, color: p.color, fontWeight: '800' }}>
                        {p.symbol}
                      </Text>
                    </Animated.View>
                  );
                })}

              {/* Main Badge: Green Checkmark (Confirmed), Red SOS (Emergency), or Warm Amber Clock (Requested) */}
              <Animated.View
                style={[
                  styles.checkCircleBadge,
                  isEmergency
                    ? styles.checkCircleBadgeEmergency
                    : !isConfirmed && styles.checkCircleBadgeRequested,
                  {
                    transform: [
                      { scale: checkScale },
                      { rotate: rotateInterpolation },
                    ],
                  },
                ]}
              >
                {isEmergency ? (
                  isConfirmed ? (
                    <Zap size={38} color="#ffffff" strokeWidth={3} />
                  ) : (
                    <AlertTriangle size={36} color="#ffffff" strokeWidth={2.8} />
                  )
                ) : isConfirmed ? (
                  <Check size={40} color="#ffffff" strokeWidth={3.8} />
                ) : (
                  <Clock size={36} color="#ffffff" strokeWidth={2.8} />
                )}
              </Animated.View>
            </View>

            {/* Animated Content Section */}
            <Animated.View
              style={[
                styles.contentSection,
                {
                  opacity: contentFadeAnim,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              {/* Title & Dynamic Status Badge */}
              <Text style={styles.titleText}>
                {isEmergency
                  ? (isConfirmed ? '🚨 Emergency Dispatch Confirmed! ⚡' : '🚨 Emergency SOS Sent!')
                  : isAdvance
                  ? '📅 Advance Booking Scheduled! ⏳'
                  : isConfirmed
                  ? (t('booking.confirmed_title') || 'Booking Confirmed! 🎉')
                  : (t('booking.requested_title') || 'Booking Requested! 📋')}
              </Text>

              <View
                style={[
                  styles.orderCodeBadge,
                  isEmergency
                    ? styles.orderCodeBadgeEmergency
                    : isAdvance
                    ? { backgroundColor: '#f0f9ff', borderColor: '#38bdf8' }
                    : !isConfirmed && styles.orderCodeBadgeRequested,
                ]}
              >
                <View
                  style={
                    isEmergency
                      ? styles.liveRedDot
                      : isAdvance
                      ? { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0284c7' }
                      : isConfirmed
                      ? styles.liveGreenDot
                      : styles.liveAmberDot
                  }
                />
                <Text
                  style={[
                    styles.orderCodeText,
                    isEmergency
                      ? styles.orderCodeTextEmergency
                      : isAdvance
                      ? { color: '#0369a1' }
                      : !isConfirmed && styles.orderCodeTextRequested,
                  ]}
                >
                  ORDER #{bookingCode} •{' '}
                  {isEmergency
                    ? (isConfirmed ? 'EMERGENCY ACTIVE • ON ROUTE' : '🚨 24/7 RAPID SOS')
                    : isAdvance
                    ? '📅 ADVANCE SCHEDULED'
                    : isConfirmed
                    ? 'CONFIRMED'
                    : 'AWAITING WORKER'}
                </Text>
              </View>

              <Text style={styles.subtitleText}>
                {isEmergency
                  ? isConfirmed
                    ? `Technician ${workerName} has accepted your emergency request and is en route! Estimated arrival in 15–30 minutes.`
                    : `Immediate SOS alert sent to ${workerName}. Fast-track mobilization SLA: within 15–30 minutes.`
                  : isAdvance
                  ? `Your appointment for ${bookingDate} at ${bookingTime} is scheduled. Automated dispatch will verify availability and send the service request to ${workerName} 3 hours before (at ${autoDispatchLead}).`
                  : isConfirmed
                  ? `Your booking has been confirmed by ${workerName}. Technician is scheduled on active duty!`
                  : `Your service request has been sent to ${workerName}. Awaiting worker confirmation.`}
              </Text>

              {/* ============================================================== */}
              {/* FLIPKART / AMAZON 4-STEP TRACKER */}
              {/* ============================================================== */}
              <View style={styles.stepperContainer}>
                <View style={styles.stepperTrackRow}>
                  {/* Step 1: Requested / Scheduled */}
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, styles.stepCircleDone]}>
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>
                      {isAdvance ? 'Scheduled' : (t('bookingDetail.step_requested') || 'Requested')}
                    </Text>
                    <Text style={styles.stepSubLabelDone}>{isAdvance ? 'Queued ✓' : 'Sent ✓'}</Text>
                  </View>

                  {/* Connecting Line 1-2 */}
                  <View style={[styles.stepLine, isConfirmed ? styles.stepLineActive : styles.stepLineAwaiting]} />

                  {/* Step 2: Confirmed / 3h Dispatch / Awaiting */}
                  <View style={styles.stepItem}>
                    {isConfirmed ? (
                      <Animated.View
                        style={[
                          styles.stepCircle,
                          styles.stepCircleDone,
                          { transform: [{ scale: stepperPulse }] },
                        ]}
                      >
                        <Check size={12} color="#ffffff" strokeWidth={3} />
                      </Animated.View>
                    ) : (
                      <Animated.View
                        style={[
                          styles.stepCircle,
                          isAdvance ? { backgroundColor: '#f0f9ff', borderColor: '#38bdf8', borderWidth: 1.5 } : styles.stepCircleAwaiting,
                          { transform: [{ scale: stepperPulse }] },
                        ]}
                      >
                        <Clock size={11} color={isAdvance ? '#0284c7' : '#d97706'} strokeWidth={2.4} />
                      </Animated.View>
                    )}
                    <Text style={[styles.stepLabel, isConfirmed ? styles.stepLabelActive : styles.stepLabelAwaiting]}>
                      {isAdvance ? '3h Dispatch' : isConfirmed ? (t('bookingDetail.step_confirmed') || 'Confirmed') : 'Confirmed'}
                    </Text>
                    <Text style={isConfirmed ? styles.stepSubLabelDone : styles.stepSubLabelAwaiting}>
                      {isConfirmed ? 'Accepted' : isAdvance ? `At ${autoDispatchLead}` : 'Waiting...'}
                    </Text>
                  </View>

                  {/* Connecting Line 2-3 */}
                  <View style={styles.stepLine} />

                  {/* Step 3: In Progress */}
                  <View style={styles.stepItem}>
                    <View style={styles.stepCirclePending}>
                      <Clock size={11} color={colors.textMuted} />
                    </View>
                    <Text style={styles.stepLabel}>{t('bookingDetail.step_in_progress') || 'In Progress'}</Text>
                    <Text style={styles.stepSubLabel}>Step 3</Text>
                  </View>

                  {/* Connecting Line 3-4 */}
                  <View style={styles.stepLine} />

                  {/* Step 4: Done */}
                  <View style={styles.stepItem}>
                    <View style={styles.stepCirclePending}>
                      <ShieldCheck size={11} color={colors.textMuted} />
                    </View>
                    <Text style={styles.stepLabel}>{t('bookingDetail.step_completed') || 'Completed'}</Text>
                    <Text style={styles.stepSubLabel}>Step 4</Text>
                  </View>
                </View>
              </View>

              {/* Awaiting / Advance Scheduling Notice Card */}
              {!isConfirmed && (
                <View
                  style={[
                    styles.awaitingNoticeCard,
                    isEmergency && styles.awaitingNoticeCardEmergency,
                    isAdvance && { backgroundColor: '#f0f9ff', borderColor: '#38bdf8' },
                  ]}
                >
                  <View style={styles.awaitingTopRow}>
                    <View
                      style={[
                        styles.awaitingClockIconCircle,
                        isEmergency && styles.awaitingEmergencyIconCircle,
                        isAdvance && { backgroundColor: '#e0f2fe' },
                      ]}
                    >
                      {isEmergency ? (
                        <AlertTriangle size={16} color="#dc2626" strokeWidth={2.5} />
                      ) : (
                        <Clock size={16} color={isAdvance ? '#0284c7' : '#d97706'} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.awaitingNoticeTitle,
                          isEmergency && styles.awaitingNoticeTitleEmergency,
                          isAdvance && { color: '#0369a1' },
                        ]}
                      >
                        {isEmergency
                          ? '🚨 Emergency Priority Mobilization'
                          : isAdvance
                          ? '📅 Automated 3-Hour Advance Dispatch'
                          : (t('booking.awaiting_worker') || 'Awaiting Worker Confirmation')}
                      </Text>
                      <Text
                        style={[
                          styles.awaitingNoticeDesc,
                          isEmergency && styles.awaitingNoticeDescEmergency,
                          isAdvance && { color: '#0c4a6e' },
                        ]}
                      >
                        {isEmergency
                          ? `${workerName} has received your SOS alert. Emergency +25% bonus wage applied. Rapid response SLA: arrival within 15–30 mins.`
                          : isAdvance
                          ? `Your booking is safely scheduled. When ${bookingDate} arrives, at ${autoDispatchLead} (3 hours before your appointment), the system will automatically check ${workerName}'s availability and dispatch the request. If occupied, you will be notified instantly to pick a new slot.`
                          : `${workerName} has received your job alert. You will be notified as soon as they confirm your booking.`}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.awaitingNoticeDivider,
                      isEmergency && styles.awaitingNoticeDividerEmergency,
                      isAdvance && { backgroundColor: 'rgba(56, 189, 248, 0.3)' },
                    ]}
                  />

                  <View style={styles.dispatchPillRow}>
                    <View
                      style={[
                        styles.pulseLiveDot,
                        isEmergency && { backgroundColor: '#ef4444' },
                        isAdvance && { backgroundColor: '#0284c7' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dispatchPillText,
                        isEmergency && { color: '#dc2626', fontWeight: '800' },
                        isAdvance && { color: '#0369a1', fontWeight: '800' },
                      ]}
                    >
                      {isEmergency
                        ? '⚡ Rapid Response Priority Unit • 15–30 min arrival SLA'
                        : isAdvance
                        ? `📅 Dispatches 3 Hours Prior (${autoDispatchLead})`
                        : 'Direct Cooperative Dispatch • Avg response 2–5 min'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Summary Details Card */}
              <View style={styles.summaryCard}>
                <View style={styles.workerRow}>
                  <View style={styles.workerAvatar}>
                    <Text style={styles.workerAvatarText}>
                      {workerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerNameText} numberOfLines={1}>
                      {workerName}
                    </Text>
                    <Text style={styles.workerServiceText}>
                      {workerTrade} • ★ {workerRating}
                    </Text>
                  </View>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountPillLabel}>Estimated</Text>
                    <Text style={styles.amountPillText}>₹{finalAmount}</Text>
                  </View>
                </View>

                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleCol}>
                    <Calendar size={13} color={colors.primary} />
                    <Text style={styles.scheduleText}>{bookingDate}</Text>
                  </View>
                  <View style={styles.scheduleCol}>
                    <Clock size={13} color={colors.primary} />
                    <Text style={styles.scheduleText}>{bookingTime}</Text>
                  </View>
                </View>

                {/* Fair Wage Guarantee */}
                <View style={[styles.fairWageBanner, isEmergency && styles.fairWageBannerEmergency]}>
                  <ShieldCheck size={14} color={isEmergency ? '#dc2626' : colors.successDark} />
                  <Text style={[styles.fairWageText, isEmergency && styles.fairWageTextEmergency]}>
                    Cooperative Fair Share: ₹{workerCut} (85% + Emergency Wage Bonus) directly to {workerName.split(' ')[0]}
                  </Text>
                </View>

                {/* Pay on Completion Tag */}
                <View style={styles.payOnCompletionRow}>
                  <Text style={styles.payOnCompletionText}>
                    💳 Pay after service completion • No advance fee required
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsCol}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={onViewBookings}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {t('booking.view_bookings') || 'Track Booking Status'}
                  </Text>
                  <ArrowRight size={17} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryBtnText}>
                    {t('common.close', 'Done')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
    },
    cardContainer: {
      width: '100%',
      maxWidth: 410,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.45 : 0.22,
      shadowRadius: 30,
      elevation: 20,
      overflow: 'hidden',
    },
    scrollArea: {
      width: '100%',
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 20,
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      zIndex: 20,
      padding: 6,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    celebrationArea: {
      width: 140,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 6,
    },
    rippleRing: {
      position: 'absolute',
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 2,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    rippleRingSecondary: {
      borderColor: '#34D399',
      backgroundColor: 'transparent',
    },
    rippleRingRequested: {
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.10)',
    },
    rippleRingRequestedSecondary: {
      borderColor: '#FBBF24',
      backgroundColor: 'transparent',
    },
    rippleRingEmergency: {
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    rippleRingEmergencySecondary: {
      borderColor: '#F87171',
      backgroundColor: 'transparent',
    },
    confettiParticle: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleBadge: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: '#059669',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 3.5,
      borderColor: '#ffffff',
    },
    checkCircleBadgeRequested: {
      backgroundColor: '#D97706',
      shadowColor: '#D97706',
    },
    checkCircleBadgeEmergency: {
      backgroundColor: '#DC2626',
      shadowColor: '#DC2626',
    },
    contentSection: {
      width: '100%',
      alignItems: 'center',
    },
    titleText: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    orderCodeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5',
      paddingHorizontal: 12,
      paddingVertical: 4.5,
      borderRadius: 20,
      marginTop: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0',
    },
    orderCodeBadgeRequested: {
      backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7',
      borderColor: isDark ? 'rgba(245,158,11,0.4)' : '#FDE68A',
    },
    orderCodeBadgeEmergency: {
      backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239,68,68,0.5)' : '#FECACA',
    },
    liveGreenDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    liveAmberDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#F59E0B',
      marginRight: 6,
    },
    liveRedDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#EF4444',
      marginRight: 6,
    },
    orderCodeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.successDark,
      letterSpacing: 0.5,
    },
    orderCodeTextRequested: {
      color: isDark ? '#FBBF24' : '#B45309',
    },
    orderCodeTextEmergency: {
      color: isDark ? '#F87171' : '#DC2626',
      fontWeight: '800',
    },
    subtitleText: {
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 12,
      paddingHorizontal: 12,
      lineHeight: 17,
    },

    // Stepper styling
    stepperContainer: {
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperTrackRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    stepItem: {
      alignItems: 'center',
      minWidth: 48,
      flex: 1,
    },
    stepCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepCircleDone: {
      backgroundColor: '#059669',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    stepCircleAwaiting: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
      borderWidth: 1.5,
      borderColor: '#F59E0B',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepCirclePending: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepLabel: {
      fontSize: 10.5,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    stepLabelActive: {
      color: colors.successDark,
      fontWeight: '700',
    },
    stepLabelAwaiting: {
      color: isDark ? '#FBBF24' : '#D97706',
      fontWeight: '700',
    },
    stepSubLabel: {
      fontSize: 9,
      color: colors.textMuted,
      marginTop: 1,
    },
    stepSubLabelDone: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.successDark,
      marginTop: 1,
    },
    stepSubLabelAwaiting: {
      fontSize: 9,
      fontWeight: '600',
      color: isDark ? '#FBBF24' : '#D97706',
      marginTop: 1,
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
      marginHorizontal: 2,
      marginTop: 10,
    },
    stepLineActive: {
      backgroundColor: '#059669',
    },
    stepLineAwaiting: {
      backgroundColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
    },

    // Awaiting Notice Card
    awaitingNoticeCard: {
      backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245,158,11,0.35)' : '#FDE68A',
      borderRadius: 14,
      padding: 11,
      marginBottom: 12,
      width: '100%',
    },
    awaitingNoticeCardEmergency: {
      backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239,68,68,0.45)' : '#FECACA',
    },
    awaitingTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    awaitingClockIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    awaitingEmergencyIconCircle: {
      backgroundColor: isDark ? 'rgba(220,38,38,0.25)' : '#FEE2E2',
    },
    awaitingNoticeTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#FBBF24' : '#92400E',
      marginBottom: 2,
    },
    awaitingNoticeTitleEmergency: {
      color: isDark ? '#F87171' : '#B91C1C',
    },
    awaitingNoticeDesc: {
      fontSize: 11.5,
      color: isDark ? '#FDE68A' : '#78350F',
      lineHeight: 16,
    },
    awaitingNoticeDescEmergency: {
      color: isDark ? '#FECACA' : '#991B1B',
    },
    awaitingNoticeDivider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
      marginVertical: 8,
    },
    awaitingNoticeDividerEmergency: {
      backgroundColor: isDark ? 'rgba(220,38,38,0.3)' : '#FCA5A5',
    },
    dispatchPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pulseLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    dispatchPillText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#FBBF24' : '#B45309',
    },

    // Summary Card
    summaryCard: {
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    workerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    workerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    workerAvatarText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
    workerInfo: {
      flex: 1,
    },
    workerNameText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    workerServiceText: {
      fontSize: 11.5,
      color: colors.textSecondary,
      marginTop: 1,
    },
    amountPill: {
      backgroundColor: isDark ? 'rgba(0,90,156,0.2)' : 'rgba(0,90,156,0.08)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0,90,156,0.4)' : 'rgba(0,90,156,0.18)',
      alignItems: 'flex-end',
    },
    amountPillLabel: {
      fontSize: 8.5,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    amountPillText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: colors.primary,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginBottom: 6,
    },
    scheduleCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    scheduleText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    fairWageBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      gap: 6,
      marginBottom: 5,
    },
    fairWageBannerEmergency: {
      backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.35)' : '#FECACA',
    },
    fairWageText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: colors.successDark,
      flex: 1,
    },
    fairWageTextEmergency: {
      color: isDark ? '#FCA5A5' : '#B91C1C',
      fontWeight: '700',
    },
    payOnCompletionRow: {
      paddingTop: 2,
    },
    payOnCompletionText: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },

    // Action buttons
    actionButtonsCol: {
      width: '100%',
      gap: 7,
    },
    primaryBtn: {
      width: '100%',
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryBtn: {
      width: '100%',
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
