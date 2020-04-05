module.exports = {
  isResolved,
  allSettled,
  onlyFulfilled,
  sequential,
  promisify,
  createAsyncQueue
};

const fulfilled = 'fulfilled';
const rejected  = 'rejected';

function isResolved(promise) {
  return promise.state === fulfilled;
}

function allSettled(promises) {
  return Promise.all(promises.map((promise) => {
    return new Promise((resolve) => {
      promise.then(
        settle(resolve, fulfilled),
        settle(resolve, rejected)
      );
    });
  }));
}

function onlyFulfilled(promises) {
  return allSettled(promises).then(results => {
    return results
      .map((item) => (item.state === fulfilled && item.value))
      .filter(Boolean)
  })
}

function settle (resolve, state) {
  return (value) => {
    resolve({ state, value });
  }
}

function sequential(promiseFns) {
  return promiseFns.reduce((chain, fn) => {
    return chain.then(() => fn());
  }, Promise.resolve());
}

function promisify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn.apply(null, [...args, (error, resp) => {
        error ? reject(error) : resolve(resp);
      }]);
    });
  };
}

function createAsyncQueue(maxTasks) {
  const queue = [];
  let pendingCount = 0;

  function processQueue() {
    queue.splice(0, maxTasks - pendingCount)
      .forEach(
        ({ fn, resolve, reject }) => {
          pendingCount++;
          fn()
            .then(resolve, reject)
            .finally(() => {
              pendingCount--;
              processQueue();
            });
        }
      );
  }

  function addTask(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      processQueue();
    });
  }

  return {
    add: addTask
  };
}


