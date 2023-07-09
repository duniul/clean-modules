import { Command, Option } from 'clipanion';
import { sharedDefaultOptions } from '../../shared.js';

/**
 * Shared options for all commands.
 */
export abstract class BaseCommand extends Command {
  directory = Option.String('-D,--directory', sharedDefaultOptions.directory, {
    description: 'Path to node_modules',
  });

  globFile = Option.String('-f,--glob-file', sharedDefaultOptions.globFile, {
    description: 'Path to a custom glob file',
  });

  noDefaults = Option.Boolean('-n,--no-defaults', sharedDefaultOptions.noDefaults, {
    description: 'Only includes/excludes globs specified by a custom glob file or CLI arguments',
  });

  globs = Option.Rest({ name: 'globs' });
}
