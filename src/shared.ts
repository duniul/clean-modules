import path from 'path';
import { fileDir } from './utils/filesystem.js';

export const DEFAULT_GLOBS_FILE_PATH = path.resolve(
  fileDir(import.meta),
  '..',
  '.cleanmodules-default'
);

export interface SharedOptions {
  // The directory to clean, usually node_modules.
  directory?: string;
  // Path to a custom glob file. Uses `.cleanmodules` by default.
  globFile?: string;
  // Whether or not to include clean-modules' default globs.
  noDefaults?: boolean;
  // List of custom globs to include or exclude.
  globs?: string[] | undefined;
}

export const sharedDefaultOptions: Required<SharedOptions> = {
  directory: path.resolve(process.cwd(), 'node_modules'),
  globFile: '.cleanmodules',
  noDefaults: false,
  globs: [],
};
