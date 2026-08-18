import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home.component';
import { JobsComponent } from './jobs.component';
import { JobDetailComponent } from './job-detail.component';
import { AdminComponent } from './admin.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, JobsComponent, JobDetailComponent, AdminComponent],
  imports: [BrowserModule, FormsModule, RouterModule.forRoot([
    { path: '', component: HomeComponent },
    { path: 'jobs', component: JobsComponent },
    { path: 'jobs/:id', component: JobDetailComponent },
    { path: 'admin', component: AdminComponent }
  ])],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
