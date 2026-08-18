import type { ArbeitnowValidated } from './validate';

export type CanonicalJob = {
  source: string;
  source_job_id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  remote: boolean | null;
  description: string | null;
  url: string | null;
  created_at: string | null; // ISO
  created_at_unix: number | null; // seconds
  tags: string[];
  job_types: string[];
};

export function normalizeArbeitnowItems(items: ArbeitnowValidated[]): CanonicalJob[] {
  return items.map((it) => {
    const created_at_unix = typeof it.created_at === 'number' ? it.created_at : null;
    const created_at = created_at_unix ? new Date(created_at_unix * 1000).toISOString() : null;

    let job_types: string[] = [];
    if (Array.isArray(it.job_types)) job_types = it.job_types;
    else if (it.job_types && typeof it.job_types === 'object') job_types = Object.values(it.job_types).map(String);
    else if (typeof it.job_types === 'string') job_types = [it.job_types];

    const tags = Array.isArray(it.tags) ? it.tags : [];

    return {
      source: 'arbeitnow',
      source_job_id: it.slug,
      title: it.title,
      company_name: it.company_name ?? null,
      location: it.location ?? null,
      remote: typeof it.remote === 'boolean' ? it.remote : null,
      description: it.description ?? null,
      url: it.url ?? null,
      created_at,
      created_at_unix,
      tags,
      job_types,
    } as CanonicalJob;
  });
}

export default { normalizeArbeitnowItems };
