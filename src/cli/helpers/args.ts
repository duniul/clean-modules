import { parseArgs } from 'node:util';
import { sharedDefaultOptions } from '../../shared.js';
import type { CommandDefinition, OptionDescriptors, ParsedArgs } from '../types.js';
import { formatHelp, VERSION } from './help.js';

/** Shared positionals for all commands. */
export const sharedPositionals = {
  globs: {
    multiple: true,
    required: false,
  },
};

/** Shared options for all commands. */
export const sharedOptions = {
  'help': {
    type: 'boolean',
    short: 'h',
    description: 'Show help',
  },
  'version': {
    type: 'boolean',
    short: 'v',
    description: 'Show version',
  },
  'directory': {
    type: 'string',
    short: 'D',
    default: sharedDefaultOptions.directory,
    defaultHint: '$PWD/node_modules',
    description: 'Path to node_modules',
    valueHint: 'path',
  },
  'glob-file': {
    type: 'string',
    short: 'f',
    default: sharedDefaultOptions.globFile,
    description: 'Path to a custom glob file',
    valueHint: 'path',
  },
  'no-defaults': {
    type: 'boolean',
    short: 'n',
    default: sharedDefaultOptions.noDefaults,
    description: 'Skips default glob patterns from being used',
  },
} satisfies OptionDescriptors;

export function processArgs<T extends CommandDefinition>(command: T): ParsedArgs<T> {
  let parsed: ParsedArgs<T>;
  try {
    parsed = parseArgs(command);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`${msg}\n\nRun with --help for usage.`);
    // oxlint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }

  const values = parsed.values as { help?: boolean; version?: boolean };

  if (values.version) {
    console.log(VERSION);
    // oxlint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  }

  if (values.help) {
    const helpText = command.renderHelp ? command.renderHelp() : formatHelp(command);
    console.log(helpText);
    // oxlint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  }

  return parsed;
}
