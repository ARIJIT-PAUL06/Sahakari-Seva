// ==============================================================================
// CUSTOMER BOOKING CREATE SCREEN — REAL-TIME SCHEDULE CONFLICTS & ALTERNATIVES
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Zap,
  AlertCircle,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { BookingConfirmedModal } from '../../components/common/BookingConfirmedModal';
import { useRole } from '../../context/RoleContext';
import type { Booking, NearbyWorkerResult } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { MOCK_CATEGORIES } from '../../services/mockDatabase';
import { translateTrade } from '../../i18n';
import { FadeInView, ScalePressable } from '../../animations';

const localToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const STANDARD_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
];

export const BookingCreateScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'CustomerTabs', isHome: false });
  const [worker, setWorker] = useState(
    route?.params?.worker || {
      name: 'Rajesh Sharma',
      hourly_rate: 249,
      service: 'Electrical',
      workerId: 'w0000000-0000-0000-0000-000000000001',
    }
  );

  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const scrollViewRef = useRef<ScrollView>(null);

  const initialEmergency = Boolean(
    route?.params?.isEmergency ||
      route?.params?.emergencyOnly ||
      route?.params?.emergency ||
      worker?.availability_status === 'emergency_only'
  );

  const isAlternativeSuggestion = Boolean(route?.params?.isAlternativeSuggestion);
  const originalWorkerName = route?.params?.originalWorkerName || '';

  const { refresh: refreshNotifications } = useRole();
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const [date, setDate] = useState(route?.params?.requestedDate || localToday());
  const [time, setTime] = useState(
    initialEmergency
      ? 'Immediate (< 15-30 min dispatch)'
      : route?.params?.requestedTime || '10:00 AM'
  );
  const [address, setAddress] = useState('Flat 402, Royal Residency, Connaught Place');
  const [pincode, setPincode] = useState('110001');
  const [description, setDescription] = useState(
    initialEmergency
      ? 'Urgent 24/7 emergency dispatch requested for immediate on-site assistance.'
      : ''
  );
  const [isEmergency, setIsEmergency] = useState(initialEmergency);
  const [submitting, setSubmitting] = useState(false);
  const [findingAlternative, setFindingAlternative] = useState(false);

  // Real-Time worker bookings for slot collision analysis
  const [workerBookings, setWorkerBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const activeWorkerId = worker.workerId || worker.id || 'w0000000-0000-0000-0000-000000000001';

  const fetchWorkerBookings = async () => {
    try {
      setLoadingBookings(true);
      const list = await ApiClient.getBookings(undefined, activeWorkerId);
      setWorkerBookings(list || []);
    } catch {
      // Fallback
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchWorkerBookings();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      fetchWorkerBookings();
    });
    return () => {
      sub.remove();
    };
  }, [activeWorkerId]);

  // Synchronize when route params update worker
  useEffect(() => {
    if (route?.params?.worker) {
      setWorker(route.params.worker);
    }
    if (route?.params?.requestedDate) {
      setDate(route.params.requestedDate);
    }
    if (route?.params?.requestedTime) {
      setTime(route.params.requestedTime);
    }
  }, [route?.params]);

  // Evaluate conflict mapping for all standard slots on chosen date
  const slotStatusMap = useMemo(() => {
    const map: Record<
      string,
      { isBusy: boolean; conflictReason?: string; conflictingBooking?: Booking }
    > = {};

    STANDARD_TIME_SLOTS.forEach((slot) => {
      const conflict = ApiClient.checkScheduleConflict(
        {
          booking_date: date,
          booking_time: slot,
          worker_id: activeWorkerId,
          is_emergency: false,
        },
        workerBookings,
        60
      );
      map[slot] = {
        isBusy: conflict.hasConflict,
        conflictReason: conflict.reason,
        conflictingBooking: conflict.conflictingBooking || undefined,
      };
    });

    return map;
  }, [date, workerBookings, activeWorkerId]);

  // Check collision for the currently selected time & date
  const currentSlotConflict = useMemo(() => {
    if (isEmergency) return { hasConflict: false };
    return ApiClient.checkScheduleConflict(
      {
        booking_date: date,
        booking_time: time,
        worker_id: activeWorkerId,
        is_emergency: isEmergency,
      },
      workerBookings,
      60
    );
  }, [date, time, isEmergency, workerBookings, activeWorkerId]);

  const isSlotColliding = !isEmergency && currentSlotConflict.hasConflict;

  // Find the first available free slot for this date
  const firstAvailableSlot = useMemo(() => {
    return STANDARD_TIME_SLOTS.find((s) => !slotStatusMap[s]?.isBusy) || '12:00 PM';
  }, [slotStatusMap]);

  const handleToggleEmergency = (val: boolean) => {
    setIsEmergency(val);
    if (val) {
      setDate(localToday());
      setTime('Immediate (< 15-30 min dispatch)');
      if (!description.trim()) {
        setDescription('Urgent 24/7 emergency dispatch requested for immediate on-site assistance.');
      }
    } else {
      setTime(firstAvailableSlot || '10:00 AM');
    }
  };

  const handleSelectDifferentTime = () => {
    if (firstAvailableSlot) {
      setTime(firstAvailableSlot);
    }
    scrollViewRef.current?.scrollTo({ y: 160, animated: true });
  };

  const handleFindClosestAlternative = async () => {
    try {
      setFindingAlternative(true);
      const workerTrade = worker.service || worker.skill_category || 'Electrical';
      const nearby = await ApiClient.getNearbyWorkers(26.9017, 75.7925, 30, workerTrade);

      // Filter out current worker
      const alternatives = nearby.filter((w) => w.workerId !== activeWorkerId);

      if (alternatives.length > 0) {
        // Find closest worker
        const closest = alternatives[0];

        navigation.navigate('WorkerSearch', {
          selectedCategory: workerTrade,
          alternativeBanner: true,
          originalWorkerName: worker.name || 'Current professional',
          requestedDate: date,
          requestedTime: time,
          closestWorkerName: closest.name,
        });
      } else {
        // If no alternative in trade, navigate to general search
        navigation.navigate('WorkerSearch', {
          selectedCategory: workerTrade,
          alternativeBanner: true,
          originalWorkerName: worker.name,
          requestedDate: date,
          requestedTime: time,
        });
      }
    } catch {
      navigation.navigate('WorkerSearch', {
        selectedCategory: worker.service || worker.skill_category || 'all',
        alternativeBanner: true,
        originalWorkerName: worker.name,
        requestedDate: date,
        requestedTime: time,
      });
    } finally {
      setFindingAlternative(false);
    }
  };

  const basePrice = worker.hourly_rate || worker.hourly_or_base_rate || 249;
  const finalAmount = isEmergency ? Math.round(basePrice * 1.25) : basePrice;

  // 85/10/5 fair split
  const workerCut = Math.round(finalAmount * 0.85);
  const welfareCut = Math.round(finalAmount * 0.1);
  const platformCut = finalAmount - workerCut - welfareCut;

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('booking.required_title'), t('booking.required_msg'));
      return;
    }

    if (isSlotColliding) {
      Alert.alert(
        t('booking.slot_busy_title', 'Professional Busy in this Time Slot'),
        t(
          'booking.slot_busy_desc',
          `${worker.name || 'This professional'} is busy at ${time}. Please select an open slot or find an alternative.`
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const workerTrade = (worker.service || worker.skill_category || '').toLowerCase();
      const matchedCategory = MOCK_CATEGORIES.find((c) => c.name.toLowerCase() === workerTrade);
      const service_category_id = matchedCategory?.id || 's0000000-0000-0000-0000-000000000001';

      const payload = {
        customer_id: 'p0000000-0000-0000-0000-000000000002', // Demo Customer Priya Singh
        worker_id: activeWorkerId,
        service_category_id,
        booking_date: date,
        booking_time: time,
        address,
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode,
        latitude: 26.9017,
        longitude: 77.2167,
        service_description: description,
        estimated_amount: finalAmount,
        final_amount: finalAmount,
        is_emergency: isEmergency,
      };

      const result = await ApiClient.createBooking(payload);
      setConfirmedBooking(result);
      void refreshNotifications();
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (err: any) {
      Alert.alert(t('booking.error_title'), err.message || t('booking.error_title'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('booking.book_worker')}
        subtitle={worker.name || worker.worker_code}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alternative Worker Suggestion Top Banner */}
        {isAlternativeSuggestion && (
          <FadeInView distance={8} duration={260}>
            <View style={styles.alternativeSuggestionBanner}>
              <View style={styles.alternativeSuggestionIconCircle}>
                <Sparkles size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alternativeBadge}>
                  <Text style={styles.alternativeBadgeText}>
                    {t('booking.closest_alternative_title', 'Closest Alternative Professional')}
                  </Text>
                </View>
                <Text style={styles.alternativeSuggestionTitle}>
                  {worker.name} is available now!
                </Text>
                <Text style={styles.alternativeSuggestionDesc}>
                  {originalWorkerName
                    ? `${originalWorkerName} was busy at your selected slot. `
                    : ''}
                  {t(
                    'booking.closest_alternative_banner',
                    'This is the closest verified professional available at your requested time. You can book now!'
                  )}
                </Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Worker Info Card */}
        <View style={styles.workerSummary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>{worker.name || 'Verified Professional'}</Text>
            <Text style={styles.workerTrade}>
              {translateTrade(worker.service || worker.skill_category)} • ★{' '}
              {worker.rating || worker.average_rating || 4.8}
            </Text>
          </View>
          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>₹{basePrice}/hr</Text>
          </View>
        </View>

        {/* Date & Time Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('booking.date_label')}</Text>
          </View>

          {/* Quick Date Chips (Today / Tomorrow / Custom) */}
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={[
                styles.quickDateChip,
                date === localToday() && styles.quickDateChipActive,
              ]}
              onPress={() => setDate(localToday())}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickDateChipText,
                  date === localToday() && styles.quickDateChipTextActive,
                ]}
              >
                Today ({localToday().slice(5)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickDateChip,
                date !== localToday() && styles.quickDateChipActive,
              ]}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const d = String(tomorrow.getDate()).padStart(2, '0');
                setDate(`${tomorrow.getFullYear()}-${m}-${d}`);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickDateChipText,
                  date !== localToday() && styles.quickDateChipTextActive,
                ]}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder={t('booking.placeholder_date')}
            placeholderTextColor={colors.textMuted}
          />

          {/* Time Slot Picker */}
          <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('booking.time_label')}</Text>
          </View>

          {!isEmergency ? (
            <>
              <Text style={styles.slotSubtitle}>
                Select an available time slot for {worker.name?.split(' ')[0] || 'the professional'}:
              </Text>

              {/* Time Slots Grid */}
              <View style={styles.timeSlotsGrid}>
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const isSelected = time === slot;
                  const isBusy = slotStatusMap[slot]?.isBusy;

                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlotChip,
                        isSelected && styles.timeSlotChipSelected,
                        isBusy && !isSelected && styles.timeSlotChipBusy,
                        isBusy && isSelected && styles.timeSlotChipBusySelected,
                      ]}
                      onPress={() => setTime(slot)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.slotContentRow}>
                        <View
                          style={[
                            styles.slotDot,
                            isBusy ? styles.slotDotBusy : styles.slotDotFree,
                            isSelected && styles.slotDotSelected,
                          ]}
                        />
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                            isBusy && styles.timeSlotTextBusy,
                          ]}
                        >
                          {slot}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.slotStatusTag,
                          isBusy ? styles.slotStatusTagBusy : styles.slotStatusTagFree,
                          isSelected && styles.slotStatusTagSelected,
                        ]}
                      >
                        {isBusy
                          ? t('booking.slot_booked', 'Booked')
                          : t('booking.slot_available', 'Free')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.emergencyTimeBox}>
              <Zap size={16} color="#e11d48" />
              <Text style={styles.emergencyTimeText}>
                Immediate (&lt; 15–30 min arrival priority dispatch)
              </Text>
            </View>
          )}

          {/* Custom Time Input */}
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            value={time}
            onChangeText={setTime}
            placeholder={t('booking.placeholder_time')}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Schedule Collision Alert Card (Shown right below Time section when slot collides) */}
        {isSlotColliding && (
          <FadeInView distance={10} duration={280}>
            <View style={styles.collisionCard}>
              <View style={styles.collisionHeaderRow}>
                <AlertCircle size={20} color="#D97706" />
                <Text style={styles.collisionTitle}>
                  {t('booking.slot_busy_title', 'Professional Busy in this Time Slot')}
                </Text>
              </View>

              <Text style={styles.collisionDesc}>
                {t(
                  'booking.slot_busy_desc',
                  `${worker.name || 'This professional'} is already committed to an active assignment at ${time} on ${date}. Please select a different time slot or find a nearby alternative professional.`
                )}
              </Text>

              {/* Inline Shortcut Actions */}
              <View style={styles.collisionActionsRow}>
                <TouchableOpacity
                  style={styles.collisionActionAltBtn}
                  onPress={handleSelectDifferentTime}
                  activeOpacity={0.8}
                >
                  <Clock size={14} color="#B86A00" />
                  <Text style={styles.collisionActionAltBtnText}>
                    Pick Free Slot ({firstAvailableSlot})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.collisionActionFindBtn}
                  onPress={handleFindClosestAlternative}
                  activeOpacity={0.85}
                  disabled={findingAlternative}
                >
                  {findingAlternative ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Users size={14} color="#FFFFFF" />
                      <Text style={styles.collisionActionFindBtnText}>
                        Find Closest Alternative →
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Address & Pincode */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('booking.address_label')}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder={t('booking.placeholder_address')}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            {t('booking.pincode_label')}
          </Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Emergency Notice Banner */}
        {isEmergency && (
          <View style={styles.emergencyNoticeBanner}>
            <Zap size={16} color="#ffffff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyNoticeTitle}>
                🚨 24/7 Priority Emergency Booking Active
              </Text>
              <Text style={styles.emergencyNoticeDesc}>
                Worker dispatched immediately for arrival within &lt; 15-30 minutes. +25% emergency
                mobilization surcharge applied.
              </Text>
            </View>
          </View>
        )}

        {/* Emergency Toggle */}
        <View style={styles.emergencyRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.emergencyTagRow}>
              <Zap size={16} color={colors.danger} />
              <Text style={styles.emergencyLabel}>{t('booking.emergency_label')}</Text>
            </View>
            <Text style={styles.emergencySub}>{t('booking.emergency_sub')}</Text>
          </View>
          <Switch
            value={isEmergency}
            onValueChange={handleToggleEmergency}
            trackColor={{ false: colors.border, true: colors.dangerLight }}
            thumbColor={isEmergency ? colors.danger : colors.surface}
          />
        </View>

        {/* Requirement Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.desc_label')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('booking.placeholder_desc')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Transparent Cooperative Fair Split Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownTitleRow}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.breakdownTitle}>{t('booking.wage_split_title')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.worker_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{workerCut}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.welfare_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{welfareCut}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('booking.platform_cut')}</Text>
            <Text style={styles.breakdownValue}>₹{platformCut}</Text>
          </View>
          {isEmergency && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.danger, fontWeight: '700' }]}>
                Emergency Surcharge (+25%)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.danger, fontWeight: '700' }]}>
                +₹{finalAmount - basePrice}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('booking.total_est')}</Text>
            <Text style={styles.totalValue}>₹{finalAmount}</Text>
          </View>
        </View>

        {/* Bottom Action Area: Either Normal Submit or Collision Redirection Buttons */}
        {isSlotColliding ? (
          <View style={styles.conflictBottomActionCard}>
            <View style={styles.conflictBottomHeader}>
              <AlertCircle size={16} color="#D97706" />
              <Text style={styles.conflictBottomHeaderText}>
                Slot unavailable ({time}). Choose an option:
              </Text>
            </View>

            <View style={styles.conflictButtonGrid}>
              <TouchableOpacity
                style={styles.conflictSelectSlotBtn}
                onPress={handleSelectDifferentTime}
                activeOpacity={0.85}
              >
                <Clock size={16} color="#B86A00" />
                <Text style={styles.conflictSelectSlotBtnText}>
                  {t('booking.select_different_time', 'Select Different Time Slot')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conflictFindAltBtn}
                onPress={handleFindClosestAlternative}
                activeOpacity={0.85}
                disabled={findingAlternative}
              >
                {findingAlternative ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Users size={16} color="#FFFFFF" />
                    <Text style={styles.conflictFindAltBtnText}>
                      {t('booking.find_closest_alternative', 'Find Closest Alternative')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, isEmergency && styles.submitBtnEmergency]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEmergency
                  ? `🚨 Request Emergency Dispatch (₹${finalAmount})`
                  : t('booking.confirm_btn', 'Send Booking Request')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <BookingConfirmedModal
        visible={!!confirmedBooking}
        booking={confirmedBooking}
        worker={worker}
        onClose={() => {
          setConfirmedBooking(null);
          navigation.navigate('CustomerTabs', { screen: 'Bookings' });
        }}
        onViewBookings={() => {
          const b = confirmedBooking;
          setConfirmedBooking(null);
          if (b?.id) {
            navigation.navigate('BookingDetail', { bookingId: b.id });
          } else {
            navigation.navigate('CustomerTabs', { screen: 'Bookings' });
          }
        }}
      />
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    alternativeSuggestionBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
      borderWidth: 1.5,
      borderColor: '#10b981',
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
    },
    alternativeSuggestionIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#064e3b' : '#d1fae5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    alternativeBadge: {
      backgroundColor: '#059669',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    alternativeBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    alternativeSuggestionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#047857',
      marginBottom: 2,
    },
    alternativeSuggestionDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    workerSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    workerName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    workerTrade: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 2,
    },
    priceChip: {
      backgroundColor: isDark ? 'rgba(8, 127, 91, 0.2)' : '#e8f7f1',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    priceChipText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },
    section: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    quickDateRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    quickDateChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    quickDateChipActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(8, 127, 91, 0.2)' : '#e8f7f1',
    },
    quickDateChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    quickDateChipTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    slotSubtitle: {
      fontSize: 11.5,
      color: colors.textMuted,
      marginBottom: 10,
    },
    timeSlotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    timeSlotChip: {
      width: '31%',
      minWidth: 90,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeSlotChipSelected: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(8, 127, 91, 0.25)' : '#e8f7f1',
    },
    timeSlotChipBusy: {
      borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#fed7aa',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.08)' : '#fffbeb',
    },
    timeSlotChipBusySelected: {
      borderColor: '#d97706',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7',
    },
    slotContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    slotDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    slotDotFree: {
      backgroundColor: '#10b981',
    },
    slotDotBusy: {
      backgroundColor: '#f59e0b',
    },
    slotDotSelected: {
      backgroundColor: colors.primary,
    },
    timeSlotText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    timeSlotTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },
    timeSlotTextBusy: {
      color: colors.textSecondary,
    },
    slotStatusTag: {
      fontSize: 9.5,
      fontWeight: '600',
      marginTop: 2,
    },
    slotStatusTagFree: {
      color: '#059669',
    },
    slotStatusTagBusy: {
      color: '#d97706',
    },
    slotStatusTagSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    emergencyTimeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#f87171',
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    emergencyTimeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#991b1b',
    },
    collisionCard: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#fffbeb',
      borderWidth: 1.5,
      borderColor: '#f59e0b',
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    collisionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    collisionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#b45309',
    },
    collisionDesc: {
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    collisionActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    collisionActionAltBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#292524' : '#ffffff',
      borderWidth: 1,
      borderColor: '#f59e0b',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    collisionActionAltBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#b45309',
    },
    collisionActionFindBtn: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#087F5B',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    collisionActionFindBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#ffffff',
    },
    conflictBottomActionCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1.5,
      borderColor: '#f59e0b',
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    conflictBottomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    conflictBottomHeaderText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#d97706',
    },
    conflictButtonGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    conflictSelectSlotBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      borderWidth: 1.5,
      borderColor: '#f59e0b',
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    conflictSelectSlotBtnText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#b45309',
      textAlign: 'center',
    },
    conflictFindAltBtn: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#087F5B',
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: 12,
      shadowColor: '#087F5B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    conflictFindAltBtnText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'center',
    },
    input: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    textArea: {
      height: 70,
      textAlignVertical: 'top',
    },
    emergencyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.dangerLight,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
      marginBottom: 16,
    },
    emergencyTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    emergencyLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.dangerDark,
    },
    emergencySub: {
      fontSize: 11,
      color: colors.dangerDark,
      marginTop: 2,
      opacity: 0.85,
    },
    breakdownCard: {
      backgroundColor: colors.successLight,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.success,
      marginBottom: 20,
    },
    breakdownTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    breakdownTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.successDark,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    breakdownLabel: {
      fontSize: 12,
      color: colors.successDark,
    },
    breakdownValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.successDark,
    },
    divider: {
      height: 1,
      backgroundColor: colors.success,
      opacity: 0.5,
      marginVertical: 8,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.successDark,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnEmergency: {
      backgroundColor: '#e11d48',
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textInverse,
    },
    emergencyNoticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#be123c',
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
    },
    emergencyNoticeTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    emergencyNoticeDesc: {
      fontSize: 11,
      color: '#ffe4e6',
      marginTop: 2,
      lineHeight: 15,
    },
  });