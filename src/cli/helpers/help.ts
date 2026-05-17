import pkgJson from '../../../package.json' with { type: 'json' };
import type { CommandDefinition, OptionDescriptor, OptionDescriptors, PositionalDescriptors } from '../types';

export const VERSION = pkgJson.version;
const NAME = pkgJson.name;
const HOMEPAGE = pkgJson.homepage.replace('#readme', '');

function renderOptions(options: OptionDescriptors): string {
  let longestArgNameLength = 0;
  const optionItems: [string, string][] = Object.entries(options).map(([key, option]) => {
    const argNames = (option as OptionDescriptor).short
      ? `-${(option as OptionDescriptor).short}, --${key}`
      : `--${key}`;

    const defaultText = option.defaultHint ?? option.default;
    const argInfo = `${option.description}${defaultText ? ` (default: ${defaultText})` : ''}`;

    if (argNames.length > longestArgNameLength) {
      longestArgNameLength = argNames.length;
    }

    return [argNames, argInfo];
  });

  return optionItems
    .map(([argNames, argInfo]) => `${argNames.padEnd(longestArgNameLength)}  ${argInfo}`)
    .join('\n');
}

type CommandDescriptor = { name: string; description: string };
type CommandDescriptors = CommandDescriptor[];

function renderCommands(commands: CommandDescriptors): string {
  return commands.map(command => `${NAME} ${command.name}\n    ${command.description}\n`).join('\n');
}

function renderUsage(
  command: string,
  positionals?: PositionalDescriptors,
  hasOptions?: boolean,
  extraUsageInfo?: string
): string {
  let usage = `\n$ ${command}`;

  if (hasOptions) {
    usage += ' [options]';
  }

  if (positionals) {
    const positionalFlags = Object.entries(positionals)
      .map(([name, { required, multiple }]) => {
        const id = multiple ? `${name}...` : name;
        return required ? `<${id}>` : `[${id}]`;
      })
      .join(' ');

    usage += ` ${positionalFlags}`;
  }

  if (extraUsageInfo) {
    usage += `\n\n${extraUsageInfo}`;
  }

  return usage;
}

function renderHeading(heading: string, minLength = 20): string {
  return `━━━ ${heading} ━━━${'━'.repeat(minLength - heading.length)}`;
}

type FormatHelpOptions = Pick<
  CommandDefinition,
  'name' | 'description' | 'options' | 'positionals' | 'extraUsageInfo'
> & { subcommands?: CommandDescriptors };

export function formatHelp({
  name,
  description,
  subcommands,
  options,
  positionals,
  extraUsageInfo,
}: FormatHelpOptions): string {
  const usageName = subcommands ? `${NAME} <command>` : name === NAME ? NAME : `${NAME} ${name}`;

  let help = `
${renderHeading(`${NAME} v${VERSION}`)}
${HOMEPAGE}

${description}

${renderHeading('Usage')}
${renderUsage(usageName, positionals, !!options, extraUsageInfo)}

`;

  if (subcommands) {
    help += renderHeading('Commands') + '\n';
    help += renderCommands(subcommands) + '\n';
  }

  if (options) {
    help += renderHeading('Options') + '\n';
    help += renderOptions(options) + '\n';
  }

  return help;
}
