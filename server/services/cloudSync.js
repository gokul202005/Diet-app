// Cloud Database Sync Adapter (Supabase & Online Cloud Storage)
export class CloudSyncService {
  constructor(cloudUrl = process.env.SUPABASE_URL, cloudKey = process.env.SUPABASE_KEY) {
    this.cloudUrl = cloudUrl;
    this.cloudKey = cloudKey;
  }

  isConfigured() {
    return Boolean(this.cloudUrl && this.cloudKey);
  }

  // Sync state to cloud
  async syncToCloud(tableName, record) {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(`${this.cloudUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'apikey': this.cloudKey,
          'Authorization': `Bearer ${this.cloudKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(record)
      });
      return await res.json();
    } catch (err) {
      console.warn('Cloud sync error:', err.message);
      return null;
    }
  }

  // Fetch from cloud
  async fetchFromCloud(tableName, query = '') {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(`${this.cloudUrl}/rest/v1/${tableName}${query}`, {
        headers: {
          'apikey': this.cloudKey,
          'Authorization': `Bearer ${this.cloudKey}`,
        }
      });
      return await res.json();
    } catch (err) {
      console.warn('Cloud fetch error:', err.message);
      return null;
    }
  }
}
