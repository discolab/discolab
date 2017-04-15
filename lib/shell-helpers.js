module.exports = {
  playInVox,
  showInFinder,
  executeCmd
};

const cp = require('child_process');

function showInFinder(fullPath) {
  return executeCmd(`open "${fullPath}"`);
}

function playInVox(fullPath) {
  return executeCmd(`open "${fullPath}"`);
}

function executeCmd(command) {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      error && reject({ error });
      resolve({ stdout, stderr });
    });
  });
}
