import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { apiUrl } from './api-config';

@Component({
  selector: 'app-home',
  template: `
    <section class="home-page">
      <section class="hero">
        <div class="hero-content">
          <p class="eyebrow">Real opportunities, one place</p>
          <h1>Find your next opportunity</h1>
          <p class="hero-copy">Discover real job opportunities from trusted public sources.</p>
          <form class="hero-search" (ngSubmit)="search()">
            <label><span class="sr-only">Search jobs, skills or companies</span><input aria-label="Search jobs" placeholder="Search jobs, skills or companies" [(ngModel)]="q" name="q" /></label>
            <label><span class="sr-only">Location</span><input aria-label="Search location" placeholder="Location" list="home-locations" [(ngModel)]="location" name="location" /></label>
            <button type="submit">Search Jobs <span aria-hidden="true">→</span></button>
          </form>
          <datalist id="home-locations"><option *ngFor="let place of locations" [value]="place"></option></datalist>
          <div class="location-suggestions" aria-label="Popular locations"><span>Explore by location</span><button *ngFor="let place of locations" type="button" (click)="location = place; search()">{{ place }}</button></div>
        </div>
      </section>

      <section class="opportunities" aria-labelledby="latest-jobs">
        <div class="section-heading">
          <div><p class="eyebrow">Latest opportunities</p><div class="heading-row"><h2 id="latest-jobs">Recent Jobs</h2><span *ngIf="isFresh" class="freshness">Updated recently</span></div></div>
        </div>
        <div *ngIf="categories.length" class="category-strip" aria-label="Filter by category">
          <button *ngFor="let category of categories" type="button" (click)="searchCategory(category)">{{ category }}</button>
        </div>
        <div *ngIf="loading" class="skeleton-grid" aria-label="Loading jobs">
          <div *ngFor="let item of [1,2,3,4]" class="skeleton-card"><i></i><b></b><span></span><span></span></div>
        </div>
        <div *ngIf="error" class="error">{{ error }}</div>
        <div *ngIf="jobs?.length" class="job-grid"><app-job-card *ngFor="let j of jobs" [job]="j"></app-job-card></div>
        <div *ngIf="!loading && jobs && jobs.length === 0" class="state">No recent jobs.</div>
      </section>
    </section>
  `,
  styles: [`
    .home-page{padding-bottom:12px}.hero{position:relative;overflow:hidden;margin:0 -24px 50px;padding:66px 24px 42px;background:linear-gradient(135deg,var(--primary-deep),#123957 72%,#155b62);color:#fff}.hero:after{position:absolute;right:-100px;bottom:-130px;width:350px;height:350px;border:1px solid rgba(78,212,192,.25);border-radius:50%;box-shadow:0 0 0 40px rgba(78,212,192,.05),0 0 0 80px rgba(78,212,192,.04);content:""}.hero-content{position:relative;z-index:1;width:min(100%,900px);margin:0 auto;text-align:center}.eyebrow{margin:0 0 9px;color:var(--accent);font-size:.74rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:720px;margin:0 auto;font-size:clamp(2.3rem,5vw,4rem);line-height:1.06;letter-spacing:-.055em}.hero-copy{max-width:570px;margin:17px auto 0;color:#d4e2ed;font-size:1.05rem;line-height:1.6}.hero-search{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,.75fr) auto;gap:8px;max-width:820px;margin:28px auto 0;padding:8px;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(255,255,255,.09)}.hero-search label{min-width:0}.hero-search input{width:100%;padding:13px 14px;border:1px solid transparent;border-radius:9px;color:var(--text);background:#fff;outline:none}.hero-search input:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(22,184,166,.18)}.hero-search button{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 19px;border:0;border-radius:9px;background:var(--accent);color:#062d31;font-weight:850;cursor:pointer}.hero-search button:hover{filter:brightness(.95)}.location-suggestions{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:7px;margin-top:16px;color:#b6c9d7;font-size:.76rem}.location-suggestions button{padding:5px 9px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:transparent;color:#e7f1f5;font-size:.76rem;cursor:pointer}.location-suggestions button:hover{border-color:var(--accent);color:#fff}.opportunities{width:min(100%,1160px);margin:0 auto;padding-top:4px}.section-heading{margin-bottom:20px}.heading-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.section-heading h2{margin:0;color:var(--text);font-size:clamp(1.55rem,3vw,2.1rem);letter-spacing:-.04em}.freshness{padding:6px 9px;border:1px solid #c5e7e2;border-radius:999px;color:#08776f;background:var(--accent-soft);font-size:.75rem;font-weight:800;white-space:nowrap}.category-strip{display:flex;gap:8px;overflow:auto;margin:-2px 0 20px;padding:4px 0;scrollbar-width:none}.category-strip button{flex:0 0 auto;padding:8px 12px;border:1px solid #dbe4eb;border-radius:999px;color:#455568;background:#fff;font-size:.82rem;font-weight:750;cursor:pointer}.category-strip button:hover{border-color:#9bd8d1;color:#08776f;background:var(--accent-soft)}.job-grid,.skeleton-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.skeleton-card{min-height:190px;padding:18px;border:1px solid var(--line);border-radius:var(--radius-lg);background:#fff}.skeleton-card>*{display:block;border-radius:8px;background:linear-gradient(100deg,#edf1f4 20%,#f8fafb 40%,#edf1f4 60%);background-size:200% 100%;animation:shimmer 1.25s infinite}.skeleton-card i{width:40px;height:40px}.skeleton-card b{width:58%;height:15px;margin-top:17px}.skeleton-card span{width:92%;height:11px;margin-top:12px}.skeleton-card span:last-child{width:72%}@keyframes shimmer{to{background-position:-200% 0}}.state,.error{display:grid;gap:8px;padding:26px;border-radius:var(--radius-md);background:#fff}.state{border:1px dashed #cbd5e1;color:var(--muted)}.state strong{color:var(--text)}.state button{width:max-content;margin-top:5px;padding:11px 16px;border:0;border-radius:9px;background:var(--accent);color:#042033;font-weight:850;cursor:pointer}.error{border:1px solid #f5c2c7;color:#b42318;background:#fff4f4}@media(max-width:768px){.hero{margin:0 -16px 42px;padding:52px 16px 34px}.hero-search{grid-template-columns:1fr 1fr}.hero-search button{min-height:48px;grid-column:1/-1}.job-grid,.skeleton-grid{grid-template-columns:1fr}}@media(max-width:480px){.hero{margin-right:-12px;margin-left:-12px;padding-top:45px}.hero-search{grid-template-columns:1fr;padding:7px}.hero-search button{grid-column:auto;padding:13px}.location-suggestions{justify-content:flex-start}.freshness{font-size:.72rem}}
  `]
})
export class HomeComponent implements OnInit {
  jobs: any[] = []; categories: string[] = []; locations = ['India', 'All Locations', 'Bengaluru', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune', 'Delhi', 'Gurugram', 'Noida', 'Kolkata', 'Ahmedabad']; loading = false; error: string | null = null; q = ''; location = 'India'; isFresh = false;
  constructor(private router: Router) {}
  ngOnInit(): void {
    this.loading = true;
    fetch(apiUrl('/api/jobs?per_page=10')).then(r => r.json()).then(j => {
      this.jobs = j.data || []; this.categories = this.collectCategories(this.jobs); this.isFresh = this.jobs.some(job => this.isRecent(job.created_at)); this.loading = false;
    }).catch(() => { this.error = 'Failed to load jobs'; this.loading = false; });
  }
  search(): void { this.router.navigate(['/jobs'], { queryParams: { q: this.q || null, location: this.location === 'All Locations' ? 'All Locations' : (this.location || 'India') } }); }
  searchCategory(category: string): void { this.router.navigate(['/jobs'], { queryParams: { tags: category } }); }
  browseAll(): void { this.router.navigate(['/jobs'], { queryParams: { location: 'All Locations' } }); }
  private collectCategories(jobs: any[]): string[] { return [...new Set(jobs.flatMap(job => this.toList(job.tags)).filter(tag => tag.length <= 24))].slice(0, 8); }
  private isRecent(value: any): boolean { const date = new Date(value); return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 7; }
  private toList(value: any): string[] { if (Array.isArray(value)) return value.map(String); if (typeof value === 'string') { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : [value]; } catch { return [value]; } } return []; }
}
