import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { ShieldCheck, Banknote, AlertCircle, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

export interface ConfirmCashModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  role: 'customer' | 'worker';
  otherPartyName: string;
  bookingCode?: string;
}

export const ConfirmCashModal: React.FC<ConfirmCashModalProps> = ({
  visible,
  onClose,
  onConfirm,
  amount,
  role,
  otherPartyName,
  bookingCode,
}) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record cash settlement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = role === 'customer';
  const workerWage = (amount * 0.85).toFixed(2);
  const welfareCorpus = (amount * 0.10).toFixed(2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E2E8F0',
                },
              ]}
            >
              {/* Top Close Button */}
              {!loading && (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Close confirmation modal"
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Icon & Shield Badge */}
              <View style={styles.iconWrap}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                  <Banknote size={32} color="#10B981" />
                </View>
              </View>

              {/* Title & Badge */}
              <View style={styles.badgeRow}>
                <ShieldCheck size={13} color="#10B981" />
                <Text style={styles.badgeText}>COOPERATIVE CASH SETTLEMENT</Text>
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {isCustomer ? 'Confirm Cash Payment' : 'Confirm Cash Receipt'}
              </Text>

              {bookingCode ? (
                <Text style={styles.bookingCodeText}>Work Order: {bookingCode}</Text>
              ) : null}

              {/* Amount Display Box */}
              <View
                style={[
                  styles.amountBox,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                  },
                ]}
              >
                <Text style={styles.amountLabel}>
                  {isCustomer ? 'Total Handover Amount' : 'Total Cash Received'}
                </Text>
                <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
                <Text style={styles.splitNote}>
                  {isCustomer
                    ? `₹${workerWage} goes directly to ${otherPartyName || 'the professional'} (85% net wage)`
                    : `₹${workerWage} direct earnings + ₹${welfareCorpus} welfare credited`}
                </Text>
              </View>

              {/* Explainer Note */}
              <Text style={[styles.explainer, { color: colors.textSecondary }]}>
                {isCustomer
                  ? `Did you hand ₹${amount.toFixed(0)} in physical cash directly to ${
                      otherPartyName || 'the professional'
                    }? This will mark the booking settled immediately.`
                  : `Did ${
                      otherPartyName || 'the customer'
                    } hand you ₹${amount.toFixed(0)} in physical cash? This will record 100% full wage settlement in your passbook.`}
              </Text>

              {/* Error Message if any */}
              {error ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: isDark ? '#374151' : '#E2E8F0',
                      backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                    },
                  ]}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {isCustomer ? '✓ Yes, Handed Cash' : '✓ Yes, Received Cash'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookingCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  amountBox: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 12,
  },
  amountLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: -0.5,
  },
  splitNote: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
  },
  explainer: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: '#087F5B',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#087F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
