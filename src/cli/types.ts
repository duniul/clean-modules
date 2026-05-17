import type { parseArgs, ParseArgsConfig, ParseArgsOptionDescriptor } from 'node:util';

export type OptionDescriptor = ParseArgsOptionDescriptor & {
  description: string;
  valueHint?: string;
  defaultHint?: string;
};

export type OptionDescriptors = Record<string, OptionDescriptor>;

export type PositionalDescriptor = {
  required?: boolean;
  multiple?: boolean;
};

export type PositionalDescriptors = Record<string, PositionalDescriptor>;

export type CommandDefinition<
  TOptions extends OptionDescriptors = OptionDescriptors,
  TPositionals extends PositionalDescriptors = PositionalDescriptors,
> = ParseArgsConfig & {
  name: string;
  description: string;
  extraUsageInfo?: string;
  options?: TOptions;
  positionals?: TPositionals;
  renderHelp?: () => string;
  run(): Promise<void>;
};

export type ParsedArgs<T extends ParseArgsConfig = ParseArgsConfig> = ReturnType<typeof parseArgs<T>>;
