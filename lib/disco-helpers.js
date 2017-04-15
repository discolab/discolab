module.exports= {
  writeDiscoJson,
  findDiscoJsons
};

const glob = require('glob');
const path = require('path');

const { log } = require('./logger');
const { writeFile, pathExists, findJsons } = require('./fs-helpers');
const { getTorrentData, getReleaseData } = require('./whatcd-helpers');
const { getTorrentDir } = require('./torrent-helpers');

const DISCO_JSON = 'disco.json';

function writeDiscoJson(hash) {
  let filePath;

  return getTorrentDir(hash)
    .then((torrentDir) => {
      filePath = path.join(torrentDir, DISCO_JSON);
      return pathExists(filePath);
    })
    .then((exists) => {
      if (exists) {
        log(`Skip - disco.json for ${hash} aleready exists`);
        return Promise.reject('skip');
      } else {
        return getTorrentData({ hash });
      }
    })
    .then((torrentData) => writeFile(filePath, getReleaseData(torrentData)))
    .catch((error) => log(`Error - ${error} - ${filePath}`));
}

function findDiscoJsons(dir) {
  return findJsons('**/disco.json', dir);
}
