import path from 'node:path';
import { fileDir } from './utils/filesystem.js';

export const DEFAULT_GLOBS_FILE_PATH = path.resolve(fileDir(import.meta.url), '..', '.cleanmodules-default');

export type SharedOptions = {
  /** The directory to clean, usually node_modules. */
  directory?: string;
  /** Path to a custom glob file. Uses `.cleanmodules` by default. */
  globFile?: string;
  /** Whether or not to include clean-modules' default globs. */
  noDefaults?: boolean;
  /** List of custom globs to include or exclude. */
  globs?: string[] | undefined;
};

export const sharedDefaultOptions: Required<SharedOptions> = {
  directory: path.resolve(process.cwd(), 'node_modules'),
  globFile: '.cleanmodules',
  noDefaults: false,
  globs: [],
};

/** Filesystem phase where a failure occurred. */
export type CleanFailurePhase = 'readdir' | 'stat' | 'unlink';

/** A non-fatal filesystem failure that occurred while crawling or removing files. */
export type CleanFailure = {
  /** Absolute path that the operation was attempted against. */
  path: string;
  /** Which filesystem operation failed. */
  phase: CleanFailurePhase;
  /** Error code, when the underlying error exposes one (e.g. `EACCES`, `EBUSY`). */
  code?: string;
  /** Human-readable error message. */
  message: string;
};
