import readline from 'readline';
import supportsColor from 'supports-color';

type DisabledConsole = Console;

/**
 * Creates a conditional console logger.
 */
export function makeLogger({ disabled }: { disabled: boolean }): Console | DisabledConsole {
  if (disabled) {
    const noop = () => undefined;
    return Object.keys(console).reduce((disabledConsole, key) => {
      disabledConsole[key as keyof Console] = noop as any;
      return disabledConsole;
    }, {} as DisabledConsole);
  }

  return console;
}

/**
 * Prompts the user with a yes/no question and waits for the answer.
 */
export async function yesOrNo(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(/ye?s?/i.test(answer));
    })
  );
}

/**
 * Simple string colorizer factory.
 */
function colorizer(colorCode: string) {
  if (!supportsColor.stdout) {
    return (text: string | number) => String(text);
  }

  return (text: string | number) => `\x1b[${colorCode}m${text}\x1b[0m`;
}

export const bold = colorizer('1');
export const green = colorizer('32');
export const yellow = colorizer('33');
