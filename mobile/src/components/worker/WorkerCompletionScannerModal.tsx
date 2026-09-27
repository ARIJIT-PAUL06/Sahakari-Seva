// src/components/worker/WorkerCompletionScannerModal.tsx
// ==============================================================================
// WORKER COMPLETION SCANNER MODAL (CO-OP DUAL-KEY VERIFICATION)
// Live camera barcode scanner to read customer's completion QR pass
// with instant fallback to 4-digit manual PIN entry.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { QrCode, X, CheckCircle2, ShieldCheck, Camera, KeyRound } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ApiClient } from '../../services/apiClient';
import type { Booking } from '../../types';
import { QRScannerView } from '../common/QRScannerView';
import { UPIPaymentService } from '../../services/upiPaymentService';

interface WorkerCompletionScannerModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: (completedBooking: Booking) => void;
}

export const WorkerCompletionScannerModal: React.FC<WorkerCompletionScannerModalProps> = ({
  visible,
  booking,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    if (visible) {
      setPinInput('');
      setSuccessAnim(false);
      setVerifying(false);
    }
  }, [visible]);

  if (!visible || !booking) return null;

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      Alert.alert('Verification Code Required', 'Please enter or scan the 4-digit code shown on the customer screen.');
      return;
    }

    try {
      setVerifying(true);
      const res = await ApiClient.verifyAndCompleteJob(booking.id, codeToVerify.trim());
      setSuccessAnim(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

      setTimeout(() => {
        setVerifying(false);
        onSuccess(res);
        onClose();
      }, 750);
    } catch (err: any) {
      setVerifying(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      Alert.alert(
        'Verification Failed',
        err.message || 'Incorrect verification code. Please ask customer to display their QR or 4-digit PIN.'
      );
    }
  };

  const handleCameraScanned = (scannedRaw: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);

    const parsed = UPIPaymentService.parseCompletionPayload(scannedRaw);

    // If payload contains a bookingId, verify it matches
    if (parsed.bookingId && parsed.bookingId !== booking.id) {
      Alert.alert(
        'Mismatched Service Pass',
        `This QR belongs to booking ${parsed.bookingCode || parsed.bookingId}, not the current job (${booking.booking_code}).`
      );
      return;
    }

    if (parsed.code) {
      handleVerifyCode(parsed.code);
    } else {
      Alert.alert('Unrecognized QR Format', 'Please ask customer to display their Service Completion Pass.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <QrCode size={18} color={colors.primary} />
              <Text style={styles.title}>Scan Customer QR Pass</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Point your camera at customer's completion QR for {booking.booking_code}.
          </Text>

          {/* Live Camera Scanner Viewport */}
          <View style={styles.scannerWrapper}>
            {successAnim ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={52} color="#059669" />
                <Text style={styles.successText}>Service Verified! ✓</Text>
                <Text style={styles.successSub}>Job marked complete. Unlocking payment.</Text>
              </View>
            ) : (
              <QRScannerView
                onScanned={handleCameraScanned}
                active={visible && !verifying && !successAnim}
                width={230}
                height={175}
              />
            )}
          </View>

          {verifying && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.verifyingText}>Verifying dual-key signature with cooperative ledger...</Text>
            </View>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER 4-DIGIT PIN</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual PIN Input Box */}
          <View style={styles.pinInputRow}>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={text => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setPinInput(cleaned);
                if (cleaned.length === 4) {
                  handleVerifyCode(cleaned);
                }
              }}
              placeholder="4-digit PIN"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              editable={!verifying}
            />

            <TouchableOpacity
              style={[
                styles.verifyPinBtn,
                pinInput.length < 4 && styles.verifyPinBtnDisabled,
              ]}
              onPress={() => handleVerifyCode(pinInput)}
              disabled={pinInput.length < 4 || verifying}
              activeOpacity={0.8}
            >
              <KeyRound size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.verifyPinBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.coopNotice}>
            Autonomous cryptographic verification under Cooperative bylaws §16
          </Text>
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
      padding: 16,
    },
    dialog: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      width: '100%',
      maxWidth: 350,
      padding: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
      overflow: 'hidden',
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
    scannerWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    successBox: {
      width: 230,
      height: 175,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#059669',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      gap: 6,
    },
    successText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#059669',
    },
    successSub: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    verifyingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    verifyingText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    dividerText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    pinInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginTop: 8,
      marginBottom: 10,
    },
    pinInput: {
      flex: 1,
      minWidth: 0,
      flexBasis: 0,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      height: 42,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 3,
    },
    verifyPinBtn: {
      flexDirection: 'row',
      flexShrink: 0,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      height: 42,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
    },
    verifyPinBtnDisabled: {
      opacity: 0.45,
    },
    verifyPinBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    coopNotice: {
      fontSize: 9.5,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
      paddingHorizontal: 4,
    },
  });
