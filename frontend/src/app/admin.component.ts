import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin',
  template: `
    <section>
      <h2>Ingestion Dashboard</h2>
      <div class="cards">
        <div class="card">
          <div class="label">Sources</div>
          <div class="value">{{ sources?.length || 0 }}</div>
        </div>
        <div class="card">
          <div class="label">Healthy</div>
          <div class="value">{{ healthyCount }}</div>
        </div>
        <div class="card">
          <div class="label">Recent Runs</div>
          <div class="value">{{ runs?.length || 0 }}</div>
        </div>
        <div class="card action">
          <button [disabled]="running" (click)="runIngestion()">{{ running ? 'Running…' : 'Run ingestion now' }}</button>
          <div *ngIf="runError" class="err">{{ runError }}</div>
        </div>
      </div>

      <h3>Source Health</h3>
      <table class="sources">
        <thead><tr><th>Source</th><th>Healthy</th><th>Last Run</th></tr></thead>
        <tbody>
          <tr *ngFor="let s of sources">
            <td>{{ s.name || s.id }}</td>
            <td>{{ s.healthy ? 'Yes' : 'No' }}</td>
            <td>{{ s.last_run || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <h3>Recent Ingestion Runs</h3>
      <table class="runs">
        <thead><tr><th>Run ID</th><th>Source</th><th>Status</th><th>Started</th><th>Finished</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of runs">
            <td>{{ r.id }}</td>
            <td>{{ r.source || 'all' }}</td>
            <td>{{ r.status }}</td>
            <td>{{ r.started_at }}</td>
            <td>{{ r.finished_at || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `.cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}.card{background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 3px rgba(2,6,23,0.06);flex:1;min-width:160px}
     .card .label{color:#6b7280;font-size:0.9em}
     .card .value{font-size:1.6em;font-weight:600}
     .card.action button{background:#2563eb;color:#fff;border:0;padding:8px 12px;border-radius:6px}
     table{width:100%;border-collapse:collapse;margin-top:8px}
     th,td{padding:8px;border-bottom:1px solid #eef2ff;text-align:left}
     .err{color:#b91c1c;margin-top:6px}
  `]
})
export class AdminComponent implements OnInit {
  sources: any[] = [];
  runs: any[] = [];
  running = false;
  runError: string | null = null;

  get healthyCount() { return this.sources.filter(s => s.healthy).length; }

  ngOnInit(): void {
    this.loadSources();
    this.loadRuns();
  }

  loadSources() {
    fetch('/api/sources')
      .then(r => r.json())
      .then(j => { this.sources = j.data || j || []; })
      .catch(() => { this.sources = []; });
  }

  loadRuns() {
    fetch('/api/ingestion/runs')
      .then(r => r.json())
      .then(j => { this.runs = j.data || j || []; })
      .catch(() => { this.runs = []; });
  }

  async runIngestion() {
    this.running = true; this.runError = null;
    try {
      const resp = await fetch('/api/ingestion/run', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
      if (!resp.ok) throw new Error('Failed to start ingestion');
      // poll recent runs until latest run not running
      for (let i=0;i<30;i++) {
        await this.delay(2000);
        await this.loadRuns();
        const latest = this.runs && this.runs[0];
        if (!latest) break;
        if (latest.status !== 'running') break;
      }
      await this.loadSources();
    } catch (e: any) {
      this.runError = e?.message || 'Error starting ingestion';
    } finally { this.running = false; }
  }

  delay(ms:number){ return new Promise(res=>setTimeout(res, ms)); }
}
