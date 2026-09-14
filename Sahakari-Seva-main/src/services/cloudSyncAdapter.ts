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
    provider: (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
      ? 'supabase'
      : process.env.EXPO_PUBLIC_API_URL
      ? 'rest'
      : 'local_only',
    endpoint: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_API_URL,
    apiKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
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
   * Queue a change to be synchronized with the remote cloud database.
   */
  public static async pushChange(payload: SyncPayload): Promise<boolean> {
    if (this.config.provider === 'local_only') {
      // Clean local operation: acknowledged immediately
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
        // Re-queue for next sync attempt
        this.syncQueue.push(item);
        failed++;
      }
    }

    this.isSyncing = false;
    return { success, failed };
  }

  private static async syncToSupabase(item: SyncPayload): Promise<void> {
    const table = item.entity;
    const url = `${this.config.endpoint}/rest/v1/${table}`;
    const headers = {
      'apikey': this.config.apiKey!,
      'Authorization': `Bearer ${this.config.apiKey!}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    };

    if (item.action === 'insert' || item.action === 'update') {
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.record),
      });
    } else if (item.action === 'delete') {
      await fetch(`${url}?id=eq.${item.entity_id}`, {
        method: 'DELETE',
        headers,
      });
    }
  }

  private static async syncToRest(item: SyncPayload): Promise<void> {
    const url = `${this.config.endpoint}/${item.entity}/${item.action === 'delete' ? item.entity_id : ''}`;
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
