import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section>
      <h2>Recent Jobs</h2>
      <div *ngIf="loading">Loading recent jobs...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <ul *ngIf="jobs?.length">
        <li *ngFor="let j of jobs" class="job-item">
          <a [routerLink]="['/jobs', j.id]">{{ j.title }}</a>
          <div class="meta">{{ j.company_name }} — {{ j.location }}</div>
        </li>
      </ul>
      <div *ngIf="jobs && jobs.length === 0">No recent jobs.</div>
    </section>
  `,
  styles: [`
    .job-item{padding:12px 0;border-bottom:1px solid #eef2ff}
    .meta{color:#6b7280;font-size:0.9em}
    .error{color:#ef4444}
  `]
})
export class HomeComponent implements OnInit {
  jobs: any[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loading = true;
    fetch('/api/jobs?per_page=10')
      .then(r => r.json())
      .then(j => { this.jobs = j.data || []; this.loading = false; })
      .catch(() => { this.error = 'Failed to load jobs'; this.loading = false; });
  }
}
