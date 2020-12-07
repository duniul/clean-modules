import pm from 'picomatch';

interface PicoOptions {
  dot?: boolean;
  regex?: boolean;
  nocase?: boolean;
}

export type GlobFunc = (filePath: string, test?: boolean) => boolean;

export function makeGlobber(globs: string | string[], picoOptions: PicoOptions = {}): GlobFunc {
  return pm(globs, { dot: true, nocase: true, ...picoOptions });
}

export function getCustomGlobbers(includedGlobs?: string[], excludedGlobs?: string[]) {
  return {
    customInclude: includedGlobs && includedGlobs.length ? makeGlobber(includedGlobs) : undefined,
    customExclude: excludedGlobs && excludedGlobs.length ? makeGlobber(excludedGlobs) : undefined,
  };
}
