import { describe, expect, it, vi } from 'vitest';
import { formatBytes, formatMs } from './formatting.js';

vi.setConfig({ testTimeout: 5000 });

describe(formatBytes, () => {
  it('returns 0 B for non-positive or non-finite input', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });

  it('formats values under 1 kB as B', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(999)).toBe('999 B');
  });

  it('uses decimal SI steps (1000) up to GB', () => {
    expect(formatBytes(1000)).toBe('1 kB');
    expect(formatBytes(1500)).toBe('1.5 kB');
    expect(formatBytes(1_000_000)).toBe('1 MB');
    expect(formatBytes(1_234_567)).toBe('1.23 MB');
    expect(formatBytes(1_000_000_000)).toBe('1 GB');
    expect(formatBytes(2_500_000_000)).toBe('2.5 GB');
  });

  it('stays on GB for very large values', () => {
    expect(formatBytes(5_000_000_000_000)).toBe('5000 GB');
  });
});

describe(formatMs, () => {
  it('returns 0ms for non-positive or non-finite input', () => {
    expect(formatMs(0)).toBe('0ms');
    expect(formatMs(-1)).toBe('0ms');
    expect(formatMs(Number.NaN)).toBe('0ms');
    expect(formatMs(Number.POSITIVE_INFINITY)).toBe('0ms');
  });

  it('formats sub-second durations in ms', () => {
    expect(formatMs(1)).toBe('1ms');
    expect(formatMs(500)).toBe('500ms');
    expect(formatMs(999)).toBe('999ms');
  });

  it('formats under one minute in seconds', () => {
    expect(formatMs(1000)).toBe('1s');
    expect(formatMs(1500)).toBe('1.5s');
    expect(formatMs(59_950)).toBe('59.95s');
  });

  it('formats one minute and up with m / m s', () => {
    expect(formatMs(60_000)).toBe('1m');
    expect(formatMs(90_000)).toBe('1m 30s');
    expect(formatMs(61_000)).toBe('1m 1s');
    expect(formatMs(125_000)).toBe('2m 5s');
  });
});
