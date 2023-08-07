import { Builtins, Cli } from 'clipanion';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileDir } from '../utils/filesystem.js';
import { AnalyzeCommand } from './commands/analyze.command.js';
import { CleanCommand } from './commands/clean.command.js';

const [_node, _app, ...args] = process.argv;
const esmRequire = createRequire(import.meta.url);
const cliDir = fileDir(import.meta.url);
const { name, version } = esmRequire(path.resolve(cliDir, '..', '..', 'package.json'));

const cli = new Cli({
  binaryLabel: name,
  binaryVersion: version,
  binaryName: name,
});

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.register(CleanCommand);
cli.register(AnalyzeCommand);

cli.runExit(args);
