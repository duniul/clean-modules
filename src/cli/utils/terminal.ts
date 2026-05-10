import readline from 'node:readline';
import supportsColor from 'supports-color';

type DisabledConsole = Console;

// oxlint-disable-next-line no-empty-function
const noop = (): void => {};

/**
 * Creates a conditional console logger.
 */
export function makeLogger({ disabled }: { disabled: boolean }): Console | DisabledConsole {
  if (disabled) {
    // oxlint-disable-next-line unicorn/no-array-reduce
    return Object.keys(console).reduce((disabledConsole, key) => {
      // oxlint-disable-next-line typescript/no-explicit-any
      disabledConsole[key as keyof Console] = noop as any;
      return disabledConsole;
    }, {} as DisabledConsole);
  }

  return console;
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

/**
 * Simple string colorizer factory.
 */
function colorizer(colorCode: string): (text: string | number) => string {
  if (!supportsColor.stdout) {
    // oxlint-disable-next-line unicorn/prefer-native-coercion-functions
    return text => String(text);
  }

  return text => `\u001B[${colorCode}m${text}\u001B[0m`;
}

export const bold = colorizer('1');
export const green = colorizer('32');
export const yellow = colorizer('33');
