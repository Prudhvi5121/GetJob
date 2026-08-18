import { Component, OnInit } from '@angular/core';
import { apiUrl } from './api-config';

@Component({
  selector: 'app-admin',
  template: `
    <section class="admin-page">
      <div class="page-heading"><p class="eyebrow">Operations</p><h2>Ingestion Dashboard</h2></div>
      <div class="cards">
        <div class="card">
          <div class="label">Total jobs</div>
          <div class="value">{{ totalJobs }}</div>
        </div>
        <div class="card">
          <div class="label">Active sources</div>
          <div class="value">{{ sources?.length || 0 }}</div>
        </div>
        <div class="card">
          <div class="label">Successful runs</div>
          <div class="value">{{ successfulRuns }}</div>
        </div>
        <div class="card">
          <div class="label">Failed runs</div>
          <div class="value">{{ failedRuns }}</div>
        </div>
      </div>
      <div class="run-action card action"><div><p class="eyebrow">Source operations</p><strong>Keep the job index current</strong><span *ngIf="runMessage" class="success">{{ runMessage }}</span><span *ngIf="runError" class="err">{{ runError }}</span></div>
        <button [disabled]="running" (click)="runIngestion()">{{ running ? 'Running ingestion...' : 'Run ingestion now' }} <span aria-hidden="true">→</span></button>
      </div>

      <h3>Source Health</h3>
      <table class="sources">
        <thead><tr><th>Source</th><th>Status</th><th>Last Run</th></tr></thead>
        <tbody>
          <tr *ngFor="let s of sources">
            <td>{{ s.name || s.id }}</td>
            <td><span class="status" [class.healthy]="s.healthy" [class.failed]="!s.healthy">{{ s.healthy ? 'Healthy' : 'Failed' }}</span></td>
            <td>{{ s.last_run || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <h3>Recent Ingestion Runs</h3>
      <div class="table-wrap"><table class="runs">
        <thead><tr><th>Run ID</th><th>Source</th><th>Status</th><th>Started</th><th>Finished</th><th>Duration</th><th>Received</th><th>Inserted</th><th>Updated</th><th>Skipped</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of runs">
            <td>{{ r.id }}</td>
            <td>{{ r.source || 'all' }}</td>
            <td><span class="status" [class.healthy]="r.status === 'success' || r.status === 'completed'" [class.failed]="r.status === 'failed'" [class.degraded]="r.status === 'running'">{{ r.status }}</span></td>
            <td>{{ r.started_at }}</td>
            <td>{{ r.finished_at || '—' }}</td>
            <td>{{ r.duration || r.duration_ms || '—' }}</td><td>{{ r.received ?? r.jobs_received ?? '—' }}</td><td>{{ r.inserted ?? '—' }}</td><td>{{ r.updated ?? '—' }}</td><td>{{ r.skipped ?? '—' }}</td>
          </tr>
        </tbody>
      </table></div>
    </section>
  `,
  styles: [
    `.page-heading{margin-bottom:26px}.eyebrow{margin:0 0 6px;color:var(--accent-strong);font-size:.74rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}h2{margin:0;color:var(--text);font-size:clamp(1.65rem,3vw,2.15rem);letter-spacing:-.04em}h3{margin:34px 0 12px;color:var(--text);font-size:1.05rem;letter-spacing:-.015em}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.card{min-width:0;padding:19px;border:1px solid var(--line);border-radius:var(--radius-md);background:var(--card-bg);box-shadow:var(--shadow-sm)}.card .label{color:var(--muted);font-size:.76rem;font-weight:750;letter-spacing:.035em;text-transform:uppercase}.card .value{margin-top:7px;color:var(--text);font-size:1.8rem;font-weight:800;letter-spacing:-.05em}.run-action{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;border:1px solid #cde7e3;border-radius:var(--radius-md);background:#effaf7}.run-action strong{display:block;color:var(--text);font-size:1rem}.run-action button{padding:11px 15px;border:0;border-radius:9px;background:var(--accent);color:#042033;font-weight:850;cursor:pointer}.run-action button:disabled{background:#c5e8e2;color:#52716c;cursor:not-allowed}.success{display:block;margin-top:6px;color:var(--accent-strong);font-size:.82rem;font-weight:700}.err{display:block;margin-top:6px;color:#b42318;font-size:.82rem;line-height:1.4}.status{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef2f4;color:#526274;font-size:.72rem;font-weight:800;text-transform:capitalize}.status.healthy{background:var(--accent-soft);color:var(--accent-strong)}.status.degraded{background:#fff5d9;color:#916b00}.status.failed{background:#fff0f0;color:#b42318}.table-wrap{overflow-x:auto}table{width:100%;min-width:920px;table-layout:auto;border-collapse:separate;border-spacing:0;margin-top:8px;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius-md);background:var(--card-bg);box-shadow:var(--shadow-sm);font-size:.86rem}th,td{padding:12px 13px;vertical-align:top;border-bottom:1px solid #edf1f5;text-align:left;overflow-wrap:anywhere}th{color:var(--muted);background:#f8fafc;font-size:.7rem;font-weight:800;letter-spacing:.055em;text-transform:uppercase}tbody tr:hover td{background:#fbfefd}tr:last-child td{border-bottom:0}@media(max-width:900px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.cards{grid-template-columns:1fr;gap:10px}.card{padding:17px}.run-action{align-items:flex-start;flex-direction:column}.run-action button{width:100%}table{font-size:.72rem}th,td{padding:9px 5px}th{font-size:.61rem;word-break:break-word}}`
  ]
})
export class AdminComponent implements OnInit {
  sources: any[] = [];
  runs: any[] = [];
  running = false;
  runError: string | null = null;
  runMessage: string | null = null;
  totalJobs = 0;

  get healthyCount() { return this.sources.filter(s => s.healthy).length; }
  get successfulRuns() { return this.runs.filter(r => r.status === 'success' || r.status === 'completed').length; }
  get failedRuns() { return this.runs.filter(r => r.status === 'failed').length; }

  ngOnInit(): void {
    this.loadSources();
    this.loadRuns();
    fetch(apiUrl('/api/jobs?per_page=1')).then(r => r.json()).then(j => this.totalJobs = j.meta?.total || 0).catch(() => this.totalJobs = 0);
  }

  loadSources() {
    fetch(apiUrl('/api/sources'))
      .then(r => r.json())
      .then(j => { this.sources = j.data || j || []; })
      .catch(() => { this.sources = []; });
  }

  loadRuns() {
    fetch(apiUrl('/api/ingestion/runs'))
      .then(r => r.json())
      .then(j => { this.runs = j.data || j || []; })
      .catch(() => { this.runs = []; });
  }

  async runIngestion() {
    this.running = true; this.runError = null; this.runMessage = null;
    try {
      const resp = await fetch(apiUrl('/api/ingestion/run'), { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
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
      this.runMessage = 'Ingestion completed.';
    } catch (e: any) {
      this.runError = e?.message || 'Error starting ingestion';
    } finally { this.running = false; }
  }

  delay(ms:number){ return new Promise(res=>setTimeout(res, ms)); }
}
