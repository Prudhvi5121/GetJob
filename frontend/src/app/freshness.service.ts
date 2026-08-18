import { Injectable } from '@angular/core';

export type FreshnessState = 'healthy' | 'stale' | 'unknown';

export interface FreshnessStatus {
  state: FreshnessState;
  label: string;
  updatedAt: Date | null;
}

@Injectable({ providedIn: 'root' })
export class FreshnessService {
  async getStatus(): Promise<FreshnessStatus> {
    try {
      const [healthResponse, runsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/ingestion/runs?per_page=50')
      ]);
      if (!healthResponse.ok || !runsResponse.ok) return this.unknown();

      const health = await healthResponse.json();
      const runsEnvelope = await runsResponse.json();
      if (!health?.data?.ok) return this.unknown();

      const runs = Array.isArray(runsEnvelope?.data) ? runsEnvelope.data : [];
      const successfulRun = runs.find((run: any) => run.finished_at && !run.error);
      if (!successfulRun) return this.unknown();

      const updatedAt = new Date(successfulRun.finished_at);
      if (Number.isNaN(updatedAt.getTime())) return this.unknown();

      const ageMs = Date.now() - updatedAt.getTime();
      const state: FreshnessState = ageMs <= 24 * 60 * 60 * 1000 ? 'healthy' : 'stale';
      return { state, updatedAt, label: state === 'healthy' ? 'Updated recently' : 'Data may be outdated' };
    } catch {
      return this.unknown();
    }
  }

  formatDate(value: Date | null): string | null {
    if (!value) return null;
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(value);
  }

  private unknown(): FreshnessStatus {
    return { state: 'unknown', label: 'Freshness unavailable', updatedAt: null };
  }
}
