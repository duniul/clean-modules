import readline from 'readline';
import supportsColor from 'supports-color';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeLogger(disabled = false): (message?: any, ...optionalParams: any[]) => void {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return disabled ? () => {} : console.log;
}

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

function color(colorCode: string) {
  return `\x1b[${colorCode}m`;
}

function colorFunc(colorCode: string) {
  if (!supportsColor.stdout) {
    return (text: string | number) => text;
  }

  return (text: string | number) => `${color(colorCode)}${text}${color('0')}`;
}

export const bold = colorFunc('1');
export const dim = colorFunc('32');
export const underline = colorFunc('4');
export const yellow = colorFunc('33');
