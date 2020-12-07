import { promises as fsPromise } from 'fs';
import { DEFAULT_DIRS_GLOB, DEFAULT_FILES_GLOB, isDefaultDir, isDefaultFile } from './defaultGlobs';
import { CleanInfo, CleanResult } from './types';
import { getCustomGlobbers } from './utils/glob';

export async function analyzeResults(
  result: CleanResult,
  includedGlobs?: string[],
  excludedGlobs?: string[]
): Promise<CleanInfo> {
  const { customInclude, customExclude } = getCustomGlobbers(includedGlobs, excludedGlobs);

  const info: CleanInfo = {
    globs: {
      defaultDirs: DEFAULT_DIRS_GLOB,
      defaultFiles: DEFAULT_FILES_GLOB,
      includeArgs: includedGlobs,
      excludeArgs: excludedGlobs,
    },
    files: {},
  };

  await Promise.all(
    result.allFiles.map(async filePath => {
      const fileStats = await fsPromise.stat(filePath);

      info.files[filePath] = {
        includedBy: {
          defaultDirs: isDefaultDir(filePath),
          defaultFiles: isDefaultFile(filePath),
          includeArgs: !!customInclude && customInclude(filePath),
        },
        excludedByArgs: !!customExclude && customExclude(filePath),
        size: fileStats.size,
      };
    })
  );

  return info;
}
