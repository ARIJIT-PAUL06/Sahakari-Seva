// ==============================================================================
// ROLE-AWARE NOTIFICATION BAR — spring pop-up panel per role
// Customer / worker / admin each receive their own notification feed with a
// smooth spring "pop" animation when the bell is pressed. The feed itself is
// owned by RoleContext so the unread badge is correct immediately and stays
// in sync across every screen.
//
// The panel is rendered inside a transparent React Native Modal, so it always
// floats ABOVE every screen (tab bars, maps, scroll views) on both native and
// web — it can never be painted behind or clipped by an ancestor.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Pressable,
  Modal,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  CalendarCheck,
  Wallet,
  HeartHandshake,
  Zap,
  ShieldCheck,
  TrendingUp,
  CheckCheck,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useRole } from '../../context/RoleContext';
import type { Notification } from '../../types';

function timeAgo(iso: string, t: (k: string, opts?: any) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.just_now');
  if (mins < 60) return t('notifications.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.hours_ago', { count: hours });
  return t('notifications.days_ago', { count: Math.floor(hours / 24) });
}

function typeIcon(type: string, colors: Palette, size = 18) {
  switch (type) {
    case 'payment': return <Wallet size={size} color={colors.successDark} />;
    case 'welfare': return <HeartHandshake size={size} color={colors.secondaryDark} />;
    case 'emergency': return <Zap size={size} color={colors.danger} />;
    case 'forecast': return <TrendingUp size={size} color={colors.violetDark} />;
    case 'admin': return <ShieldCheck size={size} color={colors.infoDark} />;
    default: return <CalendarCheck size={size} color={colors.primaryDark} />;
  }
}

function typeTint(type: string, colors: Palette): string {
  switch (type) {
    case 'payment': return colors.successLight;
    case 'welfare': return colors.secondaryLight;
    case 'emergency': return colors.dangerLight;
    case 'forecast': return colors.violetLight;
    case 'admin': return colors.infoLight;
    default: return colors.primaryLight;
  }
}

function getActionLabel(item: Notification, t: (k: string, opts?: any) => string): string {
  const id = item.id;
  const msg = item.message || '';
  const type = item.type || '';
  const url = item.action_url || '';

  if (id.startsWith('notif-compl-') || msg.includes('Completion Pass') || item.title?.includes('Sign-Off') || url.includes('showCompletionQr')) {
    return t('notifications.action_show_qr', 'Show QR Pass');
  }
  if (id === 'notif-c-01' || msg.includes('BK-2026-JPR-001')) {
    return t('notifications.action_view_booking', 'View Booking');
  }
  if (id === 'notif-c-02' || msg.includes('BK-2026-JPR-004') || type === 'payment') {
    return t('notifications.action_view_invoice', 'View Receipt');
  }
  if (id === 'notif-c-03' || type === 'welfare') {
    return t('notifications.action_view_welfare', 'View Welfare');
  }
  if (id === 'notif-c-04' || msg.includes('BK-2026-JPR-005') || msg.includes('rate')) {
    return t('notifications.action_rate_service', 'Rate Pro');
  }
  if (type === 'emergency' || type === 'booking' || id.startsWith('notif-w-')) {
    return t('notifications.action_view_job', 'View Job');
  }
  if (type === 'forecast') {
    return t('notifications.action_view_forecast', 'View Forecast');
  }
  if (id === 'notif-a-01' || msg.includes('Verification')) {
    return t('notifications.action_verify_queue', 'Review KYC');
  }
  return t('notifications.action_open', 'Open');
}

export const NotificationBar: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const { role, notifications, unreadCount, markRead, markAllRead } = useRole();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Spring "pop" animation when the panel opens
  useEffect(() => {
    if (open) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [open, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  // Compute adaptive sizing so the panel never exceeds screen bounds
  const panelMaxHeight = Math.min(screenHeight * 0.78, 560);
  const panelMaxWidth = Math.min(screenWidth - 24, 400);

  const safeNavigate = (screenName: string, params?: any) => {
    try {
      navigation.navigate(screenName, params);
      return;
    } catch {
      try {
        navigation.navigate('CustomerTabs', { screen: screenName, params });
        return;
      } catch {
        try {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate(screenName, params);
            return;
          }
        } catch (parentErr) {
          console.warn('Navigation error:', parentErr);
        }
      }
    }
  };

  const navigateForNotification = (item: Notification) => {
    if (!navigation) return;
    const id = item.id;
    const msg = item.message || '';
    const type = item.type || '';
    const url = item.action_url || '';

    // 1. CUSTOMER ROLE DESTINATIONS
    if (role === 'customer' || !role) {
      if (id.startsWith('notif-compl-') || url.includes('showCompletionQr') || msg.includes('Completion Pass') || item.title?.includes('Sign-Off')) {
        const match = url.match(/bookings\/([a-zA-Z0-9_-]+)/);
        const targetBookingId = match ? match[1] : (msg.includes('BK-2026-JPR-001') ? 'bk-demo-1' : 'bk-demo-1');
        safeNavigate('BookingDetail', { bookingId: targetBookingId, showCompletionQr: true });
        return;
      }
      if (id === 'notif-c-01' || msg.includes('BK-2026-JPR-001')) {
        safeNavigate('BookingDetail', { bookingId: 'bk-demo-1' });
        return;
      }
      if (id === 'notif-c-02' || msg.includes('BK-2026-JPR-004')) {
        safeNavigate('Invoice', { bookingId: 'bk-demo-4' });
        return;
      }
      if (id === 'notif-c-03' || type === 'welfare') {
        safeNavigate('Invoice', { bookingId: 'bk-demo-4' });
        return;
      }
      if (id === 'notif-c-04' || msg.includes('BK-2026-JPR-005') || msg.includes('rate')) {
        safeNavigate('BookingDetail', { bookingId: 'bk-demo-5' });
        return;
      }
      if (url.includes('bookings') || type === 'booking') {
        safeNavigate('Bookings');
        return;
      }
      safeNavigate('Home');
      return;
    }

    // 2. WORKER ROLE DESTINATIONS
    if (role === 'worker') {
      if (id === 'notif-w-01' || id === 'notif-w-02' || type === 'emergency' || type === 'booking' || url.includes('jobs')) {
        safeNavigate('WorkerJobs');
        return;
      }
      if (id === 'notif-w-03' || id === 'notif-w-04' || type === 'welfare' || type === 'payment' || url.includes('welfare')) {
        safeNavigate('WorkerWelfare');
        return;
      }
      safeNavigate('WorkerHome');
      return;
    }

    // 3. ADMIN ROLE DESTINATIONS
    if (role === 'admin') {
      if (id === 'notif-a-01' || url.includes('verification') || msg.includes('Verification')) {
        safeNavigate('AdminVerification');
        return;
      }
      if (id === 'notif-a-02' || type === 'forecast' || url.includes('forecast')) {
        safeNavigate('Forecast');
        return;
      }
      if (id === 'notif-a-04' || url.includes('allocation')) {
        safeNavigate('Allocation');
        return;
      }
      safeNavigate('AdminDashboard');
      return;
    }
  };

  const handleNotificationPress = (item: Notification) => {
    markRead(item.id);
    setOpen(false);
    setTimeout(() => {
      navigateForNotification(item);
    }, 140);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bellBtn, open && styles.bellBtnOpen]}
        onPress={() => setOpen(o => !o)}
        accessibilityLabel={t('notifications.title')}
      >
        <Bell size={16} color={open ? colors.textInverse : colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel={t('common.close')}
        >
          <Pressable
            style={styles.modalStage}
            onPress={e => e.stopPropagation()}
          >
            <Animated.View
              style={[
                styles.panel,
                {
                  maxHeight: panelMaxHeight,
                  maxWidth: panelMaxWidth,
                  opacity: anim,
                  transform: [{ translateY }, { scale }],
                },
              ]}
            >
              {/* Top Header Bar */}
              <View style={styles.panelHeader}>
                <View style={styles.headerTitleWrap}>
                  <View style={styles.titleRow}>
                    <Text style={styles.panelTitle}>{t('notifications.title')}</Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadCountChip}>
                        <Text style={styles.unreadCountText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.panelSub} numberOfLines={1} ellipsizeMode="tail">
                    {role ? t(`roles.${role}`) : ''} • {t('notifications.subtitle')}
                  </Text>
                </View>

                <View style={styles.panelHeaderActions}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllBtn}
                      onPress={() => markAllRead()}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <CheckCheck size={13} color={colors.primaryDark} />
                      <Text style={styles.markAllText}>{t('notifications.mark_all_read')}</Text>
                    </TouchableOpacity>
                  )}
                  {/* Dedicated Close Button — ALWAYS visible and clickable */}
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setOpen(false)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close', 'Close')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <X size={17} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Notification List */}
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyTitle}>{t('notifications.empty_title')}</Text>
                    <Text style={styles.emptyMsg}>{t('notifications.empty_msg')}</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleNotificationPress(item)}
                    style={({ pressed }) => [
                      styles.item,
                      !item.read && styles.itemUnread,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: typeTint(item.type, colors) }]}>
                      {typeIcon(item.type, colors)}
                    </View>
                    <View style={styles.itemBody}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.itemMsg} numberOfLines={3}>
                        {item.message}
                      </Text>
                      <View style={styles.itemFooterRow}>
                        <Text style={styles.itemTime}>{timeAgo(item.created_at, t)}</Text>
                        <View style={styles.actionChip}>
                          <Text style={styles.actionChipText}>
                            {getActionLabel(item, t)}
                          </Text>
                          <ChevronRight size={12} color={colors.primaryDark} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}
              />

              {/* Pinned Bottom Footer Bar */}
              <View style={styles.panelFooter}>
                <Text style={styles.footerNote}>
                  {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
                  {unreadCount > 0 ? ` • ${unreadCount} unread` : ' • all read'}
                </Text>
                <TouchableOpacity
                  style={styles.footerCloseBtn}
                  onPress={() => setOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close', 'Close')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerCloseText}>{t('common.close', 'Close')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(227, 232, 229, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bellBtnOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textInverse,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 20, 0.52)',
  },
  modalStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 64 : 54,
    paddingHorizontal: 12,
  },
  panel: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#94a3b8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 28,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1.2,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    backgroundColor: colors.surface,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unreadCountChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  unreadCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  panelSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  panelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'transparent' : '#c7d2fe',
  },
  markAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexShrink: 1,
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 12,
    borderRadius: 14,
    marginBottom: 9,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
  },
  itemUnread: {
    backgroundColor: isDark ? '#1e293b' : '#eff6ff',
    borderColor: isDark ? '#3b82f6' : '#bfdbfe',
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  itemTitleUnread: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 3,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.8,
    borderTopColor: colors.border,
  },
  itemTime: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1.2,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#f8fafc',
  },
  footerNote: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footerCloseBtn: {
    paddingHorizontal: 13,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#cbd5e1',
  },
  footerCloseText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  emptyMsg: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default NotificationBar;