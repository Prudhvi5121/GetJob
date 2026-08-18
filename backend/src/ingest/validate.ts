import { z } from 'zod';
import type { ArbeitnowRaw } from '../adapters/arbeitnow';

const ArbeitnowSchema = z.object({
  slug: z.string(),
  company_name: z.string().nullable().optional(),
  title: z.string(),
  description: z.string(),
  remote: z.boolean().optional().nullable(),
  url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  job_types: z.array(z.string()).optional(),
  location: z.string().optional().nullable(),
  created_at: z.number().optional().nullable(),
});

export type ArbeitnowValidated = z.infer<typeof ArbeitnowSchema>;

export function validateArbeitnowItems(items: unknown[]) {
  const valid: ArbeitnowValidated[] = [];
  const invalid: Array<{ item: unknown; error: any }> = [];

  for (const it of items) {
    const res = ArbeitnowSchema.safeParse(it);
    if (res.success) valid.push(res.data);
    else invalid.push({ item: it, error: res.error.format() });
  }

  return { valid, invalid };
}

export default { ArbeitnowSchema, validateArbeitnowItems };
