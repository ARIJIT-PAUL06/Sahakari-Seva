// mobile/src/components/common/Footer.tsx
// ==============================================================================
// SAHAKARI SEVA — COMPREHENSIVE APP FOOTER WITH ACCORDION "SHOW MORE"
// Essential info shown at top (Brand + 85/10/5 Fair Wage Architecture).
// "Show more" button drops down trust pillars, policies, support contacts & legal.
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, radii, spacing, Palette } from '../../theme';
import {
  Building2,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle2,
  X,
  FileText,
  Award,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PolicyModalData {
  title: string;
  subtitle: string;
  content: string[];
}

export const Footer: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors, isDark);

  const [expanded, setExpanded] = useState(false);
  const [modalData, setModalData] = useState<PolicyModalData | null>(null);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18007242527').catch(() => {});
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@sahakariseva.coop').catch(() => {});
  };

  const policyItems: Record<string, PolicyModalData> = {
    about: {
      title: t('footer.about_modal_title', 'About Sahakari Seva'),
      subtitle: t('footer.about_modal_sub', 'Worker-Owned Democratic Platform'),
      content: [
        t('footer.about_p1', 'Sahakari Seva is registered under the Multi-State Cooperative Societies Act, 2002. Unlike venture-funded gig aggregators that extract 25-40% broker commissions, our platform is 100% owned and democratically governed by skilled workers.'),
        t('footer.about_p2', 'Our mission is to establish dignity of labor for electricians, plumbers, carpenters, and technicians across India by providing guaranteed fair wages, comprehensive health coverage, and transparent pricing for citizens.'),
        t('footer.about_p3', 'Every patron and worker has equal representation through elected district supervisory councils.')
      ]
    },
    charter: {
      title: t('footer.charter_modal_title', 'Fair Wage & Pricing Charter'),
      subtitle: t('footer.charter_modal_sub', 'Transparent 85/10/5 Distribution Guarantee'),
      content: [
        t('footer.charter_p1', '85% Direct Worker Take-Home: 85 rupees of every 100 rupees paid goes straight to the executing professional immediately upon job confirmation with 0% commission deduction.'),
        t('footer.charter_p2', '10% Social Security & Health Corpus: 10% is ring-fenced into the member welfare trust providing accidental insurance up to ₹5,00,000, outpatient medical coverage, tool replacement grants, and pension accruals.'),
        t('footer.charter_p3', '5% Cooperative Operations: Exactly 5% covers server infrastructure, GPS navigation, and administrative ledger audits. Zero profit extraction, zero venture dividends.'),
        t('footer.charter_p4', 'Zero Surge Pricing: Standard fixed hourly rates governed by the cooperative trade schedule, regardless of rain, peak demand, or emergencies.')
      ]
    },
    safety: {
      title: t('footer.safety_modal_title', 'Safety, ITI Verification & Quality'),
      subtitle: t('footer.safety_modal_sub', 'Certified Standards for Your Peace of Mind'),
      content: [
        t('footer.safety_p1', 'All professionals are government ITI or Skill India certified with verified trade licenses and criminal background checks.'),
        t('footer.safety_p2', 'Every job is backed by the Sahakari Guarantee: Free rework or full refund if trade standards are not met to customer satisfaction within 7 days.'),
        t('footer.safety_p3', 'Mandatory ID verification, OTP job commencement, and real-time support monitoring protect both citizens and service providers.')
      ]
    },
    grievance: {
      title: t('footer.grievance_modal_title', 'Grievance Redressal Mechanism'),
      subtitle: t('footer.grievance_modal_sub', 'Fast, Fair & Impartial Resolution'),
      content: [
        t('footer.grievance_p1', 'Disputes are reviewed by an independent 3-member Cooperative Ombudsman Committee consisting of a customer representative, a trade master, and a legal counselor.'),
        t('footer.grievance_p2', 'Response within 2 hours of complaint registration and complete resolution guaranteed within 24 hours.'),
        t('footer.grievance_p3', 'Toll-free 24/7 hotline (1800-SAHAKARI) and in-app instant grievance escalation.')
      ]
    },
    terms: {
      title: t('footer.terms_modal_title', 'Terms of Service & Privacy Policy'),
      subtitle: t('footer.terms_modal_sub', 'Privacy First • No Data Selling'),
      content: [
        t('footer.terms_p1', 'User data is strictly encrypted and stored on sovereign Indian servers under the Digital Personal Data Protection Act, 2023.'),
        t('footer.terms_p2', 'We never sell, rent, or share personal contact details or location data with third-party advertising brokers.'),
        t('footer.terms_p3', 'Payments are processed directly via authorized RBI-licensed cooperative banking rails and UPI protocols.')
      ]
    }
  };

  return (
    <View style={styles.footerContainer}>
      {/* ==================================================================== */}
      {/* ESSENTIAL TOP SECTION (ALWAYS VISIBLE)                               */}
      {/* ==================================================================== */}
      
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View style={styles.brandLogoBox}>
          <Image
            source={require('../../../assets/logo-transparent.png')}
            style={styles.brandLogoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.brandTextWrap}>
          <View style={styles.titleWithTag}>
            <Text style={styles.brandTitle}>{t('common.brand_name', 'Sahakari Seva')}</Text>
            <View style={styles.coopBadge}>
              <Text style={styles.coopBadgeText}>CO-OP</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>
            {t('footer.federation_tag', 'Worker Cooperative Platform • Reg. Multi-State Co-op')}
          </Text>
        </View>
      </View>

      <Text style={styles.missionText}>
        {t(
          'footer.mission_text',
          "India's premier worker-owned cooperative. Democratizing trade services through transparent fair wages, comprehensive worker welfare, and zero-commission pricing."
        )}
      </Text>

      {/* ==================================================================== */}
      {/* SHOW MORE / SHOW LESS TOGGLE BUTTON                                 */}
      {/* ==================================================================== */}
      <TouchableOpacity
        style={styles.toggleBtn}
        activeOpacity={0.7}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={expanded ? t('footer.show_less', 'Show less') : t('footer.show_more', 'Show more')}
      >
        <Text style={styles.toggleBtnText}>
          {expanded ? t('footer.show_less', 'Show less') : t('footer.show_more', 'Show more')}
        </Text>
        {expanded ? (
          <ChevronUp size={15} color={colors.primary} />
        ) : (
          <ChevronDown size={15} color={colors.primary} />
        )}
      </TouchableOpacity>

      {/* ==================================================================== */}
      {/* DROPDOWN EXPANDED CONTENT                                            */}
      {/* ==================================================================== */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.sectionDivider} />

          {/* Cooperative Wage Architecture (Normal typography breakdown) */}
          <View style={styles.wageSection}>
            <View style={styles.sectionHeaderRow}>
              <Scale size={16} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>
                {t('home.fair_split_title', '100% Fair Wage Distribution')}
              </Text>
            </View>
            <Text style={styles.wageExplainer}>
              {t(
                'footer.wage_explainer',
                'Every rupee earned is transparently tracked and audited under Cooperative Law. No hidden platform commissions.'
              )}
            </Text>

            {/* Breakdown Items */}
            <View style={styles.wageBreakdownList}>
              {/* 85% Worker */}
              <View style={styles.wageRow}>
                <View style={styles.percentBox}>
                  <Text style={styles.percentText}>85%</Text>
                </View>
                <View style={styles.wageDetail}>
                  <Text style={styles.wageDetailTitle}>
                    {t('home.fair_split_worker', 'Direct Worker Earnings')}
                  </Text>
                  <Text style={styles.wageDetailSub}>
                    {t('footer.worker_sub', 'Paid directly to the executing tradesperson with 0% platform deductions')}
                  </Text>
                </View>
              </View>

              {/* 10% Social Security */}
              <View style={styles.wageRow}>
                <View style={styles.percentBox}>
                  <Text style={styles.percentText}>10%</Text>
                </View>
                <View style={styles.wageDetail}>
                  <Text style={styles.wageDetailTitle}>
                    {t('home.fair_split_welfare', 'Health & Pension Corpus')}
                  </Text>
                  <Text style={styles.wageDetailSub}>
                    {t('footer.welfare_sub', 'Allocated to family health insurance, accidental shield & pension fund')}
                  </Text>
                </View>
              </View>

              {/* 5% Operations */}
              <View style={[styles.wageRow, { borderBottomWidth: 0 }]}>
                <View style={styles.percentBox}>
                  <Text style={styles.percentText}>5%</Text>
                </View>
                <View style={styles.wageDetail}>
                  <Text style={styles.wageDetailTitle}>
                    {t('home.fair_split_platform', 'Platform Operations')}
                  </Text>
                  <Text style={styles.wageDetailSub}>
                    {t('footer.platform_sub', 'Covers server hosting, GPS navigation & democratic audits')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Audit Statement */}
            <View style={styles.auditRow}>
              <Lock size={13} color={colors.textSecondary} />
              <Text style={styles.auditText}>
                {t(
                  'bookingDetail.trust_footer',
                  'Zero exploitation: Every rupee is audited and transparent under Cooperative Law.'
                )}
              </Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Cooperative Trust Pillars */}
          <View style={styles.pillarsContainer}>
            <View style={styles.pillarItem}>
              <ShieldCheck size={16} color={colors.primary} />
              <Text style={styles.pillarTitle}>{t('footer.pillar_iti', 'Govt. ITI Certified')}</Text>
              <Text style={styles.pillarDesc}>
                {t('footer.pillar_iti_desc', 'Verified skills, criminal checks & trade licensing')}
              </Text>
            </View>

            <View style={styles.pillarItem}>
              <HeartHandshake size={16} color={colors.primary} />
              <Text style={styles.pillarTitle}>{t('footer.pillar_coop', 'Worker Owned')}</Text>
              <Text style={styles.pillarDesc}>
                {t('footer.pillar_coop_desc', 'Democratically managed with zero venture middlemen')}
              </Text>
            </View>

            <View style={styles.pillarItem}>
              <Award size={16} color={colors.primary} />
              <Text style={styles.pillarTitle}>{t('footer.pillar_pricing', 'Flat Transparent Rates')}</Text>
              <Text style={styles.pillarDesc}>
                {t('footer.pillar_pricing_desc', 'No surge pricing, hidden fees, or rush hour markups')}
              </Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Quick Policy & Information Links */}
          <View style={styles.linksContainer}>
            <Text style={styles.linksHeaderTitle}>{t('footer.info_links_title', 'Cooperative Transparency & Policies')}</Text>
            
            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => setModalData(policyItems.about)}
            >
              <View style={styles.linkLeft}>
                <Info size={14} color={colors.primary} />
                <Text style={styles.linkText}>{t('footer.link_about', 'About Sahakari Seva Model')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => setModalData(policyItems.charter)}
            >
              <View style={styles.linkLeft}>
                <FileText size={14} color={colors.primary} />
                <Text style={styles.linkText}>{t('footer.link_charter', 'Fair Wage & Price Charter')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => setModalData(policyItems.safety)}
            >
              <View style={styles.linkLeft}>
                <ShieldCheck size={14} color={colors.primary} />
                <Text style={styles.linkText}>{t('footer.link_safety', 'Safety, ITI Verification & Guarantee')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => setModalData(policyItems.grievance)}
            >
              <View style={styles.linkLeft}>
                <Scale size={14} color={colors.primary} />
                <Text style={styles.linkText}>{t('footer.link_grievance', 'Grievance Redressal & Ombudsman')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => setModalData(policyItems.terms)}
            >
              <View style={styles.linkLeft}>
                <CheckCircle2 size={14} color={colors.primary} />
                <Text style={styles.linkText}>{t('footer.link_terms', 'Terms of Service & Privacy Policy')}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionDivider} />

          {/* Support & Contact Details */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactHeaderTitle}>{t('footer.support_title', '24/7 Cooperative Support')}</Text>
            
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={handleCallSupport}
            >
              <Phone size={14} color={colors.primary} />
              <Text style={styles.contactText}>1800-SAHAKARI (1800 724 2527) • {t('footer.toll_free', 'Toll Free')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={handleEmailSupport}
            >
              <Mail size={14} color={colors.primary} />
              <Text style={styles.contactText}>support@sahakariseva.coop</Text>
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={styles.contactTextMuted}>
                Rajasthan State Co-operative Complex, C-Scheme, Jaipur - 302001
              </Text>
            </View>
          </View>

          {/* Bottom Copyright & App Version */}
          <View style={styles.bottomMeta}>
            <Text style={styles.regText}>
              {t('footer.reg_line', 'Registered Multi-State Co-operative Society #MSCS/CR/2026/894')}
            </Text>
            <Text style={styles.copyrightText}>
              © 2026 Sahakari Seva Co-operative Society Ltd. All rights reserved.
            </Text>
            <Text style={styles.taglineText}>
              {t('footer.tagline', 'Dignity of Labor • Democratic Control • Solidarity')}
            </Text>
            <Text style={styles.versionText}>v1.0.4 (Cooperative Build #142)</Text>
          </View>
        </View>
      )}

      {/* Informational Policy Modal */}
      <Modal
        visible={modalData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalData(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalData(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{modalData?.title}</Text>
                <Text style={styles.modalSub}>{modalData?.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalData(null)}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {modalData?.content.map((paragraph, idx) => (
                <View key={idx} style={styles.paragraphRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.paragraphText}>{paragraph}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setModalData(null)}
            >
              <Text style={styles.modalDoneText}>{t('common.close', 'Close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    footerContainer: {
      backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.xxl,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    brandLogoBox: {
      width: 38,
      height: 38,
      borderRadius: radii.sm,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(226, 232, 240, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    brandLogoImage: {
      width: 30,
      height: 30,
    },
    brandTextWrap: {
      flex: 1,
    },
    titleWithTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    coopBadge: {
      backgroundColor: colors.secondaryLight,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.secondaryLight,
    },
    coopBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.secondaryDark,
    },
    brandSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    missionText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },

    // Wage section styles
    wageSection: {
      gap: spacing.xs,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    sectionHeaderTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    wageExplainer: {
      fontSize: 11.5,
      color: colors.textSecondary,
      lineHeight: 16,
      marginBottom: spacing.xs,
    },
    wageBreakdownList: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    wageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    percentBox: {
      minWidth: 42,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: radii.xs,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    percentText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primaryDark,
    },
    wageDetail: {
      flex: 1,
    },
    wageDetailTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    wageDetailSub: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    auditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
    },
    auditText: {
      fontSize: 10.5,
      color: colors.textSecondary,
      flex: 1,
      fontStyle: 'italic',
    },

    // Toggle button styles
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginTop: spacing.md,
      alignSelf: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    toggleBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primary,
    },

    // Expanded section
    expandedContent: {
      marginTop: spacing.xs,
    },

    // Trust Pillars
    pillarsContainer: {
      gap: spacing.sm,
    },
    pillarItem: {
      backgroundColor: colors.surface,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: 2,
    },
    pillarTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    pillarDesc: {
      fontSize: 10.5,
      color: colors.textSecondary,
      lineHeight: 14,
    },

    // Links section
    linksContainer: {
      gap: spacing.xs,
    },
    linksHeaderTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    linkText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '500',
    },

    // Contacts
    contactContainer: {
      gap: spacing.xs,
    },
    contactHeaderTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 3,
    },
    contactText: {
      fontSize: 11.5,
      color: colors.primary,
      fontWeight: '600',
    },
    contactTextMuted: {
      fontSize: 11,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 15,
    },

    // Bottom meta
    bottomMeta: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
      gap: 3,
    },
    regText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    copyrightText: {
      fontSize: 10,
      color: colors.textMuted,
      textAlign: 'center',
    },
    taglineText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.secondaryDark,
      textAlign: 'center',
      marginTop: 2,
    },
    versionText: {
      fontSize: 9.5,
      color: colors.textMuted,
      marginTop: 2,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.sm,
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSub: {
      fontSize: 11.5,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    modalCloseBtn: {
      padding: 4,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceSubtle,
    },
    modalBody: {
      marginBottom: spacing.md,
    },
    paragraphRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    paragraphText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.textPrimary,
      flex: 1,
    },
    modalDoneBtn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm + 2,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalDoneText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
  });

export default Footer;
