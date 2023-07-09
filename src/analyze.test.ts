import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMockedFileStructure } from './__test__/getMockedFileStructure.js';
import { analyze } from './analyze.js';

const fileStructure = await getMockedFileStructure();

beforeEach(async () => {
  vol.fromNestedJSON(fileStructure);
});

describe(analyze.name, () => {
  it('returns information about the files that would be removed', async () => {
    const result = await analyze();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "filePath": "<CWD>/node_modules/dep1/.npmrc",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/.npmrc",
              "original": ".npmrc",
            },
            {
              "derived": "<CWD>/node_modules/**/.npmrc",
              "original": ".npmrc",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep2/CHANGELOG.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/*.@(md|mkd|markdown|mdown)",
              "original": "*.@(md|mkd|markdown|mdown)",
            },
            {
              "derived": "<CWD>/node_modules/**/changelog*(.*)",
              "original": "changelog*(.*)",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/__tests__/test1.js",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/__tests__/**",
              "original": "__tests__/",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/__tests__/test2.js",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/__tests__/**",
              "original": "__tests__/",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/a-dir/doc.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/*.@(md|mkd|markdown|mdown)",
              "original": "*.@(md|mkd|markdown|mdown)",
            },
          ],
        },
      ]
    `);
  })


  it('accepts custom globs', async () => {
    const result = await analyze({ globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "filePath": "<CWD>/node_modules/dep1/.npmrc",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/.npmrc",
              "original": ".npmrc",
            },
            {
              "derived": "<CWD>/node_modules/**/.npmrc",
              "original": ".npmrc",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep2/CHANGELOG.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/*.@(md|mkd|markdown|mdown)",
              "original": "*.@(md|mkd|markdown|mdown)",
            },
            {
              "derived": "<CWD>/node_modules/**/changelog*(.*)",
              "original": "changelog*(.*)",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "includedByDefault": false,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/**/nonDefaultFile.ext",
              "original": "**/nonDefaultFile.ext",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/__tests__/test1.js",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/__tests__/**",
              "original": "__tests__/",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/__tests__/test2.js",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/__tests__/**",
              "original": "__tests__/",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/a-dir/doc.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/*.@(md|mkd|markdown|mdown)",
              "original": "*.@(md|mkd|markdown|mdown)",
            },
          ],
        },
      ]
    `);
  });

  it('allows skipping default globs', async () => {
    const result = await analyze({ noDefaults: true, globs: ['**/nonDefaultFile.ext'] });
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "filePath": "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "includedByDefault": false,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/**/nonDefaultFile.ext",
              "original": "**/nonDefaultFile.ext",
            },
          ],
        },
      ]
    `);
  });

  it('uses custom glob file if provided', async () => {
    const customGlobFile = '.custom-glob-file';
    vol.fromNestedJSON({ ...fileStructure, [customGlobFile]: '**.md\n**/nonDefaultFile.ext' });

    const result = await analyze({ noDefaults: true, globFile: customGlobFile });
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "filePath": "<CWD>/node_modules/dep2/CHANGELOG.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/**.md",
              "original": "**.md",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep4/nonDefaultFile.ext",
          "includedByDefault": false,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/**/nonDefaultFile.ext",
              "original": "**/nonDefaultFile.ext",
            },
          ],
        },
        {
          "filePath": "<CWD>/node_modules/dep1/a-dir/doc.md",
          "includedByDefault": true,
          "includedByGlobs": [
            {
              "derived": "<CWD>/node_modules/**/**.md",
              "original": "**.md",
            },
          ],
        },
      ]
    `);
  });
});
