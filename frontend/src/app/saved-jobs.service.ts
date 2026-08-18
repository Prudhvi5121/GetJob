import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const STORAGE_KEY = 'getjob.savedJobs';

type SavedJob = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class SavedJobsService {
  private readonly changedSubject = new Subject<void>();
  readonly changed = this.changedSubject.asObservable();

  list(): SavedJob[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((job) => job && job.id !== undefined && job.id !== null) : [];
    } catch {
      return [];
    }
  }

  isSaved(id: string | number | undefined): boolean {
    if (id === undefined || id === null) return false;
    return this.list().some((job) => String(job.id) === String(id));
  }

  save(job: SavedJob): void {
    if (job?.id === undefined || job?.id === null || this.isSaved(job.id)) return;
    this.write([...this.list(), job]);
  }

  remove(id: string | number | undefined): void {
    if (id === undefined || id === null) return;
    this.write(this.list().filter((job) => String(job.id) !== String(id)));
  }

  private write(jobs: SavedJob[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      this.changedSubject.next();
    } catch { }
  }
}
