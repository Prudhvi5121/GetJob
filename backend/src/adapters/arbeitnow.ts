import { z } from 'zod';
import { JobSourceAdapter } from './JobSourceAdapter';
import { FetchError } from './fetchError';

const ArbeitnowItem = z.object({
  slug: z.string(),
  company_name: z.string().nullable().or(z.string()),
  title: z.string(),
  description: z.string(),
  remote: z.boolean().optional().nullable(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  job_types: z.array(z.string()).optional(),
  location: z.string().optional().nullable(),
  created_at: z.number().optional()
});

const ArbeitnowResponse = z.object({ data: z.array(ArbeitnowItem) });

export type ArbeitnowRaw = z.infer<typeof ArbeitnowItem>;

export class ArbeitnowJobSource implements JobSourceAdapter<ArbeitnowRaw> {
  getSourceName(): string {
    return 'arbeitnow';
  }

  async fetchJobs(): Promise<ArbeitnowRaw[]> {
    let res: any;
    try {
      res = await fetch('https://arbeitnow.com/api/job-board-api');
    } catch (err:any) {
      throw new FetchError(String(err?.message || err), undefined, true);
    }

    if (!res.ok) {
      const status = res.status;
      const isTransient = status >= 500;
      throw new FetchError(`Arbeitnow fetch failed: ${status}`, status, isTransient);
    }
    const json = await res.json();
    const parsed = ArbeitnowResponse.safeParse(json);
    if (parsed.success) {
      return parsed.data.data;
    }

    // Fallbacks for slightly different shapes observed in the wild
    if (Array.isArray(json)) {
      return json as ArbeitnowRaw[];
    }
    if (json && Array.isArray((json as any).data)) {
      return (json as any).data as ArbeitnowRaw[];
    }

    // Nothing matched; include zod error for debugging
    const errText = JSON.stringify(parsed.error.format(), null, 2);
    throw new Error(`Arbeitnow response did not match expected schema: ${errText}`);
  }

  async getSourceStatus(): Promise<{ healthy: boolean; lastChecked?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://arbeitnow.com/api/job-board-api', { signal: controller.signal });
      clearTimeout(timeout);
      return { healthy: res.ok, lastChecked: new Date().toISOString() };
    } catch (err) {
      return { healthy: false, lastChecked: new Date().toISOString() };
    }
  }
}

export default ArbeitnowJobSource;
