const DISCO_JSON = 'disco.json';

module.exports= {
  DISCO_JSON,
  writeDiscoJson,
  findDiscoJsons
};

const glob = require('glob');
const path = require('path');

const { log } = require('./logger');
const { writeFile, pathExists, findJsons } = require('./fs-helpers');
const { getTorrentData, getReleaseData } = require('./whatcd-helpers');
const { getTorrentDir } = require('./torrent-helpers');

function writeDiscoJson(hash) {
  let jsonPath;

  getTorrentDir(hash)
    .then(([dir]) => {
      jsonPath = path.join(dir, DISCO_JSON);
      const isGazelle = dir.indexOf('/home/subkid/apollo') > -1;
      return isGazelle ? pathExists(jsonPath) : Promise.reject('non-gazelle torrent')
    })
    .then((exists) => {
      return exists ? Promise.reject('skip') : getTorrentData({ hash });
    })
    .then((torrentData) => writeFile(jsonPath, getReleaseData(torrentData)))
    .catch((error) => log(`Error - ${error} - ${jsonPath}`));
}

function findDiscoJsons(dir) {
  return findJsons('**/disco.json', dir);
}
