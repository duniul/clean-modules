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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(/ye?s?/i.test(answer));
    });
  });
}
