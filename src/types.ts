export interface CleanResult {
  allFiles: string[];
  includedFiles: string[];
  excludedFiles: string[];
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
