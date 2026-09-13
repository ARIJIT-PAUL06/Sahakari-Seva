// mobile/src/components/common/Header.tsx
// ==============================================================================
// MOBILE HEADER — BRANDING, NOTIFICATIONS & UPPER-RIGHT PROFILE DROPDOWN MENU
// The profile icon in the upper right corner opens an all-in-one popover menu
// containing: User Profile Navigation, Operational Duty Availability Standby,
// Welfare Passbook, Service Radius & Live Radar Map, Emergency Worker SOS,
// Dark/Light Mode Toggle, Language Switcher, and Role Switch / Logout.
// ==============================================================================

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import {
  Building2,
  ArrowLeft,
  User,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
  Heart,
  Navigation as NavIcon,
  LifeBuoy,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Radio,
  X,
  Scale,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import NotificationBar from './NotificationBar';
import LanguageModal from './LanguageModal';
import ThemeToggle from './ThemeToggle';
import { useRole } from '../../context/RoleContext';
import { AuthContext, rootNavigationRef } from '../../navigation/RootNavigator';
import { ApiClient } from '../../services/apiClient';
import type { AvailabilityStatus } from '../../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onPressLanguage?: () => void;
  onPressNotifications?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

// Native short names shown on the language chip
const NATIVE_SHORT: Record<string, string> = {
  en: 'EN',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
  ur: 'اردو',
  bho: 'भोजपुरी',
};

// Robust communication helpers for mobile and web
const openDialer = (phoneNumber: string) => {
  const clean = phoneNumber.replace(/[^0-9+]/g, '');
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${clean}`;
  } else {
    Linking.openURL(`tel:${clean}`).catch(err => {
      console.warn('Dialer error:', err);
    });
  }
};

const openWhatsApp = (phoneNumber: string, text: string) => {
  const clean = phoneNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(err => {
      console.warn('WhatsApp error:', err);
    });
  }
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onPressLanguage,
  onPressNotifications,
  showBack,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors, isDark);
  const { role } = useRole();
  const { logout } = useContext(AuthContext);

  const [menuVisible, setMenuVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [sosBeaconActive, setSosBeaconActive] = useState(false);
  const [ombudsmanModalVisible, setOmbudsmanModalVisible] = useState(false);

  // Worker live status
  const [workerAvailability, setWorkerAvailability] = useState<AvailabilityStatus>('available');
  const [activeJob, setActiveJob] = useState<any>(null);

  useEffect(() => {
    if (role === 'worker') {
      ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001')
        .then(w => {
          if (w?.availability_status) {
            setWorkerAvailability(w.availability_status);
          }
        })
        .catch(() => {});

      ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001')
        .then(bookings => {
          const current = bookings?.find((b: any) => b.status === 'accepted' || b.status === 'in_progress');
          setActiveJob(current || null);
          if (current) {
            setWorkerAvailability(current.is_emergency ? 'emergency_only' : 'busy');
          }
        })
        .catch(() => {});
    }

    const sub = DeviceEventEmitter.addListener('app_booking_updated', () => {
      if (role === 'worker') {
        ApiClient.getBookings(undefined, 'w0000000-0000-0000-0000-000000000001')
          .then(bookings => {
            const current = bookings?.find((b: any) => b.status === 'accepted' || b.status === 'in_progress');
            setActiveJob(current || null);
            if (current) {
              setWorkerAvailability(current.is_emergency ? 'emergency_only' : 'busy');
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      sub.remove();
    };
  }, [role]);

  const getUserMeta = () => {
    if (role === 'worker') {
      return {
        name: 'Rajesh Sharma',
        roleBadge: t('roles.worker'),
        subTitle: 'WRK-JPR-0101 · Electrician',
        initials: 'RS',
        avatarBg: colors.primaryDark,
      };
    }
    if (role === 'admin') {
      return {
        name: 'Dr. Vikramaditya Rathore',
        roleBadge: t('roles.admin'),
        subTitle: 'SEC-RAJ-COOP-001 · Chief Registrar',
        initials: 'VR',
        avatarBg: '#0f172a',
      };
    }
    return {
      name: 'Priya Singh',
      roleBadge: t('roles.customer'),
      subTitle: 'COP-CUS-2026-8842 · Citizen Patron',
      initials: 'PS',
      avatarBg: colors.primary,
    };
  };

  const userMeta = getUserMeta();

  const handleOpenProfile = () => {
    setMenuVisible(false);
    if (!rootNavigationRef.isReady()) return;
    try {
      if (role === 'customer') {
        rootNavigationRef.navigate('CustomerProfile');
      } else if (role === 'worker') {
        rootNavigationRef.navigate('WorkerProfile');
      } else if (role === 'admin') {
        rootNavigationRef.navigate('AdminProfile');
      }
    } catch (e) {
      console.warn('Navigation to profile error:', e);
    }
  };

  const handleOpenWelfare = () => {
    setMenuVisible(false);
    if (!rootNavigationRef.isReady()) return;
    try {
      rootNavigationRef.navigate('WorkerWelfare');
    } catch (e) {
      console.warn('Navigation to welfare error:', e);
    }
  };

  const handleOpenLocation = () => {
    setMenuVisible(false);
    if (!rootNavigationRef.isReady()) return;
    try {
      rootNavigationRef.navigate('WorkerTabs', { screen: 'WorkerLocation' });
    } catch (e) {
      try {
        rootNavigationRef.navigate('WorkerLocation');
      } catch (err2) {
        console.warn('Navigation to location map error:', e, err2);
      }
    }
  };

  const handleOpenEmergencySos = () => {
    setMenuVisible(false);
    setSosModalVisible(true);
  };

  const handleToggleWorkerAvailability = async () => {
    if (activeJob) {
      const isEmerg = activeJob.is_emergency;
      Alert.alert(
        isEmerg ? '🚨 Emergency Service Locked' : '⚡ Active Work in Progress',
        isEmerg
          ? `You are currently dispatched on an emergency SOS job (${activeJob.booking_code}). Operational mode is locked to Emergency Service until completion.`
          : `You are currently on an active service assignment (${activeJob.booking_code}). Operational mode will automatically revert to "Active for work" once this job is completed.`,
        [
          {
            text: 'View Job Details',
            onPress: () => {
              setMenuVisible(false);
              if (rootNavigationRef.isReady()) {
                rootNavigationRef.navigate('WorkerJobDetail', {
                  bookingId: activeJob.id,
                  job: activeJob,
                });
              }
            },
          },
          { text: 'Understood', style: 'cancel' },
        ]
      );
      return;
    }

    const nextStatus: AvailabilityStatus = workerAvailability === 'available' ? 'offline' : 'available';
    setWorkerAvailability(nextStatus);
    try {
      await ApiClient.updateWorkerAvailability('w0000000-0000-0000-0000-000000000001', nextStatus);
      DeviceEventEmitter.emit('app_booking_updated');
    } catch (e) {
      console.warn('Worker availability update failed:', e);
    }
  };

  const handleOpenCustomerPassbook = () => {
    setMenuVisible(false);
    if (!rootNavigationRef.isReady()) return;
    try {
      rootNavigationRef.navigate('CustomerTabs', { screen: 'Bookings' });
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  };

  const handleOpenOmbudsman = () => {
    setMenuVisible(false);
    setOmbudsmanModalVisible(true);
  };

  const handleOpenLanguage = () => {
    setMenuVisible(false);
    setLangModalVisible(true);
    if (onPressLanguage) {
      try {
        onPressLanguage();
      } catch (err) {
        console.warn('onPressLanguage error:', err);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + 6 : 8 }]}>
      <View style={styles.brandRow}>
        <View style={styles.logoRow}>
          {showBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back', 'Back')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={17} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/logo-transparent.png')}
              style={styles.logoBadgeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandTextWrap}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">
                {title || 'Sahakari Seva'}
              </Text>
              <View style={styles.coopTag}>
                <Text style={styles.coopTagText}>CO-OP</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {subtitle || '📍 Jaipur • Delivering services near you'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {/* Role-aware Notification Bell */}
          <NotificationBar />

          {/* Profile Icon in Upper Right Corner */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setMenuVisible(!menuVisible)}
            accessibilityRole="button"
            accessibilityLabel="Profile and Settings Menu"
            activeOpacity={0.75}
          >
            <View style={[styles.profileAvatar, { backgroundColor: userMeta.avatarBg }]}>
              {role === 'admin' ? (
                <Shield size={14} color="#ffffff" />
              ) : (
                <Text style={styles.profileAvatarText}>{userMeta.initials}</Text>
              )}
            </View>
            <View
              style={[
                styles.activeDot,
                role === 'worker' && {
                  backgroundColor: activeJob
                    ? activeJob.is_emergency
                      ? '#ef4444'
                      : '#f59e0b'
                    : workerAvailability === 'available'
                    ? '#10b981'
                    : '#94a3b8',
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drop-down Popover Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[styles.dropdownMenu, { top: insets.top > 0 ? insets.top + 48 : 50 }]}
            onPress={e => e.stopPropagation()}
          >
            {/* User Identity Card in Menu */}
            <TouchableOpacity
              style={styles.dropdownProfileHeader}
              onPress={handleOpenProfile}
              accessibilityRole="button"
              accessibilityLabel="View Profile"
              activeOpacity={0.75}
            >
              <View style={[styles.dropdownAvatarLarge, { backgroundColor: userMeta.avatarBg }]}>
                {role === 'admin' ? (
                  <Shield size={18} color="#ffffff" />
                ) : (
                  <Text style={styles.dropdownAvatarLargeText}>{userMeta.initials}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownUserName} numberOfLines={1}>
                  {userMeta.name}
                </Text>
                <View style={styles.rolePillWrap}>
                  <Text style={styles.rolePillText}>{userMeta.roleBadge}</Text>
                </View>
                <Text style={styles.dropdownUserSub} numberOfLines={1}>
                  {userMeta.subTitle}
                </Text>
              </View>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {/* Profile Card Button */}
              <TouchableOpacity
                style={styles.dropdownItemBtn}
                onPress={handleOpenProfile}
                accessibilityRole="button"
                accessibilityLabel="My Profile"
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <User size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{t('tabs.profile')}</Text>
                  <Text style={styles.itemSubtitle}>
                    {role === 'worker'
                      ? 'Smart ID, credentials, skills & rates'
                      : 'View and edit profile details'}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* =======================================================
                  RELOCATED TOOLS SECTION (Moved outside profile page)
              ======================================================= */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.dropdownSectionLabel}>SERVICES & COOPERATIVE TOOLS</Text>
              </View>

              {/* Worker Specific Tools */}
              {role === 'worker' && (
                <>
                  {/* Standby Duty Availability Quick Toggle */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleToggleWorkerAvailability}
                    accessibilityRole="button"
                    accessibilityLabel="Duty Availability"
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.itemIconWrap,
                        {
                          backgroundColor: activeJob
                            ? activeJob.is_emergency
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)'
                            : workerAvailability === 'available'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        },
                      ]}
                    >
                      <Radio
                        size={15}
                        color={
                          activeJob
                            ? activeJob.is_emergency
                              ? '#ef4444'
                              : '#f59e0b'
                            : workerAvailability === 'available'
                            ? '#10b981'
                            : '#64748b'
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Duty Availability</Text>
                      <Text style={styles.itemSubtitle}>
                        {activeJob
                          ? activeJob.is_emergency
                            ? 'On Emergency Job (Locked)'
                            : 'On Active Assignment (Locked)'
                          : workerAvailability === 'available'
                          ? 'Active for work · Receiving jobs'
                          : 'Offline · Standby paused'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.dutyStatusPill,
                        {
                          backgroundColor: activeJob
                            ? activeJob.is_emergency
                              ? '#ef4444'
                              : '#f59e0b'
                            : workerAvailability === 'available'
                            ? '#10b981'
                            : '#94a3b8',
                        },
                      ]}
                    >
                      <Text style={styles.dutyStatusPillText}>
                        {activeJob
                          ? activeJob.is_emergency
                            ? 'EMERGENCY'
                            : 'ON JOB'
                          : workerAvailability === 'available'
                          ? 'ONLINE'
                          : 'OFFLINE'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Welfare & Social Security Passbook */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenWelfare}
                    accessibilityRole="button"
                    accessibilityLabel="Worker Welfare & Social Security"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.secondaryLight }]}>
                      <Heart size={15} color={colors.secondaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Welfare & Social Security</Text>
                      <Text style={styles.itemSubtitle}>10% Solidarity fund, Ayushman & pension</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Operating Radius & Map Radar */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenLocation}
                    accessibilityRole="button"
                    accessibilityLabel="Operating Radius & Radar"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <NavIcon size={15} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Operating Radius & Radar</Text>
                      <Text style={styles.itemSubtitle}>Dispatch range & navigation radar</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Emergency Worker SOS */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenEmergencySos}
                    accessibilityRole="button"
                    accessibilityLabel="Emergency Worker SOS"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                      <LifeBuoy size={15} color={colors.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.danger }]}>Emergency Worker SOS</Text>
                      <Text style={styles.itemSubtitle}>24x7 control room, 112 & live beacon</Text>
                    </View>
                    <View style={styles.sosTagPill}>
                      <Text style={styles.sosTagText}>SOS</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* Customer Specific Tools */}
              {role === 'customer' && (
                <>
                  {/* Welfare & Social Security Passbook */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenWelfare}
                    accessibilityRole="button"
                    accessibilityLabel="Welfare & Social Security"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.secondaryLight }]}>
                      <Heart size={15} color={colors.secondaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Welfare & Social Security</Text>
                      <Text style={styles.itemSubtitle}>10% Solidarity fund, Ayushman & pension</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Co-op Patronage & My Bookings */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenCustomerPassbook}
                    accessibilityRole="button"
                    accessibilityLabel="My Bookings & Activity"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.successLight }]}>
                      <Sparkles size={15} color={colors.successDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>My Bookings & Activity</Text>
                      <Text style={styles.itemSubtitle}>0% Commission, invoices & QR passes</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Emergency Citizen SOS */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenEmergencySos}
                    accessibilityRole="button"
                    accessibilityLabel="Emergency Citizen SOS"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                      <LifeBuoy size={15} color={colors.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.danger }]}>Emergency Citizen SOS</Text>
                      <Text style={styles.itemSubtitle}>Helpline 1800-SAHAKAR, police & 108</Text>
                    </View>
                    <View style={styles.sosTagPill}>
                      <Text style={styles.sosTagText}>SOS</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Cooperative Ombudsman */}
                  <TouchableOpacity
                    style={styles.dropdownItemBtn}
                    onPress={handleOpenOmbudsman}
                    accessibilityRole="button"
                    accessibilityLabel="Cooperative Ombudsman"
                    activeOpacity={0.75}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.violetLight }]}>
                      <Scale size={15} color={colors.violetDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Cooperative Ombudsman</Text>
                      <Text style={styles.itemSubtitle}>Statutory 12-hour binding dispute desk</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}

              {/* Admin Specific Tools */}
              {role === 'admin' && (
                <TouchableOpacity
                  style={styles.dropdownItemBtn}
                  onPress={() => {
                    setMenuVisible(false);
                    if (rootNavigationRef.isReady()) {
                      rootNavigationRef.navigate('AdminTabs', { screen: 'AdminVerification' });
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Shield size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>KYC & Shramik Registry</Text>
                    <Text style={styles.itemSubtitle}>Statutory accreditation & audits</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {/* =======================================================
                  APP PREFERENCES & SETTINGS
              ======================================================= */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.dropdownSectionLabel}>PREFERENCES & SETTINGS</Text>
              </View>

              {/* Dark Mode Toggle */}
              <TouchableOpacity
                style={styles.dropdownRowItem}
                onPress={toggleTheme}
                accessibilityRole="button"
                accessibilityLabel="Toggle Theme Appearance"
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={{ fontSize: 13 }}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{t('customerProfile.theme_label')}</Text>
                  <Text style={styles.itemSubtitle}>
                    {isDark ? 'Dark Mode (Night)' : 'Light Mode (Day)'}
                  </Text>
                </View>
                <ThemeToggle />
              </TouchableOpacity>

              {/* Language Switch */}
              <TouchableOpacity
                style={styles.dropdownItemBtn}
                onPress={handleOpenLanguage}
                accessibilityRole="button"
                accessibilityLabel="App Display Language"
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Globe size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{t('customerProfile.language_label')}</Text>
                  <Text style={styles.itemSubtitle}>{t(`lang.${i18n.language || 'en'}`)}</Text>
                </View>
                <View style={styles.langPillBadge}>
                  <Text style={styles.langPillBadgeText}>
                    {NATIVE_SHORT[i18n.language] || 'EN'}
                  </Text>
                  <ChevronRight size={12} color={colors.primary} />
                </View>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              {/* Role Switch / Log Out */}
              <TouchableOpacity
                style={styles.dropdownLogoutBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch Role or Logout"
                activeOpacity={0.75}
              >
                <LogOut size={14} color={colors.danger} />
                <Text style={styles.dropdownLogoutText}>{t('auth.switch_role')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Selector Modal */}
      <LanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      {/* Universal Cooperative Safety & Emergency SOS Modal */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSosModalVisible(false)}>
          <Pressable style={styles.actionSheetBox} onPress={e => e.stopPropagation()}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetTitleRow}>
                <View style={styles.sosIconWrap}>
                  <LifeBuoy size={20} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetTitle}>Rajasthan Sahakari Safety & SOS</Text>
                  <Text style={styles.actionSheetSub}>Direct 24x7 Cooperative & Police Dispatch Desk</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSosModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* GPS & Live Standby Location Banner */}
            <View style={styles.sosDistressBanner}>
              <View style={styles.distressHeader}>
                <Radio size={14} color="#dc2626" />
                <Text style={styles.distressTitle}>Active Co-op GPS Coordinates</Text>
                <View style={styles.livePulseBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.livePulseText}>GPS LIVE</Text>
                </View>
              </View>
              <Text style={styles.distressCoords}>26.9124° N, 75.7873° E (Jaipur Metro Zone)</Text>
              <Text style={styles.distressSub}>
                Affiliation: {userMeta.name} ({userMeta.subTitle}) · Federation Registry #8842
              </Text>
            </View>

            {/* Emergency Channels */}
            <Text style={styles.sosSectionHeader}>INSTANT ASSISTANCE CHANNELS</Text>

            <TouchableOpacity
              style={styles.sosActionRowPrimary}
              onPress={() => openDialer('18007242527')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconPrimary}>
                <PhoneCall size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitlePrimary}>Call Sahakari Control Room</Text>
                <Text style={styles.actionSubPrimary}>1800-SAHAKAR (1800-724-2527) · Toll Free 24x7</Text>
              </View>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() => openDialer('112')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                <Shield size={18} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Police Emergency & Shramik Desk</Text>
                <Text style={styles.actionSub}>Direct line to Dial 112 with priority co-op tag</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() => openDialer('108')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Heart size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Medical Emergency / Ambulance</Text>
                <Text style={styles.actionSub}>Dial 108 Emergency Medical Response Service</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() =>
                openWhatsApp(
                  '911412227000',
                  `🚨 COOPERATIVE SAFETY DISTRESS ALERT:\nUser: ${userMeta.name} (${userMeta.subTitle})\nRole: ${role}\nGPS: 26.9124° N, 75.7873° E (Jaipur Metro Zone)\nImmediate assistance requested.`
                )
              }
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <MessageSquare size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>WhatsApp Distress Broadcast</Text>
                <Text style={styles.actionSub}>Transmits live coordinates to Jaipur Control Desk</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* One-Tap Dispatch Beacon */}
            <View style={styles.beaconWrap}>
              {sosBeaconActive ? (
                <View style={styles.beaconActiveBox}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.beaconActiveTitle}>Distress Beacon Transmitting (#SOS-9182)</Text>
                    <Text style={styles.beaconActiveSub}>
                      Nearest field unit alerted. Jaipur Control Room contact established.
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.beaconBtn}
                  onPress={() => setSosBeaconActive(true)}
                  activeOpacity={0.85}
                >
                  <AlertTriangle size={16} color="#ffffff" />
                  <Text style={styles.beaconBtnText}>Broadcast Live GPS Distress Beacon</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setSosModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalDismissBtnText}>{t('common.close', 'Dismiss & Close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Interactive Cooperative Ombudsman Modal */}
      <Modal
        visible={ombudsmanModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOmbudsmanModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOmbudsmanModalVisible(false)}>
          <Pressable style={styles.actionSheetBox} onPress={e => e.stopPropagation()}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetTitleRow}>
                <View style={[styles.sosIconWrap, { backgroundColor: '#ede9fe' }]}>
                  <Scale size={20} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetTitle}>Cooperative Ombudsman Desk</Text>
                  <Text style={styles.actionSheetSub}>Statutory 12-Hour Binding Dispute Resolution</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOmbudsmanModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Statutory Law Notice Banner */}
            <View style={[styles.sosDistressBanner, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.12)' : '#f5f3ff', borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#ddd6fe' }]}>
              <View style={styles.distressHeader}>
                <Scale size={14} color="#7c3aed" />
                <Text style={[styles.distressTitle, { color: '#7c3aed' }]}>Rajasthan Co-op Societies Act §58</Text>
                <View style={[styles.livePulseBadge, { backgroundColor: '#ede9fe' }]}>
                  <Text style={[styles.livePulseText, { color: '#7c3aed' }]}>12h SLA</Text>
                </View>
              </View>
              <Text style={styles.distressCoords}>Autonomous Cooperative Arbitration Authority</Text>
              <Text style={styles.distressSub}>
                Every citizen patron and artisan member is guaranteed a statutory binding resolution within 12 hours for billing, workmanship, or conduct disputes.
              </Text>
            </View>

            {/* Interactive Channels */}
            <Text style={styles.sosSectionHeader}>STATUTORY DISPUTE CHANNELS</Text>

            <TouchableOpacity
              style={[styles.sosActionRowPrimary, { backgroundColor: '#7c3aed' }]}
              onPress={() => openDialer('18007242527')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconPrimary}>
                <PhoneCall size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitlePrimary}>Call Ombudsman Grievance Desk</Text>
                <Text style={styles.actionSubPrimary}>1800-SAHAKAR (1800-724-2527) · Toll Free 24x7</Text>
              </View>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() =>
                openWhatsApp(
                  '911412227000',
                  `⚖️ COOPERATIVE OMBUDSMAN GRIEVANCE REQUEST:\nPatron/Member: ${userMeta.name} (${userMeta.subTitle})\nRole: ${role}\nRequesting statutory 12-hour binding dispute resolution regarding a service matter.`
                )
              }
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <MessageSquare size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>WhatsApp Grievance Officer</Text>
                <Text style={styles.actionSub}>Direct desk at Registrar of Cooperatives, Jaipur Division</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosActionRow}
              onPress={() => {
                setOmbudsmanModalVisible(false);
                if (rootNavigationRef.isReady()) {
                  if (role === 'customer') {
                    rootNavigationRef.navigate('CustomerProfile');
                  } else if (role === 'worker') {
                    rootNavigationRef.navigate('WorkerProfile');
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <User size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Open Dispute Portal & History</Text>
                <Text style={styles.actionSub}>View past arbitration awards, refunds & ticket status</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setOmbudsmanModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalDismissBtnText}>{t('common.close', 'Dismiss & Close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.topPanel,
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.topPanelBorder,
      width: '100%',
      zIndex: 100,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    logoRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 6,
      minWidth: 0,
    },
    backBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 2,
    },
    logoBadge: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(226, 232, 240, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    logoBadgeImage: {
      width: 28,
      height: 28,
    },
    brandTextWrap: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
    },
    brandName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      flexShrink: 1,
      letterSpacing: -0.2,
    },
    coopTag: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 4,
      paddingVertical: 1.5,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      flexShrink: 0,
    },
    coopTagText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    brandSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 1,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    profileBtn: {
      position: 'relative',
      padding: 1,
    },
    profileAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(227, 232, 229, 0.90)',
      shadowColor: '#142238',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    profileAvatarText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    activeDot: {
      position: 'absolute',
      bottom: 1,
      right: 1,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: '#087F5B',
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    dropdownBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    dropdownMenu: {
      position: 'absolute',
      right: 12,
      width: 304,
      maxWidth: '92%',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 12,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 24,
      elevation: 16,
    },
    dropdownScroll: {
      maxHeight: 520,
    },
    dropdownProfileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceSubtle,
      padding: 10,
      borderRadius: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownAvatarLarge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#ffffff',
    },
    dropdownAvatarLargeText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#ffffff',
    },
    dropdownUserName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    rolePillWrap: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
      marginTop: 2,
    },
    rolePillText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.primary,
    },
    dropdownUserSub: {
      fontSize: 9,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sectionHeaderRow: {
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 6,
    },
    dropdownSectionLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    dropdownItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 7.5,
      paddingHorizontal: 6,
      borderRadius: 8,
    },
    dropdownRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 7.5,
      paddingHorizontal: 6,
    },
    itemIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 0.5,
    },
    dutyStatusPill: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    dutyStatusPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ffffff',
    },
    sosTagPill: {
      backgroundColor: '#fee2e2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#fca5a5',
    },
    sosTagText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: '#dc2626',
    },
    langPillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    langPillBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.primary,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
    },
    dropdownLogoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginTop: 2,
      marginBottom: 2,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
    },
    dropdownLogoutText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
    },

    // Emergency SOS Sheet Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    actionSheetBox: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    actionSheetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    sosIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionSheetTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    actionSheetSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    closeBtn: {
      padding: 4,
    },
    sosDistressBanner: {
      backgroundColor: isDark ? '#1f1315' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? '#7f1d1d' : '#fecaca',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    distressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    distressTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: '#dc2626',
      flex: 1,
    },
    livePulseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#fee2e2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    livePulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#dc2626',
    },
    livePulseText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: '#dc2626',
    },
    distressCoords: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    distressSub: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sosSectionHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    sosActionRowPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#dc2626',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    actionIconPrimary: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTitlePrimary: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    actionSubPrimary: {
      fontSize: 10,
      color: '#fecaca',
      marginTop: 1,
    },
    sosActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surfaceSubtle,
      padding: 10,
      borderRadius: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    actionSub: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
    beaconWrap: {
      marginTop: 8,
      marginBottom: 6,
    },
    beaconBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#7f1d1d' : '#ef4444',
      paddingVertical: 11,
      borderRadius: 10,
    },
    beaconBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#ffffff',
    },
    beaconActiveBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#f0fdf4',
      borderWidth: 1,
      borderColor: '#86efac',
      padding: 10,
      borderRadius: 10,
    },
    beaconActiveTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#16a34a',
    },
    beaconActiveSub: {
      fontSize: 10,
      color: '#15803d',
      marginTop: 1,
    },
    modalDismissBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 6,
      backgroundColor: colors.surfaceSubtle,
    },
    modalDismissBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });

export default Header;