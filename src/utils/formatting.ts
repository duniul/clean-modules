const SI = 1000;
const SIZE_UNITS = ['B', 'kB', 'MB', 'GB'] as const;
const MAX_FRACTION_DIGITS = 2;

/**
 * Trims a number to two fraction digits and removes trailing zeros.
 */
function trimNumber(value: number): string {
  return value.toFixed(MAX_FRACTION_DIGITS).replace(/\.?0+$/, '');
}

/**
 * Formats a byte length using decimal (SI) units up to GB (e.g. `1.2 MB`).
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < SI) {
    return `${Math.round(bytes)} B`;
  }

  let value = bytes / SI;
  let unit = 1;
  while (value >= SI && unit < SIZE_UNITS.length - 1) {
    value /= SI;
    unit++;
  }

  return `${trimNumber(value)} ${SIZE_UNITS[unit]}`;
}

const MS_PER_SECOND = 1000;
const SEC_PER_MINUTE = 60;
const MS_PER_MINUTE = SEC_PER_MINUTE * MS_PER_SECOND;

/**
 * Formats a duration in milliseconds up to minutes (e.g. `250ms`, `2.5s`, `1m 30s`).
 */
export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0ms';
  }

  if (ms < MS_PER_SECOND) {
    return `${Math.round(ms)}ms`;
  }

  if (ms < MS_PER_MINUTE) {
    return `${trimNumber(ms / MS_PER_SECOND)}s`;
  }

  const minutes = Math.floor(ms / MS_PER_MINUTE);
  const seconds = Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

export function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}
