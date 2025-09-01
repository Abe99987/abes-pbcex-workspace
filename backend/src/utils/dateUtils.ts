/**
 * Date utility functions for consistent timestamp formatting
 */

/**
 * Format a date to ISO string, handling null/undefined values
 */
export function formatTimestamp(
  date: Date | string | null | undefined
): string | null {
  if (!date) return null;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;

    return dateObj.toISOString();
  } catch {
    return null;
  }
}

/**
 * Format a date to ISO date string (YYYY-MM-DD), handling null/undefined values
 */
export function formatDate(
  date: Date | string | null | undefined
): string | null {
  if (!date) return null;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;

    const parts = dateObj.toISOString().split('T');
    return parts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a date for display, handling null/undefined values
 */
export function formatForDisplay(
  date: Date | string | null | undefined
): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleString();
  } catch {
    return 'Error formatting date';
  }
}
