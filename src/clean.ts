import type { CleanFailure, SharedOptions } from './shared.js';
import { sharedDefaultOptions } from './shared.js';
import { removeEmptyDirs, removeFiles } from './utils/filesystem.js';
import { findFilesByGlobLists, getGlobLists } from './utils/glob.js';

export const defaultCleanOptions: Required<CleanOptions> = {
  ...sharedDefaultOptions,
  dryRun: false,
  keepEmpty: false,
};

export type CleanResult = {
  /** List of all files matched for cleanup. */
  files: string[];
  /** Number of files that were removed. */
  removedFilesCount: number;
  /** How many bytes of data that was removed when cleaning. */
  reducedSize: number;
  /** The number of empty directories that were cleaned up after the operation. */
  removedEmptyDirs: number;
  /** Non-fatal failures encountered while crawling or removing files. */
  failures: CleanFailure[];
};

export type CleanOptions = SharedOptions & {
  /** Whether to skip actually deleting any files and just perform a dry run of the cleaning operation. */
  dryRun?: boolean;
  /** Whether to keep empty directories around after cleaning. */
  keepEmpty?: boolean;
};

/**
 * Removes unnecessary files to reduce the size of a node_modules directory.
 * @param options clean options
 * @returns summary of the clean operation
 */
export async function clean(options: CleanOptions = {}): Promise<CleanResult> {
  const mergedOptions = { ...defaultCleanOptions, ...options };
  const { globs, noDefaults, globFile, directory, dryRun, keepEmpty } = mergedOptions;

  const globLists = await getGlobLists({ globs, noDefaults, globFile });
  const { files, failures: crawlFailures } = await findFilesByGlobLists(directory, globLists);
  const { removedFilesCount, reducedSize, failures: removeFailures } = await removeFiles(files, { dryRun });
  const removedEmptyDirs = dryRun || keepEmpty ? 0 : await removeEmptyDirs(files);

  return {
    files,
    removedFilesCount,
    reducedSize,
    removedEmptyDirs,
    failures: [...crawlFailures, ...removeFailures],
  };
}
