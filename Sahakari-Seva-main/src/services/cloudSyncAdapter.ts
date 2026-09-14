// ==============================================================================
// SAHAKARI SEVA — HYBRID CLOUD SYNC ADAPTER
// Standardized adapter for syncing persistent local database mutations with
// remote cloud backends (Supabase PostgreSQL, REST API, or Firebase).
// ==============================================================================

export interface CloudSyncConfig {
  provider: 'supabase' | 'rest' | 'firebase' | 'local_only';
  endpoint?: string;
  apiKey?: string;
  autoSync: boolean;
}

export interface SyncPayload {
  entity: string;
  action: 'insert' | 'update' | 'delete';
  entity_id: string;
  record: any;
  timestamp: string;
}

export class CloudSyncAdapter {
  private static config: CloudSyncConfig = {
    provider: 'supabase',
    endpoint:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      'https://cvbraoniruzplwxbgzja.supabase.co',
    apiKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_nGQOmXn-_7FD0w4dMwbvgg_6KGkPR0X',
    autoSync: true,
  };

  private static syncQueue: SyncPayload[] = [];
  private static isSyncing = false;

  public static getConfig(): CloudSyncConfig {
    return { ...this.config };
  }

  public static setConfig(newConfig: Partial<CloudSyncConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Maps entity name to corresponding database table name in Supabase.
   */
  public static getTableName(entity: string): string {
    const tableMap: Record<string, string> = {
      booking: 'bookings',
      bookings: 'bookings',
      invoice: 'invoices',
      invoices: 'invoices',
      notification: 'notifications',
      notifications: 'notifications',
      worker: 'workers',
      workers: 'workers',
      profile: 'customer_profiles',
      customer_profiles: 'customer_profiles',
      rating: 'ratings',
      ratings: 'ratings',
      welfare: 'welfare',
      changelog: 'changelog',
    };
    return tableMap[entity] || entity;
  }

  /**
   * Queue a change to be synchronized with the remote cloud database.
   */
  public static async pushChange(payload: SyncPayload): Promise<boolean> {
    if (this.config.provider === 'local_only') {
      // Local operation acknowledged immediately
      return true;
    }

    this.syncQueue.push(payload);
    if (this.config.autoSync && !this.isSyncing) {
      this.flushQueue().catch(() => {});
    }
    return true;
  }

  /**
   * Flush pending changes to remote cloud backend.
   */
  public static async flushQueue(): Promise<{ success: number; failed: number }> {
    if (this.syncQueue.length === 0 || this.config.provider === 'local_only') {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    const queueCopy = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queueCopy) {
      try {
        if (this.config.provider === 'supabase' && this.config.endpoint && this.config.apiKey) {
          await this.syncToSupabase(item);
          success++;
        } else if (this.config.provider === 'rest' && this.config.endpoint) {
          await this.syncToRest(item);
          success++;
        }
      } catch (err) {
        console.warn(`[CloudSyncAdapter] Failed to sync ${item.entity}:${item.entity_id}`, err);
        // Re-queue failed item for next flush attempt
        this.syncQueue.push(item);
        failed++;
      }
    }

    this.isSyncing = false;
    return { success, failed };
  }

  private static async syncToSupabase(item: SyncPayload): Promise<void> {
    const table = this.getTableName(item.entity);
    const url = `${this.config.endpoint}/rest/v1/${table}`;
    const headers = {
      'apikey': this.config.apiKey!,
      'Authorization': `Bearer ${this.config.apiKey!}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    };

    if (item.action === 'insert' || item.action === 'update') {
      // Ensure raw_data and id are present
      const cleanRecord =
        typeof item.record === 'object' && item.record !== null
          ? {
              id: item.entity_id,
              ...item.record,
              raw_data: item.record,
            }
          : {
              id: item.entity_id,
              details: item.record,
              raw_data: item.record,
            };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanRecord),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase sync failed for ${table} [${res.status}]: ${errText}`);
      }
    } else if (item.action === 'delete') {
      const res = await fetch(`${url}?id=eq.${item.entity_id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase delete failed for ${table} [${res.status}]: ${errText}`);
      }
    }
  }

  private static async syncToRest(item: SyncPayload): Promise<void> {
    const table = this.getTableName(item.entity);
    const url = `${this.config.endpoint}/${table}/${item.action === 'delete' ? item.entity_id : ''}`;
    const method = item.action === 'insert' ? 'POST' : item.action === 'update' ? 'PATCH' : 'DELETE';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: item.action === 'delete' ? undefined : JSON.stringify(item.record),
    });
  }

  public static getQueueLength(): number {
    return this.syncQueue.length;
  }
}
