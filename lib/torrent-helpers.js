const path = require('path');
const glob = require('glob');
const { callXMLRPCMethod } = require('./xmlrpc-helpers');

module.exports = {
  getTorrentHashes,
  getTorrentDir
};

function getTorrentHashes(torrentsDir) {
  return new Promise((resolve, reject) => {
    glob('!(*.torrent).torrent', { cwd: torrentsDir }, (error, files) => {
      error ?
        reject(error) :
        resolve(files.map((filePath) => {
          return path.basename(filePath, '.torrent');
        }));
    });
  })
}

function getTorrentDir(hash) {
  return callXMLRPCMethod('d.base_path', [ hash ])
}
