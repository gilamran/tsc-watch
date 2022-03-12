import psTree from 'ps-tree';
import spawn from 'cross-spawn';
import { ChildProcess, exec } from 'child_process';

let KILL_SIGNAL = '15'; // SIGTERM
let hasPS = true;

const isWindows = process.platform === 'win32';

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', function (error) {
  if (error) {
    hasPS = false;
  }
});

export function kill(child: ChildProcess): Promise<void> {
  return new Promise<void>((resolve) => {
    if (isWindows) {
      exec(`taskkill /pid ${child.pid} /T /F`, () => resolve());
    } else {
      if (hasPS) {
        psTree(child.pid, (err, kids) => {
          const kidsPIDs = kids.map((p) => p.PID);
          const args = [`-${KILL_SIGNAL}`, child.pid.toString(), ...kidsPIDs];
          spawn('kill', args).on('close', resolve);
        });
      } else {
        exec(`kill -${KILL_SIGNAL} ${child.pid}`, () => resolve());
      }
    }
  });
}
