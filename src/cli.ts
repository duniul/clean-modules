import arg from 'arg';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { inspect } from 'util';
import { analyzeResults, findFilesToRemove, removeFiles, removeEmptyDirs } from '.';
import { bold, dim as green, underline, yellow, yesOrNo, makeLogger } from './utils/terminal';

interface CliOption {
  flag: string;
  alias: string;
  handler: string | arg.Handler | [arg.Handler];
  description: string;
}

type CliOptions = Record<string, CliOption>;

function getNodeModulesDir(positionalArgs: string[]) {
  if (positionalArgs.length > 1) {
    throw new Error(
      'Found more than one positional arguments, could not determine node_modules location. Make sure to quote any globs you want to include to prevent your shell from expanding them.'
    );
  }

  const [customDir] = positionalArgs;
  return path.resolve(process.cwd(), customDir || 'node_modules');
}

const options: CliOptions = {
  include: {
    flag: '--include',
    alias: '-i',
    handler: [String],
    description:
      'Accepts a glob string of files/folders to include that are not included by default. Can be added multiple times.',
  },
  exclude: {
    flag: '--exclude',
    alias: '-e',
    handler: [String],
    description:
      'Accepts a glob string of files/folders to exclude from the list of included files. Excludes files included by both --include option and by default. Can be added multiple times.',
  },
  analyze: {
    flag: '--analyze',
    alias: '-a',
    handler: Boolean,
    description:
      'Prints info of all globs used, which files were removed or excluded, and which globs they were included by.',
  },
  keepEmpty: {
    flag: '--keep-empty',
    alias: '-k',
    handler: Boolean,
    description: 'Skips removing empty folders after removing files.',
  },
  dryRun: {
    flag: '--dry-run',
    alias: '-d',
    handler: Boolean,
    description:
      "Runs the script and prints the same information, but doesn't actually remove any files.",
  },
  yes: {
    flag: '--yes',
    alias: '-y',
    handler: Boolean,
    description: 'Skips the confirmation prompt at the start of the script.',
  },
  json: {
    flag: '--json',
    alias: '-j',
    handler: Boolean,
    description:
      'Only logs a final JSON dump at the end of the script, useful for logs or services.',
  },
  version: {
    flag: '--version',
    alias: '-v',
    handler: Boolean,
    description: 'Prints the installed version of node-clean.',
  },
  help: {
    flag: '--help',
    alias: '-h',
    handler: Boolean,
    description: 'Prints the help documentation.',
  },
};

const argSpec = Object.values(options).reduce<arg.Spec>((spec, option) => {
  const { flag, alias, handler } = option;
  spec[flag] = handler;
  spec[alias] = flag;
  return spec;
}, {});

const args = arg(argSpec);

if (args[options.help.flag]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require('../package.json');
  const optionsList = Object.values(options);

  console.log(`--- node-clean ---

Description
  ${packageJson.description}
  
Usage
  node-clean [<path/to/node_modules>] [options]

Options
${optionsList
  .map(({ flag, alias, handler, description }, index) => {
    let argString = `  ${flag}`;

    if (alias) {
      argString += `, ${alias} `;
    }

    if (Array.isArray(handler) ? handler[0] : handler === String) {
      argString += ` <string>`;
    }

    argString += `\n  ${description}`;

    if (index !== optionsList.length - 1) {
      argString += '\n\n';
    }

    return argString;
  })
  .join('')}`);
} else if (args[options.version.flag]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require('../package.json');
  console.log(version);
} else {
  // eslint-disable-next-line no-inner-declarations
  async function run() {
    const includedGlobs = args[options.include.flag];
    const excludedGlobs = args[options.exclude.flag];
    const dryRun = !!args[options.dryRun.flag];
    const analyze = !!args[options.analyze.flag];
    const keepEmpty = !!args[options.keepEmpty.flag];
    const json = !!args[options.json.flag];
    const yes = !!args[options.yes.flag];

    const nodeModulesDir = getNodeModulesDir(args._);
    const log = makeLogger(!!json);

    if (!json) {
      log(bold('node-clean'), dryRun ? yellow('(dry run)') : '');
    }

    if (!yes) {
      const confirmed = await yesOrNo(
        `${yellow(`\nAre you sure you want to clean ${underline(nodeModulesDir)}`)}${yellow(
          '? Files will be permanently removed. (Y/N)\n'
        )}`
      );

      if (!confirmed) {
        process.exit(0);
      }
    }

    log('\nCleaning up node_modules...');
    const cleanupStart = new Date().getTime();

    const result = await findFilesToRemove(nodeModulesDir, includedGlobs, excludedGlobs);
    result.reducedSize = await removeFiles(result.includedFiles, dryRun);
    let info;

    const cleanupDuration = new Date().getTime() - cleanupStart;
    log(green(`Done in ${prettyMs(cleanupDuration)}!`));

    if (!keepEmpty) {
      log('\nCleaning up empty dirs...');

      if (dryRun) {
        log(yellow('Skipped on dry runs!'));
      } else {
        const emptyDirStart = new Date().getTime();
        result.removedEmptyDirs = await removeEmptyDirs(result.includedFiles);
        const emptyDirDuration = new Date().getTime() - emptyDirStart;
        log(green(`Done in ${prettyMs(emptyDirDuration)}!`));
      }
    }

    if (analyze) {
      log('\nAnalyzing results...');
      const analyzeStart = new Date().getTime();
      info = await analyzeResults(result, includedGlobs, excludedGlobs);
      const analyzeDuration = new Date().getTime() - analyzeStart;
      log(green(`Done in ${prettyMs(analyzeDuration)}!`));
    }

    const { includedFiles, excludedFiles, reducedSize, removedEmptyDirs } = result;

    if (json) {
      const output: Record<string, unknown> = {
        removedFiles: includedFiles.length,
        excludedFiles: excludedFiles.length,
        reducedSize,
        removedEmptyDirs,
        duration: cleanupDuration,
      };

      if (info) {
        output.info = info;
      }

      console.log(JSON.stringify(output, null, 2));
    } else {
      log(bold('\nResults:'));
      console.log('- size reduced:', green(prettyBytes(reducedSize || 0)));
      console.log('- files removed:', green(includedFiles.length));
      console.log('- files excluded:', green(excludedFiles.length));
      console.log('- empty dirs removed:', green(removedEmptyDirs || 0));

      if (info) {
        console.log('\nAnalyzed results:');
        console.log(inspect(info, { colors: true, depth: null }), '\n');
      }
    }
  }

  run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
