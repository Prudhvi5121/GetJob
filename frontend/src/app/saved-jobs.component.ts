import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SavedJobsService } from './saved-jobs.service';

@Component({
  selector: 'app-saved-jobs',
  template: `
    <section class="saved-page">
      <header class="page-heading"><p class="eyebrow">Your shortlist</p><h2>Saved Jobs</h2><p>Keep real opportunities close while you decide what is next.</p></header>
      <div *ngIf="error" class="error">We could not load your saved jobs.</div>
      <div *ngIf="!error && jobs.length" class="saved-grid"><app-job-card *ngFor="let job of jobs" [job]="job"></app-job-card></div>
      <div *ngIf="!error && !jobs.length" class="empty-state"><div class="empty-mark" aria-hidden="true">☆</div><h3>No saved jobs yet</h3><p>Save jobs you want to come back to later.</p><a routerLink="/jobs" class="browse-button">Browse Jobs <span aria-hidden="true">→</span></a></div>
    </section>
  `,
  styles: [`
    .saved-page{padding-bottom:18px}.page-heading{margin-bottom:24px}.eyebrow{margin:0 0 7px;color:var(--accent-strong);font-size:.74rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.page-heading h2{margin:0;color:var(--text);font-size:clamp(1.9rem,4vw,2.65rem);letter-spacing:-.05em}.page-heading p:last-child{margin:9px 0 0;color:var(--muted);line-height:1.55}.saved-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.empty-state{display:grid;justify-items:center;padding:64px 24px;border:1px dashed var(--line);border-radius:var(--radius-lg);background:var(--card-bg);text-align:center}.empty-mark{display:grid;width:48px;height:48px;place-items:center;border-radius:14px;background:var(--accent-soft);color:var(--accent-strong);font-size:1.7rem}.empty-state h3{margin:17px 0 6px;color:var(--text);font-size:1.2rem}.empty-state p{margin:0;color:var(--muted)}.browse-button{display:inline-flex;align-items:center;gap:7px;margin-top:22px;padding:11px 16px;border-radius:9px;background:var(--accent);color:#042033;font-size:.86rem;font-weight:850;text-decoration:none}.browse-button:hover{filter:brightness(.95)}.browse-button span{transition:transform .15s ease}.browse-button:hover span{transform:translateX(3px)}.error{padding:25px;border:1px solid #f5c2c7;border-radius:var(--radius-md);color:#b42318;background:#fff4f4}@media(max-width:600px){.saved-grid{grid-template-columns:1fr}.empty-state{padding:48px 20px}}
  `]
})
export class SavedJobsComponent implements OnInit, OnDestroy {
  jobs: any[] = [];
  error = false;
  private subscription?: Subscription;

  constructor(private savedJobs: SavedJobsService) {}

  ngOnInit(): void {
    this.reload();
    this.subscription = this.savedJobs.changed.subscribe(() => this.reload());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private reload(): void {
    try {
      this.jobs = this.savedJobs.list();
      this.error = false;
    } catch {
      this.jobs = [];
      this.error = true;
    }
  }
}
