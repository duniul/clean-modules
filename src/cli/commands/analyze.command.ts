import { analyzeIncluded } from '../../analyze.js';
import { getGlobLists } from '../../utils/glob.js';
import { BaseCommand } from '../helpers/base.command.js';

export class AnalyzeCommand extends BaseCommand {
  static override paths = [['analyze']];
  static override usage = {
    description:
      'Helps determining why a file is included by the clean command without removing any files.',
  };

  async execute(): Promise<void> {
    const globLists = await getGlobLists({
      argGlobs: { included: this.include, excluded: this.exclude },
      useDefaultGlobs: !this.noDefaults,
      userGlobsFilePath: this.globFile,
    });

    const analyzeResults = await analyzeIncluded(this.directory, globLists);

    console.log(JSON.stringify(analyzeResults, null, 2));
  }
}
