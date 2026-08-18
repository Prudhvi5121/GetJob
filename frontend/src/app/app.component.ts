import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-root">
      <header class="site-header">
        <div class="container">
          <h1 class="logo">JobFlow</h1>
          <nav>
            <a routerLink="/">Home</a>
            <a routerLink="/jobs">Jobs</a>
            <a routerLink="/admin">Admin</a>
          </nav>
        </div>
      </header>
      <main class="container">
        <router-outlet></router-outlet>
      </main>
      <footer class="site-footer container">© JobFlow</footer>
    </div>
  `,
  styles: [`
    .container{max-width:1100px;margin:0 auto;padding:0 16px}
    .site-header{background:#0f172a;color:#fff;padding:12px 0}
    .logo{margin:0;display:inline-block}
    nav{float:right}
    nav a{color:#cbd5e1;margin-left:16px;text-decoration:none}
    main{padding:24px 0}
    .site-footer{padding:16px 0;color:#6b7280}
  `]
})
export class AppComponent implements OnInit {
  health: any = null;

  ngOnInit(): void {
    // keep a quick health ping (not required for pages)
    fetch('/api/health')
      .then(r => r.json())
      .then(j => (this.health = j))
      .catch(() => (this.health = { status: 'unreachable' }));
  }
}
