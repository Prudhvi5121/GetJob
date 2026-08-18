import { GENERATED_API_BASE_URL } from './api-config.generated';

export function apiUrl(path: string): string {
  return `${GENERATED_API_BASE_URL}${path}`;
}
