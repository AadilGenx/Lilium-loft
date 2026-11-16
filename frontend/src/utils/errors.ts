import { ApiError } from '@/services/api/client';

/**
 * The message to show in a toast when a call fails.
 * Only messages that came from the API client are shown (they are already generic);
 * anything else, such as a JavaScript error, becomes the fallback.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}
