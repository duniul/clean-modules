import { analyzeIncluded } from '../../analyze';
import { IncludedExcludedArgs } from '../../types';
import { getGlobLists } from '../../utils/glob';

export interface AnalyzeCommandProps {
  argGlobs: IncludedExcludedArgs;
  nodeModulesPath: string;
  userGlobsFilePath: string;
  useDefaultGlobs: boolean;
}

export async function analyzeCommand({
  argGlobs,
  nodeModulesPath,
  userGlobsFilePath,
  useDefaultGlobs,
}: AnalyzeCommandProps): Promise<void> {
  const globLists = await getGlobLists({
    argGlobs,
    useDefaultGlobs,
    userGlobsFilePath,
  });

  const analyzeResults = await analyzeIncluded(nodeModulesPath, globLists);

  console.log(JSON.stringify(analyzeResults, null, 2));
}
