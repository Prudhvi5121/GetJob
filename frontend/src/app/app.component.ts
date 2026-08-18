import { Component, OnInit } from '@angular/core';
import { apiUrl } from './api-config';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-root" [class.theme-dark]="theme === 'dark'">
      <header class="site-header">
        <div class="container header-inner">
          <a class="logo" routerLink="/" aria-label="GetJob home"><span class="logo-mark" aria-hidden="true">G</span><span>GetJob</span></a>
          <button class="menu-toggle" type="button" aria-label="Toggle navigation" [attr.aria-expanded]="menuOpen" (click)="menuOpen = !menuOpen"><span></span><span></span><span></span></button>
          <nav [class.open]="menuOpen" aria-label="Primary navigation">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOpen = false">Home</a>
            <a routerLink="/jobs" routerLinkActive="active" (click)="menuOpen = false">Jobs</a>
            <a routerLink="/saved" routerLinkActive="active" (click)="menuOpen = false">Saved Jobs</a>
            <a routerLink="/admin" routerLinkActive="active" (click)="menuOpen = false">Admin</a>
          </nav>
          <button class="theme-toggle" type="button" [attr.aria-pressed]="theme === 'dark'" [attr.title]="theme === 'dark' ? 'Use light theme' : 'Use dark theme'" [attr.aria-label]="theme === 'dark' ? 'Use light theme' : 'Use dark theme'" (click)="toggleTheme()"><span aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span></button>
        </div>
      </header>
      <main class="container">
        <router-outlet></router-outlet>
      </main>
      <footer class="site-footer container">GetJob · Real opportunities from public sources</footer>
    </div>
  `,
  styles: [`
    :host{display:block;min-width:0}
    .container{width:min(100% - 32px,1160px);margin:0 auto}
    .site-header{position:sticky;top:0;z-index:20;background:rgba(7,26,45,.97);color:#fff;border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 4px 18px rgba(7,26,45,.12)}
    .header-inner{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    .logo{display:inline-flex;align-items:center;gap:10px;color:#fff;font-size:1.3rem;font-weight:800;letter-spacing:-.045em;text-decoration:none}.logo-mark{display:grid;width:30px;height:30px;place-items:center;border-radius:9px;background:var(--accent);color:#062d31;font-size:.95rem;font-weight:900}
    nav{display:flex;align-items:center;gap:5px;flex:1;justify-content:flex-end}nav a{position:relative;color:#cbd8e4;padding:11px 12px;border-radius:9px;font-size:.86rem;font-weight:700;text-decoration:none;transition:color .15s ease,background .15s ease}nav a:hover,nav a:focus-visible,nav a.active{color:#fff;background:rgba(255,255,255,.1);outline:none}nav a.active:after{position:absolute;right:12px;bottom:4px;left:12px;height:2px;border-radius:2px;background:var(--accent);content:""}
    .theme-toggle{display:grid;width:38px;height:38px;flex:0 0 auto;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font-size:1.05rem;cursor:pointer;transition:background .15s ease,transform .15s ease}.theme-toggle:hover{background:rgba(255,255,255,.16);transform:translateY(-1px)}
    .menu-toggle{display:none;padding:8px;border:0;border-radius:8px;background:transparent;color:#fff;cursor:pointer}.menu-toggle span{display:block;width:20px;height:2px;margin:4px;background:currentColor}
    main{padding:38px 0 56px}
    .site-footer{padding:24px 0 32px;border-top:1px solid rgba(15,21,36,0.04);color:var(--muted);font-size:.875rem}
    @media (max-width:600px){.container{width:min(100% - 24px,1160px)}.header-inner{min-height:62px;gap:8px}.logo{font-size:1.2rem}.menu-toggle{display:block}nav{display:none;position:absolute;top:62px;right:12px;left:12px;padding:8px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:var(--primary-deep);box-shadow:var(--shadow-md)}nav.open{display:grid}nav a{padding:12px}.theme-toggle{width:36px;height:36px}.site-footer{font-size:.78rem}main{padding:24px 0 40px}}
  `]
})
export class AppComponent implements OnInit {
  health: any = null;
  menuOpen = false;
  theme: 'light' | 'dark' = this.readTheme();

  private readTheme(): 'light' | 'dark' {
    try { return localStorage.getItem('getjob.theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('getjob.theme', this.theme); } catch { }
  }

  ngOnInit(): void {
    // keep a quick health ping (not required for pages)
    fetch(apiUrl('/api/health'))
      .then(r => r.json())
      .then(j => (this.health = j))
      .catch(() => (this.health = { status: 'unreachable' }));
  }
}
