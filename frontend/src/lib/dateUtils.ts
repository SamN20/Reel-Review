/**
 * Timezone-safe date utilities for formatting and manipulating date-only strings.
 * Helps prevent local-timezone offset shifts (e.g. EDT subtracting hours and rendering Sunday as Saturday).
 */

/**
 * Formats a date-only string (e.g., "YYYY-MM-DD") securely as a UTC date to prevent local timezone shifts.
 * 
 * @param dateStr The date string from the API (e.g., "2026-05-10")
 * @param options Intl.DateTimeFormatOptions (e.g., { weekday: 'long', month: 'short', day: 'numeric' })
 * @returns Formatted date string (e.g., "Sunday, May 10")
 */
export function formatDateUTC(dateStr: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (!dateStr) return "";
  
  // Force UTC timezone and merge with caller's custom formatting options
  const mergedOptions: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    ...options,
  };
  
  // Appending T00:00:00Z is standard to ensure deterministic UTC parsing across all JS engines
  const cleanedStr = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`;
  return new Date(cleanedStr).toLocaleDateString("en-US", mergedOptions);
}

/**
 * Serializes a local Date object into a timezone-safe "YYYY-MM-DD" local date string.
 * This is perfect for calendar calculations where you need local date values without offset shifts.
 * 
 * @param dateObj A local Date object
 * @returns "YYYY-MM-DD" string
 */
export function formatLocalDate(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a Sunday end-date for a given Monday start-date in a timezone-safe manner.
 * 
 * @param start_date Monday start date string (e.g. "2026-05-11")
 * @returns Sunday end date string (e.g. "2026-05-17")
 */
export function calculateEndOfWeek(start_date: string): string {
  if (!start_date) return "";
  const end = parseDateOnlyUTC(start_date);
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().split("T")[0];
}

export function parseDateOnlyUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function formatEasternDate(dateObj: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dateObj);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isDateBeforeEasternToday(dateStr: string, now: Date = new Date()): boolean {
  if (!dateStr) return false;
  return dateStr < formatEasternDate(now);
}

export function toEasternDateString(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatEasternDate(date);
}

export function getDateOnlyYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-\d{2}-\d{2}/.exec(dateStr);
  if (match) return Number(match[1]);
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}
