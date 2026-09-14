// ==============================================================================
// WORKER JOBS SCREEN — INCOMING REQUESTS & ACCEPT/DECLINE ACTIONS
// Clear visual separation of Current Commitment, Job Requests, Upcoming, and Past
// Compact squeezed cards so multiple job requests are visible simultaneously
// Prominent color distinction & uncluttered clean layout
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { Booking } from '../../types';
import { Clock, MapPin, Zap, CheckCircle2, ChevronRight, Lock, AlertTriangle, Navigation } from 'lucide-react-native';
import { FadeInView } from '../../animations';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerJobsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'scheduled' | 'completed'>('all');

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001');
      setJobs(data);
    } catch (err) {
      console.warn('Jobs load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadJobs();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      loadJobs();
    });
    return () => {
      sub.remove();
    };
  }, []);

  // Filtered Job Categories
  const inProgressJob = useMemo(() => jobs.find((b) => b.status === 'in_progress'), [jobs]);
  const acceptedJobs = useMemo(() => jobs.filter((b) => b.status === 'accepted'), [jobs]);
  const activeBannerJob = inProgressJob || acceptedJobs[0];

  const pendingJobs = useMemo(() => jobs.filter((b) => b.status === 'pending'), [jobs]);
  const scheduledJobs = useMemo(() => jobs.filter((b) => b.status === 'accepted' || b.status === 'in_progress'), [jobs]);
  const completedJobs = useMemo(
    () => jobs.filter((b) => b.status === 'completed' || b.status === 'rejected' || b.status === 'cancelled'),
    [jobs]
  );

  const handleOpenJobDetail = (job: Booking) => {
    if (navigation?.navigate) {
      navigation.navigate('WorkerJobDetail', { bookingId: job.id, job });
    }
  };

  // Compact Squeezed Job Card Component
  const renderJobCard = (job: Booking, idx: number) => {
    const isViolation = ApiClient.isPrepaidViolation(job);
    const scheduleConflict = ApiClient.checkScheduleConflict(job, jobs, 60);

    const isPending = job.status === 'pending';
    const isAccepted = job.status === 'accepted';
    const isInProgress = job.status === 'in_progress';
    const isCompleted = job.status === 'completed';
    const isPaymentPending = isCompleted && job.payment_status !== 'paid';
    const isCollision = isPending && scheduleConflict.isExactCollision;
    const isBuffer = isPending && !scheduleConflict.isExactCollision && scheduleConflict.isBufferCollision && !job.is_emergency;

    return (
      <FadeInView key={job.id} delay={idx * 25} distance={6} duration={220}>
        <TouchableOpacity
          style={[
            styles.jobCard,
            isPending && styles.jobCardPending,
            isAccepted && styles.jobCardAccepted,
            isInProgress && styles.jobCardInProgress,
            isCompleted && styles.jobCardCompleted,
            isViolation && styles.jobCardViolation,
            isCollision && styles.jobCardCollisionExact,
            isBuffer && styles.jobCardCollisionBuffer,
            job.is_emergency && styles.jobCardEmergency,
          ]}
          activeOpacity={0.78}
          onPress={() => handleOpenJobDetail(job)}
        >
          {/* Card Top Row: Code, Badge, Amount */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.codeRow}>
                <Text style={styles.jobCode}>{job.booking_code}</Text>
                {job.is_emergency && (
                  <View style={styles.emergencyPill}>
                    <Zap size={9} color="#ef4444" />
                    <Text style={styles.emergencyPillText}>{t('worker.emergency', 'EMERGENCY')}</Text>
                  </View>
                )}
                {isViolation && (
                  <View style={styles.violationPill}>
                    <Lock size={9} color="#ef4444" />
                    <Text style={styles.violationPillText}>SEC 14-B LOCKOUT</Text>
                  </View>
                )}
                {isCollision && (
                  <View style={styles.exactCollisionPill}>
                    <AlertTriangle size={9} color="#ffffff" />
                    <Text style={styles.exactCollisionPillText}>COLLISION</Text>
                  </View>
                )}
                {isBuffer && (
                  <View style={styles.bufferCollisionPill}>
                    <Clock size={9} color={isDark ? '#fbbf24' : '#b45309'} />
                    <Text style={styles.bufferCollisionPillText}>1-HR BUFFER</Text>
                  </View>
                )}
              </View>

              <View style={styles.timeRow}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={styles.timeText}>
                  {job.booking_date} at {job.booking_time}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightCol}>
              <View style={[styles.amountBadge, isViolation && styles.amountBadgeViolation]}>
                <Text style={[styles.amountText, isViolation && styles.amountTextViolation]}>
                  ₹{job.final_amount || job.estimated_amount}
                </Text>
              </View>

              {/* Status Pill */}
              <View
                style={[
                  styles.statusBadge,
                  isPending && styles.statusBadgePending,
                  isAccepted && styles.statusBadgeAccepted,
                  isInProgress && styles.statusBadgeInProgress,
                  isCompleted && (isPaymentPending ? styles.statusBadgePaymentDue : styles.statusBadgeCompleted),
                  job.status === 'rejected' && styles.statusBadgeRejected,
                  isViolation && styles.statusBadgeViolation,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isPending && styles.statusTextPending,
                    isAccepted && styles.statusTextAccepted,
                    isInProgress && styles.statusTextInProgress,
                    isCompleted && (isPaymentPending ? styles.statusTextPaymentDue : styles.statusTextCompleted),
                    job.status === 'rejected' && styles.statusTextRejected,
                    isViolation && styles.statusTextViolation,
                  ]}
                >
                  {isViolation
                    ? 'LOCKED'
                    : isPending
                    ? 'REQUESTED'
                    : isAccepted
                    ? 'CONFIRMED'
                    : isInProgress
                    ? 'IN PROGRESS'
                    : isCompleted
                    ? (isPaymentPending ? 'PAYMENT DUE' : 'COMPLETED')
                    : job.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Service Description (Single line compact preview) */}
          <Text style={styles.descText} numberOfLines={1}>
            {job.service_description}
          </Text>

          {/* Address Summary */}
          <View style={styles.addressRow}>
            <MapPin size={11} color={isViolation ? '#ef4444' : colors.textMuted} />
            <Text
              style={[styles.addressText, isViolation && styles.addressTextViolation]}
              numberOfLines={1}
            >
              {isViolation
                ? 'Coordinates locked by federation audit'
                : `${job.address} (${job.pincode})`}
            </Text>
          </View>

          {/* Card Footer: Clean text without icons */}
          <View style={[styles.cardFooter, isViolation && styles.cardFooterViolation]}>
            <Text
              style={[
                styles.cardFooterText,
                isViolation && styles.cardFooterTextViolation,
                isPending && { color: isDark ? '#fbbf24' : '#b45309' },
                isAccepted && { color: '#059669' },
                isInProgress && { color: '#2563eb' },
                isPaymentPending && { color: '#d97706', fontWeight: '700' },
              ]}
            >
              {isViolation
                ? 'View Federation Lockout Notice'
                : isInProgress
                ? 'Manage Active Work →'
                : isAccepted
                ? 'Manage Confirmed Job →'
                : isPending
                ? 'Review & Manage Job Request →'
                : isPaymentPending
                ? 'Collect Payment / Show QR Code →'
                : 'View Job Details & Wages →'}
            </Text>
            <ChevronRight
              size={13}
              color={
                isViolation
                  ? '#ef4444'
                  : isPending
                  ? isDark ? '#fbbf24' : '#b45309'
                  : isAccepted
                  ? '#059669'
                  : isInProgress
                  ? '#2563eb'
                  : isPaymentPending
                  ? '#d97706'
                  : colors.primary
              }
            />
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.jobs', 'Work Orders')}
        subtitle={t('worker.assigned_bookings', {
          count: jobs.length,
          defaultValue: `${jobs.length} total bookings assigned`,
        })}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadJobs();
            }}
          />
        }
      >
        {/* ========================================================================= */}
        {/* SECTION 1: CURRENT COMMITMENT / ACTIVE JOB (CLEANLY SEPARATED) */}
        {/* ========================================================================= */}
        <View style={styles.currentJobSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>
              {inProgressJob ? 'CURRENTLY PERFORMING JOB' : 'CURRENT COMMITMENT STATUS'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={styles.mapLinkBtn}
                onPress={() => navigation?.navigate('WorkerLocation')}
                activeOpacity={0.78}
              >
                <Navigation size={11} color={colors.primary} />
                <Text style={styles.mapLinkBtnText}>Live Map</Text>
              </TouchableOpacity>
              {activeBannerJob && (
                <View style={[styles.liveHeaderBadge, inProgressJob && styles.liveHeaderBadgeWorking]}>
                  <View style={[styles.liveHeaderDot, inProgressJob && { backgroundColor: '#3b82f6' }]} />
                  <Text style={[styles.liveHeaderBadgeText, inProgressJob && { color: '#2563eb' }]}>
                    {inProgressJob ? 'ON SITE ACTIVE' : 'COMMITTED'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {activeBannerJob ? (
            <FadeInView distance={8} duration={260}>
              <TouchableOpacity
                style={[
                  styles.activeBanner,
                  inProgressJob && styles.activeBannerInProgress,
                ]}
                activeOpacity={0.85}
                onPress={() => handleOpenJobDetail(activeBannerJob)}
              >
                <View style={styles.activeBannerLeft}>
                  <View
                    style={[
                      styles.activePulseDot,
                      inProgressJob && { backgroundColor: '#3b82f6' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.activeBannerTitleRow}>
                      <Text style={styles.activeBannerTitle}>
                        {inProgressJob
                          ? `On-Site Active: ${inProgressJob.booking_code}`
                          : `Committed: ${activeBannerJob.booking_code}${acceptedJobs.length > 1 ? ` (+${acceptedJobs.length - 1} more)` : ''}`}
                      </Text>
                      <View
                        style={[
                          styles.activeStatusPill,
                          inProgressJob && { backgroundColor: '#3b82f6' },
                        ]}
                      >
                        <Text style={styles.activeStatusPillText}>
                          {inProgressJob ? 'ON SITE / WORKING' : 'COMMITTED'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.activeBannerSub} numberOfLines={1}>
                      {activeBannerJob.service_description}
                    </Text>
                    <Text
                      style={[
                        styles.activeBannerPolicyNote,
                        inProgressJob && { color: '#2563eb' },
                      ]}
                    >
                      {inProgressJob
                        ? 'Working on-site now. Complete service before starting other jobs.'
                        : `Scheduled: ${activeBannerJob.booking_date} at ${activeBannerJob.booking_time}. Multiple non-overlapping jobs permitted.`}
                    </Text>
                  </View>
                </View>
                <View style={styles.activeBannerArrow}>
                  <ChevronRight size={18} color={inProgressJob ? '#2563eb' : '#10b981'} />
                </View>
              </TouchableOpacity>
            </FadeInView>
          ) : (
            <FadeInView distance={8} duration={260}>
              <View style={styles.readyBanner}>
                <CheckCircle2 size={16} color="#10b981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.readyBannerTitle}>Available for Assignment</Text>
                  <Text style={styles.readyBannerSub}>
                    Review pending work orders below. You may accept assignments that do not overlap (1-hr buffer).
                  </Text>
                </View>
              </View>
            </FadeInView>
          )}
        </View>

        {/* ========================================================================= */}
        {/* CLEAR SEPARATION DIVIDER */}
        {/* ========================================================================= */}
        <View style={styles.sectionSeparator}>
          <View style={styles.separatorLine} />
        </View>

        {/* Filter Navigation Tabs */}
        <View style={styles.filterPillsRow}>
          {[
            { key: 'all', label: 'All Orders', count: jobs.length },
            { key: 'requests', label: 'Requests', count: pendingJobs.length },
            { key: 'scheduled', label: 'Scheduled', count: scheduledJobs.length },
            { key: 'completed', label: 'Past Jobs', count: completedJobs.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTabPill,
                activeFilter === tab.key && styles.filterTabPillActive,
                tab.key === 'requests' && pendingJobs.length > 0 && activeFilter !== tab.key && styles.filterTabPillPendingGlow,
              ]}
              onPress={() => setActiveFilter(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabPillText,
                  activeFilter === tab.key && styles.filterTabPillTextActive,
                  tab.key === 'requests' && pendingJobs.length > 0 && activeFilter !== tab.key && { color: isDark ? '#fbbf24' : '#b45309' },
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('worker.no_requests_title', 'No Work Orders')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('worker.no_requests_sub', 'Assigned booking orders will appear here.')}
            </Text>
          </View>
        ) : (
          <>
            {/* =================================================================== */}
            {/* SECTION 2: INCOMING JOB REQUESTS (SQUEEZED, MULTIPLE VISIBLE) */}
            {/* =================================================================== */}
            {(activeFilter === 'all' || activeFilter === 'requests') && (
              <View style={styles.groupedSection}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupHeadingText}>INCOMING JOB REQUESTS</Text>
                  <View style={styles.groupBadgePending}>
                    <Text style={styles.groupBadgePendingText}>{pendingJobs.length} New</Text>
                  </View>
                </View>

                {pendingJobs.length === 0 ? (
                  activeFilter === 'requests' && (
                    <View style={styles.emptyGroupCard}>
                      <Text style={styles.emptyGroupText}>No new pending job requests</Text>
                    </View>
                  )
                ) : (
                  pendingJobs.map((job, idx) => renderJobCard(job, idx))
                )}
              </View>
            )}

            {/* =================================================================== */}
            {/* SECTION 3: UPCOMING & SCHEDULED WORK */}
            {/* =================================================================== */}
            {(activeFilter === 'all' || activeFilter === 'scheduled') && (
              <View style={styles.groupedSection}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupHeadingText}>UPCOMING & SCHEDULED</Text>
                  <View style={styles.groupBadgeScheduled}>
                    <Text style={styles.groupBadgeScheduledText}>{scheduledJobs.length} Confirmed</Text>
                  </View>
                </View>

                {scheduledJobs.length === 0 ? (
                  activeFilter === 'scheduled' && (
                    <View style={styles.emptyGroupCard}>
                      <Text style={styles.emptyGroupText}>No upcoming scheduled jobs</Text>
                    </View>
                  )
                ) : (
                  scheduledJobs.map((job, idx) => renderJobCard(job, idx))
                )}
              </View>
            )}

            {/* =================================================================== */}
            {/* SECTION 4: PREVIOUSLY DONE JOBS (COMPLETED HISTORY) */}
            {/* =================================================================== */}
            {(activeFilter === 'all' || activeFilter === 'completed') && (
              <View style={styles.groupedSection}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupHeadingText}>PREVIOUSLY DONE JOBS</Text>
                  <View style={styles.groupBadgeCompleted}>
                    <Text style={styles.groupBadgeCompletedText}>{completedJobs.length} Completed</Text>
                  </View>
                </View>

                {completedJobs.length === 0 ? (
                  activeFilter === 'completed' && (
                    <View style={styles.emptyGroupCard}>
                      <Text style={styles.emptyGroupText}>No previously completed jobs</Text>
                    </View>
                  )
                ) : (
                  completedJobs.map((job, idx) => renderJobCard(job, idx))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
      padding: 14,
      paddingBottom: 40,
    },

    // Current Commitment / Active Job Section
    currentJobSection: {
      marginBottom: 6,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    sectionHeaderLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    mapLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
    },
    mapLinkBtnText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    liveHeaderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    liveHeaderBadgeWorking: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    },
    liveHeaderDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10b981',
    },
    liveHeaderBadgeText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: '#059669',
      letterSpacing: 0.3,
    },

    // Active Commitment Banner
    activeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4',
      borderRadius: 12,
      borderWidth: 1,
      borderLeftWidth: 3,
      borderLeftColor: '#10b981',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 3,
      elevation: 1,
    },
    activeBannerInProgress: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : '#eff6ff',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe',
      borderLeftColor: '#3b82f6',
    },
    activeBannerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    activePulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10b981',
      marginTop: 4,
    },
    activeBannerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    activeBannerTitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    activeStatusPill: {
      backgroundColor: '#10b981',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    activeStatusPillText: {
      fontSize: 8,
      fontWeight: '600',
      color: '#ffffff',
      letterSpacing: 0.3,
    },
    activeBannerSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    activeBannerPolicyNote: {
      fontSize: 10,
      color: '#059669',
      marginTop: 2,
      fontWeight: '500',
    },
    activeBannerArrow: {
      paddingLeft: 8,
    },

    // Ready Banner
    readyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.04)' : '#f8fafc',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#e2e8f0',
      padding: 12,
    },
    readyBannerTitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    readyBannerSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },

    // Section Separation Divider
    sectionSeparator: {
      marginVertical: 12,
    },
    separatorLine: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
    },

    // Filter Navigation Pills Row
    filterPillsRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
    },
    filterTabPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    filterTabPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabPillPendingGlow: {
      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fcd34d',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
    },
    filterTabPillText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTabPillTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },

    // Grouped Sections
    groupedSection: {
      marginBottom: 16,
    },
    groupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    groupHeadingText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    groupBadgePending: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    groupBadgePendingText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#b45309',
    },
    groupBadgeScheduled: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    groupBadgeScheduledText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#059669',
    },
    groupBadgeCompleted: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.1)' : '#f1f5f9',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    groupBadgeCompletedText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#64748b',
    },
    emptyGroupCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : colors.surfaceSubtle,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyGroupText: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // Compact Squeezed Job Card (Lightened Theme)
    jobCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
      marginBottom: 9,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.15 : 0.02,
      shadowRadius: 3,
      elevation: 1,
    },
    jobCardPending: {
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
      backgroundColor: colors.surface,
    },
    jobCardAccepted: {
      borderLeftWidth: 3,
      borderLeftColor: '#10b981',
      backgroundColor: colors.surface,
    },
    jobCardInProgress: {
      borderLeftWidth: 3,
      borderLeftColor: '#3b82f6',
      backgroundColor: colors.surface,
    },
    jobCardCompleted: {
      borderLeftWidth: 3,
      borderLeftColor: '#94a3b8',
      backgroundColor: colors.surface,
    },
    jobCardViolation: {
      borderLeftWidth: 3,
      borderLeftColor: '#ef4444',
      backgroundColor: colors.surface,
    },
    jobCardEmergency: {
      borderLeftWidth: 3,
      borderLeftColor: '#ef4444',
      backgroundColor: colors.surface,
    },
    jobCardCollisionExact: {
      borderLeftWidth: 3,
      borderLeftColor: '#ef4444',
      backgroundColor: colors.surface,
    },
    jobCardCollisionBuffer: {
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
      backgroundColor: colors.surface,
    },

    // Card Header
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexWrap: 'wrap',
    },
    jobCode: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emergencyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      gap: 2,
    },
    emergencyPillText: {
      fontSize: 8,
      fontWeight: '600',
      color: '#dc2626',
    },
    violationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      gap: 2,
    },
    violationPillText: {
      fontSize: 8,
      fontWeight: '600',
      color: '#ffffff',
    },
    exactCollisionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      gap: 2,
    },
    exactCollisionPillText: {
      fontSize: 8,
      fontWeight: '600',
      color: '#ffffff',
    },
    bufferCollisionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      gap: 2,
    },
    bufferCollisionPillText: {
      fontSize: 8,
      fontWeight: '600',
      color: isDark ? '#fbbf24' : '#b45309',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    timeText: {
      fontSize: 10.5,
      color: colors.textMuted,
    },
    headerRightCol: {
      alignItems: 'flex-end',
      gap: 3,
    },
    amountBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    amountBadgeViolation: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    },
    amountText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#059669',
    },
    amountTextViolation: {
      color: '#ef4444',
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    statusBadgePending: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7',
    },
    statusBadgeAccepted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
    },
    statusBadgeInProgress: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
    },
    statusBadgeCompleted: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.1)' : '#f1f5f9',
    },
    statusBadgePaymentDue: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7',
      borderWidth: 0.5,
      borderColor: '#f59e0b',
    },
    statusBadgeRejected: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
    },
    statusBadgeViolation: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    },
    statusBadgeText: {
      fontSize: 8.5,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    statusTextPending: {
      color: '#b45309',
    },
    statusTextAccepted: {
      color: '#059669',
    },
    statusTextInProgress: {
      color: '#2563eb',
    },
    statusTextCompleted: {
      color: '#64748b',
    },
    statusTextPaymentDue: {
      color: '#d97706',
      fontWeight: '700',
    },
    statusTextRejected: {
      color: '#ef4444',
    },
    statusTextViolation: {
      color: '#dc2626',
    },

    // Compact Description & Address
    descText: {
      fontSize: 11.5,
      color: colors.textSecondary,
      lineHeight: 15,
      marginBottom: 4,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 6,
    },
    addressText: {
      fontSize: 10.5,
      color: colors.textMuted,
      flex: 1,
    },
    addressTextViolation: {
      color: '#ef4444',
      fontWeight: '500',
    },

    // Card Footer (No icons before text)
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    },
    cardFooterViolation: {
      borderTopColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
    },
    cardFooterText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    cardFooterTextViolation: {
      color: '#ef4444',
    },

    // Empty Box
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
  });