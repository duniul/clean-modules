import mockFs from 'mock-fs';
import { analyzeResults } from './analyze';

describe('analyzeResults', () => {
  beforeEach(() => {
    mockFs({
      a0: {
        b0: {
          c0: {
            d0: {
              e0: {},
            },
            d1: {
              e0: {
                'f0.md': 'f0',
              },
            },
            'd2.md': 'd2d2',
          },
          'c1.md': 'c1',
          'c2.js': 'c2',
        },
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('lists individual file sizes', async () => {
    const results = {
      allFiles: ['a0/b0/c1.md', 'a0/b0/c0/d2.md'],
      includedFiles: ['a0/b0/c1.md', 'a0/b0/c0/d2.md'],
      excludedFiles: [],
    };

    const info = await analyzeResults(results);

    expect(info.files['a0/b0/c1.md'].size).toBe(2);
    expect(info.files['a0/b0/c0/d2.md'].size).toBe(4);
  });

  it('says which glob included the file', async () => {
    const results = {
      allFiles: ['a0/b0/c1.md', 'a0/b0/c2.js', 'a0/b0/c0/d2.md', 'a0/b0/c0/d1/e0/f0.md'],
      includedFiles: ['a0/b0/c1.md', 'a0/b0/c2.js', 'a0/b0/c0/d2.md', 'a0/b0/c0/d1/e0/f0.md'],
      excludedFiles: [],
    };

    const includedGlobs = ['**/c2.js'];

    const info = await analyzeResults(results, includedGlobs);

    expect(info.files['a0/b0/c1.md'].includedBy.defaultDirs).toBe(false);
    expect(info.files['a0/b0/c1.md'].includedBy.defaultFiles).toBe(true);
    expect(info.files['a0/b0/c1.md'].includedBy.defaultDirs).toBe(false);

    expect(info.files['a0/b0/c2.js'].includedBy.defaultDirs).toBe(false);
    expect(info.files['a0/b0/c2.js'].includedBy.defaultFiles).toBe(false);
    expect(info.files['a0/b0/c2.js'].includedBy.includeArgs).toBe(true);
  });

  it('says if a file was excluded or not', async () => {
    const results = {
      allFiles: ['a0/b0/c1.md', 'a0/b0/c0/d2.md', 'a0/b0/c0/d1/e0/f0.md'],
      includedFiles: ['a0/b0/c1.md', 'a0/b0/c0/d1/e0/f0.md'],
      excludedFiles: ['a0/b0/c0/d2.md'],
    };

    const excludedGlobs = ['**/d2.md'];

    const info = await analyzeResults(results, [], excludedGlobs);

    expect(info.files['a0/b0/c1.md'].excludedByArgs).toBe(false);
    expect(info.files['a0/b0/c0/d2.md'].excludedByArgs).toBe(true);
  });

  it('does not throw if path is invalid', async () => {
    const results = {
      allFiles: ['invalid/path'],
      includedFiles: ['invalid/path'],
      excludedFiles: [],
    };

    expect(async () => await analyzeResults(results)).not.toThrow();
  });
});
