import { ChildProcess, fork } from 'child_process';
import { appendFileSync } from 'fs';
import { join } from 'path';
import { copyFixtures, FAILING_FILE, OUTPUT_FILE, PASSING_FILE, removeFixtures } from './test-utils';

const noop = () => {};

export class Driver {
  private subscriptions: Map<string, Function>;
  private process: ChildProcess | null;

  constructor() {
    copyFixtures();
    this.subscriptions = new Map();
    this.process = null;
  }

  public subscribe(processEventName: string, listener: Function) {
    this.subscriptions.set(processEventName, listener);
    return this;
  }

  public startWatch({ failFirst, pretty }: { failFirst?: boolean; pretty?: boolean } = {}): this {
    const params = [
      '--noClear',
      '--out',
      OUTPUT_FILE,
      failFirst ? FAILING_FILE : PASSING_FILE,
    ];
    if (pretty) {
      params.push('--pretty');
    }
    this.process = fork(join(process.cwd(), 'dist', 'lib', 'tsc-watch.js'), params, {
      stdio: 'inherit',
    });

    this.subscriptions.forEach((handler, evName) =>
      this.process!.on('message', (event) => (evName === event ? handler(event) : noop())),
    );

    return this;
  }

  public modifyToAValidChange(): this {
    appendFileSync(PASSING_FILE, '\n ');
    return this;
  }

  public modifyToAnInvalidChange(): this {
    appendFileSync(FAILING_FILE, '{{{');
    return this;
  }

  public dispose(): this {
    if (this.process && this.process.kill) {
      this.process.kill();
      this.process = null;
    }

    this.subscriptions.clear();
    removeFixtures();
    return this;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
