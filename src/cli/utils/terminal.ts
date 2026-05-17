import readline from 'node:readline';

type SimpleConsole = Pick<Console, 'log'>;

// oxlint-disable-next-line no-empty-function
const noop = (): void => {};

/**
 * Creates a conditional console logger.
 */
export function makeSimpleLogger({ disabled }: { disabled: boolean }): SimpleConsole {
  if (disabled) {
    return {
      log: noop,
    };
  }

  return {
    // oxlint-disable-next-line no-console
    log: console.log.bind(console),
  };
}

/**
 * Prompts the user with a yes/no question and waits for the answer.
 */
export function yesOrNo(query: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.error('stdin is not a TTY, skipping confirmation prompt. Please use --yes or -y to skip the prompt.');
    return Promise.resolve(false);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(/^\s*y(es)?\s*$/i.test(answer));
    });
  });
}
