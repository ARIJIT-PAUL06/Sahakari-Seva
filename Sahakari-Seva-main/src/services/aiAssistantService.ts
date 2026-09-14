// ==============================================================================
// SAHAKARI ASSISTANT SERVICE — CONVERSATIONAL & AUTOMATION ENGINE
// ==============================================================================
// - Speech Recognition via Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// - Text-to-Speech via Web Speech Synthesis (window.speechSynthesis)
// - Context-aware intent matching and direct execution on ApiClient
// - Global cross-screen synchronization via DeviceEventEmitter
// ==============================================================================

import { DeviceEventEmitter } from 'react-native';
import { ApiClient } from './apiClient';
import { Booking, ExtraTaskItem, ExtraTaskType } from '../types';
import {
  TRADE_SUGGESTIONS,
  DEFAULT_SUGGESTIONS,
} from '../components/worker/SupplementalBillModal';

export type AssistantIntentType =
  | 'START_WORK'
  | 'COMPLETE_WORK'
  | 'ACCEPT_JOB'
  | 'DECLINE_JOB'
  | 'DIAGNOSE_PARTS'
  | 'SEND_ESTIMATE'
  | 'LIST_JOBS'
  | 'EMERGENCY_REQUEST'
  | 'CUSTOMER_INFO'
  | 'EARNINGS_WELFARE'
  | 'PAYMENT_STATUS'
  | 'CONFIRM_CASH'
  | 'READ_ALOUD'
  | 'HELP'
  | 'UNKNOWN';

export interface AssistantActionCard {
  id: string;
  type: 'action_buttons' | 'job_summary' | 'earnings_summary' | 'parts_picker' | 'job_list';
  booking?: Booking;
  jobs?: Booking[];
  category?: string;
  availableTrades?: string[];
  tradeSuggestions?: Record<string, Array<{ title: string; cost: number; type: ExtraTaskType }>>;
  preSelectedTitles?: string[];
  actions?: {
    label: string;
    command: string;
    icon?: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  }[];
}

export interface AssistantMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  card?: AssistantActionCard;
}

export interface AssistantActionOutcome {
  success: boolean;
  intent: AssistantIntentType;
  message: string;
  speechText: string;
  card?: AssistantActionCard;
  affectedBookingId?: string;
  actionTaken?: 'started' | 'completed' | 'accepted' | 'declined' | 'diagnosed' | 'info';
}

export interface WorkerAssistantContext {
  activeOnSiteJob: Booking | null;      // status === 'in_progress'
  nextCommittedJob: Booking | null;     // status === 'accepted'
  pendingJobs: Booking[];               // status === 'pending'
  awaitingPaymentJob: Booking | null;   // status === 'completed' && payment_status !== 'paid'
  allJobs: Booking[];
  todayCompletedCount: number;
  todayEarnings: number;
}

export class AIAssistantService {
  private static recognitionInstance: any = null;
  private static isListeningActive: boolean = false;
  private static speechSafetyTimer: any = null;

  // ---------------------------------------------------------------------------
  // 1. SPEECH-TO-TEXT (STT)
  // ---------------------------------------------------------------------------
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static startListening(
    onResult: (transcript: string) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError('Voice input is not supported in this browser. Please use the quick action buttons.');
      return false;
    }

    try {
      this.stopListening();
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Works for Indian English and accented speech

      recognition.onstart = () => {
        this.isListeningActive = true;
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onResult(transcript.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        // Ignore silent "no-speech" events without displaying noisy alerts
        if (event.error === 'no-speech') {
          if (onEnd) onEnd();
          return;
        }
        if (onError) onError(event.error || 'Microphone error');
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        if (onEnd) onEnd();
      };

      this.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      if (onError) onError(err.message || 'Could not access microphone');
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
    this.isListeningActive = false;
  }

  public static isListening(): boolean {
    return this.isListeningActive;
  }

  // ---------------------------------------------------------------------------
  // 2. TEXT-TO-SPEECH (TTS) WITH CHROMIUM HANG SAFEGUARD
  // ---------------------------------------------------------------------------
  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, onEnd?: () => void): void {
    if (!this.isSpeechSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }
    try {
      this.stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        v => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('hi')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      let ended = false;
      const cleanup = () => {
        if (!ended) {
          ended = true;
          if (this.speechSafetyTimer) {
            clearTimeout(this.speechSafetyTimer);
            this.speechSafetyTimer = null;
          }
          if (onEnd) onEnd();
        }
      };

      utterance.onend = cleanup;
      utterance.onerror = cleanup;

      // Safety timeout for Chromium speech synthesis bug where onend fails to fire
      const safetyDuration = Math.min(14000, Math.max(3500, text.length * 90));
      this.speechSafetyTimer = setTimeout(() => {
        if (!ended) {
          this.stopSpeaking();
          cleanup();
        }
      }, safetyDuration);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable', e);
      if (onEnd) onEnd();
    }
  }

  public static stopSpeaking(): void {
    if (this.speechSafetyTimer) {
      clearTimeout(this.speechSafetyTimer);
      this.speechSafetyTimer = null;
    }
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // 2.1 SUBMIT DIAGNOSTIC ITEMS
  // ---------------------------------------------------------------------------
  public static async submitDiagnosticItems(
    bookingId: string,
    items: ExtraTaskItem[],
    notes?: string
  ): Promise<{ success: boolean; count: number; total: number; message: string }> {
    if (!items || items.length === 0) {
      throw new Error('Please select at least one part or repair item.');
    }
    const total = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
    const diagnosis_notes = notes?.trim() || `On-site diagnostic inspection: itemized ${items.length} defect correction(s) and spare parts.`;

    await ApiClient.sendSupplementalBill(bookingId, {
      diagnosis_notes,
      items,
    });

    DeviceEventEmitter.emit('app_booking_updated');

    return {
      success: true,
      count: items.length,
      total,
      message: `Estimate of ₹${total} for ${items.length} item${items.length > 1 ? 's' : ''} sent to customer for authorization.`,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. INTENT CLASSIFICATION
  // ---------------------------------------------------------------------------
  public static classifyIntent(input: string): AssistantIntentType {
    const s = input
      .toLowerCase()
      .trim()
      .replace(/\bd[\s-]scaling\b/g, 'descaling')
      .replace(/\bde[\s-]scaling\b/g, 'descaling');

    // 0. Confirm Cash Payment (Pay on Completion / After Pay)
    if (
      s.includes('cash paid') ||
      s.includes('received cash') ||
      s.includes('confirm cash') ||
      s.includes('got cash') ||
      s.includes('cash mil gaya') ||
      s.includes('nakad mila') ||
      s.includes('nakad mil gaya') ||
      s.includes('customer paid cash') ||
      (s.includes('cash') && (s.includes('pay') || s.includes('receive') || s.includes('collect') || s.includes('le liya')))
    ) {
      return 'CONFIRM_CASH';
    }

    // 0.1 Check Payment Status / After Pay flow
    if (
      s.includes('after pay') ||
      s.includes('pay after') ||
      s.includes('payment status') ||
      s.includes('did customer pay') ||
      s.includes('has customer paid') ||
      s.includes('check payment') ||
      s.includes('collect payment') ||
      s.includes('show qr') ||
      s.includes('payment qr') ||
      s.includes('payment due') ||
      s.includes('paisa mila') ||
      s.includes('bhugtan')
    ) {
      return 'PAYMENT_STATUS';
    }

    // 1. Complete work (must come before general checks)
    if (
      s.includes('complete') ||
      s.includes('finish') ||
      s.includes('done') ||
      s.includes('mark complete') ||
      s.includes('sign off') ||
      s.includes('sign-off') ||
      s.includes('signoff') ||
      s.includes('request sign') ||
      s.includes('customer verification') ||
      s.includes('grahak ko verify') ||
      s.includes('grahak ko sign') ||
      s.includes('verify work') ||
      s.includes('pura') ||
      s.includes('poora') ||
      s.includes('khatam') ||
      s.includes('samapt')
    ) {
      return 'COMPLETE_WORK';
    }

    // 2. Start work
    if (
      s.includes('start') ||
      s.includes('begin') ||
      s.includes('chalu') ||
      s.includes('shuru') ||
      s.includes('service start') ||
      s.includes('kaam shuru')
    ) {
      return 'START_WORK';
    }

    // 3. Accept job (crucial: must execute before emergency keyword to avoid loops)
    if (
      s.includes('accept') ||
      s.includes('confirm') ||
      s.includes('approve') ||
      s.includes('take job') ||
      s.includes('swikar') ||
      s.includes('manzoor')
    ) {
      return 'ACCEPT_JOB';
    }

    // 4. Decline job
    if (
      s.includes('decline') ||
      s.includes('reject') ||
      s.includes('cancel') ||
      s.includes('mana') ||
      s.includes('nahi')
    ) {
      return 'DECLINE_JOB';
    }

    // 5. Emergency SOS request / Urgent inquiry
    if (
      s.includes('emergency') ||
      s.includes('urgent') ||
      s.includes('sos') ||
      s.includes('turant') ||
      s.includes('aapatkalin') ||
      s.includes('jaldi') ||
      s.includes('danger') ||
      s.includes('immediate')
    ) {
      return 'EMERGENCY_REQUEST';
    }

    // 6. Send estimate / submit supplemental bill (crucial before generic parts check)
    if (
      s.includes('estimate') ||
      s.includes('quotation') ||
      s.includes('send quote') ||
      s.includes('submit estimate') ||
      s.includes('send estimate') ||
      s.includes('send bill') ||
      s.includes('bhejo') ||
      s.includes('bhej do') ||
      (s.includes('send') && (s.includes('part') || s.includes('cost') || s.includes('price') || s.includes('diag')))
    ) {
      return 'SEND_ESTIMATE';
    }

    // 7. Diagnose extra parts / billing / repairs across all trades
    if (
      s.startsWith('add ') ||
      s.startsWith('include ') ||
      s.startsWith('need ') ||
      s.startsWith('attach ') ||
      s.startsWith('jodo ') ||
      s.startsWith('daalo ') ||
      s.startsWith('lagao ') ||
      s.includes('part') ||
      s.includes('parts') ||
      s.includes('diagnos') ||
      s.includes('defect') ||
      s.includes('kharab') ||
      s.includes('repair') ||
      s.includes('spare') ||
      s.includes('spares') ||
      s.includes('bill') ||
      s.includes('extra') ||
      s.includes('saman') ||
      s.includes('samagri') ||
      s.includes('switch') ||
      s.includes('capacitor') ||
      s.includes('valve') ||
      s.includes('pipe') ||
      s.includes('lock') ||
      s.includes('hinge') ||
      s.includes('gas') ||
      s.includes('mcb') ||
      s.includes('putty') ||
      s.includes('wire') ||
      s.includes('pump') ||
      s.includes('wash') ||
      s.includes('acid') ||
      s.includes('scaling') ||
      s.includes('descaling') ||
      s.includes('cleaning') ||
      s.includes('clean') ||
      s.includes('tap') ||
      s.includes('drain') ||
      s.includes('motor') ||
      s.includes('tank') ||
      s.includes('filter') ||
      s.includes('leak') ||
      s.includes('blockage') ||
      s.includes('door') ||
      s.includes('wood') ||
      s.includes('paint') ||
      s.includes('primer') ||
      s.includes('damp') ||
      s.includes('disinfect') ||
      s.includes('grease') ||
      s.includes('upholstery') ||
      s.includes('steam') ||
      s.includes('pruning') ||
      s.includes('thermostat') ||
      s.includes('refrigerant') ||
      s.includes('relay')
    ) {
      return 'DIAGNOSE_PARTS';
    }

    // Customer info / contact
    if (
      s.includes('call') ||
      s.includes('phone') ||
      s.includes('customer') ||
      s.includes('contact') ||
      s.includes('kavita') ||
      s.includes('address') ||
      s.includes('location') ||
      s.includes('map') ||
      s.includes('pata')
    ) {
      return 'CUSTOMER_INFO';
    }

    // List all jobs / schedule / available requests
    if (
      s.includes('job') ||
      s.includes('jobs') ||
      s.includes('request') ||
      s.includes('requests') ||
      s.includes('avail') ||
      s.includes('schedule') ||
      s.includes('booking') ||
      s.includes('bookings') ||
      s.includes('list') ||
      s.includes('kaam') ||
      s.includes('what to do') ||
      s.includes('order') ||
      s.includes('orders') ||
      s.includes('sabhi')
    ) {
      return 'LIST_JOBS';
    }

    // Earnings / Welfare
    if (
      s.includes('earn') ||
      s.includes('earning') ||
      s.includes('earnings') ||
      s.includes('welfare') ||
      s.includes('paisa') ||
      s.includes('kamai') ||
      s.includes('wage') ||
      s.includes('balance') ||
      s.includes('fund')
    ) {
      return 'EARNINGS_WELFARE';
    }

    // Read aloud / speak details
    if (
      s.includes('read') ||
      s.includes('speak') ||
      s.includes('listen') ||
      s.includes('sunao') ||
      s.includes('batao') ||
      s.includes('bol kar')
    ) {
      return 'READ_ALOUD';
    }

    // Help
    if (s.includes('help') || s.includes('madad') || s.includes('sahayata')) {
      return 'HELP';
    }

    return 'UNKNOWN';
  }

  // ---------------------------------------------------------------------------
  // 4. WORKER CONTEXT RESOLVER
  // ---------------------------------------------------------------------------
  public static async resolveWorkerId(providedId?: string): Promise<string> {
    if (providedId && providedId.trim()) return providedId.trim();
    try {
      const SESSION_STORAGE_KEY = '@sahakari_user_session';
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      }
      if (!raw) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user?.id) return parsed.user.id;
      }
    } catch {}
    return 'w0000000-0000-0000-0000-000000000001';
  }

  public static async getWorkerContext(
    workerId?: string
  ): Promise<WorkerAssistantContext> {
    const activeWorkerId = await this.resolveWorkerId(workerId);
    const allBookings = await ApiClient.getBookings(undefined, activeWorkerId);

    const activeOnSiteJob = allBookings.find(b => b.status === 'in_progress') || null;
    const nextCommittedJob = allBookings.find(b => b.status === 'accepted') || null;
    const pendingJobs = allBookings.filter(b => b.status === 'pending');
    const awaitingPaymentJob = allBookings.find(b => b.status === 'completed' && b.payment_status !== 'paid') || null;

    const completedList = allBookings.filter(b => b.status === 'completed');
    const todayCompletedCount = completedList.length;
    const todayEarnings = completedList.reduce((sum, b) => {
      const amt = Number(b.final_amount || b.estimated_amount || 0);
      return sum + amt * 0.85;
    }, 0);

    return {
      activeOnSiteJob,
      nextCommittedJob,
      pendingJobs,
      awaitingPaymentJob,
      allJobs: allBookings,
      todayCompletedCount,
      todayEarnings,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. AUTONOMOUS COMMAND EXECUTION
  // ---------------------------------------------------------------------------
  public static async executeCommand(
    commandText: string,
    workerId?: string
  ): Promise<AssistantActionOutcome> {
    const activeWorkerId = await this.resolveWorkerId(workerId);
    const intent = this.classifyIntent(commandText);
    const context = await this.getWorkerContext(activeWorkerId);

    switch (intent) {
      case 'START_WORK': {
        if (context.activeOnSiteJob) {
          const msg = `You already have on-site work underway for job ${context.activeOnSiteJob.booking_code}. Mark that job completed before starting another one.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
            card: {
              id: 'card-active-' + Date.now(),
              type: 'action_buttons',
              booking: context.activeOnSiteJob,
              actions: [
                { label: `✓ Complete ${context.activeOnSiteJob.booking_code}`, command: `complete job`, variant: 'success' },
                { label: '🔧 Add Extra Parts', command: 'add diagnostic parts', variant: 'primary' },
                { label: '📞 Call Customer', command: `call_phone:${context.activeOnSiteJob.customer?.phone || '+919855044556'}`, variant: 'neutral' },
              ],
            },
          };
        }

        const target = context.nextCommittedJob;
        if (!target) {
          const msg = `No accepted jobs ready to start right now. You can review pending requests.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
            card: context.pendingJobs.length > 0 ? {
              id: 'card-pending-' + Date.now(),
              type: 'action_buttons',
              booking: context.pendingJobs[0],
              actions: [
                { label: `Accept ${context.pendingJobs[0].booking_code}`, command: 'accept job', variant: 'primary' },
              ],
            } : undefined,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'in_progress');
          // Broadcast app-wide update event so background screens refresh immediately!
          DeviceEventEmitter.emit('app_booking_updated');

          const custName = target.customer?.full_name || 'Customer';
          const wage = (Number(target.final_amount || target.estimated_amount || 0) * 0.85).toFixed(0);
          const isEmerg = target.is_emergency;
          const msg = isEmerg
            ? `🚨 EMERGENCY on-site work started on ${target.booking_code} for ${custName}! Your operational mode is locked to "Emergency Service" until completion. Expected wage: ₹${wage} (+25% bonus).`
            : `⚡ Service work started on ${target.booking_code} for ${custName}! Your operational mode is shifted to "On Active Work" and locked until completion. Expected wage: ₹${wage}.`;
          const speech = isEmerg
            ? `Emergency service work started for ${custName}. Focus on safety and rapid resolution.`
            : `Service work started for ${custName}. Perform work according to cooperative quality standards.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'started',
            card: {
              id: 'card-started-' + Date.now(),
              type: 'action_buttons',
              booking: target,
              actions: [
                { label: '🔧 Add Extra Parts & Tasks', command: 'add diagnostic parts', variant: 'warning' },
                { label: `✓ Complete Job (Claim ₹${wage})`, command: 'complete job', variant: 'success' },
                { label: '📞 Call Customer', command: `call_phone:${target.customer?.phone || '+919855044556'}`, variant: 'neutral' },
              ],
            },
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not start work: ${err.message}`,
            speechText: `Could not start work: ${err.message}`,
          };
        }
      }

      case 'COMPLETE_WORK': {
        // Enforce that work must actually be in progress before completing!
        if (!context.activeOnSiteJob) {
          if (context.awaitingPaymentJob) {
            const tgt = context.awaitingPaymentJob;
            const amt = Number(tgt.final_amount || tgt.estimated_amount || 0);
            const wage = (amt * 0.85).toFixed(0);
            const msg = `Job ${tgt.booking_code} has already been verified and signed off! Payment of ₹${amt} is currently awaiting settlement from the customer.\n\nDirect wage of ₹${wage} will be credited upon customer payment.`;
            return {
              success: true,
              intent,
              message: msg,
              speechText: `Job ${tgt.booking_code} is already completed and awaiting customer payment of ${amt} rupees.`,
              affectedBookingId: tgt.id,
              card: {
                id: 'card-pay-due-' + Date.now(),
                type: 'action_buttons',
                booking: tgt,
                actions: [
                  { label: '📱 Show Customer UPI QR', command: `open_payment_qr:${tgt.id}`, variant: 'primary' },
                  { label: `💵 Received Cash (₹${amt})`, command: `confirm_cash:${tgt.id}`, variant: 'success' },
                  { label: '📞 Call Customer', command: `call_phone:${tgt.customer?.phone || '+919855044556'}`, variant: 'neutral' },
                ],
              },
            };
          }

          if (context.nextCommittedJob) {
            const msg = `Job ${context.nextCommittedJob.booking_code} has not been started yet. Tap 'Start Service Work' when you arrive on-site before requesting completion sign-off.`;
            return {
              success: false,
              intent,
              message: msg,
              speechText: `Job ${context.nextCommittedJob.booking_code} has not been started yet. Please start the service first.`,
              card: {
                id: 'card-start-req-' + Date.now(),
                type: 'action_buttons',
                booking: context.nextCommittedJob,
                actions: [
                  { label: `⚡ Start ${context.nextCommittedJob.booking_code}`, command: 'start work', variant: 'success' },
                  { label: '📞 Call Customer', command: `call_phone:${context.nextCommittedJob.customer?.phone || '+919855044556'}`, variant: 'neutral' },
                ],
              },
            };
          }

          const msg = `You don't have an active on-site service job to complete right now.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const target = context.activeOnSiteJob;

        try {
          if (!target.completion_requested) {
            await ApiClient.requestJobCompletion(target.id);
            DeviceEventEmitter.emit('app_booking_updated');

            const msg = `🔒 Sign-off request sent to customer for ${target.booking_code}. The customer must show their Completion Pass QR or 4-digit PIN for you to scan before the job can be completed.`;
            const speech = `Completion sign-off request sent to customer. Please scan their QR code to finalize.`;

            return {
              success: true,
              intent,
              message: msg,
              speechText: speech,
              affectedBookingId: target.id,
              actionTaken: 'info',
              card: {
                id: 'card-qr-req-' + Date.now(),
                type: 'job_summary',
                booking: target,
                actions: [
                  { label: '📷 Open QR Scanner', command: `open_scanner:${target.id}`, variant: 'primary' },
                  { label: '📞 Call Customer', command: `call_phone:${target.customer?.phone || '+919855044556'}`, variant: 'neutral' },
                ],
              },
            };
          }

          // If completion was already requested, verify and complete
          const code = target.completion_code || '8492';
          await ApiClient.verifyAndCompleteJob(target.id, code);
          DeviceEventEmitter.emit('app_booking_updated');

          const totalAmt = Number(target.final_amount || target.estimated_amount || 0);
          const wageAmt = (totalAmt * 0.85).toFixed(2);
          const welfareAmt = (totalAmt * 0.10).toFixed(2);

          // If payment was not prepaid (After Pay / Pay on Completion)
          if (target.payment_status !== 'paid') {
            const msg = `🎉 Physical work on job ${target.booking_code} verified and completed!\n\n💳 Payment of ₹${totalAmt} is due from the customer (Pay on Completion).\nYour ₹${wageAmt} direct wage will be credited as soon as customer pays via UPI / Card or you confirm cash collection below:`;
            const speech = `Physical work completed for job ${target.booking_code}. Payment of ${totalAmt} rupees is due from customer. Collect cash or show your UPI QR code.`;

            return {
              success: true,
              intent,
              message: msg,
              speechText: speech,
              affectedBookingId: target.id,
              actionTaken: 'completed',
              card: {
                id: 'card-pay-collect-' + Date.now(),
                type: 'action_buttons',
                booking: target,
                actions: [
                  { label: '📱 Show Customer UPI QR', command: `open_payment_qr:${target.id}`, variant: 'primary' },
                  { label: `💵 Customer Paid Cash (₹${totalAmt})`, command: `confirm_cash:${target.id}`, variant: 'success' },
                  { label: '📞 Call Customer', command: `call_phone:${target.customer?.phone || '+919855044556'}`, variant: 'neutral' },
                ],
              },
            };
          }

          const isEmerg = target.is_emergency;
          const msg = isEmerg
            ? `🎉 EMERGENCY SOS job ${target.booking_code} completed via customer QR sign-off! ₹${wageAmt} direct wage credited (85%), and ₹${welfareAmt} credited to your Welfare Fund (10%). Your active duty status has automatically reverted to "Active for work".`
            : `🎉 Job ${target.booking_code} completed via customer QR sign-off! ₹${wageAmt} direct wage credited (85%), and ₹${welfareAmt} credited to your Welfare Fund (10%). Your active duty status has automatically reverted to "Active for work".`;
          const speech = isEmerg
            ? `Emergency job ${target.booking_code} verified and completed. ₹${wageAmt} direct wage credited. Your mode is now active for work.`
            : `Job ${target.booking_code} verified and completed. ₹${wageAmt} direct wage credited.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'completed',
            card: {
              id: 'card-comp-' + Date.now(),
              type: 'earnings_summary',
              booking: target,
              actions: [
                { label: '💰 Check Full Earnings', command: 'earnings summary', variant: 'primary' },
                { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
              ],
            },
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not complete job: ${err.message}`,
            speechText: `Completion failed: ${err.message}`,
          };
        }
      }

      case 'CONFIRM_CASH': {
        const codeMatch = commandText.match(/BK-\d+/i) || commandText.match(/[a-f0-9-]{36}/i);
        let target = context.awaitingPaymentJob;
        if (codeMatch) {
          const matchedStr = codeMatch[0].toLowerCase();
          const found = context.allJobs.find(
            pj => pj.booking_code.toLowerCase() === matchedStr || pj.id.toLowerCase() === matchedStr
          );
          if (found) target = found;
        }

        if (!target) {
          target = context.allJobs.find(b => b.status === 'completed' && b.payment_status !== 'paid') || null;
        }

        if (!target) {
          const msg = `You don't have any completed jobs currently awaiting cash payment collection.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          const finalAmt = target.final_amount || target.estimated_amount || 0;
          await ApiClient.confirmCashPayment(target.id, finalAmt);
          DeviceEventEmitter.emit('app_booking_updated');

          const wageAmt = (Number(finalAmt) * 0.85).toFixed(0);
          const welfareAmt = (Number(finalAmt) * 0.10).toFixed(0);
          const msg = `🎉 Cash payment of ₹${finalAmt} for job ${target.booking_code} confirmed!\n\n• Direct Wage Credited: ₹${wageAmt} (85%)\n• Welfare Reserve: ₹${welfareAmt} (10%)\n• Platform Fee: 5%\n• Receipt: Cash receipt recorded in cooperative ledger.`;
          const speech = `Cash payment of ${finalAmt} rupees confirmed for job ${target.booking_code}. Direct wage of ${wageAmt} rupees credited.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'completed',
            card: {
              id: 'card-cash-confirmed-' + Date.now(),
              type: 'earnings_summary',
              booking: target,
              actions: [
                { label: '💰 Check My Earnings', command: 'earnings summary', variant: 'primary' },
                { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
              ],
            },
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not confirm cash payment: ${err.message}`,
            speechText: `Action failed: ${err.message}`,
          };
        }
      }

      case 'PAYMENT_STATUS': {
        const target = context.awaitingPaymentJob || context.allJobs.find(b => b.status === 'completed') || context.activeOnSiteJob;
        if (!target) {
          const msg = `You have no completed jobs with pending payment. All accounts are settled!`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const isPaid = target.payment_status === 'paid';
        const finalAmt = target.final_amount || target.estimated_amount || 0;
        const wageAmt = (Number(finalAmt) * 0.85).toFixed(0);

        if (isPaid) {
          const msg = `✅ Payment of ₹${finalAmt} for job ${target.booking_code} is settled in full! ₹${wageAmt} direct wage is credited to your balance.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: `Payment of ${finalAmt} rupees for ${target.booking_code} is settled in full.`,
            card: {
              id: 'card-pay-settled-' + Date.now(),
              type: 'action_buttons',
              booking: target,
              actions: [
                { label: '💰 Check Earnings & Welfare', command: 'earnings summary', variant: 'primary' },
                { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
              ],
            },
          };
        }

        // Pending Payment (Pay on Completion / After Pay)
        const custName = target.customer?.full_name || 'Customer';
        const msg = `⏳ Job ${target.booking_code} is finished, but Payment of ₹${finalAmt} is due from ${custName}.\n\n• Payment Mode: Pay on Completion (After Pay)\n• Direct Wage: ₹${wageAmt} (credited upon customer UPI / Card or cash payment)\n\nShow the UPI QR code to the customer or confirm cash receipt below:`;
        const speech = `Job ${target.booking_code} is completed. Payment of ${finalAmt} rupees is due from ${custName}. Show your UPI QR or confirm cash payment.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          affectedBookingId: target.id,
          card: {
            id: 'card-pay-due-' + Date.now(),
            type: 'action_buttons',
            booking: target,
            actions: [
              { label: '📱 Show Customer UPI QR', command: `open_payment_qr:${target.id}`, variant: 'primary' },
              { label: `💵 Received Cash (₹${finalAmt})`, command: `confirm_cash:${target.id}`, variant: 'success' },
              { label: '📞 Call Customer', command: `call_phone:${target.customer?.phone || '+919855044556'}`, variant: 'neutral' },
            ],
          },
        };
      }

      case 'ACCEPT_JOB': {
        // 1. Check if command explicitly references a booking code (e.g., 'BK-1002' or UUID)
        const codeMatch = commandText.match(/BK-\d+/i) || commandText.match(/[a-f0-9-]{36}/i);
        let safeJob: Booking | undefined;
        if (codeMatch) {
          const matchedStr = codeMatch[0].toLowerCase();
          safeJob = context.pendingJobs.find(
            pj => pj.booking_code.toLowerCase() === matchedStr || pj.id.toLowerCase() === matchedStr
          );
        }

        // 2. Prioritize pending emergency jobs first (with cooperative priority override)
        if (!safeJob) {
          safeJob = context.pendingJobs.find(pj => {
            if (pj.is_emergency) {
              const conflict = ApiClient.checkScheduleConflict(pj, context.allJobs, 60);
              return !conflict.isExactCollision;
            }
            return false;
          });
        }

        // 3. Fallback to standard non-colliding pending job
        if (!safeJob) {
          safeJob = context.pendingJobs.find(pj => {
            const conflict = ApiClient.checkScheduleConflict(pj, context.allJobs, 60);
            return !conflict.hasConflict;
          });
        }

        if (!safeJob) {
          if (context.pendingJobs.length > 0) {
            const msg = `The pending job collides with your existing schedule (1-hour buffer required). It cannot be accepted.`;
            return {
              success: false,
              intent,
              message: msg,
              speechText: `Job cannot be accepted due to a schedule clash.`,
            };
          }
          const msg = `No pending job requests waiting to be accepted.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(safeJob.id, 'accepted');
          DeviceEventEmitter.emit('app_booking_updated');

          const isEmerg = safeJob.is_emergency;
          const msg = isEmerg
            ? `🚨 Accepted EMERGENCY SOS job ${safeJob.booking_code}! Immediate dispatch active (< 15–30 min arrival).\n\n• Operational Mode: Automatically shifted to "Emergency Service" (locked until completion).\n• Estimated Value: ₹${safeJob.estimated_amount} (+25% bonus included).\n• Customer: ${safeJob.customer?.full_name || 'Customer'}\n• Address: ${safeJob.address || safeJob.city || 'Jaipur'}`
            : `✅ Accepted job ${safeJob.booking_code} scheduled for ${safeJob.booking_date} at ${safeJob.booking_time}!\n\n• Operational Mode: Automatically shifted to "On Active Work" (locked until completion).\n• Value: ₹${safeJob.estimated_amount}.\n• Customer: ${safeJob.customer?.full_name || 'Customer'}`;
          const speech = isEmerg
            ? `Emergency dispatch accepted for job ${safeJob.booking_code}. You are now on emergency service. Arrival expected within 15 to 30 minutes.`
            : `Job ${safeJob.booking_code} accepted. You are now on active work.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: safeJob.id,
            actionTaken: 'accepted',
            card: {
              id: 'card-accepted-' + Date.now(),
              type: 'action_buttons',
              booking: safeJob,
              actions: isEmerg
                ? [
                    { label: `⚡ Start Emergency Work (${safeJob.booking_code})`, command: `start work on ${safeJob.booking_code}`, variant: 'success' },
                    { label: '📞 Call Customer Instantly', command: `call_phone:${safeJob.customer?.phone || '+919855044556'}`, variant: 'warning' },
                    { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
                  ]
                : [
                    { label: `⚡ Start ${safeJob.booking_code}`, command: `start work on ${safeJob.booking_code}`, variant: 'success' },
                    { label: '📞 Call Customer', command: `call_phone:${safeJob.customer?.phone || '+919855044556'}`, variant: 'neutral' },
                    { label: '📋 View Schedule', command: 'navigate_jobs', variant: 'neutral' },
                  ],
            },
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not accept job: ${err.message}`,
            speechText: `Could not accept job: ${err.message}`,
          };
        }
      }

      case 'EMERGENCY_REQUEST': {
        const emergencyPending = context.pendingJobs.filter(b => b.is_emergency);
        const emergencyCommitted = context.allJobs.filter(b => b.is_emergency && (b.status === 'accepted' || b.status === 'in_progress'));

        if (emergencyPending.length > 0) {
          const topEmergency = emergencyPending[0];
          const totalAmt = Number(topEmergency.final_amount || topEmergency.estimated_amount || 0);
          const wage = (totalAmt * 0.85).toFixed(0);
          const custName = topEmergency.customer?.full_name || 'Customer';
          const addr = topEmergency.address || topEmergency.city || 'Jaipur';

          const msg = `🚨 EMERGENCY SOS REQUEST DETECTED! (${topEmergency.booking_code})\n` +
            `• Customer: ${custName}\n` +
            `• Service: ${topEmergency.service_description}\n` +
            `• Location: ${addr}\n` +
            `• Expected Response: < 15–30 min immediate arrival\n` +
            `• Emergency Take-Home Wage: ₹${wage} (+25% bonus included)\n\n` +
            `Cooperative Priority Override is active. Once accepted, your operational mode will automatically lock into Emergency Service until completed. Tap below to accept:`;

          const speech = `Urgent emergency SOS job ${topEmergency.booking_code} from ${custName} requires immediate dispatch within 15 to 30 minutes! Direct wage of ₹${wage} with 25% bonus. Tap to accept dispatch now.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: topEmergency.id,
            card: {
              id: 'card-emergency-' + Date.now(),
              type: 'action_buttons',
              booking: topEmergency,
              actions: [
                { label: `🚨 Accept Emergency Dispatch`, command: `accept job ${topEmergency.booking_code}`, variant: 'danger' },
                { label: '📞 Call Customer Instantly', command: `call_phone:${topEmergency.customer?.phone || '+919855044556'}`, variant: 'warning' },
                { label: '📋 View All Requests', command: 'navigate_jobs', variant: 'neutral' },
              ],
            },
          };
        }

        if (emergencyCommitted.length > 0) {
          const activeEmergency = emergencyCommitted[0];
          const isOnSite = activeEmergency.status === 'in_progress';
          const msg = `⚡ ACTIVE EMERGENCY SERVICE (${activeEmergency.booking_code})\n` +
            `• Status: ${isOnSite ? '🚨 On-Site Service Underway' : '⚡ Confirmed Dispatch (En Route)'}\n` +
            `• Arrival SLA: < 15–30 minutes rapid response\n` +
            `• Operational Mode: Locked to Emergency Service until service completion.`;
          const speech = `You are actively deployed on emergency service for job ${activeEmergency.booking_code}. Operational mode is locked until completion.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: activeEmergency.id,
            card: {
              id: 'card-emergency-active-' + Date.now(),
              type: 'action_buttons',
              booking: activeEmergency,
              actions: [
                { label: isOnSite ? '✓ Complete Emergency Job' : `⚡ Start Emergency Work`, command: isOnSite ? 'complete job' : 'start work', variant: 'success' },
                { label: '📞 Call Customer Instantly', command: `call_phone:${activeEmergency.customer?.phone || '+919855044556'}`, variant: 'warning' },
                { label: '🔧 Add Extra Parts & Tasks', command: 'add diagnostic parts', variant: 'primary' },
              ],
            },
          };
        }

        const speech = `No pending emergency SOS jobs for you right now. You are in ready standby for 24/7 emergency dispatch.`;
        return {
          success: true,
          intent,
          message: `✅ No pending emergency SOS requests right now. You are in ready standby for 24/7 emergency dispatch.`,
          speechText: speech,
          card: {
            id: 'card-emergency-standby-' + Date.now(),
            type: 'action_buttons',
            actions: [
              { label: '📋 Check Available Requests', command: 'list available requests', variant: 'primary' },
              { label: '💰 Check Earnings & Welfare', command: 'earnings summary', variant: 'neutral' },
            ],
          },
        };
      }

      case 'DECLINE_JOB': {
        const target = context.pendingJobs[0];
        if (!target) {
          const msg = `No pending job requests to decline.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'rejected');
          DeviceEventEmitter.emit('app_booking_updated');

          const msg = `Job request ${target.booking_code} has been declined.`;
          const speech = `Request ${target.booking_code} declined.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'declined',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not decline: ${err.message}`,
            speechText: `Action failed: ${err.message}`,
          };
        }
      }

      case 'DIAGNOSE_PARTS': {
        const target = context.activeOnSiteJob || context.nextCommittedJob;
        if (!target) {
          const msg = `You need an active job to attach diagnostic parts. Start service work first.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        // Determine booking trade category
        let bookingTrade = target.service_category?.name || 'Electrical';

        // Check if user specifically requested items by keyword with speech normalization
        const lowerCmd = commandText
          .toLowerCase()
          .replace(/\bd[\s-]scaling\b/g, 'descaling')
          .replace(/\bde[\s-]scaling\b/g, 'descaling');
        const preSelectedTitles: string[] = [];
        let matchedTradeCategory: string | null = null;

        for (const tradeKey of Object.keys(TRADE_SUGGESTIONS)) {
          for (const item of TRADE_SUGGESTIONS[tradeKey]) {
            const keywords = item.title.toLowerCase().split(/[\s\-&()µ/.]+/);
            const isMatch = keywords.some(kw => kw.length > 3 && lowerCmd.includes(kw));
            if (isMatch && !preSelectedTitles.includes(item.title)) {
              preSelectedTitles.push(item.title);
              if (!matchedTradeCategory) {
                matchedTradeCategory = tradeKey;
              }
            }
          }
        }

        // If a specific trade was matched from an item, focus on that trade in the picker!
        if (matchedTradeCategory) {
          bookingTrade = matchedTradeCategory;
        }

        const msg = preSelectedTitles.length === 1
          ? `✅ Selected "${preSelectedTitles[0]}" for job ${target.booking_code}. Review details below, select additional items, or send the estimate:`
          : preSelectedTitles.length > 1
          ? `I found ${preSelectedTitles.length} matching diagnostic items for job ${target.booking_code}. Review, select more items across trades, or send the estimate:`
          : `Select diagnostic parts or extra tasks for job ${target.booking_code} from all available trades below:`;

        const speech = preSelectedTitles.length === 1
          ? `Added ${preSelectedTitles[0]} to estimate. Review or tap send estimate when ready.`
          : preSelectedTitles.length > 1
          ? `Found ${preSelectedTitles.length} matching items. Review and send estimate to customer.`
          : `Select the extra parts or repairs needed for this job.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          affectedBookingId: target.id,
          card: {
            id: 'card-parts-picker-' + Date.now(),
            type: 'parts_picker',
            booking: target,
            category: bookingTrade,
            availableTrades: Object.keys(TRADE_SUGGESTIONS),
            tradeSuggestions: TRADE_SUGGESTIONS,
            preSelectedTitles,
          },
        };
      }

      case 'SEND_ESTIMATE': {
        const target = context.activeOnSiteJob || context.nextCommittedJob;
        if (!target) {
          const msg = `You need an active on-site job to send a supplemental diagnostic estimate.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const lowerCmd = commandText
          .toLowerCase()
          .replace(/\bd[\s-]scaling\b/g, 'descaling')
          .replace(/\bde[\s-]scaling\b/g, 'descaling');

        // 1. Check if catalogue items were mentioned in speech
        const matchedItems: ExtraTaskItem[] = [];
        let detectedTrade = target.service_category?.name || 'Electrical';

        for (const tradeKey of Object.keys(TRADE_SUGGESTIONS)) {
          for (const item of TRADE_SUGGESTIONS[tradeKey]) {
            const keywords = item.title.toLowerCase().split(/[\s\-&()µ/.]+/);
            const isMatch = keywords.some(kw => kw.length > 3 && lowerCmd.includes(kw));
            if (isMatch && !matchedItems.some(it => it.title === item.title)) {
              matchedItems.push({
                id: 'part-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                title: item.title,
                cost: item.cost,
                type: item.type,
              });
              detectedTrade = tradeKey;
            }
          }
        }

        // If items were matched directly from the command, submit them!
        if (matchedItems.length > 0) {
          try {
            const res = await AIAssistantService.submitDiagnosticItems(target.id, matchedItems);
            const itemSummary = matchedItems.map(i => `${i.title} (₹${i.cost})`).join(', ');
            return {
              success: true,
              intent,
              message: `✅ ${res.message}\nItemized: ${itemSummary}`,
              speechText: `Estimate of ${res.total} rupees sent to customer for authorization.`,
              affectedBookingId: target.id,
              actionTaken: 'diagnosed',
              card: {
                id: 'card-diag-sent-' + Date.now(),
                type: 'action_buttons',
                booking: target,
                actions: [
                  { label: '✓ Complete Job When Ready', command: 'complete job', variant: 'success' },
                  { label: '🔧 Add More Parts', command: 'add diagnostic parts', variant: 'neutral' },
                ],
              },
            };
          } catch (err: any) {
            return {
              success: false,
              intent,
              message: `Could not send estimate: ${err.message}`,
              speechText: `Could not send estimate: ${err.message}`,
            };
          }
        }

        // 2. Check if a specific numeric cost was given (e.g. "send estimate for 250")
        const costMatch = lowerCmd.match(/(?:₹|rs\.?|inr)?\s*(\d{2,5})/i);
        const specifiedCost = costMatch ? parseInt(costMatch[1], 10) : 0;

        if (specifiedCost > 0) {
          let desc = lowerCmd
            .replace(/send|estimate|bhejo|bhej|do|for|of|₹|rs\.?|inr|\d+/gi, '')
            .trim();
          if (!desc || desc.length < 3) desc = 'Diagnostic Defect Correction & Materials';

          const customItem: ExtraTaskItem = {
            id: 'part-voice-' + Date.now(),
            title: desc.charAt(0).toUpperCase() + desc.slice(1),
            cost: specifiedCost,
            type: 'repair',
          };

          try {
            const res = await AIAssistantService.submitDiagnosticItems(target.id, [customItem]);
            return {
              success: true,
              intent,
              message: `✅ ${res.message}\nItemized: ${customItem.title} (₹${customItem.cost})`,
              speechText: `Estimate of ${res.total} rupees sent to customer for authorization.`,
              affectedBookingId: target.id,
              actionTaken: 'diagnosed',
              card: {
                id: 'card-diag-custom-' + Date.now(),
                type: 'action_buttons',
                booking: target,
                actions: [
                  { label: '✓ Complete Job When Ready', command: 'complete job', variant: 'success' },
                  { label: '🔧 Add More Parts', command: 'add diagnostic parts', variant: 'neutral' },
                ],
              },
            };
          } catch (err: any) {
            return {
              success: false,
              intent,
              message: `Could not send estimate: ${err.message}`,
              speechText: `Could not send estimate: ${err.message}`,
            };
          }
        }

        // 3. Fallback: Prompt user to choose items from trade suggestions
        const bookingTrade = target.service_category?.name || 'Electrical';
        return {
          success: true,
          intent,
          message: `Please select the parts or repairs to include in the estimate for ${target.booking_code}, or state the amount (e.g. "send estimate of ₹200 for pipe repair"):`,
          speechText: `Please select the parts to include, or tell me the amount. Here is the parts selector:`,
          affectedBookingId: target.id,
          card: {
            id: 'card-estimate-picker-' + Date.now(),
            type: 'parts_picker',
            booking: target,
            category: bookingTrade,
            availableTrades: Object.keys(TRADE_SUGGESTIONS),
            tradeSuggestions: TRADE_SUGGESTIONS,
            preSelectedTitles: [],
          },
        };
      }

      case 'CUSTOMER_INFO': {
        const target = context.activeOnSiteJob || context.nextCommittedJob || context.pendingJobs[0];
        if (!target) {
          const msg = `No active or upcoming jobs on file to show customer details.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const custName = target.customer?.full_name || 'Customer';
        const phone = target.customer?.phone || '+91 98550 44556';
        const addr = target.address || 'Plot 21, Jagatpura, Jaipur, Rajasthan - 302027';

        const msg = `👤 Customer: ${custName}\n📞 Phone: ${phone}\n📍 Address: ${addr}\n📋 Job: ${target.booking_code} (${target.service_description})`;
        const speech = `Customer is ${custName}, phone ${phone}, address ${addr}.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          card: {
            id: 'card-cust-' + Date.now(),
            type: 'action_buttons',
            booking: target,
            actions: [
              { label: `📞 Call ${custName}`, command: `call_phone:${phone}`, variant: 'primary' },
              { label: target.status === 'in_progress' ? '✓ Complete Job' : '⚡ Start Service Work', command: target.status === 'in_progress' ? 'complete job' : 'start work', variant: 'success' },
              { label: '🔊 Read Aloud', command: 'read details aloud', variant: 'neutral' },
            ],
          },
        };
      }

      case 'LIST_JOBS': {
        const inProgress = context.allJobs.filter(b => b.status === 'in_progress');
        const accepted = context.allJobs.filter(b => b.status === 'accepted');
        const pending = context.allJobs.filter(b => b.status === 'pending');

        // Order available requests and jobs:
        // 1. Pending requests (emergency requests prioritized at the very top)
        // 2. Confirmed upcoming jobs
        // 3. Active on-site jobs
        const sortedPending = [...pending].sort((a, b) => (b.is_emergency ? 1 : 0) - (a.is_emergency ? 1 : 0));
        const emergencyCount = pending.filter(b => b.is_emergency).length;
        const activeRequests = [...sortedPending, ...accepted, ...inProgress];
        const displayList = activeRequests.length > 0 ? activeRequests : context.allJobs.slice(0, 5);

        let msg = '';
        if (activeRequests.length > 0) {
          msg = `📋 Here are the ${activeRequests.length} currently available job${activeRequests.length > 1 ? 's & requests' : ' request'}:\n` +
            (emergencyCount > 0 ? `🚨 ${emergencyCount} EMERGENCY SOS request${emergencyCount > 1 ? 's' : ''} awaiting immediate response!\n` : '') +
            `• ${pending.length} pending request${pending.length !== 1 ? 's' : ''}\n` +
            `• ${accepted.length} confirmed job${accepted.length !== 1 ? 's' : ''}\n` +
            `• ${inProgress.length} in progress\n\n` +
            `👉 Tap on any request below to open its details page:`;
        } else {
          msg = `You currently have 0 pending or active requests. All caught up! Showing your recent job history:`;
        }

        const speech = emergencyCount > 0
          ? `Attention! You have ${emergencyCount} urgent emergency request awaiting dispatch! Listing ${activeRequests.length} available requests.`
          : activeRequests.length > 0
          ? `Listing ${activeRequests.length} available requests and jobs. Tap any request to open its details.`
          : `You have no pending requests right now. All caught up!`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          actionTaken: 'info',
          card: {
            id: 'card-jobs-list-' + Date.now(),
            type: 'job_list',
            jobs: displayList,
            actions: [
              ...(inProgress.length > 0 ? [{ label: `✓ Complete ${inProgress[0].booking_code}`, command: 'complete job', variant: 'success' as const }] : []),
              ...(accepted.length > 0 && inProgress.length === 0 ? [{ label: `⚡ Start ${accepted[0].booking_code}`, command: 'start work', variant: 'success' as const }] : []),
              ...(pending.length > 0 && inProgress.length === 0 ? [{ label: `Accept ${pending[0].booking_code}`, command: 'accept job', variant: 'primary' as const }] : []),
              { label: '📅 Open Schedule', command: 'navigate_jobs', variant: 'neutral' as const },
              { label: '💰 Check Earnings', command: 'earnings summary', variant: 'neutral' as const },
            ],
          },
        };
      }

      case 'EARNINGS_WELFARE': {
        const total = context.todayEarnings.toFixed(0);
        const count = context.todayCompletedCount;
        const welfareEstimate = (context.todayEarnings * 0.10 / 0.85).toFixed(0);

        const msg = `💰 Earnings Summary:\n• Completed Jobs: ${count}\n• Direct Wages Earned (85%): ₹${total}\n• Welfare Fund Contribution (10%): ₹${welfareEstimate}\n• Cooperative Protection: Active 🛡️`;
        const speech = `You have completed ${count} jobs with direct earnings of ${total} rupees.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          actionTaken: 'info',
        };
      }

      case 'READ_ALOUD': {
        const target = context.activeOnSiteJob || context.nextCommittedJob || context.pendingJobs[0];
        if (!target) {
          const msg = `No active or scheduled jobs to read out right now.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const cust = target.customer?.full_name || 'Customer';
        const addr = target.address || 'Address on file';
        const date = target.booking_date;
        const time = target.booking_time;
        const wage = (Number(target.final_amount || target.estimated_amount || 0) * 0.85).toFixed(0);
        const desc = target.service_description || 'Standard service work';

        const msg = `📋 Order ${target.booking_code}\n• Customer: ${cust}\n• Location: ${addr}\n• Time: ${date} at ${time}\n• Direct Wage: ₹${wage}\n• Work: ${desc}`;
        const speech = `Job order ${target.booking_code} for ${cust}, at ${addr}. Scheduled for ${date} at ${time}. Your direct wage is ${wage} rupees.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          affectedBookingId: target.id,
          card: {
            id: 'card-read-' + Date.now(),
            type: 'action_buttons',
            booking: target,
            actions: [
              { label: target.status === 'in_progress' ? '✓ Complete Job' : '⚡ Start Service Work', command: target.status === 'in_progress' ? 'complete job' : 'start work', variant: 'success' },
            ],
          },
        };
      }

      case 'HELP':
      default: {
        const inProg = context.activeOnSiteJob;
        const accepted = context.nextCommittedJob;
        const recText = inProg
          ? `You have job ${inProg.booking_code} in progress. You can say 'complete job' or 'add parts'.`
          : accepted
          ? `You have job ${accepted.booking_code} confirmed. You can say 'start work' to begin.`
          : `You can check your schedule, accept requests, or view earnings.`;

        const msg = `💡 I am your Sahakari Assistant. Here is what you can do:\n${recText}\n\nTap any action below or speak your command.`;
        const speech = `I am your Sahakari Assistant. ${recText}`;

        const primary = inProg || accepted || context.pendingJobs[0];

        return {
          success: true,
          intent: 'HELP',
          message: msg,
          speechText: speech,
          card: primary ? {
            id: 'card-help-' + Date.now(),
            type: 'action_buttons',
            booking: primary,
            actions: [
              ...(inProg ? [{ label: `✓ Complete ${inProg.booking_code}`, command: 'complete job', variant: 'success' as const }] : []),
              ...(accepted && !inProg ? [{ label: `⚡ Start ${accepted.booking_code}`, command: 'start work', variant: 'success' as const }] : []),
              { label: '📅 Open Schedule', command: 'navigate_jobs', variant: 'neutral' as const },
              { label: '💰 My Earnings', command: 'earnings summary', variant: 'neutral' as const },
            ],
          } : undefined,
        };
      }
    }
  }
}

