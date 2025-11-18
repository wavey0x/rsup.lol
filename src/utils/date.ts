/**
 * Date and Timestamp Utility Functions
 * Centralized functions for formatting dates and timestamps
 */

/**
 * Formats a Unix timestamp to MM/DD HH:MM (UTC)
 * @param ts - Unix timestamp (seconds) or string representation
 * @returns Formatted date string like "11/18 14:30" or "-" if invalid
 */
export function formatTimestamp(ts: number | string): string {
  if (!ts) return "-";

  const timestamp = typeof ts === "string" ? Number(ts) : ts;
  if (!timestamp || isNaN(timestamp)) return "-";

  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) return "-";

  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");

  return `${mm}/${dd} ${hh}:${min}`;
}

/**
 * Formats a Unix timestamp to full date (MM/DD/YYYY)
 * @param ts - Unix timestamp (seconds)
 * @returns Formatted date string like "11/18/2025" or "-" if invalid
 */
export function formatDate(ts: number): string {
  if (!ts || isNaN(ts)) return "-";

  const date = new Date(ts * 1000);
  if (isNaN(date.getTime())) return "-";

  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const yyyy = date.getUTCFullYear();

  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Extracts timestamp from a row object, trying multiple common field names
 * @param row - Data row object that might contain timestamp
 * @returns Unix timestamp in seconds or null if not found
 */
export function getTimestamp(row: any): number | null {
  if (!row || typeof row !== "object") return null;

  // Try common timestamp field names
  const timestamp = row.timestamp || row.ts || row.time || row.block_timestamp;

  if (!timestamp) return null;

  const ts = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  return !isNaN(ts) && ts > 0 ? ts : null;
}

/**
 * Converts millisecond timestamp to seconds
 * @param ms - Timestamp in milliseconds
 * @returns Timestamp in seconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Converts second timestamp to milliseconds
 * @param seconds - Timestamp in seconds
 * @returns Timestamp in milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Checks if a timestamp is in seconds or milliseconds and normalizes to seconds
 * @param ts - Timestamp to normalize
 * @returns Timestamp in seconds
 */
export function normalizeTimestamp(ts: number): number {
  // If timestamp is likely in milliseconds (> year 2200 in seconds)
  if (ts > 10000000000) {
    return msToSeconds(ts);
  }
  return ts;
}
