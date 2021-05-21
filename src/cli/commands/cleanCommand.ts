import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { findFilesToRemove, removeEmptyDirs, removeFiles } from '../..';
import { IncludedExcludedArgs } from '../../types';
import { getGlobLists } from '../../utils/glob';
import { bold, green, makeLogger, yellow, yesOrNo } from '../../utils/terminal';

export interface CleanCommandProps {
  argGlobs: IncludedExcludedArgs;
  nodeModulesPath: string;
  userGlobsFilePath: string;
  useDefaultGlobs: boolean;
  keepEmpty: boolean;
  dryRun: boolean;
  json: boolean;
  silent: boolean;
  yes: boolean;
}

export async function cleanCommand({
  argGlobs,
  nodeModulesPath,
  userGlobsFilePath,
  useDefaultGlobs,
  keepEmpty,
  dryRun,
  json,
  silent,
  yes,
}: CleanCommandProps): Promise<void> {
  const logger = makeLogger({ disabled: json || silent });

  if (!json) {
    logger.log(bold('clean-modules'), dryRun ? yellow('(dry run)') : '');
  }

  if (!yes && !dryRun) {
    const confirmed = await yesOrNo(
      yellow(
        `\nAre you sure you want to clean ${nodeModulesPath}? Files will be permanently removed. (Y/N)\n`
      )
    );

    if (!confirmed) {
      process.exit(0);
    }
  }

  logger.log('\nCleaning up node_modules...');

  const cleanupStart = new Date().getTime();

  const globLists = await getGlobLists({
    argGlobs,
    useDefaultGlobs,
    userGlobsFilePath,
  });

  const includedFiles = await findFilesToRemove(nodeModulesPath, globLists);
  const reducedSize = await removeFiles(includedFiles, { dryRun });

  let removedEmptyDirs = 0;

  const cleanupDuration = new Date().getTime() - cleanupStart;

  logger.log(green(`Done in ${prettyMs(cleanupDuration)}!`));

  if (!keepEmpty) {
    logger.log('\nCleaning up empty dirs...');
    if (dryRun) {
      logger.log(yellow('Skipped on dry runs!'));
    } else {
      const emptyDirStart = new Date().getTime();
      removedEmptyDirs = await removeEmptyDirs(includedFiles);
      const emptyDirDuration = new Date().getTime() - emptyDirStart;
      logger.log(green(`Done in ${prettyMs(emptyDirDuration)}!`));
    }
  }

  if (json) {
    const output: Record<string, unknown> = {
      removedFiles: includedFiles.length,
      reducedSize,
      removedEmptyDirs,
      duration: cleanupDuration,
      dryRun,
    };

    console.log(JSON.stringify(output, null, 2));
  } else {
    logger.log(bold('\nResults:'));
    logger.log('- size reduced:', green(prettyBytes(reducedSize || 0)));
    logger.log('- files removed:', green(includedFiles.length));
    logger.log('- empty dirs removed:', green(removedEmptyDirs || 0));
  }
}
