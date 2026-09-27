// ==============================================================================
// WORKER PROFILE SCREEN — SHRAMIK DIGITAL CREDENTIALS & TRADE PROFILE
// Pure, distraction-free worker profile: Digital Smart ID pass with QR verification,
// trade credentials, verified skills chips, statutory base rate floor, and bio.
// All operational duty toggles, service radius controls, welfare passbooks,
// emergency SOS, and app settings are centralized in the top-right initials menu.
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  Shield,
  Award,
  CheckCircle2,
  QrCode,
  Heart,
  Plus,
  X,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import { Header } from '../../components/common/Header';
import { RealQRCode } from '../../components/common/RealQRCode';
import { FadeInView } from '../../animations';
import { ApiClient } from '../../services/apiClient';
import type { Worker } from '../../types';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable Form Fields
  const [bio, setBio] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('350');
  const [serviceArea, setServiceArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [certName, setCertName] = useState('');

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [addSkillModal, setAddSkillModal] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState('National Trade Certificate (NTC) — ITI');
  const [certRollNumber, setCertRollNumber] = useState('NTC-RJ-2021-88421');
  const [certIssuingBody, setCertIssuingBody] = useState('National Council for Vocational Training (NCVT)');
  const [certYear, setCertYear] = useState('2021');
  const [certSubmitting, setCertSubmitting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const w = await ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001');
          if (w) {
            setWorker(w);
            setBio(w.bio || 'Govt ITI certified electrician with 8+ years experience in domestic and commercial troubleshooting.');
            setSkillCategory(w.skill_category || 'Electrical');
            setHourlyRate(String(w.hourly_or_base_rate || 350));
            setServiceArea(w.service_area || 'C-Scheme, Jaipur (MI Road)');
            setPincode(w.pincode || '302001');
            setSkillsList(w.skills && w.skills.length > 0 ? w.skills : ['House Wiring', 'MCB Fix', 'Inverter Cabling']);
            setCertName(w.certification_name || 'Govt ITI National Trade Certificate');
          }
        } catch {
          // Fallback handled in ApiClient
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleSimulateCertUpload = () => {
    setShowCertModal(true);
  };

  const handleSaveCert = async () => {
    setCertSubmitting(true);
    try {
      const updatedCert = `${selectedCertType} (${certRollNumber.trim() || 'VERIFIED'})`;
      setCertName(updatedCert);
      await ApiClient.updateWorkerProfile('w0000000-0000-0000-0000-000000000001', {
        certification_name: updatedCert,
      });
      setShowCertModal(false);
    } catch (e) {
      console.warn('Cert update failed:', e);
    } finally {
      setCertSubmitting(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    if (!skillsList.includes(newSkillText.trim())) {
      setSkillsList([...skillsList, newSkillText.trim()]);
    }
    setNewSkillText('');
    setAddSkillModal(false);
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToDelete));
  };

  const handleSaveProfile = async () => {
    const rateNum = Number(hourlyRate);
    if (rateNum < 249) {
      Alert.alert(
        'Statutory Floor Warning',
        'Cooperative minimum wage floor is ₹249/hr. Base rate cannot be set lower than statutory regulations.'
      );
      return;
    }

    setSaving(true);
    try {
      await ApiClient.updateWorkerProfile('w0000000-0000-0000-0000-000000000001', {
        bio,
        skill_category: skillCategory,
        hourly_or_base_rate: rateNum,
        service_area: serviceArea,
        pincode,
        skills: skillsList,
        certification_name: certName,
      });
      Alert.alert(t('workerProfile.profile_saved_title', 'Profile Saved'), t('workerProfile.profile_saved_msg', 'Your professional profile details have been updated.'));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('workerProfile.loading', 'Loading Shramik profile...')}</Text>
      </View>
    );
  }

  const workerName = worker?.profile?.full_name || 'Rajesh Sharma';
  const workerInitials = workerName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <Header
        title={workerName}
        subtitle={t('worker.federation_member', 'Jaipur Shramik Sahakari Member')}
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shramik Digital Smart ID Card */}
        <FadeInView delay={0} distance={10} duration={320}>
          <Card style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <View style={styles.idAvatar}>
                <Text style={styles.idAvatarText}>{workerInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.idNameRow}>
                  <Text style={styles.idName}>{workerName}</Text>
                  <Badge label={t('workerProfile.id_verified', 'ID VERIFIED')} variant="success" size="sm" />
                </View>
                <Text style={styles.idCode}>{worker?.worker_code || 'WRK-JPR-0101'}</Text>
                <Text style={styles.idCoop}>Jaipur Shramik Sahakari Sangh (Reg. #8842)</Text>
              </View>
            </View>

            {/* Badges Strip */}
            <View style={styles.badgeStrip}>
              <View style={styles.certBadge}>
                <Shield size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Govt ITI Certified</Text>
              </View>
              <View style={styles.certBadge}>
                <CheckCircle2 size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Police Verified</Text>
              </View>
              <View style={styles.certBadge}>
                <Heart size={11} color="#86efac" />
                <Text style={styles.certBadgeText}>Ayushman Insured</Text>
              </View>
            </View>

            {/* QR / Digital Pass Toggle */}
            <TouchableOpacity
              style={styles.qrToggleRow}
              onPress={() => setShowQrModal(true)}
              activeOpacity={0.8}
            >
              <QrCode size={15} color="#ffffff" />
              <Text style={styles.qrToggleText}>{t('workerProfile.show_qr', 'Show Shramik Smart ID QR Pass')}</Text>
              <ChevronRight size={14} color="#bbf7d0" />
            </TouchableOpacity>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.experience_label', 'Experience')}</Text>
                <Text style={styles.statVal}>{worker?.experience_years || 8} Yrs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.jobs_label', 'Jobs Done')}</Text>
                <Text style={styles.statVal}>{worker?.total_jobs || 142}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('workerProfile.rating_label', 'Rating')}</Text>
                <Text style={styles.statVal}>★ {worker?.average_rating || 4.9}</Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Trade & Professional Details Form */}
        <FadeInView delay={80} distance={10} duration={320}>
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>{t('workerProfile.trade_profile_title', 'Trade & Professional Profile')}</Text>

            <Text style={styles.label}>{t('workerProfile.primary_trade', 'Primary Trade')}</Text>
            <TextInput
              style={styles.input}
              value={skillCategory}
              onChangeText={setSkillCategory}
              placeholder="e.g. Electrical, Plumbing"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.rateHeaderRow}>
              <Text style={styles.label}>{t('workerProfile.base_rate_label', 'Statutory Base Hourly Rate (₹)')}</Text>
              <Text style={styles.statutoryBadge}>Statutory Floor: ₹249/hr</Text>
            </View>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
              placeholder="350"
              placeholderTextColor={colors.textMuted}
            />

            {/* Specialized Skills Tags */}
            <View style={styles.skillsHeaderRow}>
              <Text style={styles.label}>{t('workerProfile.skills_tags_title', 'Verified Skill Specializations')}</Text>
              <TouchableOpacity
                style={styles.addSkillBtn}
                onPress={() => setAddSkillModal(true)}
              >
                <Plus size={11} color={colors.primary} />
                <Text style={styles.addSkillText}>{t('workerProfile.add_skill', 'Add Skill')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsTagWrap}>
              {skillsList.map((skill, idx) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteSkill(skill)}
                    style={styles.skillDeleteBtn}
                  >
                    <X size={11} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>{t('workerProfile.coverage_label', 'Base Location / Service Area')}</Text>
            <TextInput
              style={styles.input}
              value={serviceArea}
              onChangeText={setServiceArea}
              placeholder="C-Scheme, Jaipur"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>{t('workerProfile.pincode_label', 'Registered Postal Pincode')}</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              placeholder="302001"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>{t('workerProfile.bio_label', 'Professional Experience & Bio')}</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder={t('workerProfile.bio_placeholder', 'Describe your technical training and experience...')}
              placeholderTextColor={colors.textMuted}
            />
          </Card>
        </FadeInView>

        {/* Certification Documents Card */}
        <FadeInView delay={160} distance={10} duration={320}>
          <Card style={styles.certCard}>
            <Text style={styles.sectionTitle}>{t('workerProfile.cert_title', 'Vocational Qualification & License')}</Text>
            <Text style={styles.certDesc}>{t('workerProfile.cert_desc', 'Verified trade accreditation under Rajasthan Cooperative Societies Act.')}</Text>

            <View style={styles.attachedDocRow}>
              <Award size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docTitle}>{certName || 'ITI Certificate (Verified)'}</Text>
                <Text style={styles.docStatus}>{t('workerProfile.verified_by', 'Verified by Jaipur District Skill Registrar')}</Text>
              </View>
            </View>

            <Button
              title={t('workerProfile.attach_replace', 'Attach / Replace Certificate')}
              variant="outline"
              size="sm"
              onPress={handleSimulateCertUpload}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </FadeInView>

        {/* Save Changes Button */}
        <FadeInView delay={220} distance={10} duration={320}>
          <Button
            title={t('workerProfile.save_profile', 'Save Profile Changes')}
            variant="primary"
            size="lg"
            loading={saving}
            onPress={handleSaveProfile}
            style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}
          />
        </FadeInView>
      </ScrollView>

      {/* QR Identity Modal */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowQrModal(false)}>
          <Pressable style={styles.qrModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>{t('workerProfile.nfc_qr_title', 'Shramik Smart ID Pass')}</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrModalSub}>{t('workerProfile.nfc_qr_sub', 'Scan for zero-commission cooperative verification')}</Text>

            {/* Genuine ISO-Compliant Worker ID QR Code */}
            <View style={{ marginVertical: 12, alignItems: 'center' }}>
              <RealQRCode
                value={`https://sahakari-seva-six.vercel.app/worker/${worker?.worker_code || 'WRK-JPR-0101'}`}
                size={170}
                color="#0f172a"
                backgroundColor="#ffffff"
                errorCorrectionLevel="M"
                centerBadge={
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={14} color={colors.primary} />
                  </View>
                }
                centerBadgeSize={30}
              />
            </View>

            <View style={styles.qrInfoBox}>
              <Text style={styles.qrWorkerName}>{workerName}</Text>
              <Text style={styles.qrCodeText}>{worker?.worker_code || 'WRK-JPR-0101'}</Text>
              <Text style={styles.qrGovtText}>✓ Authenticated by Rajasthan Cooperative Federation</Text>
            </View>

            <Button
              title={t('common.close', 'Close')}
              variant="outline"
              size="sm"
              onPress={() => setShowQrModal(false)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Skill Modal */}
      <Modal visible={addSkillModal} transparent animationType="fade" onRequestClose={() => setAddSkillModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddSkillModal(false)}>
          <Pressable style={styles.qrModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>{t('workerProfile.add_skill', 'Add Specialization')}</Text>
              <TouchableOpacity onPress={() => setAddSkillModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrModalSub}>{t('workerProfile.add_skill_prompt', 'Enter technical service specialization')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkillText}
              onChangeText={setNewSkillText}
              placeholder="e.g. Solar Panel Inverters"
              placeholderTextColor={colors.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="outline"
                size="sm"
                onPress={() => setAddSkillModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('workerProfile.add_skill', 'Add Skill')}
                variant="primary"
                size="sm"
                onPress={handleAddSkill}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Shramik Trade Certification Modal */}
      <Modal
        visible={showCertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCertModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCertModal(false)}>
          <Pressable style={styles.actionSheetBox} onPress={e => e.stopPropagation()}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetTitleRow}>
                <View style={[styles.sosIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Award size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetTitle}>Trade Qualification & License</Text>
                  <Text style={styles.actionSheetSub}>Statutory accreditation for zero-commission registry</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCertModal(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>SELECT TECHNICAL ACCREDITATION</Text>
              {[
                'National Trade Certificate (NTC) — ITI',
                'Polytechnic Electrical Diploma',
                'Central Electricity Authority Safety Pass',
                'NSDC Skill India Level-4 Certificate',
              ].map((certOption) => (
                <TouchableOpacity
                  key={certOption}
                  style={[
                    styles.certOptionRow,
                    selectedCertType === certOption && styles.certOptionRowActive,
                  ]}
                  onPress={() => setSelectedCertType(certOption)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.certOptionTitle,
                        selectedCertType === certOption && styles.certOptionTitleActive,
                      ]}
                    >
                      {certOption}
                    </Text>
                    <Text style={styles.certOptionSub}>
                      Recognized under Rajasthan Directorate of Technical Education
                    </Text>
                  </View>
                  {selectedCertType === certOption && (
                    <Check size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>CERTIFICATE ROLL / REGISTRATION NUMBER</Text>
              <TextInput
                style={styles.sheetInput}
                value={certRollNumber}
                onChangeText={setCertRollNumber}
                placeholder="e.g. NTC-RJ-2021-88421"
                placeholderTextColor={colors.textMuted}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>ISSUING BOARD</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={certIssuingBody}
                    onChangeText={setCertIssuingBody}
                    placeholder="NCVT / State Board"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>YEAR</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={certYear}
                    onChangeText={setCertYear}
                    keyboardType="numeric"
                    placeholder="2021"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.statutoryNoticeBox}>
                <Shield size={14} color={colors.successDark} />
                <Text style={styles.statutoryNoticeText}>
                  Verified under Rajasthan Cooperative Societies Act 2026. Trade credentials qualify worker for priority allocation.
                </Text>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="outline"
                size="sm"
                onPress={() => setShowCertModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={certSubmitting ? 'Saving...' : 'Submit & Verify'}
                variant="primary"
                size="sm"
                onPress={handleSaveCert}
                disabled={certSubmitting}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
      ...typography.fontBody,
      marginTop: spacing.md,
      color: colors.textSecondary,
    },
    idCard: {
      padding: spacing.md,
      backgroundColor: isDark ? '#142a20' : colors.primaryDark,
      borderColor: colors.primary,
      marginBottom: spacing.md,
      borderRadius: 16,
    },
    idCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    idAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    idAvatarText: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primaryDark,
    },
    idNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    idName: {
      ...typography.fontHeadline,
      fontSize: 18,
      color: '#ffffff',
      fontWeight: '800',
    },
    idCode: {
      fontSize: 11,
      color: '#dcfce7',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginTop: 2,
      fontWeight: '600',
    },
    idCoop: {
      ...typography.fontCaption,
      color: '#bbf7d0',
      marginTop: 2,
    },
    badgeStrip: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    certBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    certBadgeText: {
      fontSize: 9,
      color: '#86efac',
      fontWeight: '700',
    },
    qrToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 10,
    },
    qrToggleText: {
      flex: 1,
      fontSize: 11,
      color: '#ffffff',
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: radii.sm,
      padding: spacing.sm,
      justifyContent: 'space-between',
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 9,
      color: '#dcfce7',
      fontWeight: '600',
    },
    statVal: {
      ...typography.fontSubtitle,
      color: '#ffffff',
      marginTop: 2,
      fontWeight: '800',
    },
    formCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: 14,
    },
    sectionTitle: {
      ...typography.fontSubtitle,
      marginBottom: spacing.sm,
      fontWeight: '800',
    },
    label: {
      ...typography.fontCaption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: spacing.sm,
      marginBottom: 4,
    },
    rateHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    statutoryBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.successDark,
      backgroundColor: colors.successLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 3,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    skillsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    addSkillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    addSkillText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    skillsTagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
      marginBottom: 4,
    },
    skillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    skillChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    skillDeleteBtn: {
      padding: 2,
    },
    bioInput: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
    certCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: 14,
    },
    certDesc: {
      ...typography.fontBodySm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    attachedDocRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    docTitle: {
      ...typography.fontSubtitle,
      fontSize: 13,
      fontWeight: '700',
    },
    docStatus: {
      ...typography.fontCaption,
      color: colors.success,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    qrModalBox: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    qrModalHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    qrModalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    qrModalSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    qrFrame: {
      width: 200,
      height: 200,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.primary,
      marginBottom: 14,
    },
    qrPattern: {
      width: '100%',
      height: '100%',
      borderWidth: 1.5,
      borderColor: '#0f172a',
      borderRadius: 8,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrCornerTopLeft: {
      position: 'absolute',
      top: 6,
      left: 6,
      width: 36,
      height: 36,
      borderWidth: 4,
      borderColor: '#0f172a',
    },
    qrCornerTopRight: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 36,
      height: 36,
      borderWidth: 4,
      borderColor: '#0f172a',
    },
    qrCornerBottomLeft: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      width: 36,
      height: 36,
      borderWidth: 4,
      borderColor: '#0f172a',
    },
    qrCenterBadge: {
      alignItems: 'center',
    },
    qrBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.primary,
    },
    qrInfoBox: {
      alignItems: 'center',
      marginBottom: 4,
    },
    qrWorkerName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    qrCodeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginTop: 2,
    },
    qrGovtText: {
      fontSize: 10,
      color: colors.successDark,
      fontWeight: '600',
      marginTop: 4,
    },
    modalInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
      marginTop: 6,
    },
    actionSheetBox: {
      width: '100%',
      maxWidth: 500,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionSheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    actionSheetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    sosIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionSheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    actionSheetSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.7,
      marginBottom: 6,
    },
    certOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      marginBottom: 8,
    },
    certOptionRowActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
    },
    certOptionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    certOptionTitleActive: {
      color: colors.primary,
    },
    certOptionSub: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sheetInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    statutoryNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
      borderRadius: 8,
      padding: 10,
      marginTop: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
    },
    statutoryNoticeText: {
      fontSize: 10,
      color: colors.successDark,
      fontWeight: '600',
      flex: 1,
      lineHeight: 14,
    },
  });

export default WorkerProfileScreen;