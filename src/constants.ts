import path from 'path';
import { PicomatchOptions } from 'picomatch';
import { fileDir } from './utils/filesystem.js';

export const DEFAULT_USER_GLOBS_FILE_NAME = '.cleanmodules';

export const DEFAULT_GLOBS_FILE_NAME = '.cleanmodules-default';

export const DEFAULT_GLOBS_FILE_PATH = path.resolve(
  fileDir(import.meta),
  '..',
  DEFAULT_GLOBS_FILE_NAME
);

export const DEFAULT_PICO_OPTIONS: Partial<PicomatchOptions> = {
  dot: true,
  nocase: true,
  strictSlashes: true,
};
