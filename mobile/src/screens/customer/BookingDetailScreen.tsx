// mobile/src/screens/customer/BookingDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, CheckCircle2, Check, X, Wrench, ShieldCheck, Receipt, Star, Lock, Clock, QrCode, Zap } from 'lucide-react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import RatingModal from '../../components/common/RatingModal';
import { PaymentCheckoutModal } from '../../components/common/PaymentCheckoutModal';
import { PaymentConfirmedModal } from '../../components/common/PaymentConfirmedModal';
import { CompletionQRModal } from '../../components/common/CompletionQRModal';
import { ApiClient } from '../../services/apiClient';
import { Booking, Payment, Invoice } from '../../types';
import { translateTrade } from '../../i18n';

type RouteParams = {
  BookingDetail: { bookingId: string; showCompletionQr?: boolean; autoOpenCheckout?: boolean };
};

export const BookingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'BookingDetail'>>();
  const bookingId = route.params?.bookingId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [respondingBill, setRespondingBill] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [confirmedModalVisible, setConfirmedModalVisible] = useState(false);
  const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [verifyingWork, setVerifyingWork] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const b = await ApiClient.getBookingById(bookingId);
      setBooking(b || null);
    } catch {
      // Fallback handled in ApiClient
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (route.params?.showCompletionQr) {
      setQrModalVisible(true);
    }
  }, [route.params?.showCompletionQr]);

  useEffect(() => {
    if (route.params?.autoOpenCheckout && booking && booking.status === 'completed' && booking.payment_status !== 'paid') {
      setCheckoutModalVisible(true);
    }
  }, [route.params?.autoOpenCheckout, booking?.status, booking?.payment_status]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      fetchBooking();
    });
    return () => {
      sub.remove();
    };
  }, [bookingId]);

  const handleCallWorker = (phone?: string) => {
    if (!phone) {
      Alert.alert(t('bookingDetail.phone_contact_title'), t('bookingDetail.phone_contact_msg'));
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(t('bookingDetail.call_failed_title'), t('bookingDetail.call_failed_msg', { phone }));
    });
  };

  const handleApproveBill = async () => {
    if (!booking || !booking.supplemental_bill) return;
    try {
      setRespondingBill(true);
      await ApiClient.respondSupplementalBill(booking.id, true);
      Alert.alert(
        'Additional Tasks Approved! 🎉',
        `You have approved the additional repair estimate (+₹${booking.supplemental_bill.total_amount}). The professional has been authorized to proceed.`
      );
      await fetchBooking();
    } catch (err: any) {
      Alert.alert('Approval Failed', err.message || 'Could not approve supplemental bill.');
    } finally {
      setRespondingBill(false);
    }
  };

  const handleDenyBill = async () => {
    if (!booking || !booking.supplemental_bill) return;
    Alert.alert(
      'Decline Additional Tasks?',
      'The service professional will only complete the originally scheduled base repair. Extra defects will not be serviced.',
      [
        { text: 'Keep Reviewing', style: 'cancel' },
        {
          text: 'Decline Extra Work',
          style: 'destructive',
          onPress: async () => {
            try {
              setRespondingBill(true);
              await ApiClient.respondSupplementalBill(
                booking.id,
                false,
                'Customer chose base service only'
              );
              Alert.alert(
                'Extra Tasks Declined',
                'The professional has been notified to proceed with the base service only.'
              );
              await fetchBooking();
            } catch (err: any) {
              Alert.alert('Decline Failed', err.message || 'Could not decline bill.');
            } finally {
              setRespondingBill(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    Alert.alert(
      t('bookingDetail.cancel_title', 'Cancel Booking Request?'),
      t(
        'bookingDetail.cancel_msg',
        'Are you sure you want to cancel this booking request? The technician will be notified immediately and no charges will apply.'
      ),
      [
        { text: t('common.keep', 'Keep Request'), style: 'cancel' },
        {
          text: t('bookingDetail.cancel_confirm', 'Yes, Cancel Request'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ApiClient.updateBookingStatus(booking.id, 'cancelled');
              Alert.alert(
                t('bookingDetail.cancel_success_title', 'Booking Request Cancelled'),
                t('bookingDetail.cancel_success_msg', 'Your service request has been cancelled.')
              );
              await fetchBooking();
            } catch (err: any) {
              Alert.alert('Cancellation Failed', err.message || 'Could not cancel booking.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePayNow = () => {
    if (!booking) return;
    setCheckoutModalVisible(true);
  };

  const handleCustomerVerifyAndComplete = async () => {
    if (!booking) return;
    const finalPrice = booking.final_amount || booking.estimated_amount || 0;

    const doVerify = async () => {
      try {
        setVerifyingWork(true);
        await ApiClient.verifyAndCompleteJob(booking.id, 'CUSTOMER_DIRECT_APPROVAL');
        await fetchBooking();
        setCheckoutModalVisible(true);
      } catch (err: any) {
        Alert.alert('Verification Failed', err.message || 'Could not verify completion.');
      } finally {
        setVerifyingWork(false);
      }
    };

    if (Platform.OS === 'web') {
      await doVerify();
      return;
    }

    Alert.alert(
      'Verify & Sign Off Service Work? 🛡️',
      `Confirm that ${booking.worker?.profile?.full_name || 'the service professional'} has completed the service to your satisfaction. The job will be marked completed and payment of ₹${Number(finalPrice).toFixed(0)} will be unlocked.`,
      [
        { text: 'Inspect More', style: 'cancel' },
        {
          text: 'Yes, Work is Verified ✓',
          onPress: doVerify,
        },
      ]
    );
  };

  const handlePaymentSuccess = (res: { payment: Payment; invoice: Invoice }) => {
    setLatestPayment(res.payment);
    setLatestInvoice(res.invoice);
    setCheckoutModalVisible(false);
    setConfirmedModalVisible(true);
    fetchBooking();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('bookingDetail.loading')}</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('bookingDetail.not_found')}</Text>
        <Button
          title={t('bookingDetail.back_to_bookings')}
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const steps = [
    { key: 'pending', label: t('bookingDetail.step_requested') },
    { key: 'accepted', label: t('bookingDetail.step_accepted') },
    { key: 'in_progress', label: t('bookingDetail.step_in_progress') },
    { key: 'completed', label: t('bookingDetail.step_completed') },
  ];

  const getStepIndex = (st: string, paymentSt?: string) => {
    if (paymentSt === 'paid' || st === 'completed') return 3;
    switch (st) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(booking.status, booking.payment_status);
  const worker = booking.worker;
  const finalPrice = booking.final_amount || booking.estimated_amount;
  const isPaid = booking.payment_status === 'paid';
  const isPaidOrCompleted = isPaid;

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header / Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('CustomerTabs');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'Back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {booking.booking_code}
        </Text>
        <View style={styles.topBarRightPlaceholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {translateTrade(booking.service_category?.name) || t('bookingDetail.home_maintenance')}
            </Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{booking.booking_code}</Text>
              <Text style={styles.codeDot}>•</Text>
              <Text style={styles.codeStatusText}>
                {booking.status === 'pending'
                  ? (t('booking.awaiting_worker') || 'Awaiting Worker')
                  : booking.status === 'accepted'
                  ? 'Confirmed'
                  : booking.status === 'in_progress'
                  ? 'In Progress'
                  : booking.status === 'completed'
                  ? 'Completed'
                  : 'Cancelled'}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadgeWrapper}>
            <Badge
              label={
                booking.status === 'pending'
                  ? (t('bookingDetail.step_requested') || 'REQUESTED').toUpperCase()
                  : booking.status === 'accepted'
                  ? (t('bookingDetail.step_confirmed') || 'CONFIRMED').toUpperCase()
                  : booking.status === 'in_progress'
                  ? 'IN PROGRESS'
                  : booking.status.toUpperCase().replace('_', ' ')
              }
              variant={
                booking.status === 'completed' || booking.status === 'accepted'
                  ? 'success'
                  : booking.status === 'in_progress'
                  ? 'info'
                  : booking.status === 'cancelled'
                  ? 'danger'
                  : 'warning'
              }
              size="sm"
            />
          </View>
        </View>

      {/* Emergency Alert Banner */}
      {booking.is_emergency && (
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>
              {t('bookingDetail.emergency_title', '24/7 Priority Emergency Service')}
            </Text>
            <Text style={styles.emergencyDesc}>
              {t('bookingDetail.emergency_desc', 'Worker dispatched immediately for rapid on-site arrival (< 15-30 mins). +25% emergency mobilization wage applied.')}
            </Text>
          </View>
        </View>
      )}

      {/* Progress Stepper */}
      <Card style={styles.stepperCard}>
        <View style={styles.stepperHeaderRow}>
          <Text style={styles.sectionTitle}>{t('bookingDetail.status_tracking')}</Text>
          {booking.status === 'pending' && (
            <View style={styles.dispatchPill}>
              <View style={styles.dispatchPillDot} />
              <Text style={styles.dispatchPillText}>DISPATCH ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Status Explainer Banner for Customer */}
        {booking.status === 'pending' && (
          <View style={styles.statusExplainerCardPending}>
            <View style={styles.statusExplainerIconCirclePending}>
              <Clock size={18} color="#d97706" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusExplainerTitlePending}>
                {t('booking.awaiting_worker') || 'Awaiting Worker Confirmation'}
              </Text>
              <Text style={styles.statusExplainerDescPending}>
                {t('booking.awaiting_worker_desc', {
                  name: worker?.profile?.full_name || 'Assigned Professional',
                  defaultValue: `${worker?.profile?.full_name || 'Assigned Professional'} has received your job alert. You will be notified as soon as they confirm your booking.`
                })}
              </Text>
              <View style={styles.statusExplainerDivider} />
              <View style={styles.statusExplainerMetaRow}>
                <ShieldCheck size={12} color={isDark ? '#FBBF24' : '#B45309'} />
                <Text style={styles.statusExplainerMetaText}>
                  Avg response: 2–5 min • Pay upon service completion
                </Text>
              </View>
            </View>
          </View>
        )}

        {booking.status === 'accepted' && (
          <View style={styles.statusExplainerCardAccepted}>
            <CheckCircle2 size={18} color="#059669" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusExplainerTitleAccepted}>
                {t('booking.confirmed_title') || 'Booking Confirmed! 🎉'}
              </Text>
              <Text style={styles.statusExplainerDescAccepted}>
                {worker?.profile?.full_name || 'Assigned Professional'} has confirmed your booking and is scheduled on active duty for this service.
              </Text>
            </View>
          </View>
        )}

        {booking.status === 'in_progress' && (
          <View style={[styles.statusExplainerCardInProgress, booking.completion_requested && { borderColor: '#d97706', borderWidth: 1.5 }]}>
            <View style={[styles.statusExplainerIconCircleInProgress, booking.completion_requested && { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#fef3c7' }]}>
              {booking.completion_requested ? (
                <ShieldCheck size={18} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.5} />
              ) : (
                <ShieldCheck size={18} color="#2563eb" strokeWidth={2.5} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.statusExplainerTitleInProgress, booking.completion_requested && { color: isDark ? '#FBBF24' : '#b45309' }]}>
                {booking.completion_requested ? 'Worker Sign-Off Requested ⚡' : 'Service In Progress ⚡'}
              </Text>
              <Text style={styles.statusExplainerDescInProgress}>
                {booking.completion_requested
                  ? `${worker?.profile?.full_name || 'Assigned Professional'} has completed the service work and requested your verification. Inspect the work and sign off below.`
                  : `${worker?.profile?.full_name || 'Assigned Professional'} is actively performing on-site service.`}
              </Text>

              {booking.completion_requested ? (
                <View style={{ gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.payNowQuickActionBtn, { backgroundColor: '#059669', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingVertical: 9 }]}
                    onPress={handleCustomerVerifyAndComplete}
                    disabled={verifyingWork}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Verify Work Done & Pay"
                  >
                    {verifyingWork ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={16} color="#ffffff" />
                        <Text style={styles.payNowQuickActionBtnText}>
                          Verify Work Done & Pay (₹{finalPrice.toFixed(0)}) →
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.showQrActionBtn, { marginTop: 0 }]}
                    onPress={() => setQrModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <QrCode size={15} color="#ffffff" />
                    <Text style={styles.showQrActionBtnText}>
                      Show Completion Pass QR
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.showQrActionBtn}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <QrCode size={15} color="#ffffff" />
                  <Text style={styles.showQrActionBtnText}>
                    Show Completion Pass QR
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {booking.status === 'cancelled' && (
          <View style={styles.statusExplainerCardCancelled}>
            <X size={18} color={colors.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusExplainerTitleCancelled}>
                Booking Cancelled
              </Text>
              <Text style={styles.statusExplainerDescCancelled}>
                This service request has been cancelled. No fees were charged.
              </Text>
            </View>
          </View>
        )}

        {booking.status === 'completed' && !isPaid && (
          <View style={styles.statusExplainerCardPaymentDue}>
            <View style={styles.statusExplainerIconCirclePaymentDue}>
              <Zap size={18} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusExplainerTitlePaymentDue}>
                Service Completed • Payment Due
              </Text>
              <Text style={styles.statusExplainerDescPaymentDue}>
                {worker?.profile?.full_name || 'The professional'} has finished the service work. Under cooperative bylaws, payment was held until completion. Please settle ₹{finalPrice.toFixed(0)} now.
              </Text>
              <TouchableOpacity
                style={styles.payNowQuickActionBtn}
                onPress={handlePayNow}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Pay Now"
              >
                <Text style={styles.payNowQuickActionBtnText}>
                  Pay Now (₹{finalPrice.toFixed(0)}) →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {booking.status === 'completed' && isPaid && (
          <View style={styles.statusExplainerCardAccepted}>
            <CheckCircle2 size={18} color="#059669" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusExplainerTitleAccepted}>
                Service Completed & Payment Settled ✓
              </Text>
              <Text style={styles.statusExplainerDescAccepted}>
                All tasks verified and settled. 85% worker earnings credited to {worker?.profile?.full_name || 'the professional'}.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.stepperRow}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentStep && booking.status !== 'cancelled';
            const isCurrent = idx === currentStep && booking.status !== 'cancelled';
            const isAwaiting = idx === 1 && booking.status === 'pending';

            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.stepperLine,
                      isDone
                        ? styles.stepperLineDone
                        : isAwaiting
                        ? styles.stepperLineAwaiting
                        : styles.stepperLinePending,
                    ]}
                  />
                )}
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isDone && styles.stepCircleDone,
                      isAwaiting && styles.stepCircleAwaiting,
                      !isDone && !isAwaiting && styles.stepCirclePending,
                    ]}
                  >
                    {isDone ? (
                      <Check size={13} color="#ffffff" strokeWidth={3} />
                    ) : isAwaiting ? (
                      <Clock size={12} color="#d97706" strokeWidth={2.5} />
                    ) : (
                      <Text style={styles.stepNum}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isDone && styles.stepLabelDone,
                      isAwaiting && styles.stepLabelAwaiting,
                    ]}
                    numberOfLines={2}
                  >
                    {step.label}
                  </Text>
                  <Text
                    style={[
                      styles.stepSubLabel,
                      isDone && styles.stepSubLabelDone,
                      isAwaiting && styles.stepSubLabelAwaiting,
                    ]}
                  >
                    {idx === 0
                      ? 'Sent ✓'
                      : idx === 1
                      ? (booking.status === 'pending' ? 'Waiting...' : isDone ? 'Confirmed' : 'Step 2')
                      : idx === 2
                      ? (isDone ? 'Started' : 'Step 3')
                      : (isDone ? 'Done' : 'Step 4')}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </Card>

      {/* Assigned Worker Card */}
      <Card style={styles.workerCard}>
        <Text style={styles.sectionTitle}>{t('bookingDetail.assigned_professional')}</Text>
        <View style={styles.workerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(worker?.profile?.full_name || t('bookingDetail.worker_fallback')).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.nameRow}>
              <Text style={styles.workerName}>
                {worker?.profile?.full_name || t('bookingDetail.trade_fallback')}
              </Text>
              <Badge label={t('bookingDetail.verified_iti')} variant="success" size="sm" />
            </View>
            <Text style={styles.workerTrade}>{translateTrade(worker?.skill_category) || t('bookingDetail.trade_fallback')}</Text>
            <Text style={styles.workerRating}>★ {worker?.average_rating || 4.9} • {t('bookingDetail.jobs_completed', { count: worker?.total_jobs || 140 })}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          activeOpacity={0.8}
          onPress={() => handleCallWorker(worker?.profile?.phone)}
        >
          <Text style={styles.callButtonIcon}>📞</Text>
          <Text style={styles.callButtonText}>
            {t('bookingDetail.call_professional', { phone: worker?.profile?.phone ? `(${worker.profile.phone})` : '' })}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Booking Details */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>{t('bookingDetail.appointment_details')}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.scheduled_date')}:</Text>
          <Text style={styles.detailValue}>{booking.booking_date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.time_slot')}:</Text>
          <Text style={styles.detailValue}>{booking.booking_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('bookingDetail.service_location')}:</Text>
          <Text style={styles.detailValue}>{booking.address}, {booking.city} - {booking.pincode}</Text>
        </View>
        {booking.service_description ? (
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>{t('bookingDetail.problem_note')}:</Text>
            <Text style={styles.detailValue}>{booking.service_description}</Text>
          </View>
        ) : null}
      </Card>

      {/* Supplemental Bill / Extra Discovered Issues Review Card */}
      {booking.supplemental_bill && (
        <Card
          style={[
            styles.supplementalCard,
            booking.supplemental_bill.status === 'pending_approval' && styles.supplementalCardPending,
            booking.supplemental_bill.status === 'approved' && styles.supplementalCardApproved,
            booking.supplemental_bill.status === 'denied' && styles.supplementalCardDenied,
          ]}
        >
          {/* Header */}
          <View style={styles.suppHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View
                style={[
                  styles.suppIconBadge,
                  booking.supplemental_bill.status === 'pending_approval' && { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  booking.supplemental_bill.status === 'approved' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  booking.supplemental_bill.status === 'denied' && { backgroundColor: 'rgba(244, 63, 94, 0.15)' },
                ]}
              >
                {booking.supplemental_bill.status === 'pending_approval' ? (
                  <AlertTriangle size={17} color="#f59e0b" />
                ) : booking.supplemental_bill.status === 'approved' ? (
                  <CheckCircle2 size={17} color="#10b981" />
                ) : (
                  <X size={17} color={colors.danger} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suppTitle}>
                  {booking.supplemental_bill.status === 'pending_approval'
                    ? 'Extra Work Authorization Needed'
                    : booking.supplemental_bill.status === 'approved'
                    ? 'Extra Work Approved'
                    : 'Extra Work Declined'}
                </Text>
                <Text style={styles.suppSub}>
                  Reported by {worker?.profile?.full_name || 'Worker'} during inspection
                </Text>
              </View>
            </View>

            <Badge
              label={
                booking.supplemental_bill.status === 'pending_approval'
                  ? 'ACTION NEEDED'
                  : booking.supplemental_bill.status === 'approved'
                  ? 'APPROVED'
                  : 'DECLINED'
              }
              variant={
                booking.supplemental_bill.status === 'approved'
                  ? 'success'
                  : booking.supplemental_bill.status === 'pending_approval'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            />
          </View>

          {/* Worker Diagnosis Quote */}
          <View style={styles.diagnosisQuoteBox}>
            <Text style={styles.diagnosisQuoteTitle}>WORKER'S INSPECTION REPORT:</Text>
            <Text style={styles.diagnosisQuoteText}>
              "{booking.supplemental_bill.diagnosis_notes}"
            </Text>
          </View>

          {/* Itemized Tasks / Parts Table */}
          <View style={styles.suppTable}>
            <Text style={styles.suppTableHead}>ITEMIZED ADDITIONAL TASKS & PARTS</Text>
            {booking.supplemental_bill.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.suppItemRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.suppItemTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.suppItemDesc}>{item.description}</Text>
                  ) : null}
                  <View style={styles.suppTypeTag}>
                    <Text style={styles.suppTypeTagText}>
                      {item.type === 'part' ? 'Spare Part' : item.type === 'labor' ? 'Labor' : 'Repair Work'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.suppItemCost}>₹{Number(item.cost).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Impact Calculation */}
          <View style={styles.suppCalcBox}>
            <View style={styles.suppCalcRow}>
              <Text style={styles.suppCalcLabel}>Original Requested Service:</Text>
              <Text style={styles.suppCalcVal}>₹{Number(booking.estimated_amount).toFixed(2)}</Text>
            </View>
            <View style={styles.suppCalcRow}>
              <Text style={styles.suppCalcLabel}>
                Supplemental Work ({booking.supplemental_bill.items.length} items):
              </Text>
              <Text style={[styles.suppCalcVal, { color: '#10b981', fontWeight: '800' }]}>
                +₹{Number(booking.supplemental_bill.total_amount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.suppCalcDivider} />
            <View style={styles.suppCalcTotalRow}>
              <Text style={styles.suppCalcTotalLabel}>
                {booking.supplemental_bill.status === 'approved' ? 'Authorized Total Bill:' : 'Revised Total Bill:'}
              </Text>
              <Text style={styles.suppCalcTotalVal}>
                ₹{(Number(booking.estimated_amount) + Number(booking.supplemental_bill.total_amount)).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Approval / Denial Action Buttons */}
          {booking.supplemental_bill.status === 'pending_approval' && (
            <View style={styles.suppActionRow}>
              <TouchableOpacity
                style={styles.suppDenyBtn}
                onPress={handleDenyBill}
                disabled={respondingBill}
                activeOpacity={0.7}
              >
                <X size={15} color={colors.danger} />
                <Text style={styles.suppDenyBtnText}>Decline Extra Work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suppApproveBtn}
                onPress={handleApproveBill}
                disabled={respondingBill}
                activeOpacity={0.85}
              >
                {respondingBill ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.suppApproveBtnText}>
                      Approve & Proceed (+₹{booking.supplemental_bill.total_amount})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {booking.supplemental_bill.status === 'approved' && (
            <View style={styles.suppStatusFootnote}>
              <CheckCircle2 size={13} color="#10b981" />
              <Text style={styles.suppStatusFootnoteText}>
                You approved this estimate. The professional has been authorized to proceed with the extra work.
              </Text>
            </View>
          )}

          {booking.supplemental_bill.status === 'denied' && (
            <View style={styles.suppStatusFootnote}>
              <AlertTriangle size={13} color={colors.danger} />
              <Text style={[styles.suppStatusFootnoteText, { color: colors.danger }]}>
                You declined the additional tasks. Only the base repair will be completed.
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Cooperative Fair Split Pricing Card */}
      <Card style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTitle}>{t('bookingDetail.fair_pricing')}</Text>
          <Badge label={t('bookingDetail.cooperative_guarantee')} variant="info" size="sm" />
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitLabel}>{t('bookingDetail.total_amount')}</Text>
          <Text style={styles.splitTotal}>₹{finalPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.worker_take_home')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.85).toFixed(2)}</Text>
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.welfare_fund')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.10).toFixed(2)}</Text>
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.splitSubLabel}>{t('bookingDetail.platform_fee')}</Text>
          <Text style={styles.splitSubValue}>₹{(finalPrice * 0.05).toFixed(2)}</Text>
        </View>
        <View style={styles.trustFooter}>
          <Text style={styles.trustText}>
            {t('bookingDetail.trust_footer')}
          </Text>
        </View>
      </Card>

      {/* Dynamic Action Buttons */}
      <View style={styles.actionContainer}>
        {booking.status === 'pending' && (
          <View style={styles.pendingActionCard}>
            <View style={styles.pendingTrustRow}>
              <View style={styles.pendingTrustIconCircle}>
                <ShieldCheck size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTrustTitle}>
                  Pay on Service Completion • ₹0 Advance Fee
                </Text>
                <Text style={styles.pendingTrustDesc}>
                  Under Sahakari Seva cooperative rules, payment of ₹{finalPrice.toFixed(0)} is only due after {worker?.profile?.full_name || 'the professional'} finishes the work to your complete satisfaction.
                </Text>
              </View>
            </View>

            <View style={styles.pendingActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelRequestBtn}
                onPress={handleCancelBooking}
                activeOpacity={0.7}
              >
                <X size={15} color={colors.danger} />
                <Text style={styles.cancelRequestBtnText}>
                  {t('bookingDetail.cancel_request', 'Cancel Request')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshStatusBtn}
                onPress={fetchBooking}
                activeOpacity={0.85}
              >
                <Text style={styles.refreshStatusBtnText}>
                  {t('bookingDetail.refresh_status', 'Refresh Status')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {booking.status === 'accepted' && (
          <View style={styles.pendingActionCard}>
            <View style={styles.pendingTrustRow}>
              <View style={[styles.pendingTrustIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <ShieldCheck size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTrustTitle}>
                  Booking Confirmed • Pay on Service Completion
                </Text>
                <Text style={styles.pendingTrustDesc}>
                  Under cooperative bylaws, prepayment before service begins is strictly prohibited. Payment of ₹{finalPrice.toFixed(0)} will unlock only after {worker?.profile?.full_name || 'the professional'} finishes the work.
                </Text>
              </View>
            </View>
          </View>
        )}

        {booking.status === 'in_progress' && !isPaid && (
          <View style={[styles.pendingActionCard, booking.completion_requested && { borderColor: '#d97706', borderWidth: 1.5 }]}>
            <View style={styles.pendingTrustRow}>
              <View style={[styles.pendingTrustIconCircle, { backgroundColor: booking.completion_requested ? (isDark ? 'rgba(217,119,6,0.2)' : '#fef3c7') : (isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff') }]}>
                <ShieldCheck size={18} color={booking.completion_requested ? (isDark ? '#FBBF24' : '#d97706') : (isDark ? '#60a5fa' : '#2563eb')} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pendingTrustTitle, { color: booking.completion_requested ? (isDark ? '#FBBF24' : '#b45309') : (isDark ? '#60a5fa' : '#1d4ed8') }]}>
                  {booking.completion_requested ? 'Worker Ready for Sign-Off' : 'Service In Progress'}
                </Text>
                <Text style={styles.pendingTrustDesc}>
                  {booking.completion_requested
                    ? `${worker?.profile?.full_name || 'The professional'} has finished the work and requested your sign-off. Verify below to complete the job and pay the professional.`
                    : `${worker?.profile?.full_name || 'The professional'} is actively performing the service work. You will authorize completion by displaying your QR code.`}
                </Text>
              </View>
            </View>

            {booking.completion_requested ? (
              <View style={{ gap: 8, marginTop: 12 }}>
                <Button
                  title={`Verify Work Done & Pay (₹${finalPrice.toFixed(0)})`}
                  variant="primary"
                  size="lg"
                  loading={verifyingWork}
                  onPress={handleCustomerVerifyAndComplete}
                  style={{ backgroundColor: '#059669' }}
                />
                <TouchableOpacity
                  style={[styles.showQrActionBtn, { marginTop: 0 }]}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <QrCode size={15} color="#ffffff" />
                  <Text style={styles.showQrActionBtnText}>
                    Show Completion Pass QR
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.showQrActionBtn, { marginTop: 12 }]}
                onPress={() => setQrModalVisible(true)}
                activeOpacity={0.85}
              >
                <QrCode size={15} color="#ffffff" />
                <Text style={styles.showQrActionBtnText}>
                  Show Completion Pass QR
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === 'completed' && !isPaid && (
          <View style={styles.paymentDueActionCard}>
            <View style={styles.paymentDueHeaderRow}>
              <View style={styles.paymentDueBadge}>
                <Zap size={14} color="#d97706" />
                <Text style={styles.paymentDueBadgeText}>SERVICE COMPLETED • PAYMENT DUE</Text>
              </View>
              <Text style={styles.paymentDueAmountText}>₹{finalPrice.toFixed(2)}</Text>
            </View>

            <Text style={styles.paymentDueExplainerText}>
              {worker?.profile?.full_name || 'The professional'} has successfully completed this service. Under Sahakari Seva cooperative bylaws, prepayment was withheld until work was verified. Please settle the payment now.
            </Text>

            <View style={styles.paymentDueMethodsRow}>
              <View style={styles.methodTag}>
                <Text style={styles.methodTagText}>⚡ UPI Instant</Text>
              </View>
              <View style={styles.methodTag}>
                <Text style={styles.methodTagText}>💳 RuPay Card</Text>
              </View>
              <View style={styles.methodTag}>
                <Text style={styles.methodTagText}>💵 Cash to Worker</Text>
              </View>
            </View>

            <Button
              title={`Pay Now (₹${finalPrice.toFixed(0)})`}
              variant="primary"
              size="lg"
              loading={paying}
              onPress={handlePayNow}
              style={[styles.actionBtn, { marginTop: spacing.sm }]}
            />

            <TouchableOpacity
              style={styles.paidCashSecondaryBtn}
              onPress={() => {
                Alert.alert(
                  'Confirm Cash Payment',
                  `Did you hand ₹${finalPrice.toFixed(0)} in physical cash directly to ${worker?.profile?.full_name || 'the professional'}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Yes, Handed Cash',
                      onPress: async () => {
                        try {
                          setPaying(true);
                          const res = await ApiClient.confirmCashPayment(booking.id, finalPrice);
                          handlePaymentSuccess(res);
                        } catch (err: any) {
                          Alert.alert('Error', err.message || 'Could not record cash payment.');
                        } finally {
                          setPaying(false);
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.paidCashSecondaryBtnText}>
                Handed cash to {worker?.profile?.full_name?.split(' ')[0] || 'worker'}? Mark Cash Paid
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'cancelled' && (
          <View style={styles.cancelledActionCard}>
            <Text style={styles.cancelledTitle}>Booking Request Cancelled</Text>
            <Text style={styles.cancelledDesc}>
              This service request was cancelled. No payment was charged.
            </Text>
            <Button
              title="Find Another Professional"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('CustomerTabs', { screen: 'Search' })}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        {isPaidOrCompleted && (
          <View style={styles.paymentSettledCard}>
            <View style={styles.paymentSettledHeader}>
              <View style={styles.settledBadge}>
                <CheckCircle2 size={15} color="#10b981" />
                <Text style={styles.settledBadgeText}>PAYMENT SETTLED & VERIFIED</Text>
              </View>
              <Text style={styles.settledAmountText}>₹{finalPrice.toFixed(2)}</Text>
            </View>
            <Text style={styles.settledSubText}>
              Direct 85% worker earnings credited to {worker?.profile?.full_name || 'Rahul Sharma'}. Cooperative audit pass verified.
            </Text>
            <View style={styles.settledDivider} />
            <View style={styles.settledActionRow}>
              <Button
                title={t('bookingDetail.view_invoice', 'View Tax Invoice')}
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('Invoice', { bookingId: booking.id })}
                style={{ flex: 1 }}
              />
              <Button
                title={t('bookingDetail.rate_professional', 'Rate Professional')}
                variant="outline"
                size="md"
                onPress={() => setRatingModalVisible(true)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Interactive Payment Checkout Modal */}
      <PaymentCheckoutModal
        visible={checkoutModalVisible}
        booking={booking}
        totalAmount={finalPrice}
        baseAmount={Number(booking.estimated_amount) || 0}
        supplementalItems={
          booking.supplemental_bill?.status === 'approved'
            ? booking.supplemental_bill.items
            : []
        }
        onClose={() => setCheckoutModalVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Celebratory Payment Confirmed Modal */}
      <PaymentConfirmedModal
        visible={confirmedModalVisible}
        booking={booking}
        payment={latestPayment}
        invoice={latestInvoice}
        onClose={() => {
          setConfirmedModalVisible(false);
          fetchBooking();
        }}
        onViewInvoice={() => {
          setConfirmedModalVisible(false);
          navigation.navigate('Invoice', { bookingId: booking.id });
        }}
        onRateWorker={() => {
          setConfirmedModalVisible(false);
          setRatingModalVisible(true);
        }}
      />

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        bookingId={booking.id}
        workerId={booking.worker_id}
        customerId={booking.customer_id}
        workerName={worker?.profile?.full_name || t('bookingDetail.worker_fallback', 'Service Professional')}
        customerName={t('bookingDetail.verified_customer', 'Verified Customer')}
        onClose={() => setRatingModalVisible(false)}
        onSubmitted={() => fetchBooking()}
      />

      {/* Customer Job Completion Authorization QR Modal */}
      <CompletionQRModal
        visible={qrModalVisible}
        booking={booking}
        onClose={() => setQrModalVisible(false)}
        onVerifyAndPay={handleCustomerVerifyAndComplete}
      />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark = false) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    minWidth: 60,
  },
  backButtonText: {
    ...typography.fontBodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topBarTitle: {
    ...typography.fontTitle,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  topBarRightPlaceholder: {
    minWidth: 60,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  // --- Supplemental Bill Card Styles ---
  supplementalCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  supplementalCardPending: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  supplementalCardApproved: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  supplementalCardDenied: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.04)',
  },
  suppHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  suppIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suppTitle: {
    ...typography.fontSubtitle,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppSub: {
    ...typography.fontCaption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  diagnosisQuoteBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginVertical: spacing.xs,
  },
  diagnosisQuoteTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diagnosisQuoteText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  suppTable: {
    marginVertical: spacing.sm,
  },
  suppTableHead: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  suppItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suppItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suppItemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  suppTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  suppTypeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10b981',
  },
  suppItemCost: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppCalcBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  suppCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suppCalcLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  suppCalcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suppCalcDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  suppCalcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suppCalcTotalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  suppCalcTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
  },
  suppActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  suppDenyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  suppDenyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.danger,
  },
  suppApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: '#10b981',
  },
  suppApproveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  suppStatusFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  suppStatusFootnoteText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    flex: 1,
  },
  loadingText: {
    ...typography.fontBody,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.fontTitle,
    color: colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    ...typography.fontHeadline,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 25,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  codeText: {
    ...typography.fontCaption,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  codeDot: {
    fontSize: 11,
    color: colors.textMuted,
  },
  codeStatusText: {
    ...typography.fontCaption,
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#FBBF24' : '#B45309',
  },
  headerBadgeWrapper: {
    flexShrink: 0,
    marginTop: 2,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emergencyIcon: {
    fontSize: 24,
  },
  emergencyTitle: {
    ...typography.fontSubtitle,
    color: colors.danger,
  },
  emergencyDesc: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepperCard: {
    marginBottom: spacing.md,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.4)' : '#FDE68A',
  },
  dispatchPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  dispatchPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: isDark ? '#FBBF24' : '#B45309',
    letterSpacing: 0.4,
  },
  statusExplainerCardPending: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.35)' : '#FDE68A',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  statusExplainerIconCirclePending: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(245,158,11,0.25)' : '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusExplainerTitlePending: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#FBBF24' : '#92400E',
    marginBottom: 3,
  },
  statusExplainerDescPending: {
    fontSize: 11.5,
    color: isDark ? '#FDE68A' : '#78350F',
    lineHeight: 16,
  },
  statusExplainerDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
    marginVertical: 7,
  },
  statusExplainerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusExplainerMetaText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: isDark ? '#FBBF24' : '#B45309',
  },
  statusExplainerCardAccepted: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statusExplainerTitleAccepted: {
    fontSize: 12.5,
    fontWeight: '700',
    color: isDark ? '#34D399' : '#065F46',
    marginBottom: 2,
  },
  statusExplainerDescAccepted: {
    fontSize: 11.5,
    color: isDark ? '#A7F3D0' : '#047857',
    lineHeight: 16,
  },
  statusExplainerCardInProgress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : '#EFF6FF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#BFDBFE',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  statusExplainerIconCircleInProgress: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(37,99,235,0.25)' : '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusExplainerTitleInProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#60A5FA' : '#1D4ED8',
    marginBottom: 2,
  },
  statusExplainerDescInProgress: {
    fontSize: 11.5,
    color: isDark ? '#93C5FD' : '#1E40AF',
    lineHeight: 16,
  },
  showQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    gap: 7,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  showQrActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  statusExplainerCardCancelled: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.25)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statusExplainerTitleCancelled: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 2,
  },
  statusExplainerDescCancelled: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionTitle: {
    ...typography.fontSubtitle,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
    marginTop: 13,
  },
  stepperLineDone: {
    backgroundColor: '#059669',
  },
  stepperLineAwaiting: {
    backgroundColor: isDark ? 'rgba(245,158,11,0.4)' : '#FDE68A',
  },
  stepperLinePending: {
    backgroundColor: colors.border,
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 52,
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  stepCircleAwaiting: {
    backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  stepCirclePending: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelDone: {
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
    textAlign: 'center',
  },
  stepSubLabelDone: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.successDark,
    marginTop: 1,
    textAlign: 'center',
  },
  stepSubLabelAwaiting: {
    fontSize: 9,
    fontWeight: '600',
    color: isDark ? '#FBBF24' : '#D97706',
    marginTop: 1,
    textAlign: 'center',
  },
  workerCard: {
    marginBottom: spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  workerName: {
    ...typography.fontTitle,
    fontSize: 15,
    flex: 1,
    minWidth: 0,
  },
  workerTrade: {
    ...typography.fontBodySm,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  workerRating: {
    ...typography.fontCaption,
    color: colors.secondaryDark,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  callButtonIcon: {
    fontSize: 14,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  detailLabel: {
    ...typography.fontBodySm,
    color: colors.textMuted,
    width: 110,
  },
  detailValue: {
    ...typography.fontBodySm,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  pricingCard: {
    marginBottom: spacing.lg,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
    width: '100%',
  },
  pricingTitle: {
    ...typography.fontTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  splitLabel: {
    ...typography.fontTitle,
    fontSize: 16,
  },
  splitTotal: {
    ...typography.fontHeadline,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  splitSubLabel: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
  },
  splitSubValue: {
    ...typography.fontBodySm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustFooter: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
  },
  trustText: {
    ...typography.fontCaption,
    color: colors.primaryDark,
  },
  actionContainer: {
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  paymentSettledCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  paymentSettledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.4,
  },
  settledAmountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  settledSubText: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  settledDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  settledActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pendingActionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(245,158,11,0.4)' : '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.sm,
  },
  pendingTrustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.md,
  },
  pendingTrustIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingTrustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pendingTrustDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  pendingActionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelRequestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.06)',
  },
  cancelRequestBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.danger,
  },
  refreshStatusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  refreshStatusBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelledActionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginBottom: spacing.sm,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 4,
  },
  cancelledDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  statusExplainerCardPaymentDue: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  statusExplainerIconCirclePaymentDue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusExplainerTitlePaymentDue: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#FBBF24' : '#B45309',
    marginBottom: 3,
  },
  statusExplainerDescPaymentDue: {
    fontSize: 11.5,
    color: isDark ? '#FDE68A' : '#78350F',
    lineHeight: 16,
  },
  payNowQuickActionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payNowQuickActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  paymentDueActionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.5)' : '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.09,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  paymentDueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  paymentDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentDueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: isDark ? '#FBBF24' : '#B45309',
    letterSpacing: 0.3,
  },
  paymentDueAmountText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  paymentDueExplainerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 6,
  },
  paymentDueMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  methodTag: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
  },
  methodTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paidCashSecondaryBtn: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
  },
  paidCashSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default BookingDetailScreen;