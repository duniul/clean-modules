export interface CleanResult {
  includedFiles: string[];
  reducedSize?: number;
  removedEmptyDirs?: number;
  info?: CleanInfo;
}

export interface FileInfo {
  includedBy: {
    defaultFiles: boolean;
    defaultDirs: boolean;
    includeArgs: boolean;
  };
  excludedByArgs: boolean;
  size: number;
}

export interface CleanInfo {
  globs: {
    defaultFiles: string;
    defaultDirs: string;
    includeArgs?: string[] | string;
    excludeArgs?: string[] | string;
  };
  files: Record<string, FileInfo>;
}

export interface IncludedExcludedArgs {
  included: string[];
  excluded: string[];
}

export interface GlobLists {
  excluded: string[];
  included: string[];
  includedDirs?: string[];
  originalIncluded: string[];
}
