import { ChildProcess } from 'child_process';
import spawn from 'cross-spawn';
import stringArgv from 'string-argv';
import { kill } from './killer';

function runCommand(fullCommand: string): ChildProcess {
  const parts: string[] = stringArgv(fullCommand);
  const exec = parts[0];
  const args = parts.splice(1);
  return spawn(exec, args, {
    stdio: 'inherit',
  });
}

export function run(command: string): () => Promise<any> {
  const process = runCommand(command);
  const exitPromise = new Promise<void>((resolve) => process.on('exit', resolve));

  return () => Promise.all([kill(process), exitPromise]);
}
