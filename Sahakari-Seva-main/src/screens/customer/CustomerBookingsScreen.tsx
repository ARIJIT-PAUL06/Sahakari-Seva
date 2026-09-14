import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { Clock, MapPin, AlertTriangle, CheckCircle2, Zap, QrCode } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const CustomerBookingsScreen: React.FC = () => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'Home', isHome: true });
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF4DD', text: '#B86A00' },     // REQUESTED
    requested: { bg: '#FFF4DD', text: '#B86A00' },   // REQUESTED
    accepted: { bg: '#EAF2FF', text: '#2563EB' },    // IN PROGRESS / CONFIRMED
    in_progress: { bg: '#EAF2FF', text: '#2563EB' }, // IN PROGRESS
    completed: { bg: '#E8F7F1', text: '#087F5B' },   // COMPLETED
    cancelled: { bg: '#FDECEF', text: '#C62845' },   // CANCELLED
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Demo Customer Priya Singh
      const data = await ApiClient.getBookings('p0000000-0000-0000-0000-000000000002');
      setBookings(data);
    } catch (err) {
      console.warn('Bookings load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadBookings();
    });
    return () => {
      sub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.bookings')}
        subtitle={t('bookingsList.service_requests', { count: bookings.length })}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('bookingsList.empty_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('bookingsList.empty_sub')}</Text>
          </View>
        ) : (
          bookings.map((booking, idx) => {
            const statusStyle = statusColors[booking.status] || { bg: colors.surfaceSubtle, text: colors.textSecondary };

            return (
              <FadeInView key={booking.id} delay={idx * 70} distance={14} duration={320}>
                <ScalePressable onPress={() => navigation.navigate('BookingDetail', { 
                  bookingId: booking.id, 
                  showCompletionQr: !!(booking.status === 'in_progress' && booking.completion_requested)
                })}>
                  <View style={styles.bookingCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.bookingCode}>{booking.booking_code}</Text>
                        {booking.is_emergency && (
                          <View style={styles.emergencyPill}>
                            <Zap size={10} color="#e11d48" />
                            <Text style={styles.emergencyPillText}>EMERGENCY (&lt; 30m)</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {booking.status === 'pending'
                            ? 'REQUESTED'
                            : booking.status === 'accepted'
                            ? 'CONFIRMED'
                            : booking.status.toUpperCase().replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.descText} numberOfLines={2}>
                      {booking.service_description}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>
                          {booking.booking_date} {t('bookingsList.at')} {booking.booking_time}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>{booking.pincode}</Text>
                      </View>
                    </View>

                    {/* Completion Sign-Off Requested by Worker */}
                    {booking.status === 'in_progress' && booking.completion_requested && (
                      <View style={styles.completionRequestedPill}>
                        <QrCode size={11} color="#2563eb" />
                        <Text style={styles.completionRequestedPillText}>
                          Worker requested sign-off • Tap to show QR Pass
                        </Text>
                      </View>
                    )}

                    {/* Payment Due Banner if Completed */}
                    {booking.status === 'completed' && booking.payment_status !== 'paid' && (
                      <View style={styles.paymentDuePill}>
                        <Zap size={11} color="#b45309" />
                        <Text style={styles.paymentDuePillText}>
                          Service Completed • Payment of ₹{booking.final_amount} Due
                        </Text>
                      </View>
                    )}

                    {/* Action Needed Badge for Supplemental Bill */}
                    {booking.supplemental_bill?.status === 'pending_approval' && (
                      <View style={styles.actionNeededPill}>
                        <AlertTriangle size={11} color="#d97706" />
                        <Text style={styles.actionNeededPillText}>
                          Authorization Required: Extra Work Estimate (₹{booking.supplemental_bill.total_amount})
                        </Text>
                      </View>
                    )}
                    {booking.supplemental_bill?.status === 'approved' && (
                      <View style={styles.approvedPill}>
                        <CheckCircle2 size={11} color="#10b981" />
                        <Text style={styles.approvedPillText}>
                          Extra Work Approved (+₹{booking.supplemental_bill.total_amount})
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <View style={styles.cardFooterLeft}>
                        <Text style={styles.amountText}>
                          {t('bookingsList.amount')}: ₹{booking.final_amount}
                        </Text>
                        {booking.status === 'completed' && booking.payment_status !== 'paid' ? (
                          <Text style={styles.paymentDueStatusText}>Payment Due Now</Text>
                        ) : booking.payment_status === 'paid' ? (
                          <Text style={styles.paymentPaidStatusText}>Payment Settled ✓</Text>
                        ) : (
                          <Text style={styles.paymentStatusText}>
                            {t('bookingsList.payment_on_completion')}
                          </Text>
                        )}
                      </View>

                      {booking.status === 'completed' && booking.payment_status !== 'paid' ? (
                        <TouchableOpacity
                          style={styles.cardPayNowBtn}
                          onPress={() =>
                            navigation.navigate('BookingDetail', {
                              bookingId: booking.id,
                              autoOpenCheckout: true,
                            })
                          }
                          activeOpacity={0.85}
                        >
                          <Text style={styles.cardPayNowBtnText}>Pay ₹{booking.final_amount}</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.cardViewDetailsText}>Details →</Text>
                      )}
                    </View>
                  </View>
                </ScalePressable>
              </FadeInView>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean = false) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#087F5B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center'
  },
  completionRequestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  completionRequestedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  actionNeededPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4DD',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(243, 154, 36, 0.40)',
  },
  actionNeededPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B86A00',
  },
  approvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F7F1',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(8, 127, 91, 0.35)',
  },
  approvedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#087F5B',
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#e11d48',
  },
  paymentDuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFFBEB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
  },
  paymentDuePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#FBBF24' : '#B45309',
  },
  cardFooterLeft: {
    flex: 1,
  },
  paymentDueStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#FBBF24' : '#D97706',
    marginTop: 1,
  },
  paymentPaidStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },
  cardPayNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPayNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardViewDetailsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primary,
  },
});