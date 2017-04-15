const path = require('path');
const glob = require('glob');
const { callXMLRPCMethod } = require('./xmlrpc-helpers');

module.exports = {
  getTorrentHashes,
  getTorrentDir,
  setTorrentDir,
  startTorrent
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
  return callXMLRPCMethod('d.get_base_path', [ hash ])
}

function setTorrentDir(hash, torrentDir) {
  return callXMLRPCMethod('d.set_directory_base', [ hash, torrentDir ]);
}

function startTorrent(hash) {
  return callXMLRPCMethod('d.start', [ hash ]);
}
