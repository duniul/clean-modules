import type { expect } from 'vitest';

function normalizePathPart(str: string): string {
  return str.replaceAll('\\', '/'); // replace windows backslashes
}

function normalizePath(str: string): string {
  const normalizedCwd = normalizePathPart(process.cwd());
  const normalizedStr = normalizePathPart(str);
  return normalizedStr.replace(normalizedCwd, '<CWD>');
}

function shouldNormalizePath(val: unknown): val is string {
  if (typeof val === 'string') {
    return normalizePath(val) !== val;
  }

  return false;
}

type Serializer = Parameters<typeof expect.addSnapshotSerializer>[0];

export const pathSerializer: Serializer = {
  serialize(val, config, indentation, depth, refs, printer) {
    if (typeof val === 'string') {
      const normalizedVal = normalizePath(val);
      return printer(normalizedVal, config, indentation, depth, refs);
    }

    if (typeof val === 'object') {
      const normalizedVal = Object.fromEntries(
        Object.entries(val).map(([key, value]) => [
          key,
          typeof value === 'string' ? normalizePath(value) : value,
        ])
      );

      return printer(normalizedVal, config, indentation, depth, refs);
    }

    return val;
  },
  test(val) {
    return shouldNormalizePath(val);
  },
};
