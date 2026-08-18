import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-jobs',
  template: `
    <section>
      <h2>Jobs</h2>
      <div class="controls">
        <input placeholder="Search" [(ngModel)]="q" />
        <input placeholder="Location" [(ngModel)]="location" />
        <label class="remote"><input type="checkbox" [(ngModel)]="remote" /> Remote</label>
        <input placeholder="Category" [(ngModel)]="category" />
        <select multiple [(ngModel)]="job_types">
          <option *ngFor="let t of availJobTypes" [value]="t">{{t}}</option>
        </select>
        <button (click)="search()">Search</button>
      </div>

      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>

      <ul *ngIf="jobs?.length">
        <li *ngFor="let j of jobs" class="job-item">
          <a [routerLink]="['/jobs', j.id]">{{ j.title }}</a>
          <div class="meta">{{ j.company_name }} — {{ j.location }}</div>
        </li>
      </ul>
      <div *ngIf="jobs && jobs.length === 0">No jobs found.</div>

      <div class="pagination">
        <button (click)="prev()" [disabled]="page<=1">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button (click)="next()" [disabled]="page>=totalPages">Next</button>
      </div>
    </section>
  `,
  styles: [
    `.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center}
     .controls input,.controls select{padding:8px;border:1px solid #e5e7eb;border-radius:6px}
     .controls .remote{display:flex;align-items:center;gap:6px}
     .job-item{padding:12px 0;border-bottom:1px solid #eef2ff}.meta{color:#6b7280}`
  ]
})
export class JobsComponent implements OnInit {
  jobs: any[] = [];
  loading = false;
  error: string | null = null;
  q = '';
  location = '';
  remote: boolean | null = null;
  category = '';
  job_types: string[] = [];
  availJobTypes: string[] = ['Full Time','Part Time','Contract','Internship','Temporary'];
  page = 1;
  per_page = 10;
  total = 0;

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.per_page)); }

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true; this.error = null;
    const qs = new URLSearchParams({ page: String(this.page), per_page: String(this.per_page) });
    if (this.q) qs.set('q', this.q);
    if (this.location) qs.set('location', this.location);
    if (this.remote !== null) qs.set('remote', String(this.remote));
    if (this.category) qs.set('category', this.category);
    if (this.job_types && this.job_types.length) qs.set('job_types', this.job_types.join(','));
    fetch('/api/jobs?' + qs.toString())
      .then(r => r.json())
      .then(j => { this.jobs = j.data || []; this.total = j.meta?.total || this.jobs.length; this.loading = false; })
      .catch(() => { this.error = 'Failed to load jobs'; this.loading = false; });
  }

  search() { this.page = 1; this.load(); }
  next() { if (this.page < this.totalPages) { this.page++; this.load(); } }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
}
