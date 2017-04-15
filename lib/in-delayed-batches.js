module.exports = inDelayedBatches;

function inDelayedBatches(promiseFn, { delay, batchSize }) {
  const queue = [];
  let intervalId = null;

  function flushQueue() {
    let queueItem;
    let n = batchSize;

    while (n && (queueItem = queue.pop())) {
      const { args, resolve, reject } = queueItem;
      promiseFn(...args).then(resolve, reject);
      n--;
    }

    if (!queue.length) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return (...args) => {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });

      if (!intervalId) {
        intervalId = setInterval(flushQueue, delay);
      }
    });
  };
}
