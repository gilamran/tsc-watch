'use strict';

const psTree = require('ps-tree');
const spawn = require('cross-spawn');
const {
  exec
} = require('child_process');
let defaultSignal = 'SIGUSR2';
let hasPS = true;

const isWindows = process.platform === 'win32';

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', function (error) {
  if (error) {
    hasPS = false;
  }
});

module.exports = (child, signal) => {
  signal = signal || defaultSignal;

  return new Promise((resolve, reject) => {
    if (isWindows) {
      exec('taskkill /pid ' + child.pid + ' /T /F');
      resolve();
    } else {
      if (hasPS) {
        psTree(child.pid, function (err, kids) {
          spawn('kill', ['-s', signal, child.pid].concat(kids.map(function (p) {
            return p.PID;
          }))).on('close', resolve);
        });
      } else {
        exec('kill -s ' + signal + ' ' + child.pid, function () {
          // ignore if the process has been killed already
          resolve();
        });
      }
    }
  });
}