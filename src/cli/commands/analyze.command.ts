import { analyze } from '../../analyze.js';
import { BaseCommand } from '../helpers/base.command.js';

export class AnalyzeCommand extends BaseCommand {
  static override paths = [['analyze']];
  static override usage = {
    description:
      'Helps determining why a file is included by the clean command without removing any files. Extra globs can be passed as positional args.',
  };

  async execute(): Promise<void> {
    const analyzeResults = await analyze({
      globs: this.globs,
      noDefaults: this.noDefaults,
      globFile: this.globFile,
    });

    console.log(JSON.stringify(analyzeResults, null, 2));
  }
}
