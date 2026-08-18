import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-job-detail',
  template: `
    <section>
      <div *ngIf="loading">Loading job...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <article *ngIf="job">
        <h2>{{ job.title }}</h2>
        <div class="meta">{{ job.company_name }} — {{ job.location }}</div>
        <div class="desc" [innerHTML]="job.description"></div>
        <p><a [href]="job.url" target="_blank" rel="noreferrer">View Original</a></p>
      </article>
    </section>
  `,
  styles: [`
    .meta{color:#6b7280}
    .desc{margin-top:12px}
  `]
})
export class JobDetailComponent implements OnInit {
  job: any = null; loading = false; error: string | null = null;
  constructor(private route: ActivatedRoute) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loading = true;
    fetch('/api/jobs/' + id)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(j => { this.job = j.data || j; this.loading = false; })
      .catch(() => { this.error = 'Failed to load job'; this.loading = false; });
  }
}
