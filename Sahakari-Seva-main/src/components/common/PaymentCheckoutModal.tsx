// ==============================================================================
// SAHAKARI SEVA — COOPERATIVE PAYMENT CHECKOUT MODAL
// Itemized bill breakdown (Base + Supplemental approved tasks),
// 85/10/5 Fair Share distribution promise, payment method selection
// (UPI, RuPay/Cards, Net Banking, Cash on Service), and secure processing.
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Wrench,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import type { Booking, ExtraTaskItem, Invoice, Payment } from '../../types';
import { ApiClient } from '../../services/apiClient';

interface PaymentCheckoutModalProps {
  visible: boolean;
  booking: Booking | null;
  totalAmount: number;
  baseAmount: number;
  supplementalItems?: ExtraTaskItem[];
  onClose: () => void;
  onPaymentSuccess: (res: { payment: Payment; invoice: Invoice }) => void;
}

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'cash';

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  visible,
  booking,
  totalAmount,
  baseAmount,
  supplementalItems = [],
  onClose,
  onPaymentSuccess,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('priya.singh@okaxis');
  const [showItemsBreakdown, setShowItemsBreakdown] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!visible || !booking) return null;

  const workerAmt = (totalAmount * 0.85).toFixed(2);
  const welfareAmt = (totalAmount * 0.10).toFixed(2);
  const platformAmt = (totalAmount * 0.05).toFixed(2);
  const supplementalTotal = Math.max(0, totalAmount - baseAmount);

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    try {
      let methodLabel = 'UPI Instant';
      if (selectedMethod === 'upi') {
        methodLabel = `UPI (${upiApp.toUpperCase()})`;
      } else if (selectedMethod === 'card') {
        methodLabel = 'RuPay Cooperative Debit Card';
      } else if (selectedMethod === 'netbanking') {
        methodLabel = 'Net Banking (Co-op Bank)';
      } else if (selectedMethod === 'cash') {
        methodLabel = 'Cash on Service';
      }

      const res = await ApiClient.processPayment({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        worker_id: booking.worker_id,
        amount: totalAmount,
        payment_method: methodLabel,
        transaction_reference: `TXN-${Date.now().toString().slice(-8)}`,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      onPaymentSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Top Grab Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.coopBadge}>
                  <ShieldCheck size={13} color="#10B981" />
                  <Text style={styles.coopBadgeText}>SAHAKARI COOPERATIVE CHECKOUT</Text>
                </View>
                <View style={styles.bookingCodeChip}>
                  <Text style={styles.bookingCodeText}>{booking.booking_code}</Text>
                </View>
              </View>
              <Text style={styles.sheetTitle}>Payment & Cooperative Settlement</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close payment checkout"
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bill Summary Card */}
            <View style={styles.billCard}>
              <View style={styles.billCardHeader}>
                <Text style={styles.billCardTitle}>Bill & Service Summary</Text>
                <TouchableOpacity
                  style={styles.breakdownToggle}
                  onPress={() => setShowItemsBreakdown(!showItemsBreakdown)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.breakdownToggleText}>
                    {showItemsBreakdown ? 'Hide details' : 'View details'}
                  </Text>
                  {showItemsBreakdown ? (
                    <ChevronUp size={14} color={colors.primary} />
                  ) : (
                    <ChevronDown size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Base Service Inspection & Labor</Text>
                <Text style={styles.billVal}>₹{baseAmount.toFixed(2)}</Text>
              </View>

              {supplementalTotal > 0 && (
                <View style={styles.billRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Wrench size={13} color="#10B981" />
                    <Text style={[styles.billLabel, { color: colors.textPrimary, fontWeight: '700' }]}>
                      Supplemental Approved Work ({supplementalItems.length} items)
                    </Text>
                  </View>
                  <Text style={[styles.billVal, { color: '#10B981', fontWeight: '800' }]}>
                    +₹{supplementalTotal.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Expandable itemized extra items list */}
              {showItemsBreakdown && supplementalItems.length > 0 && (
                <View style={styles.supplementalItemList}>
                  {supplementalItems.map((item, idx) => (
                    <View key={item.id || idx} style={styles.suppItemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.suppItemTitle}>{item.title}</Text>
                        {item.description ? (
                          <Text style={styles.suppItemDesc}>{item.description}</Text>
                        ) : null}
                        <View style={styles.suppTag}>
                          <Text style={styles.suppTagText}>
                            {item.type === 'part'
                              ? 'Authorized Spare Part'
                              : item.type === 'labor'
                              ? 'Extra Labor'
                              : 'Repair Work'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.suppItemPrice}>₹{Number(item.cost).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <View>
                  <Text style={styles.billTotalLabel}>Total Authorized Bill</Text>
                  <Text style={styles.billTotalSub}>All taxes & cooperative insurance included</Text>
                </View>
                <Text style={styles.billTotalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Cooperative Fair Split Transparency Card */}
            <View style={styles.fairSplitCard}>
              <View style={styles.fairSplitHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#10B981" />
                  <Text style={styles.fairSplitTitle}>100% Cooperative Fair Split</Text>
                </View>
                <View style={styles.zeroExploitPill}>
                  <Text style={styles.zeroExploitPillText}>0% Middleman Cut</Text>
                </View>
              </View>

              <View style={styles.splitLine}>
                <View style={styles.splitBarWorker} />
                <View style={styles.splitBarWelfare} />
                <View style={styles.splitBarPlatform} />
              </View>

              <View style={styles.splitStatRow}>
                <View style={styles.splitStat}>
                  <Text style={styles.splitStatPercent}>85%</Text>
                  <Text style={styles.splitStatAmount}>₹{workerAmt}</Text>
                  <Text style={styles.splitStatLabel}>Worker Take-Home</Text>
                </View>
                <View style={styles.splitStatDivider} />
                <View style={styles.splitStat}>
                  <Text style={[styles.splitStatPercent, { color: '#3B82F6' }]}>10%</Text>
                  <Text style={styles.splitStatAmount}>₹{welfareAmt}</Text>
                  <Text style={styles.splitStatLabel}>Social Welfare Fund</Text>
                </View>
                <View style={styles.splitStatDivider} />
                <View style={styles.splitStat}>
                  <Text style={[styles.splitStatPercent, { color: '#F59E0B' }]}>5%</Text>
                  <Text style={styles.splitStatAmount}>₹{platformAmt}</Text>
                  <Text style={styles.splitStatLabel}>Platform Ops</Text>
                </View>
              </View>

              <View style={styles.trustFooter}>
                <ShieldCheck size={13} color="#10B981" />
                <Text style={styles.trustFooterText}>
                  Worker is paid directly upon completion. Zero commission extraction.
                </Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionHeading}>Select Payment Method</Text>

            {/* UPI Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'upi' && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod('upi')}
              activeOpacity={0.8}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.methodIconBox, selectedMethod === 'upi' && styles.methodIconBoxSelected]}>
                  <Smartphone size={18} color={selectedMethod === 'upi' ? '#10B981' : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.methodTitle}>UPI (Instant • Zero Fee)</Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
                </View>
                <View style={[styles.radioCircle, selectedMethod === 'upi' && styles.radioCircleActive]}>
                  {selectedMethod === 'upi' && <View style={styles.radioInnerDot} />}
                </View>
              </View>

              {selectedMethod === 'upi' && (
                <View style={styles.methodDetailSection}>
                  <View style={styles.upiAppRow}>
                    {(['gpay', 'phonepe', 'paytm', 'bhim'] as const).map((app) => (
                      <TouchableOpacity
                        key={app}
                        style={[styles.upiAppBtn, upiApp === app && styles.upiAppBtnActive]}
                        onPress={() => setUpiApp(app)}
                      >
                        <Text style={[styles.upiAppBtnText, upiApp === app && styles.upiAppBtnTextActive]}>
                          {app === 'gpay'
                            ? 'Google Pay'
                            : app === 'phonepe'
                            ? 'PhonePe'
                            : app === 'paytm'
                            ? 'Paytm'
                            : 'BHIM'}
                        </Text>
                        {upiApp === app && <Check size={12} color="#ffffff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.upiInputBox}>
                    <Text style={styles.upiInputPrefix}>UPI ID:</Text>
                    <TextInput
                      style={styles.upiInput}
                      value={customUpiId}
                      onChangeText={setCustomUpiId}
                      placeholder="username@upi"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* RuPay & Cards Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'card' && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod('card')}
              activeOpacity={0.8}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.methodIconBox, selectedMethod === 'card' && styles.methodIconBoxSelected]}>
                  <CreditCard size={18} color={selectedMethod === 'card' ? '#10B981' : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>RuPay / Debit / Credit Card</Text>
                  <Text style={styles.methodSub}>Zero MDR on RuPay Cooperative Debit Cards</Text>
                </View>
                <View style={[styles.radioCircle, selectedMethod === 'card' && styles.radioCircleActive]}>
                  {selectedMethod === 'card' && <View style={styles.radioInnerDot} />}
                </View>
              </View>

              {selectedMethod === 'card' && (
                <View style={styles.cardPreviewBox}>
                  <View style={styles.cardChipRow}>
                    <View style={styles.simChip} />
                    <Text style={styles.rupayLabel}>RuPay Cooperative</Text>
                  </View>
                  <Text style={styles.cardNumberMask}>•••• •••• •••• 4829</Text>
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.cardHolderName}>PRIYA SINGH</Text>
                    <Text style={styles.cardExpiry}>08/29</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Net Banking Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'netbanking' && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod('netbanking')}
              activeOpacity={0.8}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.methodIconBox, selectedMethod === 'netbanking' && styles.methodIconBoxSelected]}>
                  <Building size={18} color={selectedMethod === 'netbanking' ? '#10B981' : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Net Banking</Text>
                  <Text style={styles.methodSub}>SBI, HDFC, ICICI & State Cooperative Banks</Text>
                </View>
                <View style={[styles.radioCircle, selectedMethod === 'netbanking' && styles.radioCircleActive]}>
                  {selectedMethod === 'netbanking' && <View style={styles.radioInnerDot} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Cash Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'cash' && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod('cash')}
              activeOpacity={0.8}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.methodIconBox, selectedMethod === 'cash' && styles.methodIconBoxSelected]}>
                  <Banknote size={18} color={selectedMethod === 'cash' ? '#10B981' : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Cash on Completion</Text>
                  <Text style={styles.methodSub}>Hand cash to professional with OTP verified receipt</Text>
                </View>
                <View style={[styles.radioCircle, selectedMethod === 'cash' && styles.radioCircleActive]}>
                  {selectedMethod === 'cash' && <View style={styles.radioInnerDot} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Error banner if any */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Info size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Trust & Guarantee Bar */}
            <View style={styles.securityRow}>
              <Lock size={12} color={colors.textMuted} />
              <Text style={styles.securityText}>
                256-Bit SSL Encrypted • NPCI / RBI Compliant • Cooperative Audited
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Sticky Action Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.payNowBtn, isProcessing && styles.payNowBtnDisabled]}
              onPress={handleProcessPayment}
              disabled={isProcessing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Pay ₹${totalAmount.toFixed(2)} Securely`}
            >
              {isProcessing ? (
                <View style={styles.payNowBtnContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.payNowBtnText}>Processing Fair Payment...</Text>
                </View>
              ) : (
                <View style={styles.payNowBtnContent}>
                  <Lock size={16} color="#ffffff" />
                  <Text style={styles.payNowBtnText}>
                    Pay ₹{totalAmount.toFixed(2)} Securely
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 20,
    },
    dragHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    coopBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    coopBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.4,
    },
    bookingCodeChip: {
      backgroundColor: colors.surfaceSubtle || 'rgba(0,0,0,0.05)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bookingCodeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollArea: {
      maxHeight: 520,
    },
    scrollContent: {
      padding: 18,
      paddingBottom: 30,
    },
    billCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    billCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    billCardTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    breakdownToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    breakdownToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    billRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    billLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    billVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    supplementalItemList: {
      marginTop: 6,
      marginBottom: 4,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: '#10B981',
    },
    suppItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    suppItemTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    suppItemDesc: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    suppTag: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 3,
    },
    suppTagText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#10B981',
    },
    suppItemPrice: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    billDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    billTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    billTotalLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    billTotalSub: {
      fontSize: 10.5,
      color: colors.textMuted,
      marginTop: 1,
    },
    billTotalAmount: {
      fontSize: 20,
      fontWeight: '900',
      color: '#10B981',
    },
    fairSplitCard: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
      marginBottom: 18,
    },
    fairSplitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    fairSplitTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#065F46',
    },
    zeroExploitPill: {
      backgroundColor: '#10B981',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
    },
    zeroExploitPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#ffffff',
    },
    splitLine: {
      flexDirection: 'row',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 10,
    },
    splitBarWorker: {
      flex: 85,
      backgroundColor: '#10B981',
    },
    splitBarWelfare: {
      flex: 10,
      backgroundColor: '#3B82F6',
    },
    splitBarPlatform: {
      flex: 5,
      backgroundColor: '#F59E0B',
    },
    splitStatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    splitStat: {
      flex: 1,
      alignItems: 'center',
    },
    splitStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
    splitStatPercent: {
      fontSize: 11,
      fontWeight: '800',
      color: '#10B981',
    },
    splitStatAmount: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 1,
    },
    splitStatLabel: {
      fontSize: 9.5,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    trustFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(16, 185, 129, 0.15)',
    },
    trustFooterText: {
      fontSize: 10.5,
      color: '#047857',
      flex: 1,
      lineHeight: 14,
    },
    sectionHeading: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    methodCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 10,
    },
    methodCardSelected: {
      borderColor: '#10B981',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#F0FDF4',
    },
    methodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    methodIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodIconBoxSelected: {
      borderColor: 'rgba(16, 185, 129, 0.4)',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    methodTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    methodSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    popularBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    popularBadgeText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#D97706',
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.8,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: '#10B981',
    },
    radioInnerDot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: '#10B981',
    },
    methodDetailSection: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(16, 185, 129, 0.15)',
    },
    upiAppRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    upiAppBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    upiAppBtnActive: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    upiAppBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    upiAppBtnTextActive: {
      color: '#ffffff',
    },
    upiInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    upiInputPrefix: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textSecondary,
      marginRight: 6,
    },
    upiInput: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      paddingVertical: 4,
    },
    cardPreviewBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: isDark ? '#1E293B' : '#0F172A',
    },
    cardChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    simChip: {
      width: 24,
      height: 18,
      borderRadius: 3,
      backgroundColor: '#E2E8F0',
    },
    rupayLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#F97316',
      letterSpacing: 0.5,
    },
    cardNumberMask: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
      color: '#F8FAFC',
      marginBottom: 10,
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardHolderName: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
    },
    cardExpiry: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#94A3B8',
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
      borderRadius: 8,
      padding: 8,
      marginBottom: 10,
    },
    errorText: {
      fontSize: 11.5,
      color: '#B91C1C',
      fontWeight: '600',
      flex: 1,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
      marginBottom: 8,
    },
    securityText: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    bottomBar: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    payNowBtn: {
      backgroundColor: '#10B981',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    payNowBtnDisabled: {
      opacity: 0.7,
    },
    payNowBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    payNowBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.3,
    },
  });
