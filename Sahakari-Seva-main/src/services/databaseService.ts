// ==============================================================================
// SAHAKARI SEVA — PERSISTENT COOPERATIVE DATABASE SERVICE
// Full client-side persistent database engine backed by AsyncStorage and
// localStorage. Persists all bookings, payments, notifications, invoices,
// worker stats, and audit logs permanently across page reloads and device reboots.
// ==============================================================================

import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Booking,
  Notification,
  Invoice,
  Worker,
  Rating,
  Welfare,
  Profile,
  AdminProfile,
  AvailabilityStatus,
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
} from './mockDatabase';
import { CloudSyncAdapter } from './cloudSyncAdapter';

// Storage keys
const DB_INIT_KEY = '@sahakari_db_initialized_v2';
const KEY_BOOKINGS = '@sahakari_db_bookings';
const KEY_NOTIFICATIONS = '@sahakari_db_notifications';
const KEY_INVOICES = '@sahakari_db_invoices';
const KEY_WORKERS = '@sahakari_db_workers';
const KEY_CUSTOMER_PROFILES = '@sahakari_db_customer_profiles';
const KEY_ADMIN_PROFILE = '@sahakari_db_admin_profile';
const KEY_RATINGS = '@sahakari_db_ratings';
const KEY_WELFARE = '@sahakari_db_welfare';
const KEY_CHANGELOG = '@sahakari_db_changelog';

export interface AuditChangeRecord {
  id: string;
  timestamp: string;
  entity: 'booking' | 'notification' | 'invoice' | 'worker' | 'profile' | 'rating' | 'welfare';
  action: 'insert' | 'update' | 'delete' | 'payment_settled' | 'work_verified';
  entity_id: string;
  details?: any;
}

interface NotificationsStore {
  customer: Notification[];
  worker: Notification[];
  admin: Notification[];
}

export class DatabaseService {
  private static isLoaded = false;
  private static loadPromise: Promise<void> | null = null;

  // In-memory active cache
  private static bookingsCache: Booking[] = [];
  private static notificationsCache: NotificationsStore = { customer: [], worker: [], admin: [] };
  private static invoicesCache: Invoice[] = [];
  private static workersCache: Worker[] = [];
  private static customerProfilesCache: Record<string, Profile> = {};
  private static adminProfileCache: AdminProfile = {
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
  private static ratingsCache: Rating[] = [];
  private static welfareCache: Welfare[] = [];
  private static changeLogCache: AuditChangeRecord[] = [];

  // Low-level storage utilities
  private static async storageGet(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val) return val;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private static async storageSet(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[DatabaseService] Failed to set storage for key: ${key}`, err);
    }
  }

  /**
   * Initializes the persistent database.
   * If existing data is found in storage, loads it.
   * If first run, seeds default mock data and commits to storage.
   */
  public static async initialize(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const initVal = await this.storageGet(DB_INIT_KEY);

        if (initVal === 'true') {
          // Restore all tables from permanent storage
          const [
            bJson,
            nJson,
            iJson,
            wJson,
            cpJson,
            apJson,
            rJson,
            wfJson,
            clJson,
          ] = await Promise.all([
            this.storageGet(KEY_BOOKINGS),
            this.storageGet(KEY_NOTIFICATIONS),
            this.storageGet(KEY_INVOICES),
            this.storageGet(KEY_WORKERS),
            this.storageGet(KEY_CUSTOMER_PROFILES),
            this.storageGet(KEY_ADMIN_PROFILE),
            this.storageGet(KEY_RATINGS),
            this.storageGet(KEY_WELFARE),
            this.storageGet(KEY_CHANGELOG),
          ]);

          this.bookingsCache = bJson ? JSON.parse(bJson) : [...MOCK_BOOKINGS];
          this.notificationsCache = nJson
            ? JSON.parse(nJson)
            : {
                customer: [...MOCK_NOTIFICATIONS.customer],
                worker: [...MOCK_NOTIFICATIONS.worker],
                admin: [...MOCK_NOTIFICATIONS.admin],
              };
          this.invoicesCache = iJson ? JSON.parse(iJson) : [...MOCK_INVOICES];
          this.workersCache = wJson ? JSON.parse(wJson) : [...MOCK_WORKERS];
          this.customerProfilesCache = cpJson ? JSON.parse(cpJson) : {};
          if (apJson) this.adminProfileCache = JSON.parse(apJson);
          this.ratingsCache = rJson ? JSON.parse(rJson) : [...MOCK_RATINGS];
          this.welfareCache = wfJson ? JSON.parse(wfJson) : [...MOCK_WELFARE];
          this.changeLogCache = clJson ? JSON.parse(clJson) : [];
        } else {
          // First run: Seed from mock database
          await this.seedDefaults();
        }

        this.isLoaded = true;
      } catch (err) {
        console.error('[DatabaseService] Initialization error; fallback to memory', err);
        this.isLoaded = true;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Seeds initial realistic dataset into persistent storage.
   */
  public static async seedDefaults(): Promise<void> {
    this.bookingsCache = JSON.parse(JSON.stringify(MOCK_BOOKINGS));
    this.notificationsCache = {
      customer: JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS.customer)),
      worker: JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS.worker)),
      admin: JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS.admin)),
    };
    this.invoicesCache = JSON.parse(JSON.stringify(MOCK_INVOICES));
    this.workersCache = JSON.parse(JSON.stringify(MOCK_WORKERS));
    this.ratingsCache = JSON.parse(JSON.stringify(MOCK_RATINGS));
    this.welfareCache = JSON.parse(JSON.stringify(MOCK_WELFARE));
    this.changeLogCache = [
      {
        id: `log-seed-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entity: 'booking',
        action: 'insert',
        entity_id: 'SYSTEM_SEED',
        details: 'Initial cooperative database seeded successfully.',
      },
    ];

    // Seed default customer profile
    this.customerProfilesCache = {
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

    await Promise.all([
      this.storageSet(DB_INIT_KEY, 'true'),
      this.storageSet(KEY_BOOKINGS, JSON.stringify(this.bookingsCache)),
      this.storageSet(KEY_NOTIFICATIONS, JSON.stringify(this.notificationsCache)),
      this.storageSet(KEY_INVOICES, JSON.stringify(this.invoicesCache)),
      this.storageSet(KEY_WORKERS, JSON.stringify(this.workersCache)),
      this.storageSet(KEY_CUSTOMER_PROFILES, JSON.stringify(this.customerProfilesCache)),
      this.storageSet(KEY_ADMIN_PROFILE, JSON.stringify(this.adminProfileCache)),
      this.storageSet(KEY_RATINGS, JSON.stringify(this.ratingsCache)),
      this.storageSet(KEY_WELFARE, JSON.stringify(this.welfareCache)),
      this.storageSet(KEY_CHANGELOG, JSON.stringify(this.changeLogCache)),
    ]);
  }

  /**
   * Resets database to default state (useful for test resets).
   */
  public static async resetToDefaults(): Promise<void> {
    await this.seedDefaults();
    DeviceEventEmitter.emit('app_db_updated');
    DeviceEventEmitter.emit('app_booking_updated');
    DeviceEventEmitter.emit('app_notifications_updated');
  }

  // --- AUDIT LOGGING ---
  private static async logChange(
    entity: AuditChangeRecord['entity'],
    action: AuditChangeRecord['action'],
    entity_id: string,
    details?: any
  ) {
    const record: AuditChangeRecord = {
      id: `chg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      entity,
      action,
      entity_id,
      details,
    };
    this.changeLogCache.unshift(record);
    if (this.changeLogCache.length > 200) {
      this.changeLogCache = this.changeLogCache.slice(0, 200);
    }
    this.storageSet(KEY_CHANGELOG, JSON.stringify(this.changeLogCache)).catch(() => {});

    // Push to CloudSyncAdapter
    CloudSyncAdapter.pushChange({
      entity,
      action: action === 'delete' ? 'delete' : action === 'insert' ? 'insert' : 'update',
      entity_id,
      record: details,
      timestamp: record.timestamp,
    }).catch(() => {});
  }

  // ============================================================================
  // BOOKINGS REPOSITORY
  // ============================================================================
  public static bookings = {
    getAll: async (filter?: { customerId?: string; workerId?: string }): Promise<Booking[]> => {
      await DatabaseService.initialize();
      let list = [...DatabaseService.bookingsCache];
      if (filter?.customerId) {
        list = list.filter(b => b.customer_id === filter.customerId);
      }
      if (filter?.workerId) {
        list = list.filter(
          b => b.worker_id === filter.workerId || (b.worker as any)?.id === filter.workerId
        );
      }
      return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    },

    getById: async (id: string): Promise<Booking | null> => {
      await DatabaseService.initialize();
      return (
        DatabaseService.bookingsCache.find(b => b.id === id || b.booking_code === id) || null
      );
    },

    insert: async (booking: Booking): Promise<Booking> => {
      await DatabaseService.initialize();
      // Ensure unique id and timestamps
      const newBooking: Booking = {
        ...booking,
        id: booking.id || 'bk-' + Date.now(),
        created_at: booking.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      DatabaseService.bookingsCache.unshift(newBooking);
      await DatabaseService.storageSet(
        KEY_BOOKINGS,
        JSON.stringify(DatabaseService.bookingsCache)
      );

      await DatabaseService.logChange('booking', 'insert', newBooking.id, newBooking);
      DeviceEventEmitter.emit('app_booking_updated');
      DeviceEventEmitter.emit('app_db_updated');
      return { ...newBooking };
    },

    update: async (id: string, updates: Partial<Booking>): Promise<Booking> => {
      await DatabaseService.initialize();
      const idx = DatabaseService.bookingsCache.findIndex(
        b => b.id === id || b.booking_code === id
      );
      if (idx === -1) {
        throw new Error(`Booking ${id} not found in persistent database.`);
      }

      const existing = DatabaseService.bookingsCache[idx];
      const updated: Booking = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      DatabaseService.bookingsCache[idx] = updated;
      await DatabaseService.storageSet(
        KEY_BOOKINGS,
        JSON.stringify(DatabaseService.bookingsCache)
      );

      const action = updates.payment_status === 'paid'
        ? 'payment_settled'
        : updates.status === 'completed'
        ? 'work_verified'
        : 'update';

      await DatabaseService.logChange('booking', action, updated.id, updates);
      DeviceEventEmitter.emit('app_booking_updated');
      DeviceEventEmitter.emit('app_db_updated');
      return { ...updated };
    },

    delete: async (id: string): Promise<boolean> => {
      await DatabaseService.initialize();
      const prevLen = DatabaseService.bookingsCache.length;
      DatabaseService.bookingsCache = DatabaseService.bookingsCache.filter(
        b => b.id !== id && b.booking_code !== id
      );
      if (DatabaseService.bookingsCache.length !== prevLen) {
        await DatabaseService.storageSet(
          KEY_BOOKINGS,
          JSON.stringify(DatabaseService.bookingsCache)
        );
        await DatabaseService.logChange('booking', 'delete', id);
        DeviceEventEmitter.emit('app_booking_updated');
        return true;
      }
      return false;
    },
  };

  // ============================================================================
  // NOTIFICATIONS REPOSITORY
  // ============================================================================
  public static notifications = {
    getAll: async (userIdOrRole?: string): Promise<Notification[]> => {
      await DatabaseService.initialize();
      const id = userIdOrRole || '';
      if (id === 'worker' || id.startsWith('w')) {
        return [...DatabaseService.notificationsCache.worker];
      }
      if (id === 'admin' || id.startsWith('admin')) {
        return [...DatabaseService.notificationsCache.admin];
      }
      return [...DatabaseService.notificationsCache.customer];
    },

    insert: async (
      notification: Notification,
      role: 'customer' | 'worker' | 'admin' = 'customer'
    ): Promise<Notification> => {
      await DatabaseService.initialize();
      const newNotif: Notification = {
        ...notification,
        id: notification.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: notification.created_at || new Date().toISOString(),
        read: false,
      };

      DatabaseService.notificationsCache[role].unshift(newNotif);
      await DatabaseService.storageSet(
        KEY_NOTIFICATIONS,
        JSON.stringify(DatabaseService.notificationsCache)
      );

      await DatabaseService.logChange('notification', 'insert', newNotif.id, { role, ...newNotif });
      DeviceEventEmitter.emit('app_notifications_updated');
      return { ...newNotif };
    },

    markRead: async (id: string): Promise<boolean> => {
      await DatabaseService.initialize();
      let modified = false;

      for (const role of ['customer', 'worker', 'admin'] as const) {
        const item = DatabaseService.notificationsCache[role].find(n => n.id === id);
        if (item) {
          item.read = true;
          modified = true;
        }
      }

      if (modified) {
        await DatabaseService.storageSet(
          KEY_NOTIFICATIONS,
          JSON.stringify(DatabaseService.notificationsCache)
        );
        await DatabaseService.logChange('notification', 'update', id, { read: true });
        DeviceEventEmitter.emit('app_notifications_updated');
      }
      return modified;
    },

    markAllRead: async (role?: 'customer' | 'worker' | 'admin'): Promise<void> => {
      await DatabaseService.initialize();
      const rolesToUpdate = role ? [role] : (['customer', 'worker', 'admin'] as const);
      for (const r of rolesToUpdate) {
        DatabaseService.notificationsCache[r].forEach(n => {
          n.read = true;
        });
      }
      await DatabaseService.storageSet(
        KEY_NOTIFICATIONS,
        JSON.stringify(DatabaseService.notificationsCache)
      );
      DeviceEventEmitter.emit('app_notifications_updated');
    },
  };

  // ============================================================================
  // INVOICES REPOSITORY
  // ============================================================================
  public static invoices = {
    getAll: async (): Promise<Invoice[]> => {
      await DatabaseService.initialize();
      return [...DatabaseService.invoicesCache];
    },

    getByBookingId: async (bookingId: string): Promise<Invoice | null> => {
      await DatabaseService.initialize();
      return DatabaseService.invoicesCache.find(i => i.booking_id === bookingId) || null;
    },

    insert: async (invoice: Invoice): Promise<Invoice> => {
      await DatabaseService.initialize();
      const existingIdx = DatabaseService.invoicesCache.findIndex(
        i => i.booking_id === invoice.booking_id || i.id === invoice.id
      );

      if (existingIdx >= 0) {
        DatabaseService.invoicesCache[existingIdx] = invoice;
      } else {
        DatabaseService.invoicesCache.unshift(invoice);
      }

      await DatabaseService.storageSet(
        KEY_INVOICES,
        JSON.stringify(DatabaseService.invoicesCache)
      );

      await DatabaseService.logChange('invoice', 'insert', invoice.id, invoice);
      return { ...invoice };
    },
  };

  // ============================================================================
  // WORKERS REPOSITORY
  // ============================================================================
  public static workers = {
    getAll: async (): Promise<Worker[]> => {
      await DatabaseService.initialize();
      return [...DatabaseService.workersCache];
    },

    getById: async (workerId: string): Promise<Worker | null> => {
      await DatabaseService.initialize();
      return DatabaseService.workersCache.find(w => w.id === workerId) || null;
    },

    updateAvailability: async (workerId: string, status: AvailabilityStatus): Promise<Worker> => {
      await DatabaseService.initialize();
      const worker = DatabaseService.workersCache.find(w => w.id === workerId);
      if (worker) {
        worker.availability_status = status;
        await DatabaseService.storageSet(
          KEY_WORKERS,
          JSON.stringify(DatabaseService.workersCache)
        );
        await DatabaseService.logChange('worker', 'update', workerId, { availability_status: status });
      }
      return worker ? { ...worker } : ({ id: workerId, availability_status: status } as any);
    },

    recordJobCompleted: async (
      workerId: string,
      wageEarned: number,
      newRating?: number
    ): Promise<Worker | null> => {
      await DatabaseService.initialize();
      const worker = DatabaseService.workersCache.find(w => w.id === workerId);
      if (worker) {
        worker.total_jobs = (worker.total_jobs || 0) + 1;
        worker.total_earnings = (worker.total_earnings || 0) + wageEarned;
        if (newRating) {
          const count = worker.total_jobs;
          worker.average_rating = parseFloat(
            (((worker.average_rating || 5.0) * (count - 1) + newRating) / count).toFixed(1)
          );
        }
        await DatabaseService.storageSet(
          KEY_WORKERS,
          JSON.stringify(DatabaseService.workersCache)
        );
        await DatabaseService.logChange('worker', 'update', workerId, {
          total_jobs: worker.total_jobs,
          total_earnings: worker.total_earnings,
          average_rating: worker.average_rating,
        });
        return { ...worker };
      }
      return null;
    },

    update: async (workerId: string, updates: Partial<Worker>): Promise<Worker | null> => {
      await DatabaseService.initialize();
      const worker = DatabaseService.workersCache.find(w => w.id === workerId);
      if (worker) {
        Object.assign(worker, updates);
        await DatabaseService.storageSet(
          KEY_WORKERS,
          JSON.stringify(DatabaseService.workersCache)
        );
        await DatabaseService.logChange('worker', 'update', workerId, updates);
        return { ...worker };
      }
      return null;
    },
  };

  // ============================================================================
  // PROFILES REPOSITORY
  // ============================================================================
  public static profiles = {
    getCustomerProfile: async (
      customerId = 'p0000000-0000-0000-0000-000000000002'
    ): Promise<Profile> => {
      await DatabaseService.initialize();
      if (DatabaseService.customerProfilesCache[customerId]) {
        return { ...DatabaseService.customerProfilesCache[customerId] };
      }
      const existing = MOCK_CUSTOMERS.find(c => c.id === customerId);
      if (existing) {
        DatabaseService.customerProfilesCache[customerId] = {
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
        await DatabaseService.storageSet(
          KEY_CUSTOMER_PROFILES,
          JSON.stringify(DatabaseService.customerProfilesCache)
        );
        return { ...DatabaseService.customerProfilesCache[customerId] };
      }
      return { ...DatabaseService.customerProfilesCache['p0000000-0000-0000-0000-000000000002'] };
    },

    updateCustomerProfile: async (
      customerId: string,
      updates: Partial<Profile>
    ): Promise<Profile> => {
      await DatabaseService.initialize();
      const current = await DatabaseService.profiles.getCustomerProfile(customerId);
      const merged = { ...current, ...updates };
      DatabaseService.customerProfilesCache[customerId] = merged;
      await DatabaseService.storageSet(
        KEY_CUSTOMER_PROFILES,
        JSON.stringify(DatabaseService.customerProfilesCache)
      );
      await DatabaseService.logChange('profile', 'update', customerId, updates);
      return { ...merged };
    },

    getAdminProfile: async (): Promise<AdminProfile> => {
      await DatabaseService.initialize();
      return { ...DatabaseService.adminProfileCache };
    },

    updateAdminProfile: async (updates: Partial<AdminProfile>): Promise<AdminProfile> => {
      await DatabaseService.initialize();
      DatabaseService.adminProfileCache = { ...DatabaseService.adminProfileCache, ...updates };
      await DatabaseService.storageSet(
        KEY_ADMIN_PROFILE,
        JSON.stringify(DatabaseService.adminProfileCache)
      );
      await DatabaseService.logChange('profile', 'update', DatabaseService.adminProfileCache.id, updates);
      return { ...DatabaseService.adminProfileCache };
    },
  };

  // ============================================================================
  // RATINGS REPOSITORY
  // ============================================================================
  public static ratings = {
    getAll: async (workerId?: string): Promise<Rating[]> => {
      await DatabaseService.initialize();
      if (workerId) {
        return DatabaseService.ratingsCache.filter(r => r.worker_id === workerId);
      }
      return [...DatabaseService.ratingsCache];
    },

    insert: async (rating: Rating): Promise<Rating> => {
      await DatabaseService.initialize();
      const newRating: Rating = {
        ...rating,
        id: rating.id || `r-${Date.now()}`,
        created_at: rating.created_at || new Date().toISOString(),
      };
      DatabaseService.ratingsCache.unshift(newRating);
      await DatabaseService.storageSet(
        KEY_RATINGS,
        JSON.stringify(DatabaseService.ratingsCache)
      );
      await DatabaseService.logChange('rating', 'insert', newRating.id, newRating);
      return { ...newRating };
    },
  };

  // ============================================================================
  // WELFARE REPOSITORY
  // ============================================================================
  public static welfare = {
    getAll: async (workerId?: string): Promise<Welfare[]> => {
      await DatabaseService.initialize();
      if (workerId) {
        return DatabaseService.welfareCache.filter(w => w.worker_id === workerId);
      }
      return [...DatabaseService.welfareCache];
    },

    insertClaim: async (claim: Welfare): Promise<Welfare> => {
      await DatabaseService.initialize();
      const newClaim: Welfare = {
        ...claim,
        id: claim.id || `welf-${Date.now()}`,
      };
      DatabaseService.welfareCache.unshift(newClaim);
      await DatabaseService.storageSet(
        KEY_WELFARE,
        JSON.stringify(DatabaseService.welfareCache)
      );
      await DatabaseService.logChange('welfare', 'insert', newClaim.id, newClaim);
      return { ...newClaim };
    },
  };

  // ============================================================================
  // AUDIT CHANGELOG REPOSITORY
  // ============================================================================
  public static changeLog = {
    getAll: async (): Promise<AuditChangeRecord[]> => {
      await DatabaseService.initialize();
      return [...DatabaseService.changeLogCache];
    },

    getStats: async (): Promise<{
      totalBookings: number;
      pendingPayments: number;
      totalInvoices: number;
      totalNotifications: number;
      totalLoggedChanges: number;
      storageType: string;
      cloudProvider: string;
    }> => {
      await DatabaseService.initialize();
      const pendingPayments = DatabaseService.bookingsCache.filter(
        b => b.payment_status !== 'paid'
      ).length;

      return {
        totalBookings: DatabaseService.bookingsCache.length,
        pendingPayments,
        totalInvoices: DatabaseService.invoicesCache.length,
        totalNotifications:
          DatabaseService.notificationsCache.customer.length +
          DatabaseService.notificationsCache.worker.length +
          DatabaseService.notificationsCache.admin.length,
        totalLoggedChanges: DatabaseService.changeLogCache.length,
        storageType: Platform.OS === 'web' ? 'IndexedDB/LocalStorage' : 'AsyncStorage',
        cloudProvider: CloudSyncAdapter.getConfig().provider,
      };
    },
  };
}
