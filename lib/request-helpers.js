const fs = require('fs');
const request = require('request');

module.exports = {
  downloadFile
};

function downloadFile(uri, downloadTo) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading file from ${uri}`);
    request.head(uri, () => {
      request(uri)
        .on('error', (e) => {
          console.log(`Failed to download: ${e.toString()}`);
          reject(e.code);
        })
        .pipe(
          fs.createWriteStream(downloadTo)
            .on('error', (e) => {
              console.log(`Failed to download: ${e.toString()}`);
              reject(e.code);
            })
            .on('close', () => resolve(downloadTo))
        );
    });
  });
}
