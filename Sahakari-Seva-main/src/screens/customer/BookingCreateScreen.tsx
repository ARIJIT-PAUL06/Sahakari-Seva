// ==============================================================================
// CUSTOMER BOOKING CREATE SCREEN — INTERACTIVE CALENDAR & REAL-TIME SLOTS
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import {
  ShieldCheck,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Zap,
  AlertCircle,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { BookingConfirmedModal } from '../../components/common/BookingConfirmedModal';
import { useRole } from '../../context/RoleContext';
import type { Booking } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { MOCK_CATEGORIES } from '../../services/mockDatabase';
import { translateTrade } from '../../i18n';
import { FadeInView } from '../../animations';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    year: y,
    month: now.getMonth(), // 0-11
    day: now.getDate(),
    dateStr: `${y}-${m}-${d}`,
  };
};

export const STANDARD_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
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

  const todayInfo = useMemo(() => getTodayDate(), []);

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

  // Selected date state (YYYY-MM-DD)
  const [date, setDate] = useState(route?.params?.requestedDate || todayInfo.dateStr);

  // Calendar Year and Month for monthly view
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    if (route?.params?.requestedDate) {
      const parts = route.params.requestedDate.split('-');
      if (parts.length === 3) return Number(parts[0]);
    }
    return todayInfo.year;
  });

  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    if (route?.params?.requestedDate) {
      const parts = route.params.requestedDate.split('-');
      if (parts.length === 3) return Number(parts[1]) - 1;
    }
    return todayInfo.month;
  });

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

  const activeWorkerId = worker.workerId || worker.id || 'w0000000-0000-0000-0000-000000000001';

  const fetchWorkerBookings = async () => {
    try {
      const list = await ApiClient.getBookings(undefined, activeWorkerId);
      setWorkerBookings(list || []);
    } catch {
      // Fallback
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
      const parts = route.params.requestedDate.split('-');
      if (parts.length === 3) {
        setCalendarYear(Number(parts[0]));
        setCalendarMonth(Number(parts[1]) - 1);
      }
    }
    if (route?.params?.requestedTime) {
      setTime(route.params.requestedTime);
    }
  }, [route?.params]);

  // Calendar days grid computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days: Array<{
      day: number | null;
      dateStr: string | null;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
      hasWorkerBookings: boolean;
    }> = [];

    // Preceding empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        day: null,
        dateStr: null,
        isToday: false,
        isSelected: false,
        isPast: false,
        hasWorkerBookings: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayInfo.dateStr;
      const isSelected = dateStr === date;
      const isPast = dateStr < todayInfo.dateStr;
      const hasWorkerBookings = workerBookings.some(
        (b) =>
          b.booking_date === dateStr &&
          (b.status === 'accepted' || b.status === 'in_progress')
      );

      days.push({
        day: d,
        dateStr,
        isToday,
        isSelected,
        isPast,
        hasWorkerBookings,
      });
    }

    return days;
  }, [calendarYear, calendarMonth, date, todayInfo, workerBookings]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear((prev) => prev - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear((prev) => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const cur = getTodayDate();
    setCalendarYear(cur.year);
    setCalendarMonth(cur.month);
    setDate(cur.dateStr);
  };

  const selectedDateFormatted = useMemo(() => {
    if (!date) return '';
    try {
      const parts = date.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {}
    return date;
  }, [date]);

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
      setDate(todayInfo.dateStr);
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
          {
            name: worker.name || 'This professional',
            time,
            date,
            defaultValue: `${worker.name || 'This professional'} is busy at ${time}. Please select an open slot or find an alternative.`
          }
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

        {/* ========================================================================= */}
        {/* 1. DATE CALENDAR CARD (Interactive Monthly Calendar) */}
        {/* ========================================================================= */}
        <View style={styles.calendarCard}>
          {/* Header Row with Today Jump */}
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarHeaderTitleGroup}>
              <View style={styles.calendarIconCircle}>
                <CalendarIcon size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.calendarSectionTitle}>{t('booking.date_label')}</Text>
                <Text style={styles.calendarSectionSub}>
                  {selectedDateFormatted || 'Select booking date'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.todayPillBtn}
              onPress={handleJumpToToday}
              activeOpacity={0.7}
            >
              <Clock size={11} color={colors.primary} />
              <Text style={styles.todayPillBtnText}>{t('calendar.today', 'Today')}</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation Strip */}
          <View style={styles.monthNavStrip}>
            <TouchableOpacity
              style={styles.monthArrowBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.monthLabelText}>
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </Text>

            <TouchableOpacity
              style={styles.monthArrowBtn}
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((w, idx) => (
              <View key={w} style={styles.weekdayCol}>
                <Text
                  style={[
                    styles.weekdayText,
                    idx === 0 && { color: colors.danger },
                  ]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              if (item.day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              return (
                <TouchableOpacity
                  key={item.dateStr!}
                  style={styles.dayCell}
                  onPress={() => {
                    if (!item.isPast) {
                      setDate(item.dateStr!);
                    }
                  }}
                  disabled={item.isPast}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.dayBadge,
                      item.isSelected && styles.dayBadgeSelected,
                      item.isToday && !item.isSelected && styles.dayBadgeToday,
                      item.isPast && styles.dayBadgePast,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        item.isSelected && styles.dayNumberTextSelected,
                        item.isToday && !item.isSelected && styles.dayNumberTextToday,
                        item.isPast && styles.dayNumberTextPast,
                      ]}
                    >
                      {item.day}
                    </Text>

                    {item.hasWorkerBookings && !item.isPast && (
                      <View
                        style={[
                          styles.dayBusyDot,
                          item.isSelected && styles.dayBusyDotSelected,
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Date Confirmation Bar */}
          <View style={styles.selectedDateBadgeRow}>
            <View style={styles.selectedDateDot} />
            <Text style={styles.selectedDateBadgeText}>
              Selected: <Text style={{ fontWeight: '800' }}>{selectedDateFormatted}</Text>
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. TIME SLOT PANEL (Horizontal Scrollbar - No Free Text Input) */}
        {/* ========================================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('booking.time_label')}</Text>
          </View>

          {!isEmergency ? (
            <>
              <Text style={styles.slotSubtitle}>
                Scroll horizontally to choose an available time slot:
              </Text>

              {/* Horizontal Scrollable Time Slots Strip */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.timeSlotsScrollContent}
                style={styles.timeSlotsScrollView}
              >
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const isSelected = time === slot;
                  const isBusy = slotStatusMap[slot]?.isBusy;

                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlotPill,
                        isSelected && styles.timeSlotPillSelected,
                        isBusy && !isSelected && styles.timeSlotPillBusy,
                        isBusy && isSelected && styles.timeSlotPillBusySelected,
                      ]}
                      onPress={() => setTime(slot)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.slotDotAndText}>
                        <View
                          style={[
                            styles.slotDot,
                            isBusy ? styles.slotDotBusy : styles.slotDotFree,
                            isSelected && styles.slotDotSelected,
                          ]}
                        />
                        <Text
                          style={[
                            styles.timeSlotPillText,
                            isSelected && styles.timeSlotPillTextSelected,
                            isBusy && styles.timeSlotPillTextBusy,
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
                          : t('booking.slot_available', 'Available')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emergencyTimeBox}>
              <Zap size={16} color="#e11d48" />
              <Text style={styles.emergencyTimeText}>
                Immediate (&lt; 15–30 min arrival priority dispatch)
              </Text>
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 3. SCHEDULE COLLISION ALERT CARD (Shown right below Time section) */}
        {/* ========================================================================= */}
        {isSlotColliding && (
          <FadeInView distance={8} duration={240}>
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
                  {
                    name: worker.name || 'This professional',
                    time,
                    date,
                    defaultValue: `${worker.name || 'This professional'} is already committed to an active assignment at ${time} on ${date}. Please select a different time slot or find a nearby alternative professional.`
                  }
                )}
              </Text>

              {/* Inline Helper Shortcut Actions */}
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

        {/* ========================================================================= */}
        {/* 4. MAIN ACTION BUTTON (Fades and disables when slot is colliding) */}
        {/* ========================================================================= */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            isEmergency && styles.submitBtnEmergency,
            isSlotColliding && styles.submitBtnFaded,
          ]}
          onPress={handleSubmit}
          disabled={submitting || isSlotColliding}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text
              style={[
                styles.submitBtnText,
                isSlotColliding && styles.submitBtnTextFaded,
              ]}
            >
              {isEmergency
                ? `🚨 Request Emergency Dispatch (₹${finalAmount})`
                : isSlotColliding
                ? `Time Slot Unavailable (${time})`
                : t('booking.confirm_btn', 'Send Booking Request')}
            </Text>
          )}
        </TouchableOpacity>
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

    // CALENDAR CARD STYLES
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 16,
    },
    calendarHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    calendarHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    calendarIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarSectionTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    calendarSectionSub: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 1,
    },
    todayPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: isDark ? 'transparent' : colors.primary,
    },
    todayPillBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    monthNavStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 7,
      paddingHorizontal: 6,
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceSubtle,
      borderRadius: 10,
    },
    monthArrowBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
    },
    monthLabelText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 6,
    },
    weekdayCol: {
      flex: 1,
      alignItems: 'center',
    },
    weekdayText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 1,
    },
    dayBadge: {
      width: 34,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: 'transparent',
    },
    dayBadgeSelected: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    dayBadgeToday: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    dayBadgePast: {
      opacity: 0.35,
    },
    dayNumberText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 15,
    },
    dayNumberTextSelected: {
      color: colors.textInverse,
      fontWeight: '800',
    },
    dayNumberTextToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    dayNumberTextPast: {
      color: colors.textMuted,
    },
    dayBusyDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#f59e0b',
      marginTop: 2,
    },
    dayBusyDotSelected: {
      backgroundColor: '#ffffff',
    },
    selectedDateBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(8, 127, 91, 0.12)' : '#e8f7f1',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      marginTop: 8,
    },
    selectedDateDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    selectedDateBadgeText: {
      fontSize: 11.5,
      color: colors.primary,
    },

    // TIME SLOTS SECTION & HORIZONTAL SCROLLBAR
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
    slotSubtitle: {
      fontSize: 11.5,
      color: colors.textMuted,
      marginBottom: 10,
    },
    timeSlotsScrollView: {
      marginHorizontal: -4,
    },
    timeSlotsScrollContent: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 4,
      paddingBottom: 6,
    },
    timeSlotPill: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 110,
    },
    timeSlotPillSelected: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(8, 127, 91, 0.25)' : '#e8f7f1',
    },
    timeSlotPillBusy: {
      borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#fed7aa',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.08)' : '#fffbeb',
    },
    timeSlotPillBusySelected: {
      borderColor: '#d97706',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7',
    },
    slotDotAndText: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
    timeSlotPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    timeSlotPillTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },
    timeSlotPillTextBusy: {
      color: colors.textSecondary,
    },
    slotStatusTag: {
      fontSize: 9.5,
      fontWeight: '600',
      marginTop: 3,
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

    // COLLISION CARD
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
    submitBtnFaded: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
      borderColor: colors.border,
      borderWidth: 1,
      opacity: 0.55,
      shadowOpacity: 0,
      elevation: 0,
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textInverse,
    },
    submitBtnTextFaded: {
      color: colors.textMuted,
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