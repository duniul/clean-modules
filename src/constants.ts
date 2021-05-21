import path from 'path';
import { PicomatchOptions } from 'picomatch';

export const DEFAULT_USER_GLOBS_FILE_NAME = '.cleanmodules';

export const DEFAULT_GLOBS_FILE_NAME = '.cleanmodules-default';

export const DEFAULT_GLOBS_FILE_PATH = path.resolve(__dirname, `../${DEFAULT_GLOBS_FILE_NAME}`);

export const DEFAULT_PICO_OPTIONS: Partial<PicomatchOptions> = {
  dot: true,
  nocase: true,
  strictSlashes: true,
};
