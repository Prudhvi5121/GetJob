export interface JobSourceAdapter<T = any> {
  getSourceName(): string;
  fetchJobs(): Promise<T[]>;
  getSourceStatus(): Promise<{ healthy: boolean; lastChecked?: string }>;
}
