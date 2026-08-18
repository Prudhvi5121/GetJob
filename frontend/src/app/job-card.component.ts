import { Component, Input } from '@angular/core';
import { SavedJobsService } from './saved-jobs.service';

@Component({
  selector: 'app-job-card',
  template: `
    <article class="job-item">
      <div class="card-heading">
        <div class="company-avatar" *ngIf="job?.company_name" [style.background]="avatarBackground" [style.color]="avatarColor">{{ companyInitial }}</div>
        <div class="card-title-group">
          <a [routerLink]="['/jobs', job.id]">{{ job.title }}</a>
          <p *ngIf="job.company_name">{{ job.company_name }}</p>
        </div>
      </div>
      <div class="job-badges meta" *ngIf="hasMetadata">
        <span *ngIf="job.location" class="location"><span aria-hidden="true">●</span> {{ job.location }}</span>
        <span *ngIf="isRemote" class="is-remote"><span aria-hidden="true">↗</span> Remote</span>
        <span *ngFor="let type of jobTypes">{{ type }}</span>
        <span *ngFor="let tag of tags">{{ tag }}</span>
      </div>
      <p *ngIf="descriptionPreview" class="job-preview">{{ descriptionPreview }}</p>
      <footer class="card-footer">
        <time *ngIf="formattedDate">{{ formattedDate }}</time>
        <button class="save-job" type="button" [class.saved]="isSaved" [attr.aria-pressed]="isSaved" [attr.aria-label]="isSaved ? 'Remove ' + job?.title + ' from saved jobs' : 'Save ' + job?.title" [attr.title]="isSaved ? 'Remove saved job' : 'Save job'" (click)="toggleSaved($event)"><span aria-hidden="true">{{ isSaved ? '★' : '☆' }}</span><span class="save-label">{{ isSaved ? 'Saved' : 'Save' }}</span></button>
        <a class="view-job" [routerLink]="['/jobs', job.id]">View Job <span aria-hidden="true">→</span></a>
      </footer>
    </article>
  `,
  styles: [`
    :host{display:block;height:100%}.job-item{display:flex;flex-direction:column;height:100%;min-width:0;padding:18px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--card-bg);box-shadow:var(--shadow-sm);transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}.job-item:hover{transform:translateY(-3px);border-color:#9bd7cf;box-shadow:var(--shadow-md)}.card-heading{display:flex;align-items:flex-start;gap:12px}.company-avatar{display:grid;flex:0 0 auto;width:40px;height:40px;place-items:center;border-radius:11px;color:#075f5a;font-size:.95rem;font-weight:850}.card-title-group{min-width:0}.card-title-group>a{display:block;color:var(--text);font-size:1rem;font-weight:800;line-height:1.35;text-decoration:none}.card-title-group>a:hover{color:var(--accent-strong);text-decoration:underline}.card-title-group p{margin:3px 0 0;color:var(--muted);font-size:.86rem;line-height:1.4}.job-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:15px}.job-badges span{max-width:100%;overflow-wrap:anywhere;padding:4px 8px;border:1px solid #dfe8ed;border-radius:999px;color:#526274;background:#f8fafc;font-size:.72rem;font-weight:700;line-height:1.3}.job-badges .location{border-color:transparent;background:transparent;padding-left:0;color:#526274}.job-badges .location span{color:var(--accent)}.job-badges .is-remote{border-color:#b9e5df;color:#08776f;background:var(--accent-soft)}.job-preview{display:-webkit-box;overflow:hidden;margin:14px 0 0;color:#526274;font-size:.85rem;line-height:1.52;-webkit-box-orient:vertical;-webkit-line-clamp:2}.card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:15px;border-top:1px solid #edf1f4}.card-footer time{color:var(--muted);font-size:.74rem}.save-job{display:inline-flex;align-items:center;gap:5px;padding:4px 6px;border:0;border-radius:7px;background:transparent;color:var(--muted);font-size:.76rem;font-weight:800;cursor:pointer;transition:color .15s ease,background .15s ease,transform .15s ease}.save-job:hover{background:var(--accent-soft);color:var(--accent-strong);transform:translateY(-1px)}.save-job.saved{color:var(--accent-strong)}.view-job{display:inline-flex;align-items:center;gap:6px;margin-left:auto;color:#087c74;font-size:.8rem;font-weight:800;text-decoration:none}.view-job span{transition:transform .15s ease}.view-job:hover span{transform:translateX(3px)}
  `]
})
export class JobCardComponent {
  @Input() job: any;
  constructor(private savedJobs: SavedJobsService) {}

  get companyInitial(): string { return (this.job?.company_name || '').trim().charAt(0).toUpperCase(); }
  get isRemote(): boolean { return this.job?.remote === true || this.job?.remote === 1 || this.job?.remote === '1'; }
  get isSaved(): boolean { return this.savedJobs.isSaved(this.job?.id); }
  toggleSaved(event: MouseEvent): void { event.stopPropagation(); if (this.isSaved) this.savedJobs.remove(this.job?.id); else this.savedJobs.save(this.job); }
  get jobTypes(): string[] { return this.toList(this.job?.job_types).slice(0, 2); }
  get tags(): string[] { return this.toList(this.job?.tags).slice(0, 2); }
  get hasMetadata(): boolean { return !!this.job?.location || this.isRemote || this.jobTypes.length > 0 || this.tags.length > 0; }
  get avatarBackground(): string { return this.avatarPalette.background; }
  get avatarColor(): string { return this.avatarPalette.color; }
  get descriptionPreview(): string {
    const text = String(this.job?.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length <= 210) return text;
    const lastSpace = text.lastIndexOf(' ', 207);
    return text.slice(0, lastSpace > 120 ? lastSpace : 207).trimEnd() + '…';
  }
  get formattedDate(): string | null {
    if (!this.job?.created_at) return null;
    const date = new Date(this.job.created_at);
    return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }
  private toList(value: any): string[] {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string') { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [value]; } catch { return value ? [value] : []; } }
    return [];
  }
  private get avatarPalette(): { background: string; color: string } {
    const palettes = [
      { background: 'linear-gradient(145deg,#c6f1eb,#92dbd2)', color: '#075f5a' },
      { background: 'linear-gradient(145deg,#dce9ff,#b8cef7)', color: '#284b8a' },
      { background: 'linear-gradient(145deg,#f6e0ff,#dfbef0)', color: '#704087' },
      { background: 'linear-gradient(145deg,#fff0cc,#f2d58c)', color: '#855d00' },
      { background: 'linear-gradient(145deg,#d9f0d8,#acd9ad)', color: '#276c3b' },
      { background: 'linear-gradient(145deg,#ffe0e1,#f3b9bb)', color: '#984249' }
    ];
    const name = String(this.job?.company_name || '');
    const hash = [...name].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0);
    return palettes[hash % palettes.length];
  }
}
