import type { ArgsDef } from 'citty';
import { sharedDefaultOptions } from '../../shared.js';

/**
 * Shared options for all commands.
 */
export const sharedArgs = {
  'directory': {
    type: 'string',
    alias: ['D'],
    default: sharedDefaultOptions.directory,
    description: 'Path to node_modules',
    valueHint: 'path',
  },
  'glob-file': {
    type: 'string',
    alias: ['f'],
    default: sharedDefaultOptions.globFile,
    description: 'Path to a custom glob file',
    valueHint: 'path',
  },
  'no-defaults': {
    type: 'boolean',
    alias: ['n'],
    default: sharedDefaultOptions.noDefaults,
    description: 'Only includes/excludes globs specified by a custom glob file or CLI arguments',
  },
  'globs': {
    type: 'positional',
    description: 'Optional extra globs to include or exclude',
    required: false,
  },
} satisfies ArgsDef;
