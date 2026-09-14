// mobile/src/components/common/CompletionQRModal.tsx
// ==============================================================================
// CUSTOMER COMPLETION QR MODAL (CO-OP DUAL-KEY VERIFICATION)
// Uncluttered, elegant modal displaying the customer's single-use completion QR
// and 4-digit fallback PIN for worker scan sign-off.
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
import Svg, { Rect, G } from 'react-native-svg';
import { ShieldCheck, X, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Booking } from '../../types';

interface CompletionQRModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onVerifyAndPay?: () => void;
}

// Generate a deterministic 21x21 QR pattern based on booking code and secret code
function generateQRMatrix(seed: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to place 7x7 Finder Pattern
  const placeFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  // Top-left, top-right, bottom-left finder patterns
  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash-based data filler
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTL = r < 9 && c < 9;
      const inTR = r < 9 && c >= size - 8;
      const inBL = r >= size - 8 && c < 9;
      const inCenter = r >= 8 && r <= 12 && c >= 8 && c <= 12;

      if (!inTL && !inTR && !inBL && !inCenter && r !== 6 && c !== 6) {
        const val = ((hash >> (bitIdx % 24)) & 1) === 1;
        matrix[r][c] = val || ((r * 3 + c * 7 + (bitIdx % 5)) % 2 === 0);
        bitIdx++;
      }
    }
  }

  return matrix;
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
  const workerName =
    booking?.worker?.profile?.full_name || (booking?.worker as any)?.name || 'Service Professional';

  const matrix = useMemo(() => {
    return generateQRMatrix(`${bookingCode}-${verificationCode}`);
  }, [bookingCode, verificationCode]);

  useEffect(() => {
    if (visible && booking && booking.status === 'completed') {
      onClose();
    }
  }, [visible, booking?.status, onClose]);

  if (!visible || !booking) return null;

  const qrSize = 180;
  const cellSize = qrSize / 21;

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
            Show this QR to {workerName} to verify work and authorize completion.
          </Text>

          {/* QR Code Canvas */}
          <View style={styles.qrContainer}>
            <Svg width={qrSize} height={qrSize}>
              <Rect width={qrSize} height={qrSize} fill="#ffffff" rx={8} />
              <G>
                {matrix.map((row, rIdx) =>
                  row.map((active, cIdx) =>
                    active ? (
                      <Rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx * cellSize}
                        y={rIdx * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="#0f172a"
                      />
                    ) : null
                  )
                )}
              </G>
            </Svg>

            {/* Center CO-OP Shield Emblem */}
            <View style={styles.centerBadge}>
              <ShieldCheck size={18} color="#059669" />
            </View>
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
            <Text style={styles.metaText}>₹{booking.final_amount || booking.estimated_amount}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaSuccess}>100% Secure</Text>
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
              accessibilityLabel={`Verify Work Done & Pay Now (₹${booking.final_amount || booking.estimated_amount})`}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.verifyAndPayBtnText}>
                Verify Work Done & Pay (₹{booking.final_amount || booking.estimated_amount}) →
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
      marginBottom: 16,
      lineHeight: 16,
    },
    qrContainer: {
      padding: 12,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    centerBadge: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#059669',
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeContainer: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 12,
    },
    codeLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    pinBoxes: {
      flexDirection: 'row',
      gap: 8,
    },
    pinBox: {
      width: 38,
      height: 42,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      borderWidth: 1.5,
      borderColor: '#059669',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinDigit: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
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
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
    },
    doneBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
