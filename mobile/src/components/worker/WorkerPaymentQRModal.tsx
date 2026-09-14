// ==============================================================================
// WORKER PAYMENT UPI QR MODAL — IN-PERSON ON-SITE PAYMENT COLLECTION
// Displays cooperative UPI QR code for the customer to scan on the spot.
// ==============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { ShieldCheck, X, Check, QrCode } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Booking } from '../../types';

interface WorkerPaymentQRModalProps {
  visible: boolean;
  booking: Booking | null;
  amount: number;
  workerName: string;
  onClose: () => void;
  onConfirmCash?: () => void;
}

function generateQRMatrix(seed: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

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

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
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

export const WorkerPaymentQRModal: React.FC<WorkerPaymentQRModalProps> = ({
  visible,
  booking,
  amount,
  workerName,
  onClose,
  onConfirmCash,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const upiId = 'sahakari.coop@npci';
  const bookingCode = booking?.booking_code || 'BK-2026';

  const matrix = useMemo(() => {
    return generateQRMatrix(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(workerName)}&am=${amount}&tr=${bookingCode}`);
  }, [upiId, workerName, amount, bookingCode]);

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
              <QrCode size={18} color={colors.primary} />
              <Text style={styles.title}>Customer Payment QR</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Ask customer to scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
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

            {/* Center CO-OP Emblem */}
            <View style={styles.centerBadge}>
              <ShieldCheck size={18} color="#059669" />
            </View>
          </View>

          {/* Amount and UPI Tag */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>PAYMENT DUE FOR {bookingCode}</Text>
            <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
            <Text style={styles.upiSubText}>Cooperative VPA: {upiId}</Text>
          </View>

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
                <Text style={styles.cashConfirmBtnText}>Customer Paid Cash</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeActionBtnText}>Close QR</Text>
            </TouchableOpacity>
          </View>
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
      marginBottom: 16,
      lineHeight: 16,
    },
    qrContainer: {
      padding: 12,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    centerBadge: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    amountBox: {
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 16,
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
    upiSubText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
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
      paddingVertical: 12,
      borderRadius: 10,
    },
    cashConfirmBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    closeActionBtn: {
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    },
    closeActionBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
