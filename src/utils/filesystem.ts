import fs, { type Dirent } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CleanFailure, CleanFailurePhase } from '../shared.js';

export type DirentAction = (dirent: Dirent) => void;
export type CheckPathFunc = (nextPath: string) => boolean;
export type CrawlErrorHandler = (failure: CleanFailure) => void;

function hasErrorCode(error: unknown, code: string): boolean {
  return (error as { code?: string })?.code === code;
}

/**
 * Builds a `CleanFailure` from a thrown filesystem error.
 */
export function toFailure(filePath: string, phase: CleanFailurePhase, error: unknown): CleanFailure {
  const err = error as { code?: string; message?: string } | undefined;
  const failure: CleanFailure = {
    path: filePath,
    phase,
    message: err?.message ?? String(error),
  };

  if (err?.code !== undefined) {
    failure.code = err.code;
  }

  return failure;
}

/**
 * Check if a file exists without throwing.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.stat(filePath);

    return true;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT')) {
      return false;
    }

    throw error;
  }
}

/**
 * Asynchronously loop through each file in a directory, passing the dirents for each file to the provided action.
 * ENOENT/ENOTDIR errors are treated as empty directories. Other errors are forwarded to `onError`, when provided.
 */
export async function forEachDirentAsync(
  dirPath: string,
  action: DirentAction,
  onError?: CrawlErrorHandler
): Promise<void> {
  let dirFiles: Dirent[] = [];

  try {
    dirFiles = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (error: unknown) {
    if (!hasErrorCode(error, 'ENOENT') && !hasErrorCode(error, 'ENOTDIR')) {
      onError?.(toFailure(dirPath, 'readdir', error));
    }
  }

  await Promise.all(dirFiles.map(action));
}

/**
 * Get the file paths inside a directory without throwing.
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.promises.readdir(dirPath);
    return files;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) {
      return [];
    }

    throw error;
  }
}

/**
 * Counts the path separators in a directory path. Used to bucket directories
 * by depth so they can be processed strictly bottom-up.
 */
function depthOf(dirPath: string): number {
  let count = 0;
  for (const char of dirPath) {
    if (char === path.sep) {
      count++;
    }
  }
  return count;
}

/**
 * Attempts to remove a directory if it's empty. Returns true if it was removed.
 * ENOENT, EBUSY and similar errors are treated as no-ops (best effort).
 */
async function tryRemoveDirIfEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.promises.readdir(dirPath);
    if (entries.length > 0) {
      return false;
    }
    await fs.promises.rmdir(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deeply removes empty directories for each file path.
 *
 * Walks up from each file's immediate parent and removes any ancestor that is
 * empty. Directories are processed in waves grouped by depth to avoid redundant
 * `readdir` calls on shared ancestors.
 *
 * @param filePaths the file paths to remove empty directories for
 * @returns the number of empty directories removed
 */
export async function removeEmptyDirs(filePaths: string[] | readonly string[]): Promise<number> {
  if (filePaths.length === 0) {
    return 0;
  }

  const dirsByDepth = new Map<number, Set<string>>();
  let maxDepth = 0;

  function queue(dir: string): void {
    const depth = depthOf(dir);
    let bucket = dirsByDepth.get(depth);

    if (!bucket) {
      bucket = new Set();
      dirsByDepth.set(depth, bucket);
    }

    bucket.add(dir);

    if (depth > maxDepth) {
      maxDepth = depth;
    }
  }

  for (const filePath of filePaths) {
    queue(path.dirname(filePath));
  }

  let removedCount = 0;

  for (let depth = maxDepth; depth >= 0; depth--) {
    const bucket = dirsByDepth.get(depth);
    if (!bucket || bucket.size === 0) {
      continue;
    }

    // oxlint-disable-next-line no-await-in-loop
    const results = await Promise.all(
      [...bucket].map(async dir => ({ dir, removed: await tryRemoveDirIfEmpty(dir) }))
    );

    for (const { dir, removed } of results) {
      if (!removed) {
        continue;
      }

      removedCount++;

      const parent = path.dirname(dir);
      if (parent !== dir) {
        queue(parent);
      }
    }
  }

  return removedCount;
}

/**
 * Find all files in a directory as fast as possible, without any extra checks or validations.
 */
export async function crawlDirFast(
  filePaths: string[],
  dirPath: string,
  onError?: CrawlErrorHandler
): Promise<void> {
  await forEachDirentAsync(
    dirPath,
    async dirent => {
      const nextPath = dirPath + path.sep + dirent.name;

      if (dirent.isDirectory()) {
        await crawlDirFast(filePaths, nextPath, onError);
      } else {
        filePaths.push(nextPath);
      }
    },
    onError
  );
}

/**
 * Crawl files and validate them against glob patterns.
 */
export async function crawlDirWithChecks(
  filePaths: string[], // Mutate array to avoid losing speed on spreading
  dirPath: string,
  checkDir: CheckPathFunc,
  checkFile: CheckPathFunc,
  onError?: CrawlErrorHandler
): Promise<string[]> {
  await forEachDirentAsync(
    dirPath,
    async nextPathDirent => {
      const nextPath = dirPath + path.sep + nextPathDirent.name;

      if (nextPathDirent.isDirectory()) {
        if (checkDir(nextPath)) {
          // If a full directory matches, include all of it.
          await crawlDirFast(filePaths, nextPath, onError);
        } else {
          // Keep recursively checking each directory
          await crawlDirWithChecks(filePaths, nextPath, checkDir, checkFile, onError);
        }
      } else if (checkFile(nextPath)) {
        filePaths.push(nextPath);
      }
    },
    onError
  );

  return filePaths;
}

export type RemoveFilesOptions = {
  dryRun?: boolean;
};

export type RemoveFilesResult = {
  /** Number of files removed. */
  removedFilesCount: number;
  /** Total size of the removed files, in bytes. */
  reducedSize: number;
  /** Per-file failures encountered while stating or unlinking. */
  failures: CleanFailure[];
};

/**
 * Removes files and returns the total size of the removed files alongside any per-file failures.
 *
 * ENOENT errors are treated as a no-op (the file already does not exist). Any other error during
 * `stat` or `unlink` is captured as a {@link CleanFailure}.
 *
 * @param filePaths the file paths to remove
 * @param options dryRun: if true, don't actually remove the files
 */
export async function removeFiles(
  filePaths: string[] | readonly string[],
  options: RemoveFilesOptions = {}
): Promise<RemoveFilesResult> {
  let reducedSize = 0;
  const failures: CleanFailure[] = [];
  let removedFilesCount = 0;

  await Promise.all(
    filePaths.map(async filePath => {
      let fileStats: Awaited<ReturnType<typeof fs.promises.stat>>;

      try {
        fileStats = await fs.promises.stat(filePath);
      } catch (error: unknown) {
        if (!hasErrorCode(error, 'ENOENT')) {
          failures.push(toFailure(filePath, 'stat', error));
        }
        return;
      }

      if (!options.dryRun) {
        try {
          await fs.promises.unlink(filePath);
          removedFilesCount++;
        } catch (error: unknown) {
          if (!hasErrorCode(error, 'ENOENT')) {
            failures.push(toFailure(filePath, 'unlink', error));
          }
          return;
        }
      }

      reducedSize += fileStats.size;
    })
  );

  return { removedFilesCount, reducedSize, failures };
}

/**
 * Get directory of the file directory, like CommonJS `__dirname`.
 * @example const thisFilesDir = fileDir(import.meta.url);
 */
export function fileDir(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
