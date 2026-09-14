// ==============================================================================
// SAHAKARI ASSISTANT WIDGET — INTERACTIVE WORKER ASSISTANT
// ==============================================================================
// - Floating bottom-right trigger with live status indicators
// - Interactive conversational assistant with action cards
// - Direct 1-tap execution of:
//   * Start Service Work
//   * Itemize & Submit Diagnostic Extra Parts across all trades
//   * Complete Job & Claim Direct Wage
//   * View Schedule & Customer Contacts
//   * Speech recognition & text-to-speech
//   * Instant cross-app synchronization
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  Linking,
  DeviceEventEmitter,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  Wrench,
  TrendingUp,
  Send,
  RefreshCw,
  MapPin,
  Clock,
  User,
  Phone,
  ArrowRight,
  Search,
  Check,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import { rootNavigationRef } from '../../navigation/RootNavigator';
import { ApiClient } from '../../services/apiClient';
import {
  AIAssistantService,
  WorkerAssistantContext,
  AssistantActionOutcome,
  AssistantMessage,
  AssistantActionCard,
} from '../../services/aiAssistantService';
import { Booking, ExtraTaskItem, ExtraTaskType } from '../../types';
import { TRADE_SUGGESTIONS } from './SupplementalBillModal';

// ==============================================================================
// IN-CHAT INTERACTIVE DIAGNOSTIC & EXTRA PARTS PICKER CARD
// ==============================================================================
interface AssistantPartsPickerCardProps {
  card: AssistantActionCard;
  isDark: boolean;
  onSubmit: (items: ExtraTaskItem[], notes?: string) => Promise<void>;
  onStateChange?: (state: { selectedItems: ExtraTaskItem[]; notes: string; submit: () => Promise<void> }) => void;
}

const AssistantPartsPickerCard: React.FC<AssistantPartsPickerCardProps> = ({
  card,
  isDark,
  onSubmit,
  onStateChange,
}) => {
  const suggestionsCatalog = card.tradeSuggestions || TRADE_SUGGESTIONS;
  const trades = card.availableTrades && card.availableTrades.length > 0
    ? card.availableTrades
    : Object.keys(suggestionsCatalog);

  const defaultCategory = card.category && suggestionsCatalog[card.category]
    ? card.category
    : trades[0] || 'Electrical';

  const [activeTrade, setActiveTrade] = useState<string>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<ExtraTaskItem[]>(() => {
    const list: ExtraTaskItem[] = [];
    if (card.preSelectedTitles && card.preSelectedTitles.length > 0) {
      for (const t of Object.keys(suggestionsCatalog)) {
        for (const it of suggestionsCatalog[t]) {
          if (card.preSelectedTitles.includes(it.title)) {
            list.push({
              id: 'part-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              title: it.title,
              cost: it.cost,
              type: it.type,
            });
          }
        }
      }
    }
    return list;
  });

  // Custom Item Form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customType, setCustomType] = useState<ExtraTaskType>('part');

  // Inspection note
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter items in active trade, or search across all trades if query typed
  const rawItems = searchQuery.trim().length > 0
    ? Object.entries(suggestionsCatalog).flatMap(([_, items]) =>
        items.filter(it => it.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : suggestionsCatalog[activeTrade] || [];

  const handleToggleItem = (item: { title: string; cost: number; type: ExtraTaskType }) => {
    if (submitted) return;
    const existingIndex = selectedItems.findIndex(i => i.title === item.title);
    if (existingIndex >= 0) {
      setSelectedItems(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          id: 'part-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: item.title,
          cost: item.cost,
          type: item.type,
        },
      ]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customTitle.trim()) {
      Alert.alert('Required', 'Please enter a description for the custom part or repair.');
      return;
    }
    const costNum = Number(customCost);
    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert('Required', 'Please enter a valid rupee cost.');
      return;
    }

    setSelectedItems(prev => [
      ...prev,
      {
        id: 'part-custom-' + Date.now(),
        title: customTitle.trim(),
        cost: costNum,
        type: customType,
      },
    ]);

    setCustomTitle('');
    setCustomCost('');
    setShowCustomForm(false);
  };

  const totalRupees = selectedItems.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || submitting || submitted) return;
    try {
      setSubmitting(true);
      await onSubmit(selectedItems, notes);
      setSubmitted(true);
    } catch (err) {
      console.warn('Failed to submit diagnostic parts', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        selectedItems,
        notes,
        submit: handleSubmit,
      });
    }
  }, [selectedItems, notes, submitting, submitted]);

  return (
    <View style={[styles.partsCardContainer, isDark && styles.partsCardContainerDark]}>
      {/* Header */}
      <View style={styles.partsCardHeader}>
        <View style={styles.partsBadge}>
          <Wrench size={12} color="#059669" />
          <Text style={styles.partsBadgeText}>DIAGNOSTIC & EXTRA PARTS</Text>
        </View>
        <Text style={[styles.partsHeaderTitle, isDark && { color: '#ffffff' }]}>
          Itemize Extra Repairs & Spare Parts
        </Text>
        <Text style={styles.partsHeaderSub}>
          Select all necessary items to send an estimate to the customer:
        </Text>
      </View>

      {/* Trade Switcher Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partsTradeScroll}
      >
        {trades.map(trade => {
          const isActive = trade === activeTrade && searchQuery.trim().length === 0;
          return (
            <TouchableOpacity
              key={trade}
              style={[
                styles.partsTradePill,
                isActive && styles.partsTradePillActive,
                isDark && !isActive && styles.partsTradePillDark,
              ]}
              onPress={() => {
                setActiveTrade(trade);
                setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.partsTradePillText,
                  isActive && styles.partsTradePillTextActive,
                  isDark && !isActive && { color: '#94a3b8' },
                ]}
              >
                {trade}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Input */}
      <View style={[styles.partsSearchBox, isDark && styles.partsSearchBoxDark]}>
        <Search size={14} color="#94a3b8" />
        <TextInput
          style={[styles.partsSearchInput, isDark && { color: '#ffffff' }]}
          placeholder="Search parts across trades..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Parts Checklist */}
      <View style={styles.partsList}>
        <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
          <View style={{ gap: 6 }}>
            {rawItems.map((item, idx) => {
              const isSelected = selectedItems.some(i => i.title === item.title);
              return (
                <TouchableOpacity
                  key={item.title + idx}
                  style={[
                    styles.partsItemRow,
                    isSelected && styles.partsItemRowSelected,
                    isDark && styles.partsItemRowDark,
                    isDark && isSelected && styles.partsItemRowDarkSelected,
                  ]}
                  onPress={() => handleToggleItem(item)}
                  activeOpacity={0.7}
                  disabled={submitted}
                >
                  <View style={[styles.partsCheckbox, isSelected && styles.partsCheckboxChecked]}>
                    {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.partsItemTitle,
                        isSelected && styles.partsItemTitleSelected,
                        isDark && { color: '#f1f5f9' },
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.partsTagRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          item.type === 'part' && styles.typeBadgePart,
                          item.type === 'labor' && styles.typeBadgeLabor,
                          item.type === 'repair' && styles.typeBadgeRepair,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            item.type === 'part' && styles.typeBadgePartText,
                            item.type === 'labor' && styles.typeBadgeLaborText,
                            item.type === 'repair' && styles.typeBadgeRepairText,
                          ]}
                        >
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.partsItemPrice}>₹{item.cost}</Text>
                </TouchableOpacity>
              );
            })}

            {rawItems.length === 0 && (
              <View style={styles.partsEmptyState}>
                <Text style={styles.partsEmptyText}>No items found matching "{searchQuery}"</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Custom Item Drawer */}
      {!submitted && (
        <View style={styles.customSection}>
          {!showCustomForm ? (
            <TouchableOpacity
              style={styles.addCustomBtn}
              onPress={() => setShowCustomForm(true)}
              activeOpacity={0.7}
            >
              <Plus size={13} color="#059669" />
              <Text style={styles.addCustomBtnText}>+ Add Custom Defect or Part</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.customFormBox, isDark && styles.customFormBoxDark]}>
              <View style={styles.customFormHeader}>
                <Text style={[styles.customFormTitle, isDark && { color: '#ffffff' }]}>Custom Defect or Part</Text>
                <TouchableOpacity onPress={() => setShowCustomForm(false)}>
                  <X size={15} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.customInput, isDark && styles.customInputDark]}
                placeholder="Description (e.g. Copper Pipe 3m extension)"
                placeholderTextColor="#94a3b8"
                value={customTitle}
                onChangeText={setCustomTitle}
              />

              <TextInput
                style={[styles.customInput, isDark && styles.customInputDark]}
                placeholder="Cost ₹ (e.g. 250)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={customCost}
                onChangeText={setCustomCost}
              />

              <View style={styles.typeSegmentedGroup}>
                {([
                  { type: 'part', label: '📦 Part' },
                  { type: 'labor', label: '🔨 Labor' },
                  { type: 'repair', label: '🔧 Repair' },
                ] as const).map(({ type: t, label }) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeSegmentedBtn,
                      customType === t && styles.typeSegmentedBtnActive,
                      isDark && customType !== t && styles.typeSegmentedBtnDark,
                    ]}
                    onPress={() => setCustomType(t as ExtraTaskType)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.typeSegmentedBtnText,
                        customType === t && styles.typeSegmentedBtnTextActive,
                        isDark && customType !== t && { color: '#94a3b8' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addCustomSubmitBtn}
                onPress={handleAddCustomItem}
                activeOpacity={0.8}
              >
                <Text style={styles.addCustomSubmitBtnText}>Add to Estimate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Defect Notes */}
      {!submitted && (
        <TextInput
          style={[styles.notesInputCompact, isDark && styles.notesInputCompactDark]}
          placeholder="Diagnosis note (optional, e.g. Customer agreed to switch replacement)"
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
        />
      )}

      {/* Live Summary & Submit Footer */}
      <View style={[styles.partsFooter, isDark && styles.partsFooterDark]}>
        <View>
          <Text style={[styles.partsTotalCount, isDark && { color: '#cbd5e1' }]}>
            {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
          </Text>
          <Text style={styles.partsTotalSum}>Total: ₹{totalRupees}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitEstimateBtn,
            (selectedItems.length === 0 || submitting || submitted) && styles.submitEstimateBtnDisabled,
            submitted && styles.submitEstimateBtnDone,
          ]}
          onPress={handleSubmit}
          disabled={selectedItems.length === 0 || submitting || submitted}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : submitted ? (
            <>
              <Check size={14} color="#ffffff" />
              <Text style={styles.submitEstimateBtnText}>Estimate Sent</Text>
            </>
          ) : (
            <>
              <Send size={13} color="#ffffff" />
              <Text style={styles.submitEstimateBtnText}>
                {selectedItems.length > 0 ? `Send Estimate (₹${totalRupees})` : 'Select Items'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==============================================================================
// IN-CHAT INTERACTIVE JOB & REQUEST LIST CARD
// ==============================================================================
interface AssistantJobListCardProps {
  card: AssistantActionCard;
  isDark: boolean;
  onSelectJob: (job: Booking) => void;
}

const AssistantJobListCard: React.FC<AssistantJobListCardProps> = ({
  card,
  isDark,
  onSelectJob,
}) => {
  const jobs = card.jobs || (card.booking ? [card.booking] : []);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress'>('all');

  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const acceptedCount = jobs.filter(j => j.status === 'accepted').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;

  const filteredJobs = jobs.filter(j => {
    if (activeFilter === 'all') return true;
    return j.status === activeFilter;
  });

  if (jobs.length === 0) {
    return (
      <View style={[styles.jobListCardContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <Text style={[styles.jobListEmptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          No requests or jobs found.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.jobListCardContainer, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
      {/* Card Header */}
      <View style={[styles.jobListCardHeader, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
        <View style={styles.jobListCardHeaderLeft}>
          <Text style={[styles.jobListCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Available Requests & Jobs
          </Text>
          <View style={styles.jobListCountBadge}>
            <Text style={styles.jobListCountBadgeText}>{jobs.length}</Text>
          </View>
        </View>
        <Text style={[styles.jobListCardSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Tap any request to open page
        </Text>
      </View>

      {/* Filter Chips if multiple statuses exist */}
      {(pendingCount > 0 || acceptedCount > 0 || inProgressCount > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.jobListFilterScroll, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]} contentContainerStyle={styles.jobListFilterContent}>
          <TouchableOpacity
            style={[
              styles.jobListFilterPill,
              { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
              activeFilter === 'all' && (isDark ? { backgroundColor: '#334155' } : styles.jobListFilterPillActive),
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.jobListFilterText, activeFilter === 'all' && styles.jobListFilterTextActive]}>
              All ({jobs.length})
            </Text>
          </TouchableOpacity>
          {pendingCount > 0 && (
            <TouchableOpacity
              style={[
                styles.jobListFilterPill,
                { backgroundColor: isDark ? '#0f172a' : '#fef3c7' },
                activeFilter === 'pending' && styles.jobListFilterPillActiveAmber,
              ]}
              onPress={() => setActiveFilter('pending')}
            >
              <Text
                style={[
                  styles.jobListFilterText,
                  { color: '#d97706' },
                  activeFilter === 'pending' && styles.jobListFilterTextActiveAmber,
                ]}
              >
                Pending ({pendingCount})
              </Text>
            </TouchableOpacity>
          )}
          {acceptedCount > 0 && (
            <TouchableOpacity
              style={[
                styles.jobListFilterPill,
                { backgroundColor: isDark ? '#0f172a' : '#eff6ff' },
                activeFilter === 'accepted' && styles.jobListFilterPillActiveBlue,
              ]}
              onPress={() => setActiveFilter('accepted')}
            >
              <Text
                style={[
                  styles.jobListFilterText,
                  { color: '#2563eb' },
                  activeFilter === 'accepted' && styles.jobListFilterTextActiveBlue,
                ]}
              >
                Confirmed ({acceptedCount})
              </Text>
            </TouchableOpacity>
          )}
          {inProgressCount > 0 && (
            <TouchableOpacity
              style={[
                styles.jobListFilterPill,
                { backgroundColor: isDark ? '#0f172a' : '#ecfdf5' },
                activeFilter === 'in_progress' && styles.jobListFilterPillActiveGreen,
              ]}
              onPress={() => setActiveFilter('in_progress')}
            >
              <Text
                style={[
                  styles.jobListFilterText,
                  { color: '#059669' },
                  activeFilter === 'in_progress' && styles.jobListFilterTextActiveGreen,
                ]}
              >
                Active ({inProgressCount})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Job Items List */}
      <View style={styles.jobListItems}>
        {filteredJobs.map((job, idx) => {
          const isPending = job.status === 'pending';
          const isInProgress = job.status === 'in_progress';
          const isAccepted = job.status === 'accepted';
          const totalAmt = Number(job.final_amount || job.estimated_amount || 0);
          const directWage = (totalAmt * 0.85).toFixed(0);

          return (
            <TouchableOpacity
              key={job.id || idx}
              style={[
                styles.jobListItem,
                idx < filteredJobs.length - 1 && { borderBottomColor: isDark ? '#334155' : '#f1f5f9', borderBottomWidth: 1 },
                { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
              ]}
              onPress={() => onSelectJob(job)}
              activeOpacity={0.7}
            >
              {/* Top Row: Code & Status */}
              <View style={styles.jobListItemTop}>
                <View style={[styles.jobCodeBadge, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <Text style={[styles.jobCodeText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                    {job.booking_code}
                  </Text>
                </View>

                <View style={styles.jobStatusContainer}>
                  {job.is_emergency && (
                    <View style={styles.emergencyPill}>
                      <Text style={styles.emergencyPillText}>🚨 Emergency</Text>
                    </View>
                  )}
                  {isInProgress && (
                    <View style={[styles.statusPill, styles.statusPillProgress]}>
                      <Text style={styles.statusTextProgress}>⚡ In Progress</Text>
                    </View>
                  )}
                  {isAccepted && (
                    <View style={[styles.statusPill, styles.statusPillAccepted]}>
                      <Text style={styles.statusTextAccepted}>📋 Confirmed</Text>
                    </View>
                  )}
                  {isPending && (
                    <View style={[styles.statusPill, styles.statusPillPending]}>
                      <Text style={styles.statusTextPending}>🔔 Pending Request</Text>
                    </View>
                  )}
                  {!isPending && !isAccepted && !isInProgress && (
                    <View style={[styles.statusPill, styles.statusPillDefault]}>
                      <Text style={styles.statusTextDefault}>{job.status}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Service Description */}
              <Text style={[styles.jobServiceDesc, { color: isDark ? '#f1f5f9' : '#1e293b' }]} numberOfLines={2}>
                {job.service_description || 'General Service Work'}
              </Text>

              {/* Customer & Location Info */}
              <View style={styles.jobMetaRow}>
                <View style={styles.jobMetaItem}>
                  <User size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text style={[styles.jobMetaText, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
                    {job.customer?.full_name || 'Customer'}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <MapPin size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text style={[styles.jobMetaText, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
                    {job.address?.split(',')[0] || job.city || 'Jaipur'}
                  </Text>
                </View>
              </View>

              {/* Timing & Wage & Action */}
              <View style={styles.jobListItemBottom}>
                <View style={styles.jobTimingBox}>
                  <Clock size={11} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text style={[styles.jobTimingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {job.booking_date} • {job.booking_time}
                  </Text>
                </View>

                <View style={styles.jobWageAndAction}>
                  <View style={styles.jobWageBox}>
                    <Text style={styles.jobWageText}>₹{directWage}</Text>
                    <Text style={styles.jobWageSub}>wage</Text>
                  </View>

                  <View style={[styles.jobActionPill, { backgroundColor: isDark ? '#0f172a' : '#ecfdf5', borderColor: isDark ? '#059669' : '#10b981' }]}>
                    <Text style={[styles.jobActionPillText, { color: isDark ? '#34d399' : '#059669' }]}>
                      View Request
                    </Text>
                    <ChevronRight size={13} color={isDark ? '#34d399' : '#059669'} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export interface WorkerAIAssistantWidgetProps {
  showFloatingTrigger?: boolean;
  workerId?: string;
}

export const WorkerAIAssistantWidget: React.FC<WorkerAIAssistantWidgetProps> = ({
  showFloatingTrigger = false,
  workerId,
}) => {
  const { colors, isDark } = useTheme();

  // Modal open/close & loading states
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [context, setContext] = useState<WorkerAssistantContext | null>(null);

  // Speech Recognition & Synthesis
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');

  // Conversational message feed with interactive action cards
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  // Pulse animation for floating trigger
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Active parts picker selection tracker for direct voice/text estimate submission
  const activePartsPickerRef = useRef<{
    bookingId: string;
    selectedItems: ExtraTaskItem[];
    notes: string;
    submit: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Load context on mount and subscribe to app-wide updates
  useEffect(() => {
    refreshContext();
    const subBooking = DeviceEventEmitter.addListener('app_booking_updated', () => {
      refreshContext();
    });
    const subOpen = DeviceEventEmitter.addListener('open_worker_ai_assistant', () => {
      setIsOpen(true);
    });
    return () => {
      subBooking.remove();
      subOpen.remove();
    };
  }, [workerId]);

  useEffect(() => {
    if (isOpen) {
      refreshContext();
    }
  }, [isOpen]);

  const initializedRef = useRef(false);

  const refreshContext = async (forceInit = false) => {
    try {
      setLoading(true);
      const ctx = await AIAssistantService.getWorkerContext(workerId);
      setContext(ctx);

      // Initialize conversation only once on first open, or on explicit user refresh
      if (!initializedRef.current || forceInit) {
        initializedRef.current = true;
        initializeConversation(ctx);
      }
    } catch (err) {
      console.warn('Failed to refresh assistant context', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = (ctx: WorkerAssistantContext) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const inProg = ctx.activeOnSiteJob;
    const accepted = ctx.nextCommittedJob;
    const pending = ctx.pendingJobs;
    const awaitingPayment = ctx.awaitingPaymentJob;
    const emergencyPending = pending.find(j => j.is_emergency);

    let greeting = 'Namaste! I am your Sahakari Assistant ⚡.\n';
    let card: AssistantActionCard | undefined;

    // PRIORITY 1: Active on-site work ALWAYS takes precedence!
    if (inProg) {
      const wage = (Number(inProg.final_amount || inProg.estimated_amount || 0) * 0.85).toFixed(0);
      const isEmerg = inProg.is_emergency;
      const custName = inProg.customer?.full_name || 'Customer';
      const custPhone = inProg.customer?.phone || '+919855044556';

      greeting += isEmerg
        ? `🚨 EMERGENCY SERVICE ON-SITE! You are active on ${inProg.booking_code} (${custName}). Operational mode is locked to Emergency Service until completion. Expected wage: ₹${wage} (+25% bonus included).`
        : `⚡ Active On-Site: ${inProg.booking_code} (${custName}). Operational mode is locked until completion. Expected direct wage: ₹${wage}. What would you like to do?`;

      if (emergencyPending) {
        greeting += `\n\n*(Note: 1 new SOS request ${emergencyPending.booking_code} queued in area)*`;
      }

      card = {
        id: 'init-card-1',
        type: 'action_buttons',
        booking: inProg,
        actions: [
          { label: isEmerg ? `✓ Complete Emergency Job (₹${wage})` : `✓ Complete Job (₹${wage})`, command: 'complete job', variant: 'success' },
          { label: '🔧 Add Extra Parts & Tasks', command: 'add diagnostic parts', variant: 'warning' },
          { label: `📞 Call ${custName}`, command: `call_phone:${custPhone}`, variant: isEmerg ? 'warning' : 'neutral' },
        ],
      };
    }
    // PRIORITY 2: Emergency dispatch alert when not currently on-site
    else if (emergencyPending) {
      const wage = (Number(emergencyPending.final_amount || emergencyPending.estimated_amount || 0) * 0.85).toFixed(0);
      const custPhone = emergencyPending.customer?.phone || '+919855044556';
      greeting += `🚨 URGENT SOS DISPATCH ALERT! You have an emergency booking request (${emergencyPending.booking_code}) waiting for immediate dispatch (< 15-30 min arrival SLA)! Expected direct wage: ₹${wage} (+25% bonus included).`;
      card = {
        id: 'init-card-emergency',
        type: 'action_buttons',
        booking: emergencyPending,
        actions: [
          { label: `🚨 Accept Emergency (${emergencyPending.booking_code})`, command: `accept job ${emergencyPending.booking_code}`, variant: 'danger' },
          { label: '📞 Call Customer Instantly', command: `call_phone:${custPhone}`, variant: 'warning' },
          { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
        ],
      };
    }
    // PRIORITY 2.5: Completed job awaiting customer payment (After Pay)
    else if (awaitingPayment) {
      const amt = awaitingPayment.final_amount || awaitingPayment.estimated_amount || 0;
      const wage = (Number(amt) * 0.85).toFixed(0);
      const custName = awaitingPayment.customer?.full_name || 'Customer';
      greeting += `💳 PAYMENT DUE! Job ${awaitingPayment.booking_code} for ${custName} is completed. Collect ₹${amt} from the customer (Pay on Completion). Expected direct wage: ₹${wage}.`;
      card = {
        id: 'init-card-pay-due',
        type: 'action_buttons',
        booking: awaitingPayment,
        actions: [
          { label: '📱 Show Customer UPI QR', command: `open_payment_qr:${awaitingPayment.id}`, variant: 'primary' },
          { label: `💵 Received Cash (₹${amt})`, command: `confirm_cash:${awaitingPayment.id}`, variant: 'success' },
          { label: `📞 Call ${custName}`, command: `call_phone:${awaitingPayment.customer?.phone || '+919855044556'}`, variant: 'neutral' },
        ],
      };
    }
    // PRIORITY 3: Next committed job
    else if (accepted) {
      const wage = (Number(accepted.final_amount || accepted.estimated_amount || 0) * 0.85).toFixed(0);
      const isEmerg = accepted.is_emergency;
      const custName = accepted.customer?.full_name || 'Customer';
      const custPhone = accepted.customer?.phone || '+919855044556';
      greeting += isEmerg
        ? `🚨 EMERGENCY DISPATCH ACTIVE! You have accepted emergency job ${accepted.booking_code} for ${custName} (< 15-30 min SLA). Expected direct wage: ₹${wage}.`
        : `You have 1 confirmed job ready to start: ${accepted.booking_code} for ${custName} on ${accepted.booking_date} at ${accepted.booking_time}. Expected direct wage: ₹${wage}.`;
      card = {
        id: 'init-card-2',
        type: 'action_buttons',
        booking: accepted,
        actions: [
          { label: isEmerg ? '⚡ Start Emergency Work Now' : '⚡ Start Service Work Now', command: 'start work', variant: 'success' },
          { label: `📞 Call ${custName}`, command: `call_phone:${custPhone}`, variant: 'neutral' },
          { label: '🔊 Read Order Aloud', command: 'read details aloud', variant: 'neutral' },
        ],
      };
    }
    // PRIORITY 4: Pending requests
    else if (pending.length > 0) {
      greeting += `You have ${pending.length} new booking request${pending.length > 1 ? 's' : ''} waiting for your review. Tap any request below to view its page:`;
      card = {
        id: 'init-card-3',
        type: 'job_list',
        jobs: pending,
        actions: [
          { label: `Accept ${pending[0].booking_code} (₹${pending[0].estimated_amount})`, command: 'accept job', variant: 'primary' },
          { label: 'Decline Request', command: 'decline job', variant: 'danger' },
        ],
      };
    }
    // PRIORITY 5: Standby
    else {
      greeting += `You are completely caught up! No active jobs right now. You can check your earnings or review your schedule.`;
      card = {
        id: 'init-card-4',
        type: 'action_buttons',
        actions: [
          { label: '💰 Check My Earnings', command: 'earnings summary', variant: 'primary' },
          { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
        ],
      };
    }

    setMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text: greeting,
        timestamp: time,
        card,
      },
    ]);
  };

  const handleOpenJobDetail = (job: Booking) => {
    AIAssistantService.stopSpeaking();
    AIAssistantService.stopListening();
    setIsOpen(false);
    setTimeout(() => {
      try {
        if (rootNavigationRef.isReady()) {
          rootNavigationRef.navigate('WorkerJobDetail', { bookingId: job.id, job });
        }
      } catch (err) {
        console.warn('Could not navigate to job detail', err);
      }
    }, 60);
  };

  const handleSendDiagnosticEstimate = async (bookingId: string, items: ExtraTaskItem[], notes?: string) => {
    setActionInProgress(true);
    try {
      const res = await AIAssistantService.submitDiagnosticItems(bookingId, items, notes);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const itemSummary = items.map(i => `${i.title} (₹${i.cost})`).join(', ');
      const confirmMsg: AssistantMessage = {
        id: 'ai-diag-' + Date.now(),
        sender: 'ai',
        text: `✅ ${res.message}\nItemized: ${itemSummary}`,
        timestamp: time,
        card: {
          id: 'card-diag-followup-' + Date.now(),
          type: 'action_buttons',
          actions: [
            { label: '✓ Complete Job When Ready', command: 'complete job', variant: 'success' },
            { label: '🔧 Add More Parts', command: 'add diagnostic parts', variant: 'neutral' },
          ],
        },
      };

      setMessages(prev => [...prev, confirmMsg]);
      setIsSpeaking(true);
      AIAssistantService.speak(
        `Estimate of ${res.total} rupees for ${items.length} item${items.length > 1 ? 's' : ''} sent to customer for authorization.`,
        () => setIsSpeaking(false)
      );
      await refreshContext();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send diagnostic estimate');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleExecute = async (command: string) => {
    if (!command.trim() || actionInProgress) return;
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const trimmed = command.trim();

    // 1. Direct Native Phone Dialer Handler
    if (trimmed.startsWith('call_phone:') || trimmed.startsWith('tel:')) {
      const phoneRaw = trimmed.replace('call_phone:', '').replace('tel:', '').trim();
      const phoneClean = phoneRaw.replace(/[^0-9+]/g, '');
      setMessages(prev => [
        ...prev,
        { id: 'user-' + Date.now(), sender: 'user', text: `📞 Call Customer (${phoneRaw})`, timestamp: userTime },
        { id: 'ai-' + Date.now() + 1, sender: 'ai', text: `📞 Opening device phone dialer for ${phoneRaw}...`, timestamp: userTime },
      ]);
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(`tel:${phoneClean}`, '_self');
        } else {
          Linking.openURL(`tel:${phoneClean}`);
        }
      } catch (err) {
        Alert.alert('Phone Call', `Dial number: ${phoneRaw}`);
      }
      return;
    }

    // 2. Direct QR Scanner Navigation Handler
    if (trimmed.startsWith('open_scanner:')) {
      const bId = trimmed.replace('open_scanner:', '').trim();
      AIAssistantService.stopSpeaking();
      AIAssistantService.stopListening();
      setIsOpen(false);
      setTimeout(() => {
        try {
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate('WorkerJobDetail', { bookingId: bId, openScanner: true });
          }
        } catch (err) {
          console.warn('Could not open scanner screen', err);
        }
      }, 80);
      return;
    }

    // 2.1 Direct Payment QR Navigation Handler
    if (trimmed.startsWith('open_payment_qr:') || trimmed === 'show_payment_qr') {
      const bId = trimmed.startsWith('open_payment_qr:') ? trimmed.replace('open_payment_qr:', '').trim() : undefined;
      AIAssistantService.stopSpeaking();
      AIAssistantService.stopListening();
      setIsOpen(false);
      setTimeout(() => {
        try {
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate('WorkerJobDetail', { bookingId: bId, openPaymentQr: true });
          }
        } catch (err) {
          console.warn('Could not open payment QR modal', err);
        }
      }, 80);
      return;
    }

    // 2.2 Direct Cash Confirmation Handler
    if (trimmed.startsWith('confirm_cash:')) {
      const bId = trimmed.replace('confirm_cash:', '').trim();
      setMessages(prev => [
        ...prev,
        { id: 'user-' + Date.now(), sender: 'user', text: `💵 Confirming cash payment...`, timestamp: userTime },
      ]);
      setActionInProgress(true);
      try {
        const bookings = await ApiClient.getBookings();
        const b = bookings.find((item: Booking) => item.id === bId);
        const amt = b?.final_amount || b?.estimated_amount || 0;
        await ApiClient.confirmCashPayment(bId, amt);
        DeviceEventEmitter.emit('app_booking_updated');
        const wage = (Number(amt) * 0.85).toFixed(0);
        const confirmMsg: AssistantMessage = {
          id: 'ai-cash-' + Date.now(),
          sender: 'ai',
          text: `🎉 Cash payment of ₹${amt} confirmed for job ${b?.booking_code || ''}!\n• ₹${wage} credited to your direct wage balance (85%).\n• Service invoice generated and marked paid.`,
          timestamp: userTime,
          card: {
            id: 'card-cash-ok-' + Date.now(),
            type: 'earnings_summary',
            actions: [
              { label: '💰 Check My Earnings', command: 'earnings summary', variant: 'primary' },
              { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
            ],
          },
        };
        setMessages(prev => [...prev, confirmMsg]);
        setIsSpeaking(true);
        AIAssistantService.speak(`Cash payment of ${amt} rupees confirmed. Wage credited.`, () => setIsSpeaking(false));
        await refreshContext();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not confirm cash payment');
      } finally {
        setActionInProgress(false);
      }
      return;
    }

    // 3. Direct Schedule Navigation Handler
    if (trimmed === 'navigate_jobs') {
      AIAssistantService.stopSpeaking();
      AIAssistantService.stopListening();
      setIsOpen(false);
      setTimeout(() => {
        try {
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate('WorkerTabs', { screen: 'WorkerJobs' });
          }
        } catch (err) {
          console.warn('Could not navigate to schedule', err);
        }
      }, 80);
      return;
    }

    // 4. Direct Send Estimate Handler if parts are already selected in the active card
    const normalizedCmd = trimmed.toLowerCase();
    if (
      (normalizedCmd === 'send estimate' ||
        normalizedCmd.includes('send estimate') ||
        normalizedCmd.includes('estimate bhejo') ||
        normalizedCmd.includes('submit estimate')) &&
      activePartsPickerRef.current &&
      activePartsPickerRef.current.selectedItems.length > 0
    ) {
      const userMsg: AssistantMessage = {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: command,
        timestamp: userTime,
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      await activePartsPickerRef.current.submit();
      return;
    }

    // Append user message
    const userMsg: AssistantMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: command,
      timestamp: userTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setActionInProgress(true);

    try {
      const outcome: AssistantActionOutcome = await AIAssistantService.executeCommand(command, workerId);
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const aiMsg: AssistantMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: outcome.message,
        timestamp: aiTime,
        card: outcome.card,
      };

      setMessages(prev => [...prev, aiMsg]);

      // Speak feedback
      if (outcome.speechText) {
        setIsSpeaking(true);
        AIAssistantService.speak(outcome.speechText, () => setIsSpeaking(false));
      }

      await refreshContext();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: `⚠️ ${err.message || 'Action could not be executed.'}`,
          timestamp: errorTime,
        },
      ]);
    } finally {
      setActionInProgress(false);
    }
  };

  // Voice toggle
  const toggleVoice = () => {
    if (isListening) {
      AIAssistantService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const started = AIAssistantService.startListening(
        (transcript: string) => {
          setIsListening(false);
          handleExecute(transcript);
        },
        (error: string) => {
          setIsListening(false);
          console.log('Voice recognition notice:', error);
        },
        () => {
          setIsListening(false);
        }
      );
      if (!started) {
        setIsListening(false);
      }
    }
  };

  // Audio readout toggle
  const toggleAudio = () => {
    if (isSpeaking) {
      AIAssistantService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      handleExecute('read details aloud');
    }
  };

  const activeJob = context?.activeOnSiteJob || context?.nextCommittedJob;
  const hasEmergencyPending = context?.pendingJobs?.some(j => j.is_emergency);

  // Uncluttered Adaptive Contextual Action Chips (Exactly 3 pills tailored to current state)
  const renderContextualChips = () => {
    if (context?.activeOnSiteJob) {
      const active = context.activeOnSiteJob;
      const phone = active.customer?.phone || '+919855044556';
      return (
        <View style={styles.chipRowUncluttered}>
          <TouchableOpacity
            style={[styles.chip, styles.chipSuccess]}
            onPress={() => handleExecute('complete job')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <CheckCircle2 size={13} color="#059669" />
            <Text style={[styles.chipText, styles.chipTextSuccess]}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, styles.chipWarning]}
            onPress={() => handleExecute('add diagnostic parts')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Wrench size={13} color="#d97706" />
            <Text style={[styles.chipText, styles.chipTextWarning]}>Extra Parts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute(`call_phone:${phone}`)}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Phone size={13} color="#2563eb" />
            <Text style={styles.chipText}>Call Client</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasEmergencyPending) {
      return (
        <View style={styles.chipRowUncluttered}>
          <TouchableOpacity
            style={[styles.chip, styles.chipEmergency]}
            onPress={() => handleExecute('accept job')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <AlertTriangle size={13} color="#ef4444" />
            <Text style={[styles.chipText, styles.chipTextEmergency]}>Accept SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute('navigate_jobs')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Clock size={13} color="#2563eb" />
            <Text style={styles.chipText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute('earnings summary')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <TrendingUp size={13} color="#059669" />
            <Text style={styles.chipText}>Earnings</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (context?.awaitingPaymentJob) {
      const waitJob = context.awaitingPaymentJob;
      const finalAmt = waitJob.final_amount || waitJob.estimated_amount || 0;
      return (
        <View style={styles.chipRowUncluttered}>
          <TouchableOpacity
            style={[styles.chip, styles.chipWarning]}
            onPress={() => handleExecute(`open_payment_qr:${waitJob.id}`)}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Zap size={13} color="#d97706" />
            <Text style={[styles.chipText, styles.chipTextWarning]}>Show UPI QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, styles.chipSuccess]}
            onPress={() => handleExecute(`confirm_cash:${waitJob.id}`)}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <CheckCircle2 size={13} color="#059669" />
            <Text style={[styles.chipText, styles.chipTextSuccess]}>Paid Cash (₹{finalAmt})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute('earnings summary')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <TrendingUp size={13} color="#2563eb" />
            <Text style={styles.chipText}>Earnings</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (context?.nextCommittedJob) {
      const nextJob = context.nextCommittedJob;
      const phone = nextJob.customer?.phone || '+919855044556';
      return (
        <View style={styles.chipRowUncluttered}>
          <TouchableOpacity
            style={[styles.chip, styles.chipSuccess]}
            onPress={() => handleExecute('start work')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Zap size={13} color="#059669" />
            <Text style={[styles.chipText, styles.chipTextSuccess]}>Start Work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute(`call_phone:${phone}`)}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Phone size={13} color="#2563eb" />
            <Text style={styles.chipText}>Call Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => handleExecute('navigate_jobs')}
            disabled={actionInProgress}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Clock size={13} color="#2563eb" />
            <Text style={styles.chipText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default Standby / Free
    return (
      <View style={styles.chipRowUncluttered}>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleExecute('navigate_jobs')}
          disabled={actionInProgress}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Clock size={13} color="#2563eb" />
          <Text style={styles.chipText}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleExecute('earnings summary')}
          disabled={actionInProgress}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <TrendingUp size={13} color="#059669" />
          <Text style={styles.chipText}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleExecute('help')}
          disabled={actionInProgress}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Sparkles size={13} color="#8b5cf6" />
          <Text style={styles.chipText}>Help</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* 1. FLOATING ACTION BUTTON (BOTTOM-RIGHT) - OPTIONAL                 */}
      {/* ------------------------------------------------------------------- */}
      {showFloatingTrigger && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.fabButton, hasEmergencyPending && styles.fabButtonEmergency]}
              onPress={() => setIsOpen(true)}
              activeOpacity={0.85}
              accessibilityLabel="Open Sahakari Assistant"
            >
              <View style={styles.fabInner}>
                <Sparkles size={22} color="#ffffff" strokeWidth={2.5} />
                {hasEmergencyPending ? (
                  <View style={[styles.fabActiveDot, { backgroundColor: '#ef4444' }]} />
                ) : context?.activeOnSiteJob ? (
                  <View style={styles.fabActiveDot} />
                ) : null}
              </View>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={[styles.fabLabelPill, hasEmergencyPending && styles.fabLabelPillEmergency]}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.85}
          >
            {hasEmergencyPending ? (
              <>
                <AlertTriangle size={11} color="#fca5a5" />
                <Text style={[styles.fabLabelText, { color: '#fca5a5' }]}>SOS Alert</Text>
              </>
            ) : (
              <>
                <Zap size={11} color="#10b981" />
                <Text style={styles.fabLabelText}>Assistant</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE ASSISTANT MODAL SHEET                                */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          AIAssistantService.stopSpeaking();
          AIAssistantService.stopListening();
          setIsOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          {/* Backdrop Tap to Dismiss (area above the bottom sheet) */}
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => {
              AIAssistantService.stopSpeaking();
              AIAssistantService.stopListening();
              setIsOpen(false);
            }}
            accessibilityLabel="Close assistant sheet"
          />

          <View
            style={[styles.sheetContainer, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
          >
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.aiBadgeIcon}>
                  <Sparkles size={16} color="#10b981" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.sheetTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                    Sahakari Assistant
                  </Text>
                  <Text
                    style={[styles.sheetSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Voice & Task Companion
                  </Text>
                </View>
              </View>

              <View style={styles.sheetHeaderActions}>
                {/* Audio Read-out Toggle */}
                <TouchableOpacity
                  style={[styles.iconHeaderBtn, isSpeaking && styles.iconHeaderBtnActive]}
                  onPress={toggleAudio}
                  accessibilityLabel="Listen aloud"
                >
                  {isSpeaking ? (
                    <VolumeX size={18} color="#ef4444" />
                  ) : (
                    <Volume2 size={18} color="#10b981" />
                  )}
                </TouchableOpacity>

                {/* Refresh Context */}
                <TouchableOpacity
                  style={styles.iconHeaderBtn}
                  onPress={() => refreshContext(true)}
                  disabled={loading}
                >
                  <RefreshCw size={17} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Close Sheet */}
                <TouchableOpacity
                  style={styles.iconHeaderBtn}
                  onPress={() => {
                    AIAssistantService.stopSpeaking();
                    AIAssistantService.stopListening();
                    setIsOpen(false);
                  }}
                >
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Strip */}
            {activeJob && (
              <View
                style={[
                  styles.statusStrip,
                  activeJob.is_emergency && styles.statusStripEmergency,
                ]}
              >
                <View style={styles.statusStripLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: activeJob.is_emergency
                          ? '#ef4444'
                          : context?.activeOnSiteJob
                          ? '#10b981'
                          : '#3b82f6',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusStripText,
                      activeJob.is_emergency && { color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {activeJob.is_emergency
                      ? context?.activeOnSiteJob
                        ? '🚨 Emergency On-Site: '
                        : '🚨 Emergency Dispatch: '
                      : context?.activeOnSiteJob
                      ? 'In Progress: '
                      : 'Confirmed: '}
                    <Text style={{ fontWeight: '800' }}>{activeJob.booking_code}</Text>
                    {' • '}
                    {activeJob.customer?.full_name || 'Customer'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statusStripWage,
                    activeJob.is_emergency && { color: isDark ? '#f87171' : '#dc2626' },
                  ]}
                >
                  ₹{(Number(activeJob.final_amount || activeJob.estimated_amount || 0) * 0.85).toFixed(0)} wage
                </Text>
              </View>
            )}

            {/* Conversation Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollInner}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAi,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.sender === 'user'
                          ? styles.bubbleTextUser
                          : { color: isDark ? '#f1f5f9' : '#1e293b' },
                      ]}
                    >
                      {msg.text}
                    </Text>

                    {/* Interactive Action Cards */}
                    {msg.card && msg.card.actions && msg.card.actions.length > 0 && (
                      <View style={styles.cardActionGroup}>
                        {msg.card.actions.map((act, actIdx) => (
                          <TouchableOpacity
                            key={actIdx}
                            style={[
                              styles.cardActionBtn,
                              act.variant === 'success' && styles.cardActionSuccess,
                              act.variant === 'primary' && styles.cardActionPrimary,
                              act.variant === 'warning' && styles.cardActionWarning,
                              act.variant === 'danger' && styles.cardActionDanger,
                              act.variant === 'neutral' && styles.cardActionNeutral,
                            ]}
                            onPress={() => handleExecute(act.command)}
                            disabled={actionInProgress}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.cardActionText,
                                (act.variant === 'success' ||
                                  act.variant === 'primary' ||
                                  act.variant === 'danger') && {
                                  color: '#ffffff',
                                },
                              ]}
                            >
                              {act.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Interactive Multi-Trade Parts & Diagnosis Picker */}
                    {msg.card && msg.card.type === 'parts_picker' && msg.card.booking && (
                      <AssistantPartsPickerCard
                        card={msg.card}
                        isDark={isDark}
                        onSubmit={async (items, notes) => {
                          await handleSendDiagnosticEstimate(msg.card!.booking!.id, items, notes);
                        }}
                        onStateChange={(cardState) => {
                          activePartsPickerRef.current = {
                            bookingId: msg.card!.booking!.id,
                            selectedItems: cardState.selectedItems,
                            notes: cardState.notes,
                            submit: cardState.submit,
                          };
                        }}
                      />
                    )}

                    {/* Interactive Job & Request List Card */}
                    {msg.card && msg.card.type === 'job_list' && (
                      <AssistantJobListCard
                        card={msg.card}
                        isDark={isDark}
                        onSelectJob={handleOpenJobDetail}
                      />
                    )}

                    <Text
                      style={[
                        styles.bubbleTime,
                        msg.sender === 'user' ? { color: '#dcfce7' } : { color: '#94a3b8' },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              ))}

              {actionInProgress && (
                <View style={styles.typingBox}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.typingText}>Executing action on live bookings...</Text>
                </View>
              )}
            </ScrollView>

            {/* Uncluttered Adaptive Quick Action Chips (Max 3 pills tailored to state) */}
            {renderContextualChips()}

            {/* Input Bar */}
            <View
              style={[
                styles.footerInputBar,
                { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              {/* Mic Button */}
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={toggleVoice}
                activeOpacity={0.8}
                accessibilityLabel="Voice microphone"
              >
                {isListening ? (
                  <MicOff size={18} color="#ffffff" />
                ) : (
                  <Mic size={18} color="#ffffff" />
                )}
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
                placeholder={
                  isListening
                    ? 'Listening... speak your command'
                    : 'Type or tap quick actions...'
                }
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleExecute(inputText)}
                returnKeyType="send"
              />

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnDisabled,
                ]}
                onPress={() => handleExecute(inputText)}
                disabled={!inputText.trim() || actionInProgress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send command"
              >
                <Send size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 84,
    right: 18,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#34d399',
  },
  fabInner: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabActiveDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  fabButtonEmergency: {
    backgroundColor: '#dc2626',
    borderColor: '#f87171',
    shadowColor: '#dc2626',
  },
  fabLabelPill: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  fabLabelPillEmergency: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  fabLabelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '72%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
    flexShrink: 1,
  },
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconHeaderBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },

  // Status Strip
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusStripEmergency: {
    backgroundColor: '#fef2f2',
    borderBottomColor: '#fecaca',
  },
  statusStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusStripText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
  },
  statusStripWage: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },

  // Chat Scroll
  chatScroll: {
    flex: 1,
  },
  chatScrollInner: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  bubbleAi: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTime: {
    fontSize: 9.5,
    alignSelf: 'flex-end',
  },

  // Interactive Card Actions inside chat
  cardActionGroup: {
    gap: 6,
    marginTop: 4,
  },
  cardActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  cardActionSuccess: {
    backgroundColor: '#059669',
  },
  cardActionPrimary: {
    backgroundColor: '#2563eb',
  },
  cardActionWarning: {
    backgroundColor: '#d97706',
  },
  cardActionDanger: {
    backgroundColor: '#ef4444',
  },
  cardActionNeutral: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cardActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },

  typingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  typingText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Uncluttered Adaptive 3-Pill Action Row
  chipRowUncluttered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  chipSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  chipTextSuccess: {
    color: '#059669',
    fontWeight: '800',
  },
  chipWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  chipTextWarning: {
    color: '#b45309',
    fontWeight: '800',
  },
  chipEmergency: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextEmergency: {
    color: '#dc2626',
    fontWeight: '800',
  },

  // Footer Input Bar
  footerInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
  },
  inputField: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12.5,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  // Parts Picker Card Styles
  partsCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 6,
    gap: 10,
  },
  partsCardContainerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  partsCardHeader: {
    gap: 2,
  },
  partsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  partsBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  partsHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
  },
  partsHeaderSub: {
    fontSize: 11,
    color: '#64748b',
  },
  partsTradeScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  partsTradePill: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  partsTradePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  partsTradePillDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  partsTradePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  partsTradePillTextActive: {
    color: '#ffffff',
  },
  partsSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    gap: 6,
  },
  partsSearchBoxDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  partsSearchInput: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 0,
  },
  partsList: {
    gap: 6,
  },
  partsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 8,
  },
  partsItemRowSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  partsItemRowDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  partsItemRowDarkSelected: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  partsCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partsCheckboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  partsItemTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e293b',
  },
  partsItemTitleSelected: {
    color: '#065f46',
    fontWeight: '700',
  },
  partsTagRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  typeBadgePart: {
    backgroundColor: '#e0f2fe',
  },
  typeBadgeLabor: {
    backgroundColor: '#f3e8ff',
  },
  typeBadgeRepair: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  typeBadgePartText: {
    color: '#0284c7',
  },
  typeBadgeLaborText: {
    color: '#7c3aed',
  },
  typeBadgeRepairText: {
    color: '#d97706',
  },
  partsItemPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
  },
  partsEmptyState: {
    padding: 12,
    alignItems: 'center',
  },
  partsEmptyText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  customSection: {
    marginTop: 2,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 6,
    backgroundColor: '#ecfdf5',
  },
  addCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  customFormBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  customFormBoxDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  customFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customFormTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  customInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 30,
    fontSize: 11,
  },
  customInputDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    color: '#ffffff',
  },
  typeSegmentedGroup: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  typeSegmentedBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeSegmentedBtnDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  typeSegmentedBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeSegmentedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeSegmentedBtnTextActive: {
    color: '#ffffff',
  },
  addCustomSubmitBtn: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addCustomSubmitBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  notesInputCompact: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 30,
    fontSize: 10.5,
  },
  notesInputCompactDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#ffffff',
  },
  partsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  partsFooterDark: {
    borderTopColor: '#334155',
  },
  partsTotalCount: {
    fontSize: 10.5,
    color: '#64748b',
  },
  partsTotalSum: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
  },
  submitEstimateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  submitEstimateBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitEstimateBtnDone: {
    backgroundColor: '#10b981',
  },
  submitEstimateBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ---------------------------------------------------------------------------
  // JOB & REQUEST LIST CARD STYLES
  // ---------------------------------------------------------------------------
  jobListCardContainer: {
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  jobListCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  jobListCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobListCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  jobListCountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  jobListCountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  jobListCardSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  jobListFilterScroll: {
    borderBottomWidth: 1,
  },
  jobListFilterContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  jobListFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobListFilterPillActive: {
    backgroundColor: '#0f172a',
  },
  jobListFilterPillActiveAmber: {
    backgroundColor: '#d97706',
  },
  jobListFilterPillActiveBlue: {
    backgroundColor: '#2563eb',
  },
  jobListFilterPillActiveGreen: {
    backgroundColor: '#059669',
  },
  jobListFilterText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  jobListFilterTextActive: {
    color: '#ffffff',
  },
  jobListFilterTextActiveAmber: {
    color: '#ffffff',
  },
  jobListFilterTextActiveBlue: {
    color: '#ffffff',
  },
  jobListFilterTextActiveGreen: {
    color: '#ffffff',
  },
  jobListItems: {
    flexDirection: 'column',
  },
  jobListItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  jobListItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  jobCodeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  jobStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencyPill: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#dc2626',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillProgress: {
    backgroundColor: '#ecfdf5',
  },
  statusTextProgress: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  statusPillAccepted: {
    backgroundColor: '#eff6ff',
  },
  statusTextAccepted: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#2563eb',
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
  },
  statusTextPending: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#d97706',
  },
  statusPillDefault: {
    backgroundColor: '#f1f5f9',
  },
  statusTextDefault: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'capitalize',
  },
  jobServiceDesc: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  jobListItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 4,
  },
  jobTimingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobTimingText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  jobWageAndAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobWageBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  jobWageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  jobWageSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
  },
  jobActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  jobActionPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  jobListEmptyText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
});




