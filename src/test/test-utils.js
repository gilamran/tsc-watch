const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = (action, timeout = 4000) => {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
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

module.exports = { waitFor };