// ==============================================================================
// WORKER JOB DETAIL SCREEN — DEDICATED CONCISE PANEL FOR SINGLE JOB
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  MapPin,
  Check,
  X,
  Zap,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Calendar,
  DollarSign,
  HeartHandshake,
  AlertTriangle,
  QrCode,
  FileText,
} from 'lucide-react-native';
import { ApiClient } from '../../services/apiClient';
import { Booking, ExtraTaskItem } from '../../types';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { FadeInView, ScalePressable } from '../../animations';
import { SupplementalBillModal } from '../../components/worker/SupplementalBillModal';
import { WorkerCompletionScannerModal } from '../../components/worker/WorkerCompletionScannerModal';
import { WorkerPaymentQRModal } from '../../components/worker/WorkerPaymentQRModal';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

import { useNavigation, useRoute } from '@react-navigation/native';

interface WorkerJobDetailScreenProps {
  route?: {
    params?: {
      bookingId?: string;
      job?: Booking;
    };
  };
  navigation?: any;
}

export const WorkerJobDetailScreen: React.FC<WorkerJobDetailScreenProps> = ({
  route: propRoute,
  navigation: propNavigation,
}) => {
  const hookNavigation = useNavigation<any>();
  const hookRoute = useRoute<any>();
  const navigation = propNavigation || hookNavigation;
  const route = propRoute || hookRoute;
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerJobs', isHome: false });
  const { bookingId } = route?.params || {};
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [job, setJob] = useState<Booking | null>(route?.params?.job || null);
  const [loading, setLoading] = useState(!route?.params?.job);
  const [updating, setUpdating] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState<{
    hasConflict: boolean;
    isExactCollision: boolean;
    isBufferCollision: boolean;
    conflictingBooking: Booking | null;
    timeDifferenceMinutes: number | null;
    reason?: string;
  }>({
    hasConflict: false,
    isExactCollision: false,
    isBufferCollision: false,
    conflictingBooking: null,
    timeDifferenceMinutes: null,
  });
  const [ongoingServiceConflict, setOngoingServiceConflict] = useState<Booking | null>(null);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [paymentQrVisible, setPaymentQrVisible] = useState(false);

  const fetchJob = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const allJobs = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      const found = allJobs.find((b) => b.id === bookingId);
      const currentJob = found || job;
      if (found) {
        setJob(found);
      }

      // Check if candidate job collides with any existing committed job (1-hour buffer)
      if (currentJob) {
        const conflict = ApiClient.checkScheduleConflict(currentJob, allJobs, 60);
        setScheduleConflict(conflict);
      }

      // Check if worker already has another job actively in progress on-site
      const ongoing = allJobs.find(
        (b) => b.id !== bookingId && b.status === 'in_progress'
      );
      setOngoingServiceConflict(ongoing || null);
    } catch (err) {
      console.warn('Failed to load job details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.job) {
      setJob(route.params.job);
    }
    if (route?.params?.openScanner) {
      setScannerVisible(true);
    }
    if (route?.params?.openPaymentQr) {
      setPaymentQrVisible(true);
    }
    fetchJob();
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      fetchJob();
    });
    return () => {
      sub.remove();
    };
  }, [bookingId, route?.params?.job, route?.params?.openScanner, route?.params?.openPaymentQr]);

  const isPrepaidViolation = ApiClient.isPrepaidViolation(job);

  const handleCallCustomer = (phone?: string) => {
    if (isPrepaidViolation) {
      Alert.alert(
        'Action Restricted',
        'Customer contact is locked because this booking received prepayment prior to service commencement.'
      );
      return;
    }
    const targetPhone = phone || '+91 98765 43210';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert('Phone Contact', `Customer phone: ${targetPhone}`);
    });
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job) return;

    // Guard: Prevent accessing or modifying prepaid violation jobs
    if (isPrepaidViolation) {
      Alert.alert(
        'Access Revoked',
        'This job received prepayment before service commencement. Under cooperative bylaws, worker access is revoked.'
      );
      return;
    }

    // Guard: Prevent accepting a job that collides with an existing committed job
    if (newStatus === 'accepted') {
      if (scheduleConflict.hasConflict) {
        // Cooperative Emergency Priority Override:
        // Emergency jobs can bypass non-exact 60-minute buffer collisions for immediate dispatch
        if (!job.is_emergency || scheduleConflict.isExactCollision) {
          Alert.alert(
            'Schedule Collision ⚠️',
            scheduleConflict.reason ||
              `This job collides with committed job ${scheduleConflict.conflictingBooking?.booking_code}. You cannot accept overlapping bookings.`,
            [{ text: 'Understand' }]
          );
          return;
        }
      }
    }

    // Guard: Prevent starting service if another job is actively in progress on-site
    if (newStatus === 'in_progress') {
      if (ongoingServiceConflict) {
        Alert.alert(
          'Active Service In Progress ⚠️',
          `You already have on-site work underway for job ${ongoingServiceConflict.booking_code}. Mark that job completed before starting service work on this booking.`,
          [{ text: 'Understand' }]
        );
        return;
      }
    }

    try {
      setUpdating(true);
      await ApiClient.updateBookingStatus(job.id, newStatus);
      if (newStatus === 'accepted') {
        if (job.is_emergency) {
          Alert.alert(
            '🚨 Emergency Dispatch Accepted! ⚡',
            'Cooperative Priority Override activated. You are dispatched to customer with < 15-30 min arrival SLA. +25% Emergency Rate Bonus will be credited upon completion.'
          );
        } else {
          Alert.alert(
            t('worker.job_accepted_title', 'Job Accepted! 🎉'),
            'Your operational duty status has shifted to "On Active Job". You are now officially assigned to this booking.'
          );
        }
      } else if (newStatus === 'in_progress') {
        Alert.alert('Service Started 🚀', 'You have begun on-site work. Perform all tasks to cooperative standards.');
      } else if (newStatus === 'completed') {
        Alert.alert('Job Completed! ✓', `Great job! ₹${job.final_amount} service completed. 85% wage credited.`);
      } else if (newStatus === 'rejected') {
        Alert.alert('Request Declined', 'This job request has been declined.');
      }
      await fetchJob();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitSupplementalBill = async (billData: {
    diagnosis_notes: string;
    items: ExtraTaskItem[];
  }) => {
    if (!job) return;
    try {
      await ApiClient.sendSupplementalBill(job.id, billData);
      const totalExtra = billData.items.reduce((s, it) => s + (Number(it.cost) || 0), 0);
      Alert.alert(
        'Estimate Sent to Customer',
        `Supplemental bill for ₹${totalExtra} has been sent to customer profile. Awaiting authorization.`
      );
      fetchJob();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send supplemental bill.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading job panel...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={36} color={colors.danger} />
        <Text style={styles.errorTitle}>Job Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Jobs List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finalAmount = Number(job.final_amount || job.estimated_amount || 0);
  const workerTakeHome = (finalAmount * 0.85).toFixed(2);
  const welfareCorpus = (finalAmount * 0.10).toFixed(2);
  const platformFee = (finalAmount * 0.05).toFixed(2);

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('WorkerJobs');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>Jobs</Text>
        </TouchableOpacity>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>{job.booking_code}</Text>
          <Text style={styles.topBarSub}>Cooperative Work Order</Text>
        </View>

        <View style={styles.topRightBadge}>
          {isPrepaidViolation ? (
            <View style={[styles.badgePill, styles.badgeViolation]}>
              <Lock size={11} color="#ffffff" />
              <Text style={styles.badgeViolationText}>LOCKED</Text>
            </View>
          ) : (
            <View
              style={[
                styles.badgePill,
                job.status === 'accepted' && styles.badgeAccepted,
                job.status === 'in_progress' && styles.badgeInProgress,
                job.status === 'completed' && styles.badgeCompleted,
                job.status === 'pending' && styles.badgePending,
                job.status === 'rejected' && styles.badgeRejected,
              ]}
            >
              <Text style={styles.badgeText}>
                {job.status === 'pending'
                  ? 'REQUESTED'
                  : job.status === 'accepted'
                  ? 'CONFIRMED'
                  : job.status === 'in_progress'
                  ? 'IN PROGRESS'
                  : job.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* CASE: PREPAYMENT VIOLATION LOCKOUT */}
        {isPrepaidViolation ? (
          <FadeInView distance={14} duration={320}>
            <View style={styles.lockoutCard}>
              <View style={styles.lockoutIconWrap}>
                <ShieldAlert size={40} color="#ef4444" />
              </View>

              <Text style={styles.lockoutTitle}>Job Profile Inaccessible to Worker</Text>
              <Text style={styles.lockoutBadge}>COOPERATIVE BYLAW SECTION 14-B LOCKOUT</Text>

              <Text style={styles.lockoutDesc}>
                This booking received customer prepayment prior to service commencement in direct violation of Sahakari Seva cooperative bylaws.
              </Text>

              <View style={styles.lockoutNoticeBox}>
                <Text style={styles.lockoutNoticeText}>
                  Under federation bylaws, service professionals are strictly barred from accessing prepaid job profiles to eliminate unverified advance fees, payment disputes, and labor liability.
                </Text>
                <Text style={styles.lockoutAuditCode}>
                  Reference: AUD-SEC14B-{job.booking_code} • Reassigned to Federation Audit
                </Text>
              </View>

              <View style={styles.lockoutDetailsBox}>
                <View style={styles.lockoutDetailRow}>
                  <Text style={styles.lockoutDetailLabel}>Customer Details:</Text>
                  <Text style={styles.lockoutDetailRedacted}>[REDACTED BY FEDERATION]</Text>
                </View>
                <View style={styles.lockoutDetailRow}>
                  <Text style={styles.lockoutDetailLabel}>Service Address:</Text>
                  <Text style={styles.lockoutDetailRedacted}>[COORDINATES LOCKED]</Text>
                </View>
                <View style={styles.lockoutDetailRow}>
                  <Text style={styles.lockoutDetailLabel}>Phone Contact:</Text>
                  <Text style={styles.lockoutDetailRedacted}>[CALLING DISABLED]</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.lockoutReturnBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.lockoutReturnBtnText}>← Return to Active Jobs</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        ) : (
          <>

            {/* On-Site Service In Progress Warning for Accepted Jobs */}
            {job.status === 'accepted' && ongoingServiceConflict && (
              <FadeInView distance={10} duration={260}>
                <View style={styles.conflictBanner}>
                  <Clock size={18} color="#b45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conflictBannerTitle}>
                      On-Site Work in Progress ({ongoingServiceConflict.booking_code})
                    </Text>
                    <Text style={styles.conflictBannerDesc}>
                      You are actively on-site for {ongoingServiceConflict.booking_code}. Mark that job completed before beginning service on this booking.
                    </Text>
                  </View>
                </View>
              </FadeInView>
            )}

            {/* EMERGENCY MOBILIZATION PRIORITY BANNER */}
            {job.is_emergency && (
              <FadeInView distance={10} duration={260}>
                <View style={styles.emergencyMobilizationBanner}>
                  <View style={styles.emergencyMobilizationHeader}>
                    <Zap size={18} color="#ffffff" />
                    <Text style={styles.emergencyMobilizationTitle}>
                      🚨 24/7 EMERGENCY SOS DISPATCH
                    </Text>
                  </View>
                  <Text style={styles.emergencyMobilizationDesc}>
                    Immediate priority mobilization required. Customer expects rapid arrival (&lt; 15-30 min SLA). +25% Emergency Wage Bonus credited directly to you upon completion.
                  </Text>
                  <View style={styles.emergencyMobilizationBadges}>
                    <View style={styles.emergencyMobilizationPill}>
                      <Clock size={11} color="#ffe4e6" />
                      <Text style={styles.emergencyMobilizationPillText}>Arrival SLA: &lt; 15–30 min</Text>
                    </View>
                    <View style={styles.emergencyMobilizationPill}>
                      <ShieldCheck size={11} color="#ffe4e6" />
                      <Text style={styles.emergencyMobilizationPillText}>Emergency Rate: +25% Bonus</Text>
                    </View>
                  </View>
                </View>
              </FadeInView>
            )}

            {/* Section 1: Job Overview & Timing */}
            <FadeInView delay={40} distance={12} duration={300}>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.timeInfoRow}>
                    <Clock size={16} color={colors.primary} />
                    <Text style={styles.dateTimeText}>
                      {job.booking_date} at {job.booking_time}
                    </Text>
                  </View>
                  {job.is_emergency && (
                    <View style={styles.emergencyPill}>
                      <Zap size={11} color="#ef4444" />
                      <Text style={styles.emergencyPillText}>EMERGENCY SOS</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>SERVICE DESCRIPTION</Text>
                <Text style={styles.descriptionText}>{job.service_description}</Text>
              </View>
            </FadeInView>

            {/* Section 2: Customer & Service Location */}
            <FadeInView delay={90} distance={12} duration={300}>
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>CUSTOMER & SERVICE LOCATION</Text>

                <View style={styles.customerRow}>
                  <View style={styles.customerAvatarCircle}>
                    <Text style={styles.customerAvatarText}>
                      {(job.customer?.full_name || 'Customer').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>
                      {job.customer?.full_name || 'Valued Cooperative Customer'}
                    </Text>
                    <Text style={styles.customerPhone}>
                      {job.customer?.phone || '+91 98765 43210'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallCustomer(job.customer?.phone)}
                    activeOpacity={0.8}
                  >
                    <Phone size={15} color="#ffffff" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.addressBox}>
                  <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressTitle}>Address</Text>
                    <Text style={styles.addressLine}>{job.address}</Text>
                    <Text style={styles.addressCity}>
                      {job.city}, {job.state} - {job.pincode}
                    </Text>
                  </View>
                </View>
              </View>
            </FadeInView>

            {/* Section 3: Wages & Fair Split Breakdown */}
            <FadeInView delay={140} distance={12} duration={300}>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionLabel}>WAGES & COOPERATIVE SPLIT</Text>
                  <Text style={styles.totalAmountText}>₹{finalAmount}</Text>
                </View>

                <View style={styles.splitGrid}>
                  <View style={[styles.splitBox, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                    <Text style={[styles.splitBoxVal, { color: '#10b981' }]}>₹{workerTakeHome}</Text>
                    <Text style={styles.splitBoxLabel}>Direct Wage (85%)</Text>
                  </View>

                  <View style={[styles.splitBox, { backgroundColor: isDark ? '#78350f' : '#fffbeb' }]}>
                    <Text style={[styles.splitBoxVal, { color: '#f59e0b' }]}>₹{welfareCorpus}</Text>
                    <Text style={styles.splitBoxLabel}>Welfare Fund (10%)</Text>
                  </View>

                  <View style={[styles.splitBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.splitBoxVal, { color: '#64748b' }]}>₹{platformFee}</Text>
                    <Text style={styles.splitBoxLabel}>Platform Ops (5%)</Text>
                  </View>
                </View>

                <View style={styles.guaranteeRow}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Text style={styles.guaranteeText}>
                    Zero commission exploitation • 100% transparent cooperative compensation
                  </Text>
                </View>
              </View>
            </FadeInView>

            {/* Section 4: Supplemental Extra Tasks Diagnosis */}
            {(job.status === 'accepted' || job.status === 'in_progress') && (
              <FadeInView delay={190} distance={12} duration={300}>
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>ON-SITE DIAGNOSIS & EXTRA PARTS</Text>

                  {job.supplemental_bill ? (
                    <View
                      style={[
                        styles.sbCard,
                        job.supplemental_bill.status === 'pending_approval' && styles.sbPending,
                        job.supplemental_bill.status === 'approved' && styles.sbApproved,
                        job.supplemental_bill.status === 'denied' && styles.sbDenied,
                      ]}
                    >
                      <View style={styles.sbHeader}>
                        {job.supplemental_bill.status === 'pending_approval' && (
                          <>
                            <Clock size={14} color="#f59e0b" />
                            <Text style={[styles.sbStatusText, { color: '#f59e0b' }]}>
                              Supplemental Estimate Pending (₹{job.supplemental_bill.total_amount})
                            </Text>
                          </>
                        )}
                        {job.supplemental_bill.status === 'approved' && (
                          <>
                            <CheckCircle2 size={14} color="#10b981" />
                            <Text style={[styles.sbStatusText, { color: '#10b981' }]}>
                              Customer Approved (+₹{job.supplemental_bill.total_amount})
                            </Text>
                          </>
                        )}
                        {job.supplemental_bill.status === 'denied' && (
                          <>
                            <AlertCircle size={14} color="#ef4444" />
                            <Text style={[styles.sbStatusText, { color: '#ef4444' }]}>
                              Customer Declined Extra Work
                            </Text>
                          </>
                        )}
                      </View>

                      <Text style={styles.sbNotes}>"{job.supplemental_bill.diagnosis_notes}"</Text>

                      <View style={styles.sbChipsWrap}>
                        {job.supplemental_bill.items.map((it) => (
                          <View key={it.id} style={styles.sbChip}>
                            <Text style={styles.sbChipText}>
                              {it.title}: <Text style={{ fontWeight: '800' }}>₹{it.cost}</Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.extraBillBtn}
                      onPress={() => setBillModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Wrench size={15} color="#059669" />
                      <Text style={styles.extraBillBtnText}>Diagnose Extra Issues & Bill Customer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </FadeInView>
            )}

            {/* Section 5: Action Button Panel */}
            <FadeInView delay={230} distance={12} duration={300}>
              <View style={styles.actionCard}>
                {job.status === 'pending' && (
                  scheduleConflict.isExactCollision ? (
                    // Exact same date & time: ACCEPT OPTION IS HIDDEN completely (only Decline)
                    <View style={styles.exactHiddenActionBox}>
                      <TouchableOpacity
                        style={styles.fullDeclineBtn}
                        onPress={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                        activeOpacity={0.7}
                      >
                        <X size={16} color={colors.danger} />
                        <Text style={styles.declineBtnText}>{t('worker.decline_btn', 'Decline Request')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : scheduleConflict.isBufferCollision && !job.is_emergency ? (
                    // Buffer overlap: Worker cannot accept routine non-emergency jobs
                    <View style={styles.pendingActionGrid}>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                        activeOpacity={0.7}
                      >
                        <X size={16} color={colors.danger} />
                        <Text style={styles.declineBtnText}>{t('worker.decline_btn', 'Decline')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.acceptBtn, styles.acceptBtnDisabled]}
                        disabled={true}
                        activeOpacity={1}
                        onPress={() => {
                          Alert.alert(
                            'Schedule Conflict',
                            scheduleConflict.reason || 'This job collides with another scheduled booking.'
                          );
                        }}
                      >
                        <AlertTriangle size={15} color="#ffffff" />
                        <Text style={styles.acceptBtnText}>Schedule Conflict</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // No exact collision: Normal active buttons or Emergency Priority Override
                    <View style={styles.pendingActionGrid}>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                        activeOpacity={0.7}
                      >
                        <X size={16} color={colors.danger} />
                        <Text style={styles.declineBtnText}>{t('worker.decline_btn', 'Decline')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.acceptBtn, job.is_emergency && styles.acceptEmergencyBtn]}
                        onPress={() => handleUpdateStatus('accepted')}
                        disabled={updating}
                        activeOpacity={0.85}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            {job.is_emergency ? (
                              <Zap size={16} color="#ffffff" strokeWidth={2.5} />
                            ) : (
                              <Check size={16} color="#ffffff" strokeWidth={2.5} />
                            )}
                            <Text style={styles.acceptBtnText}>
                              {job.is_emergency ? '🚨 Accept Emergency' : t('worker.accept_btn', 'Accept Request')}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )
                )}

                {job.status === 'accepted' && (
                  <TouchableOpacity
                    style={[
                      styles.startBtn,
                      ongoingServiceConflict && styles.startBtnBlocked,
                    ]}
                    onPress={() => handleUpdateStatus('in_progress')}
                    disabled={updating}
                    activeOpacity={0.85}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Zap size={16} color="#ffffff" />
                        <Text style={styles.startBtnText}>
                          {ongoingServiceConflict
                            ? `Finish Ongoing Job First (${ongoingServiceConflict.booking_code})`
                            : t('worker.start_service', 'Start Service Work')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {job.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.completeBtn, job.completion_requested && { backgroundColor: '#059669' }]}
                    onPress={async () => {
                      if (job.completion_requested) {
                        setScannerVisible(true);
                      } else {
                        try {
                          setUpdating(true);
                          await ApiClient.requestJobCompletion(job.id);
                          Alert.alert(
                            'Sign-Off Request Sent 🛡️',
                            'Customer has been sent a verification notification. Ask them to show their Completion QR, then tap "Scan Customer QR to Finalize".'
                          );
                          await fetchJob();
                        } catch (err: any) {
                          Alert.alert('Action Failed', err.message || 'Could not request completion');
                        } finally {
                          setUpdating(false);
                        }
                      }
                    }}
                    disabled={updating}
                    activeOpacity={0.85}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : job.completion_requested ? (
                      <>
                        <QrCode size={18} color="#ffffff" />
                        <Text style={styles.completeBtnText}>
                          Scan Customer QR to Finalize (₹{finalAmount})
                        </Text>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} color="#ffffff" />
                        <Text style={styles.completeBtnText}>
                          Request Customer Sign-Off (₹{finalAmount})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {job.status === 'completed' && job.payment_status !== 'paid' && (
                  <View style={styles.awaitingPaymentBox}>
                    <View style={styles.awaitingPaymentHeader}>
                      <View style={styles.awaitingPaymentBadge}>
                        <Zap size={13} color="#d97706" />
                        <Text style={styles.awaitingPaymentBadgeText}>SERVICE DONE • AWAITING PAYMENT</Text>
                      </View>
                      <Text style={styles.awaitingPaymentAmount}>₹{finalAmount}</Text>
                    </View>
                    <Text style={styles.awaitingPaymentDesc}>
                      Customer sign-off verified! Under cooperative bylaws, customer has been prompted to pay ₹{finalAmount}.
                    </Text>

                    <View style={styles.awaitingPaymentActions}>
                      <TouchableOpacity
                        style={styles.showPaymentQrBtn}
                        onPress={() => setPaymentQrVisible(true)}
                        activeOpacity={0.85}
                      >
                        <QrCode size={16} color="#ffffff" />
                        <Text style={styles.showPaymentQrBtnText}>Show Customer UPI QR</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.confirmCashReceivedBtn}
                        onPress={() => {
                          Alert.alert(
                            'Confirm Cash Receipt',
                            `Did customer hand you ₹${finalAmount} in physical cash?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Yes, Received Cash',
                                onPress: async () => {
                                  try {
                                    setUpdating(true);
                                    await ApiClient.confirmCashPayment(job.id, Number(finalAmount));
                                    Alert.alert(
                                      'Payment Settled! ✓',
                                      `₹${workerTakeHome} (85% net wage) credited to your cooperative account!`
                                    );
                                    await fetchJob();
                                  } catch (err: any) {
                                    Alert.alert('Error', err.message || 'Could not record cash payment.');
                                  } finally {
                                    setUpdating(false);
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.85}
                      >
                        <Check size={16} color="#059669" />
                        <Text style={styles.confirmCashReceivedBtnText}>Customer Paid Cash (₹{finalAmount})</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {job.status === 'completed' && job.payment_status === 'paid' && (
                  <View style={styles.completedBox}>
                    <CheckCircle2 size={24} color="#10b981" />
                    <Text style={styles.completedTitle}>Service Completed & Payment Settled ✓</Text>
                    <Text style={styles.completedDesc}>
                      ₹{workerTakeHome} net wage (85%) credited to your cooperative account. ₹{(Number(finalAmount) * 0.1).toFixed(2)} to Welfare Fund.
                    </Text>
                    <TouchableOpacity
                      style={[styles.confirmCashReceivedBtn, { backgroundColor: '#10b981', marginTop: 12 }]}
                      onPress={() => navigation.navigate('Invoice', { bookingId: job.id })}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="View Tax Invoice & Payout Receipt"
                    >
                      <FileText size={16} color="#ffffff" />
                      <Text style={[styles.confirmCashReceivedBtnText, { color: '#ffffff' }]}>
                        View Tax Invoice & Payout Receipt
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </FadeInView>
          </>
        )}
      </ScrollView>

      {/* Supplemental Bill Modal */}
      {job && (
        <SupplementalBillModal
          visible={billModalVisible}
          onClose={() => setBillModalVisible(false)}
          booking={job}
          onSubmit={handleSubmitSupplementalBill}
        />
      )}

      {/* Customer Completion QR Scanner Modal */}
      {job && (
        <WorkerCompletionScannerModal
          visible={scannerVisible}
          booking={job}
          onClose={() => setScannerVisible(false)}
          onSuccess={async (completedBooking) => {
            Alert.alert(
              'Sign-Off Verified! ✓',
              `Customer completion pass verified for ${completedBooking.booking_code}. Total bill: ₹${completedBooking.final_amount}. Ask customer to pay via UPI QR or collect cash.`
            );
            await fetchJob();
          }}
        />
      )}

      {/* Customer Payment UPI QR Modal */}
      {job && (
        <WorkerPaymentQRModal
          visible={paymentQrVisible}
          booking={job}
          amount={Number(finalAmount)}
          workerName={job?.worker?.profile?.full_name || 'Ramesh Sharma'}
          onClose={() => setPaymentQrVisible(false)}
          onConfirmCash={async () => {
            try {
              setUpdating(true);
              await ApiClient.confirmCashPayment(job.id, Number(finalAmount));
              Alert.alert(
                'Payment Settled! ✓',
                `₹${workerTakeHome} (85% net wage) credited to your cooperative account!`
              );
              await fetchJob();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not record cash payment.');
            } finally {
              setUpdating(false);
            }
          }}
        />
      )}
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 48 : 14,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1.2,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      gap: 10,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    topBarTitleCol: {
      flex: 1,
      alignItems: 'center',
    },
    topBarTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    topBarSub: {
      fontSize: 10.5,
      color: colors.textMuted,
      marginTop: 1,
    },
    topRightBadge: {
      minWidth: 80,
      alignItems: 'flex-end',
    },
    badgePill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.primaryLight,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.4,
    },
    badgeAccepted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
    },
    badgeInProgress: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
    },
    badgeCompleted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
    },
    badgePending: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb',
    },
    badgeRejected: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
    },
    badgeViolation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#ef4444',
    },
    badgeViolationText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 12,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.danger,
      marginTop: 10,
    },
    backBtn: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    backBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      padding: 16,
      marginBottom: 14,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateTimeText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emergencyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: '#fee2e2',
    },
    emergencyPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#ef4444',
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
      marginVertical: 12,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    descriptionText: {
      fontSize: 13.5,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    customerAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerAvatarText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    customerName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    customerPhone: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#10b981',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    callButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ffffff',
    },
    addressBox: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    addressTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    addressLine: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 2,
    },
    addressCity: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    totalAmountText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    splitGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    splitBox: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    splitBoxVal: {
      fontSize: 14,
      fontWeight: '800',
    },
    splitBoxLabel: {
      fontSize: 9.5,
      color: colors.textMuted,
      marginTop: 3,
      textAlign: 'center',
    },
    guaranteeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    guaranteeText: {
      fontSize: 10.5,
      color: colors.textMuted,
      flex: 1,
    },
    sbCard: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginTop: 4,
    },
    sbPending: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
    },
    sbApproved: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
    },
    sbDenied: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
    },
    sbHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    sbStatusText: {
      fontSize: 12,
      fontWeight: '800',
    },
    sbNotes: {
      fontSize: 11.5,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    sbChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    sbChip: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    sbChipText: {
      fontSize: 11,
      color: colors.textPrimary,
    },
    extraBillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
      marginTop: 4,
    },
    extraBillBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#059669',
    },
    actionCard: {
      marginTop: 4,
    },
    pendingActionGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    declineBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: colors.danger,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    },
    declineBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.danger,
    },
    acceptBtn: {
      flex: 1.6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    acceptBtnDisabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.65,
    },
    acceptBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    startBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    startBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    completeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: '#10b981',
    },
    completeBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    completedBox: {
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#a7f3d0',
      gap: 6,
    },
    completedTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#10b981',
    },
    completedDesc: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
    awaitingPaymentBox: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#fffbeb',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a',
      gap: 10,
    },
    awaitingPaymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    awaitingPaymentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#fef3c7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    awaitingPaymentBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? '#fbbf24' : '#b45309',
      letterSpacing: 0.3,
    },
    awaitingPaymentAmount: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    awaitingPaymentDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    awaitingPaymentActions: {
      gap: 8,
      marginTop: 4,
    },
    showPaymentQrBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
    },
    showPaymentQrBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    confirmCashReceivedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      borderWidth: 1.5,
      borderColor: '#10b981',
      paddingVertical: 11,
      borderRadius: 10,
    },
    confirmCashReceivedBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#059669',
    },
    conflictBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
      padding: 12,
      borderRadius: 12,
      marginBottom: 14,
    },
    conflictBannerTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: isDark ? '#fbbf24' : '#b45309',
    },
    conflictBannerDesc: {
      fontSize: 11,
      color: isDark ? '#fde68a' : '#92400e',
      marginTop: 2,
      lineHeight: 15,
    },
    exactConflictBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fca5a5',
      padding: 12,
      borderRadius: 12,
      marginBottom: 14,
    },
    exactConflictBannerTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#ef4444',
    },
    exactConflictBannerDesc: {
      fontSize: 11,
      color: isDark ? '#fca5a5' : '#b91c1c',
      marginTop: 2,
      lineHeight: 15,
    },
    exactHiddenActionBox: {
      gap: 10,
    },
    exactCollisionNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fca5a5',
      padding: 10,
      borderRadius: 10,
    },
    exactCollisionNoticeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#ef4444',
      flex: 1,
      lineHeight: 16,
    },
    fullDeclineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: colors.danger,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    },
    startBtnBlocked: {
      backgroundColor: '#64748b',
      opacity: 0.85,
    },
    lockoutCard: {
      backgroundColor: isDark ? '#1e1b1b' : '#ffffff',
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: '#ef4444',
      padding: 20,
      alignItems: 'center',
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    lockoutIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    lockoutTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#ef4444',
      textAlign: 'center',
    },
    lockoutBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: '#b91c1c',
      letterSpacing: 0.5,
      backgroundColor: '#fee2e2',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
      marginTop: 6,
      marginBottom: 12,
    },
    lockoutDesc: {
      fontSize: 13,
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 14,
    },
    lockoutNoticeBox: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
      padding: 12,
      borderRadius: 10,
      marginBottom: 14,
    },
    lockoutNoticeText: {
      fontSize: 11.5,
      color: isDark ? '#fca5a5' : '#b91c1c',
      lineHeight: 16,
    },
    lockoutAuditCode: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#f87171' : '#991b1b',
      marginTop: 6,
    },
    lockoutDetailsBox: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
      marginBottom: 18,
      gap: 8,
    },
    lockoutDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lockoutDetailLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textMuted,
    },
    lockoutDetailRedacted: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ef4444',
      letterSpacing: 0.5,
    },
    lockoutReturnBtn: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    lockoutReturnBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    emergencyMobilizationBanner: {
      backgroundColor: '#be123c',
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
    },
    emergencyMobilizationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    emergencyMobilizationTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: 0.4,
    },
    emergencyMobilizationDesc: {
      fontSize: 11.5,
      color: '#ffe4e6',
      lineHeight: 16,
      marginBottom: 10,
    },
    emergencyMobilizationBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    emergencyMobilizationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    emergencyMobilizationPillText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    acceptEmergencyBtn: {
      backgroundColor: '#e11d48',
    },
  });

