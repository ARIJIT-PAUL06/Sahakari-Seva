// mobile/src/screens/worker/WorkerWelfareScreen.tsx
// ==============================================================================
// WORKER WELFARE PASSBOOK — SOCIAL SECURITY & SOLIDARITY CORPUS
// Elegant, uncluttered glassmorphism passbook interface with live animations,
// 10% autonomous ring-fenced reserve telemetry, and allocation statements.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import type { Welfare, Worker } from '../../types';
import { useTranslation } from 'react-i18next';
import { FadeInView, AnimatedNumber, ScalePressable } from '../../animations';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import { useRole } from '../../context/RoleContext';

interface PassbookTransaction {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: number;
  balanceAfter: number;
  type: 'allocation' | 'dividend';
}

const RECENT_LEDGER: PassbookTransaction[] = [
  {
    id: 'tx-101',
    date: '12 Sep 2026 · 04:15 PM',
    title: 'Booking #BK-1002',
    description: '10% Co-op Solidarity allocation (Electrical Repair)',
    amount: 140.0,
    balanceAfter: 14920.0,
    type: 'allocation',
  },
  {
    id: 'tx-102',
    date: '11 Sep 2026 · 11:30 AM',
    title: 'Booking #BK-0994',
    description: '10% Co-op Solidarity allocation (Inverter Wiring)',
    amount: 180.0,
    balanceAfter: 14780.0,
    type: 'allocation',
  },
  {
    id: 'tx-103',
    date: '09 Sep 2026 · 02:00 PM',
    title: 'Booking #BK-0988',
    description: '10% Co-op Solidarity allocation (MCB Replacement)',
    amount: 120.0,
    balanceAfter: 14600.0,
    type: 'allocation',
  },
  {
    id: 'tx-104',
    date: '01 Sep 2026 · 10:00 AM',
    title: 'Federation Dividend Credit',
    description: 'Annual cooperative surplus dividend distribution',
    amount: 840.0,
    balanceAfter: 14480.0,
    type: 'dividend',
  },
];

export const WorkerWelfareScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { role } = useRole();
  const { handleBack } = useAppBackHandler({
    homeRouteName: role === 'worker' ? 'WorkerHome' : 'CustomerTabs',
    isHome: false,
  });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);

  const [worker, setWorker] = useState<Worker | null>(null);
  const [welfareList, setWelfareList] = useState<Welfare[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schemes' | 'ledger'>('schemes');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, wel] = await Promise.all([
          ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001'),
          ApiClient.getWelfare('w0000000-0000-0000-0000-000000000001'),
        ]);
        setWorker(w);
        setWelfareList(wel && wel.length > 0 ? wel : [
          {
            id: 'wel-01',
            worker_id: 'w0000000-0000-0000-0000-000000000001',
            welfare_scheme: 'Ayushman Bharat PM-JAY Health Shield',
            enrollment_status: 'Active',
            insurance_status: 'Active · ₹5 Lakh Hospitalization Cover',
            insurance_provider: 'National Health Authority (NHA)',
            policy_reference: 'AB-PMJAY-2026-8842',
            valid_until: '31 Mar 2027',
            contribution_balance: 8420.0,
          },
          {
            id: 'wel-02',
            worker_id: 'w0000000-0000-0000-0000-000000000001',
            welfare_scheme: 'PM Shram Yogi Maandhan Pension (PMSYM)',
            enrollment_status: 'Active',
            insurance_status: 'Active · Old-Age Pension Guarantee',
            insurance_provider: 'Ministry of Labour & Employment',
            policy_reference: 'PMSYM-RAJ-2026',
            valid_until: 'Lifetime (Age 60+)',
            contribution_balance: 4200.0,
          },
          {
            id: 'wel-03',
            worker_id: 'w0000000-0000-0000-0000-000000000001',
            welfare_scheme: 'Co-op Accidental & Disability Shield',
            enrollment_status: 'Active',
            insurance_status: 'Active · On-Duty Emergency SOS Cover',
            insurance_provider: 'Jaipur Shramik Sahakari Federation',
            policy_reference: 'JPR-COOP-ACC-101',
            valid_until: '31 Dec 2027',
            contribution_balance: 2300.0,
          },
        ]);
      } catch {
        // Handled in ApiClient fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalEarnings = worker?.total_earnings || 74200;
  const totalWelfareContribution =
    welfareList.reduce((sum, item) => sum + (item.contribution_balance || 0), 0) || 14920;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('welfare.loading', 'Loading social security passbook...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={t('welfare.title', 'Welfare Passbook')}
        subtitle={t('welfare.subtitle', '10% Ring-Fenced Social Reserve')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Chip Banner */}
        <FadeInView distance={8} duration={280}>
          <View style={styles.statusPillBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText} numberOfLines={1} ellipsizeMode="tail">
              {role === 'customer'
                ? 'COOP-PATRON-8842 · Citizen Member · Co-op Act §16'
                : 'WRK-JPR-0101 · Active Member · Co-op Act §16'}
            </Text>
          </View>
        </FadeInView>

        {/* Hero Glass Passbook Card */}
        <FadeInView delay={60} distance={12} duration={320}>
          <View style={styles.heroGlassCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTag}>SHRAMIK SOLIDARITY CORPUS</Text>
              <View style={styles.ringFencedBadge}>
                <Text style={styles.ringFencedText}>100% Ring-Fenced</Text>
              </View>
            </View>

            <Text style={styles.balanceLabel}>Total Accumulated Reserve</Text>
            <View style={styles.balanceRow}>
              <AnimatedNumber
                value={totalWelfareContribution}
                prefix="₹"
                format={n => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                duration={1000}
                style={styles.balanceAmount}
              />
            </View>
            <Text style={styles.balanceSub}>
              Autonomous 10% social capital allocation credited directly from every completed service.
            </Text>

            {/* Frosted Split Telemetry */}
            <View style={styles.splitGrid}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Direct Member Earnings</Text>
                <AnimatedNumber
                  value={totalEarnings}
                  prefix="₹"
                  format={n => n.toLocaleString('en-IN')}
                  duration={1000}
                  style={styles.splitValue}
                />
                <Text style={styles.splitNote}>100% Take-Home (0% Cut)</Text>
              </View>

              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Social Capital Pool</Text>
                <Text style={[styles.splitValue, { color: colors.primary }]}>10% Statutory</Text>
                <Text style={styles.splitNote}>Health, Pension & Cover</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Passbook Tab Switcher */}
        <FadeInView delay={120} distance={10} duration={300}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'schemes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('schemes')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'schemes' && styles.tabBtnTextActive]}>
                Active Schemes ({welfareList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ledger' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ledger')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'ledger' && styles.tabBtnTextActive]}>
                Allocation Statement
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* TAB 1: Active Social Security Schemes */}
        {activeTab === 'schemes' && (
          <View style={styles.schemesList}>
            {welfareList.map((scheme, idx) => (
              <FadeInView key={scheme.id} delay={160 + idx * 70} distance={10} duration={300}>
                <ScalePressable style={styles.schemeGlassCard}>
                  <View style={styles.schemeHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.schemeName}>{scheme.welfare_scheme}</Text>
                      <Text style={styles.schemeProvider}>{scheme.insurance_provider}</Text>
                    </View>
                    <View style={styles.enrolledPill}>
                      <Text style={styles.enrolledPillText}>{scheme.enrollment_status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.schemeDetailsGrid}>
                    <View style={styles.schemeDetailCol}>
                      <Text style={styles.detailTitle}>Coverage</Text>
                      <Text style={styles.detailValueSuccess}>{scheme.insurance_status}</Text>
                    </View>
                    <View style={styles.schemeDetailCol}>
                      <Text style={styles.detailTitle}>Policy Reference</Text>
                      <Text style={styles.detailValueMono}>{scheme.policy_reference || 'REF-2026'}</Text>
                    </View>
                  </View>

                  <View style={styles.schemeFooterRow}>
                    <View>
                      <Text style={styles.validUntilLabel}>Valid Through</Text>
                      <Text style={styles.validUntilVal}>{scheme.valid_until || '31 Mar 2027'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.schemeBalLabel}>Dedicated Reserve</Text>
                      <Text style={styles.schemeBalVal}>₹{Number(scheme.contribution_balance).toFixed(2)}</Text>
                    </View>
                  </View>
                </ScalePressable>
              </FadeInView>
            ))}
          </View>
        )}

        {/* TAB 2: Passbook Ledger Transactions */}
        {activeTab === 'ledger' && (
          <View style={styles.ledgerList}>
            {RECENT_LEDGER.map((tx, idx) => (
              <FadeInView key={tx.id} delay={160 + idx * 70} distance={10} duration={300}>
                <View style={styles.ledgerRowCard}>
                  <View style={styles.ledgerTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ledgerTitle}>{tx.title}</Text>
                      <Text style={styles.ledgerDate}>{tx.date}</Text>
                    </View>
                    <View style={styles.creditBadge}>
                      <Text style={styles.creditBadgeText}>+ ₹{tx.amount.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Text style={styles.ledgerDesc}>{tx.description}</Text>
                  <View style={styles.ledgerBottomRow}>
                    <Text style={styles.balanceAfterLabel}>Reserve Balance after credit:</Text>
                    <Text style={styles.balanceAfterVal}>₹{tx.balanceAfter.toFixed(2)}</Text>
                  </View>
                </View>
              </FadeInView>
            ))}
          </View>
        )}

        {/* Cooperative Solidarity Charter Guarantee */}
        <FadeInView delay={380} distance={10} duration={300}>
          <View style={styles.charterBox}>
            <Text style={styles.charterTitle}>Cooperative Solidarity Charter</Text>
            <Text style={styles.charterText}>
              All welfare capital is held in trust under Section 16 of the Rajasthan Cooperative Societies Act 2026.
              Funds are ring-fenced exclusively for member health, pensions, and on-duty protections, with zero administrative or corporate extraction.
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark: boolean) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.md,
      fontWeight: '500',
    },

    // Status Pill
    statusPillBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
      maxWidth: '100%',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10b981',
    },
    statusPillText: {
      fontSize: 10.5,
      color: isDark ? '#86efac' : colors.primaryDark,
      fontWeight: '600',
    },

    // Hero Glass Passbook Card
    heroGlassCard: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.85)',
      marginBottom: 14,
      shadowColor: isDark ? '#000000' : colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      elevation: 6,
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          } as any)
        : {}),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardHeaderTag: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    ringFencedBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
    },
    ringFencedText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: isDark ? '#86efac' : colors.primaryDark,
    },
    balanceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 2,
      marginBottom: 4,
    },
    balanceAmount: {
      fontSize: 30,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    balanceSub: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
      marginBottom: 14,
      fontWeight: '400',
    },

    // Split Grid
    splitGrid: {
      flexDirection: 'row',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      paddingTop: 12,
    },
    splitItem: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(241, 245, 249, 0.65)',
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.7)',
    },
    splitLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '500',
    },
    splitValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 2,
    },
    splitNote: {
      fontSize: 9.5,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Tabs
    tabBar: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.8)',
      borderRadius: 12,
      padding: 3,
      marginBottom: 12,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBtnActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabBtnText: {
      fontSize: 11.5,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabBtnTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },

    // Schemes List
    schemesList: {
      gap: 10,
      marginBottom: 12,
    },
    schemeGlassCard: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 10,
      elevation: 2,
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          } as any)
        : {}),
    },
    schemeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 10,
    },
    schemeName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 17,
    },
    schemeProvider: {
      fontSize: 10.5,
      color: colors.textMuted,
      marginTop: 2,
      fontWeight: '400',
    },
    enrolledPill: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    enrolledPillText: {
      fontSize: 9,
      fontWeight: '600',
      color: isDark ? '#86efac' : colors.primaryDark,
    },
    schemeDetailsGrid: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      marginBottom: 8,
    },
    schemeDetailCol: {
      flex: 1,
    },
    detailTitle: {
      fontSize: 9.5,
      color: colors.textMuted,
      fontWeight: '500',
    },
    detailValueSuccess: {
      fontSize: 10.5,
      color: isDark ? '#86efac' : colors.primaryDark,
      fontWeight: '500',
      marginTop: 2,
    },
    detailValueMono: {
      fontSize: 10,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '500',
      marginTop: 2,
    },
    schemeFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    validUntilLabel: {
      fontSize: 9.5,
      color: colors.textMuted,
    },
    validUntilVal: {
      fontSize: 10.5,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 1,
    },
    schemeBalLabel: {
      fontSize: 9.5,
      color: colors.textMuted,
    },
    schemeBalVal: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 1,
    },

    // Ledger List
    ledgerList: {
      gap: 10,
      marginBottom: 12,
    },
    ledgerRowCard: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          } as any)
        : {}),
    },
    ledgerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    ledgerTitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    ledgerDate: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
    },
    creditBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    creditBadgeText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#86efac' : colors.primaryDark,
    },
    ledgerDesc: {
      fontSize: 10.5,
      color: colors.textSecondary,
      lineHeight: 14,
      marginBottom: 6,
    },
    ledgerBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      paddingTop: 6,
    },
    balanceAfterLabel: {
      fontSize: 9.5,
      color: colors.textMuted,
    },
    balanceAfterVal: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // Charter Box
    charterBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(241, 245, 249, 0.65)',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.7)',
      marginTop: 6,
      marginBottom: 10,
    },
    charterTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 3,
    },
    charterText: {
      fontSize: 10,
      color: colors.textMuted,
      lineHeight: 14,
      fontWeight: '400',
    },
  });

export default WorkerWelfareScreen;