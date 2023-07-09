import { Command, Option } from 'clipanion';
import path from 'path';
import { DEFAULT_USER_GLOBS_FILE_NAME } from '../../constants.js';

/**
 * Shared options for all commands.
 */
export abstract class BaseCommand extends Command {
  include = Option.Array('-i,--include', [], {
    description: 'Custom glob patterns for files to include',
  });

  exclude = Option.Array('-e,--exclude', [], {
    description: 'Custom glob patterns for files to exclude',
  });

  directory = Option.String('-D,--directory', path.resolve(process.cwd(), 'node_modules'), {
    description: 'Path to node_modules',
  });

  globFile = Option.String('-f,--glob-file', DEFAULT_USER_GLOBS_FILE_NAME, {
    description: 'Path to a custom globs file',
  });

  noDefaults = Option.Boolean('-n,--no-defaults', false, {
    description: 'Only includes/excludes globs specified by a custom glob file or CLI arguments',
  });
}
