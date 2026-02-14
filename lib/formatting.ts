const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/**
 * Format a byte count as a human-readable file size.
 *
 * Examples: "128 B", "4.2 KB", "12.8 MB", "1.05 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

const MONTH_ABBREVS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format an epoch-millisecond timestamp as "MMM d, yyyy h:mm AM/PM" in the
 * device's local timezone.
 *
 * Example: "Jan 15, 2024 3:30 PM"
 */
export function formatTimestamp(epochMs: number): string {
  const d = new Date(epochMs);
  const month = MONTH_ABBREVS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const amPm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12; // convert 0 -> 12

  const mm = String(minutes).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${mm} ${amPm}`;
}

/**
 * Format a transfer speed in bytes/sec as "X.X KB/s" or "X.X MB/s".
 */
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < MB) {
    return `${(bytesPerSec / KB).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSec / MB).toFixed(1)} MB/s`;
}

const MAX_REASONABLE_SECONDS = 359_999; // ~100 hours

/**
 * Format an estimated number of seconds remaining as a human-readable string.
 *
 * Examples: "~45 sec remaining", "~12 min remaining", "~2h 15m remaining"
 */
export function formatEta(seconds: number): string {
  if (seconds < 0 || !Number.isFinite(seconds) || seconds > MAX_REASONABLE_SECONDS) {
    return 'calculating...';
  }

  if (seconds < 60) {
    return `~${Math.round(seconds)} sec remaining`;
  }

  if (seconds < 3600) {
    return `~${Math.round(seconds / 60)} min remaining`;
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `~${h}h ${m}m remaining`;
}

/**
 * Format a future epoch-millisecond target as a countdown ("XXh YYm") relative
 * to the current time. Returns "Now" if the target is in the past.
 */
export function formatCountdown(targetMillis: number): string {
  const diffMs = targetMillis - Date.now();

  if (diffMs <= 0) return 'Now';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Format an hour (0-23) and minute (0-59) as "H:MM AM/PM".
 *
 * Examples: (3, 0) -> "3:00 AM", (15, 30) -> "3:30 PM"
 */
export function formatScheduleTime(hour: number, minute: number): string {
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const mm = String(minute).padStart(2, '0');
  return `${displayHour}:${mm} ${amPm}`;
}
