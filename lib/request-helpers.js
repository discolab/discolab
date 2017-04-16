const fs = require('fs');
const request = require('request');
const { log } = require('../lib/logger');

module.exports = {
  downloadFile
};

function downloadFile(uri, downloadTo) {
  return new Promise((resolve, reject) => {
    log(`Downloading file from ${uri}`);
    request.head(uri, () => {
      request(uri)
        .on('error', (e) => {
          log(`Failed to download: ${e.toString()}`);
          reject(e.code);
        })
        .pipe(
          fs.createWriteStream(downloadTo)
            .on('error', (e) => {
              log(`Failed to download: ${e.toString()}`);
              reject(e.code);
            })
            .on('close', () => resolve(downloadTo))
        );
    });
  });
}
