import { analyzeCommand } from './commands/analyze.command.js';
import { cleanCommand } from './commands/clean.command.js';
import { formatHelp } from './helpers/help.js';

const FIRST_POSITIONAL_INDEX = 2;

const firstPositional = process.argv
  .slice(FIRST_POSITIONAL_INDEX)
  .find(positional => !positional.startsWith('-'));

switch (firstPositional) {
  case cleanCommand.name: {
    await cleanCommand.run();
    break;
  }

  case analyzeCommand.name: {
    await analyzeCommand.run();
    break;
  }

  default: {
    const rootCommand = {
      ...cleanCommand,
      renderHelp: (): string =>
        formatHelp({
          ...cleanCommand,
          subcommands: [
            { name: `${cleanCommand.name} (default)`, description: cleanCommand.description },
            analyzeCommand,
          ],
        }),
    };

    await rootCommand.run();
    break;
  }
}
