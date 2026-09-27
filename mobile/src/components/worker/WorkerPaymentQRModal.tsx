// src/components/worker/WorkerPaymentQRModal.tsx
// ==============================================================================
// WORKER PAYMENT UPI QR MODAL — GENUINE IN-PERSON NPCI UPI COLLECTION
// Displays valid ISO-compliant UPI QR code for the customer to scan on the spot
// using Google Pay, PhonePe, Paytm, BHIM, Cred, or any Indian banking app.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  X,
  Check,
  QrCode,
  Smartphone,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Booking } from '../../types';
import { RealQRCode } from '../common/RealQRCode';
import { UPIPaymentService, COOP_DEFAULT_VPA } from '../../services/upiPaymentService';
import { DatabaseService } from '../../services/databaseService';

interface WorkerPaymentQRModalProps {
  visible: boolean;
  booking: Booking | null;
  amount: number;
  workerName: string;
  onClose: () => void;
  onConfirmCash?: () => void;
  onPaymentReceived?: () => void;
}

export const WorkerPaymentQRModal: React.FC<WorkerPaymentQRModalProps> = ({
  visible,
  booking,
  amount,
  workerName,
  onClose,
  onConfirmCash,
  onPaymentReceived,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [copied, setCopied] = useState(false);
  const [paymentDetected, setPaymentDetected] = useState(false);
  const [polling, setPolling] = useState(false);

  const bookingCode = booking?.booking_code || 'BK-2026';
  const finalAmt = Number(amount) > 0 ? Number(amount) : Number(booking?.final_amount || booking?.estimated_amount || 0);

  // Standard NPCI UPI URI
  const upiUri = useMemo(() => {
    return UPIPaymentService.buildUPIUri({
      pa: COOP_DEFAULT_VPA,
      pn: `Sahakari Seva - ${workerName || 'Professional'}`,
      am: finalAmt,
      cu: 'INR',
      tn: `Service fee for ${bookingCode}`,
      tr: `TXN-${booking?.id?.slice(0, 8) || Date.now().toString().slice(-8)}`,
    });
  }, [workerName, finalAmt, bookingCode, booking?.id]);

  // Real-time listener: detects when payment is recorded in Supabase / Local DB
  useEffect(() => {
    if (!visible || !booking) return;

    setPaymentDetected(false);

    const checkStatus = async () => {
      try {
        const fresh = await DatabaseService.bookings.getById(booking.id);
        if (fresh && fresh.payment_status === 'paid') {
          setPaymentDetected(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          if (onPaymentReceived) onPaymentReceived();
        }
      } catch {
        // ignore
      }
    };

    // Initial check
    checkStatus();

    // Event listener
    const sub = DeviceEventEmitter.addListener('app_booking_updated', checkStatus);

    // 3-second polling fallback for active QR modal
    const timer = setInterval(checkStatus, 3000);

    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [visible, booking?.id, onPaymentReceived]);

  if (!visible || !booking) return null;

  const qrSize = 190;

  const handleCopyVpa = () => {
    setCopied(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUPIApp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const opened = await Linking.openURL(upiUri);
    } catch {
      // In web or simulator without UPI apps
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
              <Text style={styles.title}>Customer UPI Payment QR</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {paymentDetected ? (
            <View style={styles.successState}>
              <CheckCircle2 size={54} color="#059669" />
              <Text style={styles.successTitle}>Payment Received! ✓</Text>
              <Text style={styles.successSub}>
                ₹{finalAmt.toFixed(2)} credited towards {bookingCode}. 85% net wage has been routed to your cooperative passbook.
              </Text>
              <TouchableOpacity style={styles.successDoneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.successDoneBtnText}>Close & Finish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Ask customer to scan with any UPI app (GPay, PhonePe, Paytm, BHIM, Cred)
              </Text>

              {/* Real ISO-Compliant QR Code */}
              <View style={styles.qrContainer}>
                <RealQRCode
                  value={upiUri}
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

              {/* Amount and UPI Tag */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>AMOUNT DUE FOR {bookingCode}</Text>
                <Text style={styles.amountValue}>₹{finalAmt.toFixed(2)}</Text>

                <TouchableOpacity style={styles.vpaRow} onPress={handleCopyVpa} activeOpacity={0.7}>
                  <Text style={styles.upiSubText}>Co-op VPA: {COOP_DEFAULT_VPA}</Text>
                  {copied ? (
                    <Check size={12} color="#059669" />
                  ) : (
                    <Copy size={12} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Optional: Open in UPI App if customer is viewing on device */}
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.upiIntentBtn} onPress={handleOpenUPIApp} activeOpacity={0.8}>
                  <Smartphone size={14} color="#2563eb" />
                  <Text style={styles.upiIntentBtnText}>Launch UPI App on This Device</Text>
                  <ExternalLink size={12} color="#2563eb" />
                </TouchableOpacity>
              )}

              {/* Bottom Action Buttons */}
              <View style={styles.buttonRow}>
                {onConfirmCash && (
                  <TouchableOpacity
                    style={styles.cashConfirmBtn}
                    onPress={() => {
                      onClose();
                      onConfirmCash();
                    }}
                    activeOpacity={0.85}
                  >
                    <Check size={15} color="#ffffff" />
                    <Text style={styles.cashConfirmBtnText}>Customer Paid in Cash</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={styles.closeActionBtnText}>Close QR Code</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
      maxWidth: 345,
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
      fontWeight: '800',
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
      paddingHorizontal: 8,
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
    amountBox: {
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 12,
    },
    amountLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    amountValue: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    vpaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    },
    upiSubText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    upiIntentBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      width: '100%',
      marginBottom: 10,
    },
    upiIntentBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#2563eb',
    },
    buttonRow: {
      width: '100%',
      gap: 8,
    },
    cashConfirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#059669',
      paddingVertical: 11,
      borderRadius: 10,
    },
    cashConfirmBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    closeActionBtn: {
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    },
    closeActionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    successState: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 12,
    },
    successTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#059669',
    },
    successSub: {
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    successDoneBtn: {
      backgroundColor: '#059669',
      paddingVertical: 11,
      paddingHorizontal: 32,
      borderRadius: 10,
      marginTop: 8,
    },
    successDoneBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
  });
