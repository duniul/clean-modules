import { vol } from 'memfs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockedFileStructure } from '../__test__/getMockedFileStructure.js';
import type { analyze, AnalyzeResult } from '../analyze.js';
import type * as cleanModule from '../clean.js';
import type { clean, CleanResult } from '../clean.js';
import type * as terminalModule from './utils/terminal.js';
import type { yesOrNo } from './utils/terminal.js';

vi.setConfig({ testTimeout: 5000 });

type CleanFn = typeof clean;
type AnalyzeFn = typeof analyze;

const mocks = vi.hoisted(() => ({
  clean: vi.fn<CleanFn>(),
  analyze: vi.fn<AnalyzeFn>(),
  yesOrNo: vi.fn<typeof yesOrNo>(),
}));

vi.mock(import('../clean.js'), () => ({ clean: mocks.clean }));
vi.mock(import('../analyze.js'), () => ({ analyze: mocks.analyze }));
vi.mock(import('./utils/terminal.js'), async () => {
  const actual = await vi.importActual<typeof terminalModule>('./utils/terminal.js');
  return { ...actual, yesOrNo: mocks.yesOrNo };
});

const DEFAULT_CLEAN_RESULT: CleanResult = {
  files: [],
  removedFilesCount: 0,
  reducedSize: 0,
  removedEmptyDirs: 0,
  failures: [],
};

const DEFAULT_ANALYZE_RESULT: AnalyzeResult = {
  files: [],
  failures: [],
};

class ExitError extends Error {
  override name = 'ExitError';
  exitCode: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.exitCode = code;
  }
}

type RunOptions = {
  stdinTTY?: boolean;
  confirm?: boolean;
  cleanResult?: CleanResult;
  cleanImpl?: CleanFn;
  analyzeResult?: AnalyzeResult;
  analyzeImpl?: AnalyzeFn;
};

type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function formatArg(arg: unknown): string {
  return typeof arg === 'string' ? arg : String(arg);
}

/**
 * Runs the CLI as if invoked from a shell with the given args.
 */
async function runCli(argv: string[], opts: RunOptions = {}): Promise<RunResult> {
  const originalArgv = process.argv;
  const originalIsTTY = process.stdin.isTTY;

  process.argv = ['node', 'cli.js', ...argv];
  (process.stdin as { isTTY?: boolean }).isTTY = opts.stdinTTY ?? true;

  const cleanSetup = mocks.clean.mockReset();
  if (opts.cleanImpl) {
    cleanSetup.mockImplementation(opts.cleanImpl);
  } else {
    cleanSetup.mockResolvedValue(opts.cleanResult ?? DEFAULT_CLEAN_RESULT);
  }

  const analyzeSetup = mocks.analyze.mockReset();
  if (opts.analyzeImpl) {
    analyzeSetup.mockImplementation(opts.analyzeImpl);
  } else {
    analyzeSetup.mockResolvedValue(opts.analyzeResult ?? DEFAULT_ANALYZE_RESULT);
  }

  mocks.yesOrNo.mockReset().mockResolvedValue(opts.confirm ?? true);

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  let exitCode = 0;

  const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]): void => {
    stdoutLines.push(args.map(formatArg).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]): void => {
    stderrLines.push(args.map(formatArg).join(' '));
  });
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number): never => {
    throw new ExitError(typeof code === 'number' ? code : 0);
  }) as typeof process.exit);

  vi.resetModules();

  try {
    await import('./cli.js');
  } catch (error) {
    if (error instanceof ExitError) {
      exitCode = error.exitCode;
    } else {
      throw error;
    }
  } finally {
    process.argv = originalArgv;
    (process.stdin as { isTTY?: boolean }).isTTY = originalIsTTY;
    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  }

  return {
    exitCode,
    stdout: stdoutLines.join('\n'),
    stderr: stderrLines.join('\n'),
  };
}

/** Normalizes non-deterministic bits (version, durations) so snapshots stay stable. */
function normalize(text: string): string {
  return text
    .replaceAll(/v\d+\.\d+\.\d+/g, 'vX.Y.Z')
    .replaceAll(/Done in \d+(?:\.\d+)?(?:ms|s|m \d+s|m)!/g, 'Done in <DURATION>!')
    .replaceAll(/"duration": \d+/g, '"duration": <DURATION>');
}

describe('default command', () => {
  it('renders help that lists both subcommands', async () => {
    expect.hasAssertions();

    const result = await runCli(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('renders the package version on --version', async () => {
    expect.hasAssertions();

    const result = await runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('runs clean when no subcommand is given', async () => {
    expect.hasAssertions();

    const result = await runCli(['--yes']);

    expect(result.exitCode).toBe(0);
    expect(mocks.clean).toHaveBeenCalledTimes(1);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });

  it('forwards positional args as globs to clean', async () => {
    expect.hasAssertions();

    await runCli(['--yes', '**/*.foo', '**/*.bar']);

    expect(mocks.clean).toHaveBeenCalledTimes(1);
    expect(mocks.clean).toHaveBeenCalledWith(
      expect.objectContaining({ globs: expect.arrayContaining(['**/*.foo', '**/*.bar']) })
    );
  });

  it('forwards clean options when no subcommand is given', async () => {
    expect.hasAssertions();

    await runCli(['--yes', '--dry-run', '--keep-empty', '--directory', '/tmp/nm']);

    expect(mocks.clean).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true, keepEmpty: true, directory: '/tmp/nm' })
    );
  });

  it('exits with code 1 when an unknown option is passed', async () => {
    expect.hasAssertions();

    const result = await runCli(['--bogus']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Run with --help for usage.');
    expect(mocks.clean).not.toHaveBeenCalled();
  });
});

describe('clean command', () => {
  it('renders the clean help', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('calls clean with default options when none are passed', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes']);

    expect(mocks.clean).toHaveBeenCalledTimes(1);
    expect(mocks.clean).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: false,
        keepEmpty: false,
        noDefaults: false,
        globFile: '.cleanmodules',
      })
    );
  });

  it('forwards positional args as globs', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes', '**/foo', '**/bar']);

    expect(mocks.clean).toHaveBeenCalledWith(
      expect.objectContaining({ globs: expect.arrayContaining(['**/foo', '**/bar']) })
    );
  });

  it('forwards --directory / -D', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes', '--directory', '/long/path']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ directory: '/long/path' }));

    await runCli(['clean', '--yes', '-D', '/short/path']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ directory: '/short/path' }));
  });

  it('forwards --glob-file / -f', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes', '--glob-file', '.custom-globs']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ globFile: '.custom-globs' }));

    await runCli(['clean', '--yes', '-f', '.short-globs']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ globFile: '.short-globs' }));
  });

  it('forwards --no-defaults / -n', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes', '--no-defaults']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ noDefaults: true }));

    await runCli(['clean', '--yes', '-n']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ noDefaults: true }));
  });

  it('forwards --keep-empty / -k', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes', '--keep-empty']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ keepEmpty: true }));

    await runCli(['clean', '--yes', '-k']);
    expect(mocks.clean).toHaveBeenLastCalledWith(expect.objectContaining({ keepEmpty: true }));
  });

  it('forwards --dry-run / -d and skips confirmation', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--dry-run'], { stdinTTY: false });

    expect(result.exitCode).toBe(0);
    expect(mocks.clean).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true }));
    expect(mocks.yesOrNo).not.toHaveBeenCalled();
    expect(result.stdout).toContain('(dry run)');
  });

  it('-d short flag also enables dry run', async () => {
    expect.hasAssertions();

    await runCli(['clean', '-d'], { stdinTTY: false });

    expect(mocks.clean).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true }));
  });

  it('--silent / -s suppresses logger output but still calls clean', async () => {
    expect.hasAssertions();

    const longResult = await runCli(['clean', '--yes', '--silent']);
    expect(longResult.exitCode).toBe(0);
    expect(longResult.stdout).toBe('');
    expect(mocks.clean).toHaveBeenCalledTimes(1);

    const shortResult = await runCli(['clean', '--yes', '-s']);
    expect(shortResult.stdout).toBe('');
  });

  it('--json / -j prints a JSON summary instead of human-readable output', async () => {
    expect.hasAssertions();

    const cleanResult: CleanResult = {
      files: ['/x'],
      removedFilesCount: 1,
      reducedSize: 100,
      removedEmptyDirs: 2,
      failures: [],
    };

    const result = await runCli(['clean', '--yes', '--json'], { cleanResult });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toStrictEqual(
      expect.objectContaining({
        removedFiles: 1,
        reducedSize: 100,
        removedEmptyDirs: 2,
        dryRun: false,
        failures: [],
      })
    );
  });

  it('--yes / -y skips the readline confirmation prompt', async () => {
    expect.hasAssertions();

    await runCli(['clean', '--yes']);
    expect(mocks.yesOrNo).not.toHaveBeenCalled();
    expect(mocks.clean).toHaveBeenCalledTimes(1);

    await runCli(['clean', '-y']);
    expect(mocks.yesOrNo).not.toHaveBeenCalled();
    expect(mocks.clean).toHaveBeenCalledTimes(1);
  });

  it('prompts for confirmation and continues when the user confirms', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean'], { confirm: true });

    expect(result.exitCode).toBe(0);
    expect(mocks.yesOrNo).toHaveBeenCalledTimes(1);
    expect(mocks.clean).toHaveBeenCalledTimes(1);
  });

  it('prompts for confirmation and aborts when the user declines', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean'], { confirm: false });

    expect(result.exitCode).toBe(0);
    expect(mocks.yesOrNo).toHaveBeenCalledTimes(1);
    expect(mocks.clean).not.toHaveBeenCalled();
  });

  it('exits 1 when stdin is not a TTY and confirmation is required', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean'], { stdinTTY: false });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('stdin is not a TTY');
    expect(mocks.clean).not.toHaveBeenCalled();
  });

  it('--fail-on-error / -e exits 1 when clean() reports failures', async () => {
    expect.hasAssertions();

    const cleanResult: CleanResult = {
      files: [],
      removedFilesCount: 0,
      reducedSize: 0,
      removedEmptyDirs: 0,
      failures: [{ path: '/x', phase: 'unlink', message: 'boom' }],
    };

    const longResult = await runCli(['clean', '--yes', '--fail-on-error'], { cleanResult });
    expect(longResult.exitCode).toBe(1);

    const shortResult = await runCli(['clean', '--yes', '-e'], { cleanResult });
    expect(shortResult.exitCode).toBe(1);
  });

  it('--fail-on-error exits 0 when there are no failures', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--yes', '--fail-on-error']);

    expect(result.exitCode).toBe(0);
  });
});

describe('analyze command', () => {
  it('renders the analyze help', async () => {
    expect.hasAssertions();

    const result = await runCli(['analyze', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('calls analyze with default options when none are passed', async () => {
    expect.hasAssertions();

    await runCli(['analyze']);

    expect(mocks.analyze).toHaveBeenCalledTimes(1);
    expect(mocks.clean).not.toHaveBeenCalled();
    expect(mocks.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ noDefaults: false, globFile: '.cleanmodules' })
    );
  });

  it('forwards positional args as globs', async () => {
    expect.hasAssertions();

    await runCli(['analyze', '**/foo', '**/bar']);

    expect(mocks.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ globs: expect.arrayContaining(['**/foo', '**/bar']) })
    );
  });

  it('forwards --directory / -D', async () => {
    expect.hasAssertions();

    await runCli(['analyze', '--directory', '/long/path']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ directory: '/long/path' }));

    await runCli(['analyze', '-D', '/short/path']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ directory: '/short/path' }));
  });

  it('forwards --glob-file / -f', async () => {
    expect.hasAssertions();

    await runCli(['analyze', '--glob-file', '.custom-globs']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ globFile: '.custom-globs' }));

    await runCli(['analyze', '-f', '.short-globs']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ globFile: '.short-globs' }));
  });

  it('forwards --no-defaults / -n', async () => {
    expect.hasAssertions();

    await runCli(['analyze', '--no-defaults']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ noDefaults: true }));

    await runCli(['analyze', '-n']);
    expect(mocks.analyze).toHaveBeenLastCalledWith(expect.objectContaining({ noDefaults: true }));
  });

  it('prints the analyze result as JSON', async () => {
    expect.hasAssertions();

    const analyzeResult: AnalyzeResult = {
      files: [{ filePath: '/x', includedByDefault: true, includedByGlobs: [] }],
      failures: [],
    };

    const result = await runCli(['analyze'], { analyzeResult });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toStrictEqual(analyzeResult);
  });

  it('exits 1 on unknown option', async () => {
    expect.hasAssertions();

    const result = await runCli(['analyze', '--bogus']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Run with --help for usage.');
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
});

/**
 * End-to-end smoke tests for the human-readable output that clean.command.ts
 * renders. Runs the real `clean` implementation against a memfs fixture for
 * the success paths, and inject mocked results for the failure paths.
 */
describe('clean output formatting', () => {
  let realClean: CleanFn;
  let fileStructure: Awaited<ReturnType<typeof getMockedFileStructure>>;

  beforeAll(async () => {
    const actualCleanModule = await vi.importActual<typeof cleanModule>('../clean.js');
    realClean = actualCleanModule.clean;
    fileStructure = await getMockedFileStructure();
  });

  beforeEach(() => {
    vol.fromNestedJSON(fileStructure);
  });

  it('renders a human-readable summary after a successful clean', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--yes'], { cleanImpl: realClean });

    expect(result.exitCode).toBe(0);
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('marks the run as a dry run in the human-readable output', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--dry-run'], { cleanImpl: realClean });

    expect(result.exitCode).toBe(0);
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('emits a JSON summary with --json (no human-readable text)', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--yes', '--json'], { cleanImpl: realClean });

    expect(result.exitCode).toBe(0);
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('lists failures (truncated past MAX_PRINTED_FAILURES) below the summary', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--yes'], {
      cleanResult: {
        files: Array.from({ length: 8 }, (_, i) => `/node_modules/dep/file-${i}`),
        removedFilesCount: 3,
        reducedSize: 12_345,
        removedEmptyDirs: 0,
        failures: Array.from({ length: 8 }, (_, i) => ({
          path: `/node_modules/dep/file-${i}`,
          phase: 'unlink',
          code: 'EACCES',
          message: `permission denied (${i})`,
        })),
      },
    });

    expect(result.exitCode).toBe(0);
    expect(normalize(result.stdout)).toMatchSnapshot();
  });

  it('uses singular wording and skips truncation when there is a single failure', async () => {
    expect.hasAssertions();

    const result = await runCli(['clean', '--yes'], {
      cleanResult: {
        files: ['/node_modules/dep/only-file'],
        removedFilesCount: 0,
        reducedSize: 0,
        removedEmptyDirs: 0,
        failures: [{ path: '/node_modules/dep/only-file', phase: 'unlink', message: 'boom' }],
      },
    });

    expect(result.exitCode).toBe(0);
    expect(normalize(result.stdout)).toMatchSnapshot();
  });
});
