const path = require('path');
const mime = require('mime');
const mm = require('music-metadata');
const { log } = require('../lib/logger');
const { createReadStream } = require('fs');

function parseMediaFile(filePath) {
  return new Promise((resolve) => {
    const mimeType = mime.lookup(filePath);

    log('parsing media file', filePath);

    mm.parseStream(createReadStream(filePath), mimeType, { duration: true, skipCovers: true })
      .then(
        (metadata) => {
          resolve({
            title: metadata.common.title,
            artist: metadata.common.artist,
            duration: metadata.format.duration,
            mimeType
          });
        },
        () => {
          log('parsing of media file failed');
          resolve({
            title: path.basename(filePath),
            artist: '',
            duration: 0,
            mimeType
          });
        }
      )
  });
}

module.exports = {
  parseMediaFile
};
