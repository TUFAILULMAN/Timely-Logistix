/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClockRecord, User } from '../types';

/**
 * Safely normalizes any timestamp representation (number, numeric string, Firestore Timestamp, ISO string)
 * into a clean epoch millisecond number.
 */
export const normalizeTimestamp = (ts: any): number | undefined => {
  if (ts === null || ts === undefined) return undefined;
  if (typeof ts === 'number' && !isNaN(ts) && ts > 0) return Math.floor(ts);
  if (typeof ts === 'string') {
    const num = Number(ts);
    if (!isNaN(num) && num > 0) return Math.floor(num);
    const parsed = Date.parse(ts);
    if (!isNaN(parsed) && parsed > 0) return Math.floor(parsed);
  }
  if (typeof ts === 'object') {
    if (typeof ts.toMillis === 'function') return Math.floor(ts.toMillis());
    if (typeof ts.seconds === 'number') {
      return Math.floor(ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1000000 : 0));
    }
    if (typeof ts._seconds === 'number') {
      return Math.floor(ts._seconds * 1000 + (ts._nanoseconds ? ts._nanoseconds / 1000000 : 0));
    }
  }
  return undefined;
};

/**
 * Parse a time string like "05:00 PM", "5:00 PM", "17:00", "05:00:23 PM" into minutes from start of day (0..1439).
 */
export const parseTimeToMinutes = (t?: string): number => {
  if (!t) return 0;
  try {
    const clean = t.trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const numPart = clean.replace(/[^\d:]/g, '');
    const parts = numPart.split(':');
    if (parts.length === 0) return 0;
    let hh = parseInt(parts[0], 10) || 0;
    const mm = parseInt(parts[1], 10) || 0;
    if (isPM && hh !== 12) hh += 12;
    if (isAM && hh === 12) hh = 0;
    return hh * 60 + mm;
  } catch {
    return 0;
  }
};

/**
 * Parses date + time string into an exact epoch timestamp in milliseconds.
 * If fallbackTimestamp is provided and valid, returns it directly.
 * Handles overnight shift crossovers gracefully.
 */
export const parseFullDateTimeToMs = (
  dateStr?: string,
  timeStr?: string,
  fallbackTimestamp?: number,
  isOvernightNextDay?: boolean
): number => {
  const normFallback = normalizeTimestamp(fallbackTimestamp);
  if (normFallback && !isNaN(normFallback) && normFallback > 0) {
    return normFallback;
  }
  if (!timeStr) return Date.now();
  try {
    const cleanTime = timeStr.trim();
    const isPM = cleanTime.toUpperCase().includes('PM');
    const isAM = cleanTime.toUpperCase().includes('AM');
    const numPart = cleanTime.replace(/[^\d:]/g, '');
    const parts = numPart.split(':');
    let hh = parseInt(parts[0], 10) || 0;
    const mm = parseInt(parts[1], 10) || 0;
    const ss = parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0;
    if (isPM && hh !== 12) hh += 12;
    if (isAM && hh === 12) hh = 0;

    let d: Date;
    if (dateStr && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      d = new Date(year, month - 1, day, hh, mm, ss, 0);
      if (isOvernightNextDay) {
        d.setDate(d.getDate() + 1);
      }
    } else {
      d = new Date();
      d.setHours(hh, mm, ss, 0);
    }
    const ms = d.getTime();
    if (!isNaN(ms) && ms > 0) return ms;
  } catch (e) {
    console.warn('Date parse fallback error:', e);
  }
  return Date.now();
};

/**
 * Calculates exact break duration in integer minutes.
 * Uses exact timestamps if available, otherwise calculates time difference cleanly.
 */
export const calculateBreakMinutes = (
  takenAt: string,
  completedAt?: string,
  startedAtTimestamp?: number,
  completedAtTimestamp?: number
): number => {
  const startMs = normalizeTimestamp(startedAtTimestamp);
  const endMs = normalizeTimestamp(completedAtTimestamp);
  if (startMs && endMs && endMs >= startMs) {
    const diffMs = endMs - startMs;
    return Math.max(1, Math.round(diffMs / 60000));
  }
  if (!completedAt) return 0;
  const startMins = parseTimeToMinutes(takenAt);
  const endMins = parseTimeToMinutes(completedAt);
  if (endMins >= startMins) {
    return Math.max(1, endMins - startMins);
  }
  return Math.max(1, (1440 - startMins) + endMins);
};

const stripPrefix = (str?: string): string => {
  if (!str) return '';
  const s = str.toLowerCase().trim();
  if (s.startsWith('u_')) return s.substring(2);
  if (s.startsWith('disp_')) return s.substring(5);
  return s;
};

/**
 * Finds the currently active, uncompleted shift record for a user across all records.
 * Supports matching by user ID, dispatcher ID, username, or display name.
 * Robust against timezone differences, date crossovers (overnight shifts), and login/logout reloads.
 * Rejects stale dangling shifts older than 18 hours so clock never runs away to 70+ hours.
 */
export const findUserActiveShift = (
  attendanceList: ClockRecord[] | undefined,
  user: User | null | undefined
): ClockRecord | null => {
  if (!user || !attendanceList || attendanceList.length === 0) return null;
  const rawUserId = user.id || '';
  const rawUserDispId = user.dispatcherId || '';
  const cleanUsername = (user.username || '').toLowerCase().trim();
  const cleanName = (user.name || '').toLowerCase().trim();
  const strippedUserId = stripPrefix(rawUserId);
  const strippedDispId = stripPrefix(rawUserDispId);
  const now = Date.now();
  const MAX_ACTIVE_SHIFT_AGE_MS = 18 * 60 * 60 * 1000; // 18 hours max open shift window

  // Find all uncompleted (no clockOut) shifts for this user within valid shift window
  const matchingActive = attendanceList.filter(a => {
    if (!a || a.clockOut) return false;

    // Check age of shift to avoid ancient dangling ghost shifts
    const startMs = normalizeTimestamp(a.clockInTimestamp) || parseFullDateTimeToMs(a.date, a.clockIn);
    if (now - startMs > MAX_ACTIVE_SHIFT_AGE_MS) {
      return false; // Stale shift from days ago, ignore as active
    }

    const aDisp = (a.dispatcherId || '').toLowerCase().trim();
    const aDispName = (a.dispatcherName || '').toLowerCase().trim();
    const strippedADisp = stripPrefix(aDisp);

    // Direct ID comparisons
    if (a.dispatcherId === rawUserId || aDisp === rawUserId.toLowerCase()) return true;
    if (rawUserDispId && (a.dispatcherId === rawUserDispId || aDisp === rawUserDispId.toLowerCase())) return true;
    if (strippedADisp && (strippedADisp === strippedUserId || (strippedDispId && strippedADisp === strippedDispId))) return true;

    // Username / email comparisons
    if (cleanUsername) {
      if (aDisp === cleanUsername) return true;
      if (cleanUsername.includes('@') && aDisp === cleanUsername.split('@')[0]) return true;
      if (aDisp.includes('@') && aDisp.split('@')[0] === cleanUsername) return true;
    }

    // Name comparisons
    if (cleanName && (aDisp === cleanName || aDispName === cleanName)) return true;

    return false;
  });

  if (matchingActive.length === 0) return null;

  // If multiple found, sort by most recent clockInTimestamp or date+time descending
  matchingActive.sort((a, b) => {
    const timeA = normalizeTimestamp(a.clockInTimestamp) || parseFullDateTimeToMs(a.date, a.clockIn);
    const timeB = normalizeTimestamp(b.clockInTimestamp) || parseFullDateTimeToMs(b.date, b.clockIn);
    return timeB - timeA;
  });

  return matchingActive[0];
};

/**
 * Calculates live elapsed shift duration in monotonic seconds.
 * Guaranteed never to fluctuate or jump across midnight or timezones.
 * Caps runaway shifts safely at standard limit.
 */
export const getLiveShiftElapsedSeconds = (record: ClockRecord | null | undefined): number => {
  if (!record || !record.clockIn) return 0;
  const startMs = normalizeTimestamp(record.clockInTimestamp) || parseFullDateTimeToMs(record.date, record.clockIn);
  let endMs: number;
  if (record.clockOutTimestamp) {
    endMs = normalizeTimestamp(record.clockOutTimestamp) || Date.now();
  } else if (record.clockOut) {
    endMs = parseFullDateTimeToMs(record.date, record.clockOut);
    if (endMs < startMs) {
      endMs += 24 * 60 * 60 * 1000;
    }
  } else {
    endMs = Date.now();
  }
  const elapsedSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
  // Cap at 24 hours max (86400s) to prevent any mathematical display runaway
  return Math.min(elapsedSecs, 86400);
};

/**
 * Returns formatted HH:MM:SS string from elapsed seconds.
 */
export const formatSecondsToTimer = (totalSeconds: number): string => {
  const safeSecs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSecs / 3600).toString().padStart(2, '0');
  const mins = Math.floor((safeSecs % 3600) / 60).toString().padStart(2, '0');
  const secs = (safeSecs % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

/**
 * Formats integer minutes to human readable string like "8h 30m"
 */
export const formatMinutesToHours = (minutes?: number): string => {
  if (minutes === undefined || minutes === null) return 'In Progress';
  const safeMins = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMins / 60);
  const mins = safeMins % 60;
  return `${hrs}h ${mins}m`;
};

