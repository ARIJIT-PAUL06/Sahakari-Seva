// ==============================================================================
// MOBILE API CLIENT — DYNAMIC HOST RESOLUTION & RESILIENT FALLBACKS
// Automatically resolves computer IP when running in Expo Go on mobile.
// Every endpoint falls back to the rich offline mock database so the app is
// fully functional without the backend.
// ==============================================================================

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform } from 'react-native';
import {
  Worker,
  NearbyWorkerResult,
  ServiceCategory,
  Booking,
  DemandForecastRecord,
  WorkforceAllocation,
  Rating,
  Payment,
  Invoice,
  Welfare,
  Notification,
  ExtraTaskItem,
  SupplementalBill,
  Profile,
  AdminProfile
} from '../types';
import {
  MOCK_CATEGORIES,
  MOCK_WORKERS,
  MOCK_CUSTOMERS,
  MOCK_BOOKINGS,
  MOCK_RATINGS,
  MOCK_WELFARE,
  MOCK_INVOICES,
  MOCK_NOTIFICATIONS,
  MOCK_ADMIN_STATS,
  buildNearbyWorkers,
  haversineKm,
} from './mockDatabase';

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    const normalized = configuredUrl.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  try {
    // In Expo Go, hostUri contains the IP of the development computer
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5001/api`;
      }
    }
  } catch (err) {
    // ignore
  }
  // The LAN host above serves Expo Go. This keeps simulators and web working
  // without configuration when no public API URL has been provided.
  return 'http://localhost:5001/api';
}

export class ApiClient {
  private static baseUrl = resolveApiBaseUrl();
  private static isServerAvailable: boolean | null = null;
  private static lastHealthCheck = 0;
  private static readonly OFFLINE_RETRY_INTERVAL_MS = 30000;
  private static readonly REQUEST_TIMEOUT_MS = 1500;
  private static hasLoggedOfflineNotice = false;

  public static setBaseUrl(url: string) {
    this.baseUrl = url;
    this.isServerAvailable = null;
    this.lastHealthCheck = 0;
  }

  public static getBaseUrl(): string {
    return this.baseUrl;
  }

  public static resetServerStatus() {
    this.isServerAvailable = null;
    this.lastHealthCheck = 0;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If recently verified that server is unreachable, fast-fail to mock database without waiting
    const now = Date.now();
    if (this.isServerAvailable === false && now - this.lastHealthCheck < this.OFFLINE_RETRY_INTERVAL_MS) {
      throw new Error(`Server offline (fast fallback)`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }

      this.isServerAvailable = true;
      this.hasLoggedOfflineNotice = false;

      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.isServerAvailable = false;
      this.lastHealthCheck = Date.now();

      // Log informative status to terminal instead of triggering mobile device YellowBox
      if (!this.hasLoggedOfflineNotice) {
        this.hasLoggedOfflineNotice = true;
        console.log(
          `[ApiClient] Live backend offline at ${this.baseUrl} — smoothly using built-in cooperative database.`
        );
      }
      throw err;
    }
  }

  // --- SERVICE CATEGORIES ---
  public static async getCategories(): Promise<ServiceCategory[]> {
    try {
      return await this.request<ServiceCategory[]>('/services');
    } catch {
      return MOCK_CATEGORIES;
    }
  }

  // --- WORKER STATUS PERSISTENCE HELPERS ---
  public static async persistWorkerAvailability(workerId: string, status: string): Promise<void> {
    try {
      const key = `@sahakari_worker_status_${workerId}`;
      await AsyncStorage.setItem(key, status);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, status);
      }
    } catch (e) {
      console.warn('Failed to persist worker availability', e);
    }
  }

  public static async restoreWorkerAvailability(workerId: string): Promise<string | null> {
    try {
      const key = `@sahakari_worker_status_${workerId}`;
      let val = await AsyncStorage.getItem(key);
      if (!val && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        val = window.localStorage.getItem(key);
      }
      return val;
    } catch {
      return null;
    }
  }

  // --- BOOKING & INVOICE PERSISTENCE HELPERS ---
  public static async persistBooking(booking: Booking): Promise<void> {
    try {
      const key = `@sahakari_booking_${booking.id}`;
      const json = JSON.stringify(booking);
      await AsyncStorage.setItem(key, json);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
      }
    } catch (e) {
      console.warn('Failed to persist booking', e);
    }
  }

  public static async restoreBooking(bookingId: string): Promise<Booking | null> {
    try {
      const key = `@sahakari_booking_${bookingId}`;
      let val = await AsyncStorage.getItem(key);
      if (!val && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        val = window.localStorage.getItem(key);
      }
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  public static async persistInvoice(invoice: Invoice): Promise<void> {
    try {
      const key = `@sahakari_invoice_${invoice.booking_id}`;
      const json = JSON.stringify(invoice);
      await AsyncStorage.setItem(key, json);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
      }
    } catch (e) {
      console.warn('Failed to persist invoice', e);
    }
  }

  public static async restoreInvoice(bookingId: string): Promise<Invoice | null> {
    try {
      const key = `@sahakari_invoice_${bookingId}`;
      let val = await AsyncStorage.getItem(key);
      if (!val && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        val = window.localStorage.getItem(key);
      }
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  // --- WORKERS & GEOLOCATION MATCHING ---
  public static async getNearbyWorkers(
    lat: number,
    lng: number,
    radius = 15,
    service?: string,
    emergency = false
  ): Promise<NearbyWorkerResult[]> {
    let results: NearbyWorkerResult[];
    try {
      let url = `/workers/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`;
      if (service && service !== 'all') url += `&service=${encodeURIComponent(service)}`;
      if (emergency) url += `&emergency=true`;
      results = await this.request<NearbyWorkerResult[]>(url);
    } catch {
      results = buildNearbyWorkers(lat, lng, radius, service, emergency);
    }

    // Synchronize current worker availability from mock memory / storage
    for (const r of results) {
      const w = MOCK_WORKERS.find(x => x.id === r.workerId);
      if (w) {
        r.availability = w.availability_status;
      }
    }
    return results;
  }

  public static async getWorkers(verification?: string): Promise<Worker[]> {
    try {
      const path = verification ? `/workers?verification=${encodeURIComponent(verification)}` : '/workers';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      const list = verification
        ? MOCK_WORKERS.filter(w => w.verification_status === verification)
        : MOCK_WORKERS;
      return list.length ? list : MOCK_WORKERS;
    }
  }

  public static async getWorkerById(id: string): Promise<Worker> {
    let worker: Worker;
    try {
      worker = await this.request<Worker>(`/workers/${id}`);
    } catch {
      worker = (
        MOCK_WORKERS.find(w => w.id === id) ||
        MOCK_WORKERS[0] || {
          id: id || 'w0000000-0000-0000-0000-000000000001',
          worker_code: 'WRK-JPR-0101',
          skill_category: 'Electrical',
          skills: ['House Wiring'],
          experience_years: 8,
          service_area: 'C-Scheme, Jaipur',
          pincode: '302001',
          hourly_or_base_rate: 249,
          average_rating: 4.9,
          total_jobs: 142,
          total_earnings: 74200,
          welfare_status: 'Active Member',
          insurance_status: 'Ayushman Bharat + PMSBY',
          availability_status: 'available',
          verification_status: 'verified',
        } as any
      );
    }

    const savedStatus = await this.restoreWorkerAvailability(worker.id);
    if (savedStatus) {
      worker.availability_status = savedStatus as any;
      const memWorker = MOCK_WORKERS.find(x => x.id === worker.id);
      if (memWorker) memWorker.availability_status = savedStatus as any;
    }

    return worker;
  }

  public static async updateWorkerProfile(
    workerId: string,
    updates: Partial<Worker> & Record<string, any>
  ): Promise<Worker> {
    try {
      return await this.request<Worker>(`/workers/${workerId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId) || MOCK_WORKERS[0];
      if (w) {
        Object.assign(w, updates);
        return w;
      }
      return { id: workerId, ...updates } as any;
    }
  }

  public static async updateWorkerLocation(
    workerId: string,
    lat: number,
    lng: number,
    radius?: number
  ): Promise<Worker> {
    try {
      return await this.request<Worker>(`/workers/${workerId}/location`, {
        method: 'PATCH',
        body: JSON.stringify({ latitude: lat, longitude: lng, service_radius_km: radius })
      });
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.latitude = lat;
        w.longitude = lng;
        w.service_radius_km = radius ?? w.service_radius_km;
        return w;
      }
      return { id: workerId, latitude: lat, longitude: lng, service_radius_km: radius } as any;
    }
  }

  public static async updateWorkerAvailability(
    workerId: string,
    status: string
  ): Promise<Worker> {
    await this.persistWorkerAvailability(workerId, status);
    try {
      const res = await this.request<Worker>(`/workers/${workerId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.availability_status = status as any;
      }
      return res;
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.availability_status = status as any;
        return w;
      }
      return { id: workerId, availability_status: status } as any;
    }
  }

  // --- BOOKINGS ---
  public static async getBookings(customerId?: string, workerId?: string): Promise<Booking[]> {
    try {
      let url = '/bookings';
      if (customerId) url += `?customer_id=${customerId}`;
      if (workerId) url += `?worker_id=${workerId}`;
      return await this.request<Booking[]>(url);
    } catch {
      let list = await Promise.all(
        MOCK_BOOKINGS.map(async b => {
          const stored = await this.restoreBooking(b.id);
          if (stored) {
            Object.assign(b, stored);
          }
          return b;
        })
      );
      if (customerId) list = list.filter(b => b.customer_id === customerId);
      if (workerId) list = list.filter(b => b.worker_id === workerId);
      return [...list].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    }
  }

  public static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const res = await this.request<any>(`/bookings/${bookingId}`);
      if (res && (res.data || res.id)) return res.data || res;
    } catch {
      // offline fallback
    }

    const inMem = MOCK_BOOKINGS.find(b => b.id === bookingId || b.booking_code === bookingId);
    const stored = await this.restoreBooking(bookingId);
    if (stored && inMem) {
      Object.assign(inMem, stored);
      return inMem;
    }
    if (stored) return stored;
    return inMem || null;
  }

  public static async createBooking(bookingPayload: any): Promise<Booking> {
    try {
      const created = await this.request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      });
      DeviceEventEmitter.emit('app_booking_updated');
      return created;
    } catch {
      const workerInfo = MOCK_WORKERS.find(w => w.id === bookingPayload.worker_id);
      const customerInfo = MOCK_CUSTOMERS.find(c => c.id === bookingPayload.customer_id);
      const booking: Booking = {
        id: 'bk-' + Date.now(),
        booking_code: 'BK-2026-' + Math.floor(1000 + Math.random() * 9000),
        cooperative_id: 'c0000000-0000-0000-0000-000000000001',
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...bookingPayload,
        worker: workerInfo,
        customer: customerInfo,
      } as any;
      MOCK_BOOKINGS.unshift(booking);
      MOCK_NOTIFICATIONS.customer.unshift({
        id: 'notif-c-' + Date.now(),
        user_id: bookingPayload.customer_id || 'p0000000-0000-0000-0000-000000000002',
        type: (booking.is_emergency ? 'emergency' : 'booking') as any,
        title: booking.is_emergency
          ? `🚨 EMERGENCY DISPATCH REQUESTED! ⚡ (${booking.booking_code})`
          : `Booking Requested! 📋 (${booking.booking_code})`,
        message: booking.is_emergency
          ? `Urgent 24/7 emergency dispatch requested for ${workerInfo?.profile?.full_name || (workerInfo as any)?.name || 'Worker'} (< 15-30 min arrival). Worker alerted with SOS priority.`
          : `Your booking request for ${workerInfo?.profile?.full_name || (workerInfo as any)?.name || 'Worker'} on ${booking.booking_date || 'scheduled date'} at ${booking.booking_time || '10:00 AM'} has been sent. Awaiting worker confirmation.`,
        read: false,
        action_url: '/bookings',
        created_at: new Date().toISOString(),
      });
      MOCK_NOTIFICATIONS.worker.unshift({
        id: 'notif-w-' + Date.now(),
        user_id: bookingPayload.worker_id || 'w0000000-0000-0000-0000-000000000001',
        type: (booking.is_emergency ? 'emergency' : 'booking') as any,
        title: booking.is_emergency
          ? `🚨 EMERGENCY SOS JOB REQUEST! ⚡ (${booking.booking_code})`
          : `New Job Request! 📋 (${booking.booking_code})`,
        message: booking.is_emergency
          ? `URGENT: 24/7 Emergency SOS requested by ${customerInfo?.full_name || 'Customer'}. Dispatch SLA: < 15-30 mins! +25% Emergency Rate Bonus applied.`
          : `New booking requested by ${customerInfo?.full_name || 'Customer'} for ${booking.booking_date || 'scheduled date'} at ${booking.booking_time || '10:00 AM'}. Tap to accept or review.`,
        read: false,
        action_url: '/jobs',
        created_at: new Date().toISOString(),
      });
      DeviceEventEmitter.emit('app_booking_updated');
      return booking;
    }
  }

  public static isPrepaidViolation(booking: Booking | null | undefined): boolean {
    if (!booking) return false;
    return booking.payment_status === 'paid' && (booking.status === 'pending' || booking.status === 'accepted');
  }

  /**
   * Parses time string like "14:30", "10:00", "10:00 AM", "2:30 PM", or "Immediate (< 15-30 min dispatch)" into minutes from midnight (0 - 1439).
   */
  public static parseTimeToMinutes(timeStr?: string): number | null {
    if (!timeStr) return null;
    const clean = timeStr.trim();
    if (/immediate/i.test(clean)) {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }
    const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const modifier = ampmMatch[3]?.toUpperCase();
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) return hours * 60 + minutes;
    }
    return null;
  }

  /**
   * Checks whether a candidate booking collides with any already committed bookings (accepted or in_progress).
   * Minimum buffer is 1 hour (60 minutes).
   */
  public static checkScheduleConflict(
    candidateBooking: Booking | null | undefined,
    existingBookings: Booking[],
    bufferMinutes: number = 60
  ): {
    hasConflict: boolean;
    isExactCollision: boolean;
    isBufferCollision: boolean;
    conflictingBooking: Booking | null;
    timeDifferenceMinutes: number | null;
    reason?: string;
  } {
    if (!candidateBooking) {
      return {
        hasConflict: false,
        isExactCollision: false,
        isBufferCollision: false,
        conflictingBooking: null,
        timeDifferenceMinutes: null,
      };
    }

    const candidateDate = candidateBooking.booking_date;
    const candidateMins = this.parseTimeToMinutes(candidateBooking.booking_time);
    if (!candidateDate || candidateMins === null) {
      return {
        hasConflict: false,
        isExactCollision: false,
        isBufferCollision: false,
        conflictingBooking: null,
        timeDifferenceMinutes: null,
      };
    }

    const candidateWorkerId =
      candidateBooking.worker_id || (candidateBooking.worker as any)?.id;

    for (const existing of existingBookings) {
      if (existing.id === candidateBooking.id) continue;
      // Only check against committed jobs
      if (existing.status !== 'accepted' && existing.status !== 'in_progress') continue;

      const existingWorkerId =
        existing.worker_id || (existing.worker as any)?.id;
      if (candidateWorkerId && existingWorkerId && candidateWorkerId !== existingWorkerId) continue;

      if (existing.booking_date === candidateDate) {
        const existingMins = this.parseTimeToMinutes(existing.booking_time);
        if (existingMins !== null) {
          const diff = Math.abs(candidateMins - existingMins);
          if (diff === 0) {
            return {
              hasConflict: true,
              isExactCollision: true,
              isBufferCollision: true,
              conflictingBooking: existing,
              timeDifferenceMinutes: 0,
              reason: `Exact schedule collision: Already committed to job ${existing.booking_code} on ${existing.booking_date} at ${existing.booking_time}.`,
            };
          } else if (diff < bufferMinutes) {
            return {
              hasConflict: true,
              isExactCollision: false,
              isBufferCollision: true,
              conflictingBooking: existing,
              timeDifferenceMinutes: diff,
              reason: candidateBooking.is_emergency
                ? `Emergency Mobilization Priority: Within ${diff} mins of committed job ${existing.booking_code} (${existing.booking_time}). Priority dispatch override active.`
                : `Schedule buffer conflict: Scheduled within ${diff} mins of committed job ${existing.booking_code} (${existing.booking_time}). Minimum ${bufferMinutes}-minute buffer required.`,
            };
          }
        }
      }
    }

    return {
      hasConflict: false,
      isExactCollision: false,
      isBufferCollision: false,
      conflictingBooking: null,
      timeDifferenceMinutes: null,
    };
  }

  public static async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const targetBooking = MOCK_BOOKINGS.find(x => x.id === bookingId);
    if (targetBooking && this.isPrepaidViolation(targetBooking)) {
      throw new Error(
        "Access Revoked: Customer prepayment was detected before service commenced. Under cooperative bylaws, this job profile is locked from worker access and transferred to Federation Dispute Audit."
      );
    }

    const assignedWorkerId =
      targetBooking?.worker_id ||
      (targetBooking?.worker as any)?.id ||
      'w0000000-0000-0000-0000-000000000001';

    // 1. If accepting a job, verify schedule collision and adjust time if exact collision
    if (status === 'accepted' && targetBooking) {
      const conflict = this.checkScheduleConflict(targetBooking, MOCK_BOOKINGS, 60);
      if (conflict.hasConflict && conflict.isExactCollision) {
        const existingHour = parseInt(targetBooking.booking_time?.split(':')[0] || '14', 10);
        targetBooking.booking_time = `${Math.min(existingHour + 2, 20)}:00`;
      }
    }

    // 2. If starting a job, auto-complete any older in_progress job so the worker is never blocked
    if (status === 'in_progress') {
      const ongoingJob = MOCK_BOOKINGS.find(
        b =>
          (b.worker_id === assignedWorkerId || (b.worker as any)?.id === assignedWorkerId) &&
          b.id !== bookingId &&
          b.status === 'in_progress'
      );

      if (ongoingJob) {
        ongoingJob.status = 'completed';
        ongoingJob.updated_at = new Date().toISOString();
      }
    }

    let resultBooking: Booking | null = null;
    try {
      resultBooking = await this.request<Booking>(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch {
      const b = MOCK_BOOKINGS.find(x => x.id === bookingId);
      if (b) {
        b.status = status as any;
        b.updated_at = new Date().toISOString();
        resultBooking = b;
      } else {
        resultBooking = { id: bookingId, status } as any;
      }
    }

    // Automatically shift operational duty status for the assigned service worker
    if (resultBooking) {
      const assignedWorkerId =
        resultBooking.worker_id ||
        (resultBooking.worker as any)?.id ||
        (resultBooking as any)?.workerId;

      if (assignedWorkerId) {
        if (status === 'accepted' || status === 'in_progress') {
          const targetMode = resultBooking.is_emergency ? 'emergency_only' : 'busy';
          await this.updateWorkerAvailability(assignedWorkerId, targetMode);

          // Notify customer that booking is officially confirmed
          const workerObj = MOCK_WORKERS.find(w => w.id === assignedWorkerId);
          const workerName = workerObj?.profile?.full_name || (workerObj as any)?.name || 'Service Professional';
          MOCK_NOTIFICATIONS.customer.unshift({
            id: 'notif-c-' + Date.now(),
            user_id: resultBooking.customer_id || 'p0000000-0000-0000-0000-000000000002',
            type: resultBooking.is_emergency ? 'emergency' : 'booking',
            title: resultBooking.is_emergency
              ? `🚨 Emergency Dispatch Confirmed! (${resultBooking.booking_code})`
              : `Booking Confirmed! 🎉 (${resultBooking.booking_code})`,
            message: resultBooking.is_emergency
              ? `${workerName} has accepted your emergency request! Worker is on 24/7 Emergency Service (< 15-30 min arrival SLA).`
              : `${workerName} has accepted and confirmed your booking! Worker duty status is now "On Active Job".`,
            read: false,
            action_url: '/bookings',
            created_at: new Date().toISOString(),
          });
        } else if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
          // Check if worker has any other active jobs in 'accepted' or 'in_progress'
          const remainingActiveJobs = MOCK_BOOKINGS.filter(
            bk =>
              (bk.worker_id === assignedWorkerId || (bk.worker as any)?.id === assignedWorkerId) &&
              bk.id !== bookingId &&
              (bk.status === 'accepted' || bk.status === 'in_progress')
          );
          if (remainingActiveJobs.length === 0) {
            // Revert automatically back to 'available' ("Active for work")
            await this.updateWorkerAvailability(assignedWorkerId, 'available');
          } else if (remainingActiveJobs.some(b => b.is_emergency)) {
            // Keep on emergency service if another emergency job is active
            await this.updateWorkerAvailability(assignedWorkerId, 'emergency_only');
          } else {
            // Otherwise remain on active work
            await this.updateWorkerAvailability(assignedWorkerId, 'busy');
          }
        }
      }
    }

    DeviceEventEmitter.emit('app_booking_updated');
    return resultBooking!;
  }

  /**
   * Worker requests customer authorization to complete an on-site service.
   * Generates a single-use 4-digit code and QR payload, and notifies the customer.
   */
  public static async requestJobCompletion(bookingId: string): Promise<Booking> {
    const targetBooking = MOCK_BOOKINGS.find(x => x.id === bookingId);
    if (!targetBooking) {
      throw new Error('Booking not found');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const qrPayload = JSON.stringify({
      type: 'SAHAKARI_VERIFY',
      bookingId: targetBooking.id,
      bookingCode: targetBooking.booking_code,
      code,
      timestamp: Date.now(),
    });

    targetBooking.completion_requested = true;
    targetBooking.completion_requested_at = new Date().toISOString();
    targetBooking.completion_code = code;
    targetBooking.completion_qr_payload = qrPayload;
    targetBooking.updated_at = new Date().toISOString();
    await this.persistBooking(targetBooking);

    const workerObj = MOCK_WORKERS.find(
      w => w.id === (targetBooking.worker_id || (targetBooking.worker as any)?.id)
    );
    const workerName =
      workerObj?.profile?.full_name || (workerObj as any)?.name || 'Your Service Professional';

    // Notify customer that service sign-off is requested
    MOCK_NOTIFICATIONS.customer.unshift({
      id: `notif-c-comp-${Date.now()}`,
      user_id: targetBooking.customer_id || 'p0000000-0000-0000-0000-000000000002',
      type: 'booking',
      title: 'Job Completion Sign-Off 🛡️',
      message: `${workerName} has completed work for ${targetBooking.booking_code}. Tap to authorize and show Completion QR.`,
      read: false,
      action_url: `/bookings/${targetBooking.id}?showCompletionQr=1`,
      created_at: new Date().toISOString(),
    });

    DeviceEventEmitter.emit('app_booking_updated');
    DeviceEventEmitter.emit('customer_completion_requested', {
      bookingId,
      code,
      qrPayload,
      bookingCode: targetBooking.booking_code,
    });

    return { ...targetBooking };
  }

  /**
   * Worker verifies customer QR or enters 4-digit PIN to mark job as complete.
   */
  public static async verifyAndCompleteJob(
    bookingId: string,
    codeOrPayload: string
  ): Promise<Booking> {
    const targetBooking = MOCK_BOOKINGS.find(x => x.id === bookingId);
    if (!targetBooking) {
      throw new Error('Booking not found');
    }

    const trimmed = (codeOrPayload || '').trim();
    let extractedCode = trimmed;
    try {
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.code) extractedCode = String(parsed.code);
      }
    } catch {
      // not json
    }

    const isDirectOrSimulated =
      trimmed === 'SIMULATED_QR_SCAN' ||
      trimmed === 'CUSTOMER_DIRECT_APPROVAL' ||
      trimmed === 'CUSTOMER_VERIFIED';
    const isMatch =
      targetBooking.completion_code &&
      (extractedCode === targetBooking.completion_code ||
        trimmed.includes(targetBooking.completion_code));

    // In demo mode, if code hasn't been generated yet or matches
    if (!isDirectOrSimulated && !isMatch && targetBooking.completion_code) {
      throw new Error(
        'Invalid Verification Code. Please ask customer to show their screen with the Completion QR.'
      );
    }

    targetBooking.status = 'completed';
    targetBooking.completion_requested = false;
    targetBooking.completion_code = undefined;
    targetBooking.completion_qr_payload = undefined;
    // Under Sahakari cooperative bylaws (Pay on Service Completion):
    // Verifying service completion confirms physical work is done, unlocking payment by customer.
    targetBooking.payment_status = 'pending';
    targetBooking.updated_at = new Date().toISOString();
    await this.persistBooking(targetBooking);

    const assignedWorkerId =
      targetBooking.worker_id ||
      (targetBooking.worker as any)?.id ||
      (targetBooking as any)?.workerId;

    if (assignedWorkerId) {
      const remainingActiveJobs = MOCK_BOOKINGS.filter(
        bk =>
          (bk.worker_id === assignedWorkerId || (bk.worker as any)?.id === assignedWorkerId) &&
          bk.id !== bookingId &&
          (bk.status === 'accepted' || bk.status === 'in_progress')
      );
      if (remainingActiveJobs.length === 0) {
        await this.updateWorkerAvailability(assignedWorkerId, 'available');
      }
    }

    MOCK_NOTIFICATIONS.customer.unshift({
      id: `notif-c-done-${Date.now()}`,
      user_id: targetBooking.customer_id || 'p0000000-0000-0000-0000-000000000002',
      type: 'booking',
      title: 'Service Completed • Payment Due ✓',
      message: `Work on ${targetBooking.booking_code} was completed by ${targetBooking.worker?.profile?.full_name || 'the professional'}. Please complete payment of ₹${targetBooking.final_amount || targetBooking.estimated_amount}.`,
      read: false,
      action_url: `/bookings/${targetBooking.id}`,
      created_at: new Date().toISOString(),
    });

    MOCK_NOTIFICATIONS.worker.unshift({
      id: `notif-w-done-${Date.now()}`,
      user_id: targetBooking.worker_id || 'w0000000-0000-0000-0000-000000000001',
      type: 'booking',
      title: 'Sign-Off Verified • Awaiting Customer Payment ⏳',
      message: `Customer verified completion of ${targetBooking.booking_code}. Customer has been prompted to pay ₹${targetBooking.final_amount || targetBooking.estimated_amount}.`,
      read: false,
      action_url: `/jobs/${targetBooking.id}`,
      created_at: new Date().toISOString(),
    });

    DeviceEventEmitter.emit('app_booking_updated');
    return { ...targetBooking };
  }

  public static async confirmCashPayment(
    bookingId: string,
    amount?: number
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    const finalAmt =
      amount !== undefined
        ? amount
        : Number(booking.final_amount) || Number(booking.estimated_amount) || 0;
    return await this.processPayment({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      worker_id: booking.worker_id,
      amount: finalAmt,
      payment_method: 'Cash to Professional',
      transaction_reference: `CASH-${Date.now().toString().slice(-8)}`,
    });
  }

  public static async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newTime: string
  ): Promise<Booking> {
    try {
      const res = await this.request<Booking>(`/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ booking_date: newDate, booking_time: newTime })
      });
      DeviceEventEmitter.emit('app_booking_updated');
      return res;
    } catch {
      const b = MOCK_BOOKINGS.find(x => x.id === bookingId);
      if (b) {
        b.booking_date = newDate;
        b.booking_time = newTime;
        b.updated_at = new Date().toISOString();
        DeviceEventEmitter.emit('app_booking_updated');
        return { ...b };
      }
      DeviceEventEmitter.emit('app_booking_updated');
      return { id: bookingId, booking_date: newDate, booking_time: newTime } as any;
    }
  }

  // --- SUPPLEMENTAL BILL (EXTRA TASKS & DEFECTS) ---
  public static async sendSupplementalBill(
    bookingId: string,
    billData: {
      diagnosis_notes: string;
      items: ExtraTaskItem[];
    }
  ): Promise<Booking> {
    const subtotal = billData.items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
    const supplementalBill: SupplementalBill = {
      id: 'sb-' + Date.now(),
      booking_id: bookingId,
      status: 'pending_approval',
      diagnosis_notes: billData.diagnosis_notes,
      items: billData.items,
      subtotal,
      total_amount: subtotal,
      created_at: new Date().toISOString(),
    };

    try {
      return await this.request<Booking>(`/bookings/${bookingId}/supplemental-bill`, {
        method: 'POST',
        body: JSON.stringify(supplementalBill),
      });
    } catch {
      const b = MOCK_BOOKINGS.find(x => x.id === bookingId);
      if (b) {
        b.supplemental_bill = supplementalBill;
        b.updated_at = new Date().toISOString();

        // Push real-time notification to Customer
        MOCK_NOTIFICATIONS.customer.unshift({
          id: 'notif-c-' + Date.now(),
          user_id: b.customer_id,
          type: 'extra_bill',
          title: `⚠️ Additional Work Estimate: ₹${subtotal}`,
          message: `${b.worker?.profile?.full_name || 'Worker'} discovered additional defective issues for ${b.booking_code}. Please review and approve.`,
          read: false,
          action_url: `/bookings`,
          created_at: new Date().toISOString(),
        });

        return { ...b };
      }
      return { id: bookingId, supplemental_bill: supplementalBill } as any;
    }
  }

  public static async respondSupplementalBill(
    bookingId: string,
    approved: boolean,
    denialReason?: string
  ): Promise<Booking> {
    try {
      return await this.request<Booking>(`/bookings/${bookingId}/supplemental-bill/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ approved, denial_reason: denialReason }),
      });
    } catch {
      const b = MOCK_BOOKINGS.find(x => x.id === bookingId);
      if (b && b.supplemental_bill) {
        b.supplemental_bill.status = approved ? 'approved' : 'denied';
        b.supplemental_bill.responded_at = new Date().toISOString();
        if (!approved && denialReason) {
          b.supplemental_bill.denial_reason = denialReason;
        }
        if (approved) {
          b.final_amount = (Number(b.estimated_amount) || 0) + b.supplemental_bill.total_amount;
        }
        b.updated_at = new Date().toISOString();
        await this.persistBooking(b);

        // Push real-time confirmation notification to Worker
        MOCK_NOTIFICATIONS.worker.unshift({
          id: 'notif-w-' + Date.now(),
          user_id: b.worker_id,
          type: 'extra_bill_response',
          title: approved
            ? `✅ Additional Work Approved (+₹${b.supplemental_bill.total_amount})`
            : `❌ Additional Work Declined`,
          message: approved
            ? `Customer approved additional repair work for ${b.booking_code}. You may proceed with the additional tasks.`
            : `Customer declined additional work for ${b.booking_code}. Please proceed with base service only.`,
          read: false,
          action_url: `/jobs`,
          created_at: new Date().toISOString(),
        });

        return { ...b };
      }
      return b as any;
    }
  }

  // --- AI DEMAND FORECASTING ---
  public static async getDemandForecast(): Promise<{
    zone_forecasts: DemandForecastRecord[];
    weekly_demand_curve: any[];
    total_historical_events: number;
  }> {
    try {
      return await this.request<any>('/forecast');
    } catch {
      return {
        total_historical_events: 160,
        weekly_demand_curve: [
          { day: 'Mon', date: '2026-09-07', predicted_bookings: 18, surge_multiplier: 1.0 },
          { day: 'Tue', date: '2026-09-08', predicted_bookings: 19, surge_multiplier: 1.0 },
          { day: 'Wed', date: '2026-09-09', predicted_bookings: 21, surge_multiplier: 1.0 },
          { day: 'Thu', date: '2026-09-10', predicted_bookings: 20, surge_multiplier: 1.0 },
          { day: 'Fri', date: '2026-09-11', predicted_bookings: 24, surge_multiplier: 1.15 },
          { day: 'Sat', date: '2026-09-12', predicted_bookings: 35, surge_multiplier: 1.55 },
          { day: 'Sun', date: '2026-09-13', predicted_bookings: 38, surge_multiplier: 1.55 }
        ],
        zone_forecasts: [
          {
            id: 'fc-1',
            location_zone: 'Jaipur - C-Scheme / Central',
            service_category: 'Electrical',
            forecast_date: '2026-09-05',
            forecast_time_window: '09:00 - 13:00',
            predicted_demand: 14,
            confidence_score: 0.88,
            confidence_lower_bound: 11,
            confidence_upper_bound: 17,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: false,
            status_note: 'High demand surge due to ambient heat & electrical load',
            generated_at: new Date().toISOString()
          },
          {
            id: 'fc-2',
            location_zone: 'Jaipur - Malviya Nagar / South',
            service_category: 'Plumbing',
            forecast_date: '2026-09-05',
            forecast_time_window: '10:00 - 14:00',
            predicted_demand: 9,
            confidence_score: 0.82,
            confidence_lower_bound: 7,
            confidence_upper_bound: 12,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: false,
            status_note: 'Seasonal drainage & leakage volume expected to rise',
            generated_at: new Date().toISOString()
          },
          {
            id: 'fc-3',
            location_zone: 'Jaipur - Jagatpura',
            service_category: 'Electrical',
            forecast_date: '2026-09-05',
            forecast_time_window: '09:00 - 18:00',
            predicted_demand: 5,
            confidence_score: 0.41,
            confidence_lower_bound: 3,
            confidence_upper_bound: 8,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: true,
            status_note: 'Insufficient local historical data. Using statistical baseline fallback.',
            generated_at: new Date().toISOString()
          }
        ]
      };
    }
  }

  // --- WORKFORCE ALLOCATION ---
  public static async getWorkforceAllocations(): Promise<{
    summary: any;
    data: WorkforceAllocation[];
  }> {
    try {
      const res = await this.request<any>('/allocation/recommendations');
      return {
        summary: res.summary || {},
        data: Array.isArray(res) ? res : res.data || []
      };
    } catch {
      return {
        summary: {
          total_analyzed_zones: 5,
          understaffed_zones: 2,
          balanced_zones: 2,
          overstaffed_zones: 1
        },
        data: [
          {
            id: 'alloc-1',
            location_zone: 'Jaipur - C-Scheme / Central',
            service_category: 'Electrical',
            target_date: '2026-09-05',
            predicted_demand: 14,
            available_workers: 2,
            shortage_or_surplus: -8,
            allocation_status: 'understaffed',
            recommended_mobilization: 3,
            priority_level: 'high',
            recommendation_notes: 'Urgent: Demand exceeds active capacity. Recommend mobilizing 3 standby cooperative electricians.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-2',
            location_zone: 'Jaipur - Malviya Nagar / South',
            service_category: 'Plumbing',
            target_date: '2026-09-05',
            predicted_demand: 9,
            available_workers: 2,
            shortage_or_surplus: -3,
            allocation_status: 'understaffed',
            recommended_mobilization: 1,
            priority_level: 'normal',
            recommendation_notes: 'Drainage and leakage volume spike expected. Mobilize 1 standby plumber.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-3',
            location_zone: 'Jaipur - Vaishali Nagar',
            service_category: 'Carpentry',
            target_date: '2026-09-05',
            predicted_demand: 3,
            available_workers: 2,
            shortage_or_surplus: 3,
            allocation_status: 'balanced',
            recommended_mobilization: 0,
            priority_level: 'normal',
            recommendation_notes: 'Optimal capacity balance: active workers meet demand.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-4',
            location_zone: 'Mumbai - Bandra West',
            service_category: 'Electrical',
            target_date: '2026-09-05',
            predicted_demand: 2,
            available_workers: 3,
            shortage_or_surplus: 7,
            allocation_status: 'overstaffed',
            recommended_mobilization: 0,
            priority_level: 'low',
            recommendation_notes: 'Surplus standby workers available for cross-zone dispatch.',
            generated_at: new Date().toISOString()
          }
        ]
      };
    }
  }

  // --- ADMIN STATS ---
  public static async getAdminStats(): Promise<any> {
    try {
      return await this.request<any>('/stats/admin');
    } catch {
      return {
        ...MOCK_ADMIN_STATS,
        totalWorkers: MOCK_ADMIN_STATS.totalWorkers,
        totalBookings: MOCK_ADMIN_STATS.totalBookings,
        completedJobs: MOCK_ADMIN_STATS.completedJobs,
        welfareCorpus: MOCK_ADMIN_STATS.welfareCorpus
      };
    }
  }

  // --- WORKER VERIFICATION ---
  public static async verifyWorker(workerId: string, status: 'verified' | 'rejected', notes?: string): Promise<Worker> {
    try {
      const res = await this.request<any>(`/workers/${workerId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
      return res.data;
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.verification_status = status;
        w.verification_notes = notes;
        w.welfare_status = status === 'verified' ? 'Active Member' : 'Rejected';
        w.insurance_status = status === 'verified' ? 'PMSBY Active' : 'None';
        return w;
      }
      return { id: workerId, verification_status: status } as any;
    }
  }

  // --- RATINGS ---
  public static async getRatings(workerId?: string): Promise<Rating[]> {
    try {
      const path = workerId ? `/ratings?worker_id=${encodeURIComponent(workerId)}` : '/ratings';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return workerId
        ? MOCK_RATINGS.filter(r => r.worker_id === workerId)
        : MOCK_RATINGS;
    }
  }

  public static async createRating(data: {
    booking_id: string;
    customer_id: string;
    worker_id: string;
    rating: number;
    feedback?: string;
    tags?: string[];
    customer_name?: string;
  }): Promise<Rating> {
    try {
      const res = await this.request<any>('/ratings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.data;
    } catch {
      const rating: Rating = {
        id: `r-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString()
      };
      MOCK_RATINGS.unshift(rating);
      return rating;
    }
  }

  // --- PAYMENTS & INVOICES (85 / 10 / 5 FAIR SPLIT) ---
  public static async processPayment(data: {
    booking_id: string;
    customer_id: string;
    worker_id: string;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
  }): Promise<{ payment: Payment; invoice: Invoice }> {
    const amt = Number(data.amount) || 0;
    const workerAmt = parseFloat((amt * 0.85).toFixed(2));
    const welfareAmt = parseFloat((amt * 0.10).toFixed(2));
    const platformAmt = parseFloat((amt * 0.05).toFixed(2));
    const txnRef = data.transaction_reference || `TXN-DEMO-${Date.now().toString().slice(-8)}`;

    let responseFromApi: any = null;
    try {
      const res = await this.request<any>('/payments', {
        method: 'POST',
        body: JSON.stringify({ ...data, amount: amt, transaction_reference: txnRef })
      });
      responseFromApi = (res && res.data) ? res.data : res;
    } catch {
      // offline/mock fallback
    }

    const invoice: Invoice = (responseFromApi && responseFromApi.invoice) ? responseFromApi.invoice : {
      id: `inv-${Date.now()}`,
      booking_id: data.booking_id,
      invoice_number: `INV-2026-${Date.now().toString().slice(-6)}`,
      customer_id: data.customer_id,
      worker_id: data.worker_id,
      subtotal: amt,
      platform_fee: platformAmt,
      cooperative_share: welfareAmt,
      worker_amount: workerAmt,
      tax: 0,
      total_amount: amt,
      generated_at: new Date().toISOString()
    };

    const payment: Payment = (responseFromApi && responseFromApi.payment) ? responseFromApi.payment : {
      id: `pay-${Date.now()}`,
      booking_id: data.booking_id,
      customer_id: data.customer_id,
      worker_id: data.worker_id,
      amount: amt,
      payment_method: data.payment_method || 'UPI',
      transaction_reference: txnRef,
      status: 'paid',
      payment_gateway: 'Sahakari Cooperative Gateway (NPCI/UPI)',
      created_at: new Date().toISOString()
    };

    // Store/replace in memory MOCK_INVOICES
    const existingInvIdx = MOCK_INVOICES.findIndex(i => i.booking_id === data.booking_id);
    if (existingInvIdx >= 0) {
      MOCK_INVOICES[existingInvIdx] = invoice;
    } else {
      MOCK_INVOICES.unshift(invoice);
    }
    await this.persistInvoice(invoice);

    // Mark the booking paid AND completed
    const b = MOCK_BOOKINGS.find(x => x.id === data.booking_id);
    if (b) {
      b.payment_status = 'paid';
      b.status = 'completed';
      b.final_amount = amt;
      b.updated_at = new Date().toISOString();
      await this.persistBooking(b);
      DeviceEventEmitter.emit('app_booking_updated');
    }

    // Automatically reset worker operational duty status back to 'available' if no other active jobs
    const assignedWorkerId = data.worker_id || b?.worker_id;
    if (assignedWorkerId) {
      const hasOtherActiveJobs = MOCK_BOOKINGS.some(
        bk =>
          (bk.worker_id === assignedWorkerId || (bk.worker as any)?.id === assignedWorkerId) &&
          bk.id !== data.booking_id &&
          (bk.status === 'accepted' || bk.status === 'in_progress')
      );
      if (!hasOtherActiveJobs) {
        await this.updateWorkerAvailability(assignedWorkerId, 'available');
      }
    }

    // Push notification to customer
    MOCK_NOTIFICATIONS.customer.unshift({
      id: 'notif-c-' + Date.now(),
      user_id: data.customer_id,
      type: 'payment',
      title: `Payment Successful (₹${amt.toFixed(2)}) 🎉`,
      message: `Payment of ₹${amt.toFixed(2)} confirmed for ${b?.booking_code || 'booking'}. ₹${workerAmt.toFixed(2)} directly credited to ${b?.worker?.profile?.full_name || 'the professional'}.`,
      read: false,
      action_url: '/bookings',
      created_at: new Date().toISOString(),
    });

    // Push notification to worker
    MOCK_NOTIFICATIONS.worker.unshift({
      id: 'notif-w-' + Date.now(),
      user_id: data.worker_id,
      type: 'payment',
      title: `₹${workerAmt.toFixed(2)} Wage Credited! 💸`,
      message: `85% cooperative direct wage for job ${b?.booking_code || ''} has been deposited to your account.`,
      read: false,
      action_url: '/welfare',
      created_at: new Date().toISOString(),
    });

    return { payment, invoice };
  }

  public static async getInvoice(bookingId: string): Promise<Invoice | null> {
    try {
      const res = await this.request<any>(`/payments/invoices/${bookingId}`);
      if (res && res.data) return res.data;
      if (res && res.invoice_number) return res;
    } catch {
      // offline fallback
    }

    const inMem = MOCK_INVOICES.find(i => i.booking_id === bookingId);
    if (inMem) return inMem;

    const stored = await this.restoreInvoice(bookingId);
    if (stored) {
      MOCK_INVOICES.unshift(stored);
      return stored;
    }

    // Dynamically generate invoice matching the booking total
    const b = MOCK_BOOKINGS.find(bk => bk.id === bookingId);
    if (b) {
      const amt = Number(b.final_amount) || Number(b.estimated_amount) || 0;
      const inv: Invoice = {
        id: `inv-${bookingId}`,
        booking_id: bookingId,
        invoice_number: `INV-2026-${bookingId.slice(-6).toUpperCase()}`,
        customer_id: b.customer_id,
        worker_id: b.worker_id,
        subtotal: amt,
        platform_fee: parseFloat((amt * 0.05).toFixed(2)),
        cooperative_share: parseFloat((amt * 0.10).toFixed(2)),
        worker_amount: parseFloat((amt * 0.85).toFixed(2)),
        tax: 0,
        total_amount: amt,
        generated_at: b.updated_at || new Date().toISOString(),
      };
      MOCK_INVOICES.unshift(inv);
      return inv;
    }

    return null;
  }

  // --- WELFARE ---
  public static async getWelfare(workerId?: string): Promise<Welfare[]> {
    try {
      const path = workerId ? `/welfare?worker_id=${encodeURIComponent(workerId)}` : '/welfare';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return workerId
        ? MOCK_WELFARE.filter(w => w.worker_id === workerId)
        : MOCK_WELFARE;
    }
  }

  // --- NOTIFICATIONS (role-aware feeds) ---
  public static async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const path = userId ? `/notifications?user_id=${encodeURIComponent(userId)}` : '/notifications';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      const id = userId || '';
      if (id.startsWith('w')) return MOCK_NOTIFICATIONS.worker;
      if (id.startsWith('admin')) return MOCK_NOTIFICATIONS.admin;
      if (MOCK_CUSTOMERS.some(c => c.id === id)) return MOCK_NOTIFICATIONS.customer;
      // Default feed by caller convention: customer profiles are p-ids,
      // worker profiles are w-ids, admin is admin-demo.
      if (id.startsWith('p')) return MOCK_NOTIFICATIONS.customer;
      return MOCK_NOTIFICATIONS.customer;
    }
  }

  public static async markNotificationRead(id: string): Promise<boolean> {
    try {
      await this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
      return true;
    } catch {
      for (const feed of Object.values(MOCK_NOTIFICATIONS)) {
        const n = feed.find(x => x.id === id);
        if (n) n.read = true;
      }
      return true;
    }
  }

  // --- CUSTOMER PROFILE ---
  private static mockCustomerProfiles: Record<string, Profile> = {
    'p0000000-0000-0000-0000-000000000002': {
      id: 'p0000000-0000-0000-0000-000000000002',
      full_name: 'Priya Singh',
      email: 'priya.singh@customer.in',
      phone: '+91 98711 54321',
      role: 'customer',
      address: 'Flat 402, C-Scheme',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      language: 'en',
      membership_id: 'COP-CUS-2026-8842',
      total_spent: 4890,
      coop_savings: 1450,
      welfare_contribution: 146,
      saved_addresses: [
        {
          id: 'addr-1',
          label: 'Home',
          address: 'Flat 402, C-Scheme',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          is_default: true,
        },
        {
          id: 'addr-2',
          label: 'Office',
          address: 'Tower B, World Trade Park, Malviya Nagar',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302017',
          is_default: false,
        },
      ],
      emergency_contacts: [
        {
          id: 'em-1',
          name: 'Dr. Alok Singh',
          phone: '+91 98290 11223',
          relation: 'Father / Family',
        },
      ],
    },
  };

  public static async getCustomerProfile(customerId = 'p0000000-0000-0000-0000-000000000002'): Promise<Profile> {
    try {
      const res = await this.request<any>(`/customers/${customerId}/profile`);
      return res.data || res;
    } catch {
      if (this.mockCustomerProfiles[customerId]) {
        return { ...this.mockCustomerProfiles[customerId] };
      }
      const existing = MOCK_CUSTOMERS.find(c => c.id === customerId);
      if (existing) {
        this.mockCustomerProfiles[customerId] = {
          ...existing,
          membership_id: 'COP-CUS-2026-8842',
          total_spent: 4890,
          coop_savings: 1450,
          welfare_contribution: 146,
          saved_addresses: [
            {
              id: 'addr-default',
              label: 'Home',
              address: existing.address || 'Flat 402, C-Scheme',
              city: existing.city || 'Jaipur',
              state: existing.state || 'Rajasthan',
              pincode: existing.pincode || '302001',
              is_default: true,
            },
          ],
          emergency_contacts: [
            {
              id: 'em-default',
              name: 'Family Helpline',
              phone: '+91 98290 11223',
              relation: 'Emergency Contact',
            },
          ],
        };
        return { ...this.mockCustomerProfiles[customerId] };
      }
      return { ...this.mockCustomerProfiles['p0000000-0000-0000-0000-000000000002'] };
    }
  }

  public static async updateCustomerProfile(
    customerId: string,
    updates: Partial<Profile>
  ): Promise<Profile> {
    try {
      const res = await this.request<any>(`/customers/${customerId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.data || res;
    } catch {
      const current = await this.getCustomerProfile(customerId);
      const merged = { ...current, ...updates };
      this.mockCustomerProfiles[customerId] = merged;
      // Also update in MOCK_CUSTOMERS array if present
      const inList = MOCK_CUSTOMERS.find(c => c.id === customerId);
      if (inList) {
        Object.assign(inList, updates);
      }
      return { ...merged };
    }
  }

  // --- ADMIN PROFILE ---
  private static mockAdminProfile: AdminProfile = {
    id: 'admin-sec-001',
    officer_name: 'Dr. Vikramaditya Rathore, IAS (Retd.)',
    designation: 'Chief Registrar & Commissioner of Cooperatives',
    department: 'Dept of Cooperatives & Shramik Welfare, Govt of Rajasthan',
    authority_code: 'SEC-RAJ-COOP-001',
    state: 'Rajasthan',
    jurisdiction_districts: 24,
    affiliated_cooperatives: 128,
    statutory_minimum_wage: 249,
    mandatory_certification: true,
    emergency_mobilization_override: true,
    patronage_dividend_rate: 12,
    last_audit_date: '2026-09-01',
    integrity_hash: '0x8F92A7D1C34E65B901FE',
  };

  public static async getAdminProfile(): Promise<AdminProfile> {
    try {
      const res = await this.request<any>('/admin/profile');
      return res.data || res;
    } catch {
      return { ...this.mockAdminProfile };
    }
  }

  public static async updateAdminProfile(updates: Partial<AdminProfile>): Promise<AdminProfile> {
    try {
      const res = await this.request<any>('/admin/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.data || res;
    } catch {
      this.mockAdminProfile = { ...this.mockAdminProfile, ...updates };
      return { ...this.mockAdminProfile };
    }
  }
}