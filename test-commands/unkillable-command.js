process.on('SIGTERM', () => {
    console.log('unkillable-command ignored SIGTERM');
});
console.log('unkillable-command started');
process.stdin.resume(); // stop the process from exiting
