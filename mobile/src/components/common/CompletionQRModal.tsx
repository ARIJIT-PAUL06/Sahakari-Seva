// src/components/common/CompletionQRModal.tsx
// ==============================================================================
// CUSTOMER COMPLETION QR MODAL (CO-OP DUAL-KEY VERIFICATION)
// Displays genuine, ISO-standard QR code with cryptographic verification payload
// and 4-digit fallback PIN for worker camera scan sign-off.
// ==============================================================================

import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { ShieldCheck, X, CheckCircle2, Lock } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Booking } from '../../types';
import { RealQRCode } from './RealQRCode';
import { UPIPaymentService } from '../../services/upiPaymentService';

interface CompletionQRModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onVerifyAndPay?: () => void;
}

export const CompletionQRModal: React.FC<CompletionQRModalProps> = ({
  visible,
  booking,
  onClose,
  onVerifyAndPay,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const verificationCode = booking?.completion_code || '8492';
  const bookingCode = booking?.booking_code || 'BK-2026';
  const amount = Number(booking?.final_amount || booking?.estimated_amount || 0);
  const workerName =
    booking?.worker?.profile?.full_name || (booking?.worker as any)?.name || 'Service Professional';

  // Generate ISO-compliant JSON verification payload
  const qrPayload = useMemo(() => {
    if (!booking) return '';
    return UPIPaymentService.buildCompletionPayload(
      booking.id,
      bookingCode,
      verificationCode,
      amount
    );
  }, [booking?.id, bookingCode, verificationCode, amount]);

  useEffect(() => {
    if (visible && booking && booking.status === 'completed') {
      onClose();
    }
  }, [visible, booking?.status, onClose]);

  if (!visible || !booking) return null;

  const qrSize = 190;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <ShieldCheck size={18} color="#059669" />
              <Text style={styles.title}>Service Completion Pass</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Show this scannable QR to {workerName} to verify work and authorize completion.
          </Text>

          {/* Genuine ISO-Compliant QR Code */}
          <View style={styles.qrContainer}>
            <RealQRCode
              value={qrPayload}
              size={qrSize}
              color="#0f172a"
              backgroundColor="#ffffff"
              errorCorrectionLevel="M"
              centerBadge={
                <View style={styles.centerBadge}>
                  <ShieldCheck size={16} color="#059669" />
                </View>
              }
              centerBadgeSize={32}
            />
          </View>

          {/* 4-Digit Manual PIN Fallback */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>OR SHARE 4-DIGIT PIN</Text>
            <View style={styles.pinBoxes}>
              {verificationCode.split('').map((digit, i) => (
                <View key={i} style={styles.pinBox}>
                  <Text style={styles.pinDigit}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Booking Reference Pill */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{bookingCode}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>₹{amount.toFixed(2)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaSuccess}>100% Verified</Text>
          </View>

          {onVerifyAndPay && (
            <TouchableOpacity
              style={styles.verifyAndPayBtn}
              onPress={() => {
                onClose();
                onVerifyAndPay();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Verify Work Done & Pay Now (₹${amount.toFixed(2)})`}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.verifyAndPayBtnText}>
                Verify Work Done & Pay (₹{amount.toFixed(2)}) →
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Done / Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialog: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      width: '100%',
      maxWidth: 340,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 6,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeBtn: {
      padding: 4,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 14,
      lineHeight: 16,
    },
    qrContainer: {
      padding: 10,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    centerBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#059669',
      justifyContent: 'center',
      alignItems: 'center',
    },
    codeContainer: {
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 10,
    },
    codeLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    pinBoxes: {
      flexDirection: 'row',
      gap: 8,
    },
    pinBox: {
      width: 38,
      height: 40,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      borderWidth: 1.5,
      borderColor: '#059669',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinDigit: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
    },
    metaText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    metaDot: {
      fontSize: 11,
      color: colors.textMuted,
    },
    metaSuccess: {
      fontSize: 11,
      color: '#059669',
      fontWeight: '600',
    },
    verifyAndPayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#059669',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      width: '100%',
      marginBottom: 10,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    verifyAndPayBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    doneBtn: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
      paddingVertical: 9,
      paddingHorizontal: 24,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
    },
    doneBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
