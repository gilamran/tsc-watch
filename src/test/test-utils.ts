import fsExtra from 'fs-extra';
import { join } from 'path';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitFor = (action: Function, timeout = 30000) => {
  const startTime = Date.now();
  return new Promise<void>((resolve, reject) => {
    const retry = () => {
      if (Date.now() - timeout > startTime) {
        reject();
      } else {
        if (action()) {
          resolve();
        } else {
          wait(50).then(retry);
        }
      }
    };

    retry();
  });
};

export const TMP_DIR = join(process.cwd(), 'tmp');
export const TMP_FIXTURES_DIR = join(TMP_DIR, 'fixtures');
export const OUTPUT_FILE = join(TMP_FIXTURES_DIR, 'output.js');
export const FAILING_FILE = join(TMP_FIXTURES_DIR, 'failing.ts');
export const PASSING_FILE = join(TMP_FIXTURES_DIR, 'passing.ts');

export function copyFixtures() {
  fsExtra.copySync(join(process.cwd(), 'src', 'test', 'fixtures'), TMP_FIXTURES_DIR);
}

export function removeFixtures() {
  fsExtra.removeSync(TMP_DIR);
}
