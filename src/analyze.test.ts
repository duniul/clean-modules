import { vol } from 'memfs';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import { getMockedFileStructure } from './__test__/getMockedFileStructure.js';
import { analyze } from './analyze.js';

vi.setConfig({ testTimeout: 5000 });

const fileStructure = await getMockedFileStructure();

describe(analyze, () => {
  beforeEach(() => {
    vol.fromNestedJSON(fileStructure);
  });

  it('returns information about the files that would be removed', async () => {
    expect.hasAssertions();

    const result = await analyze();
    expect(result).toMatchSnapshot();
  });

  it('accepts custom globs', async () => {
    expect.hasAssertions();

    const result = await analyze({ globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchSnapshot();
  });

  it('allows skipping default globs', async () => {
    expect.hasAssertions();

    const result = await analyze({ noDefaults: true, globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchSnapshot();
  });

  it('uses custom glob file if provided', async () => {
    expect.hasAssertions();

    const customGlobFile = '.custom-glob-file';
    vol.fromNestedJSON({ ...fileStructure, [customGlobFile]: '**.md\n**/nonDefaultFile.ext' });

    const result = await analyze({ noDefaults: true, globFile: customGlobFile });
    expect(result).toMatchSnapshot();
  });
});
