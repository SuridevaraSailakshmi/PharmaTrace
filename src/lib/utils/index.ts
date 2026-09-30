/**
 * PharmaTrace — Utility functions
 *
 * General-purpose utility functions.
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names with clsx.
 * If tailwind-merge is added later, wrap it here.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a date string for display.
 */
export function formatDate(dateString: string, locale = 'en-US'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date-time string for display.
 */
export function formatDateTime(dateString: string, locale = 'en-US'): string {
  return new Date(dateString).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for testing and development.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
