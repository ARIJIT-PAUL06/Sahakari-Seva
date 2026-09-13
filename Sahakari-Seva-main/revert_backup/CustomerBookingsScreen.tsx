// ==============================================================================
// CUSTOMER BOOKINGS SCREEN — BOOKING LIFECYCLE & STATUS TRACKING
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
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
  const styles = createStyles(colors);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: isDark ? '#3d2e05' : '#fef3c7', text: isDark ? '#fbbf24' : '#d97706' },
    accepted: { bg: isDark ? '#0c2d48' : '#e0f2fe', text: isDark ? '#38bdf8' : '#0284c7' },
    in_progress: { bg: isDark ? '#1a2e05' : '#ecfdf5', text: isDark ? '#4ade80' : '#16a34a' },
    completed: { bg: isDark ? '#1e1b4b' : '#ede9fe', text: isDark ? '#a78bfa' : '#7c3aed' },
    cancelled: { bg: isDark ? '#3f1212' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' }
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
  }, []);

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
                      <Text style={styles.amountText}>{t('bookingsList.amount')}: ₹{booking.final_amount}</Text>
                      <Text style={styles.paymentStatusText}>
                        {booking.payment_status === 'paid' ? t('bookingsList.paid') : t('bookingsList.payment_on_completion')}
                      </Text>
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

const createStyles = (colors: Palette) => StyleSheet.create({
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  actionNeededPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  approvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  approvedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
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
});