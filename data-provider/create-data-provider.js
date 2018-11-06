const path = require('path');
const { findDiscoJsons, findCovers } = require('../lib/disco-helpers');
const { findFiles, writeFile } = require('../lib/fs-helpers');
const { parseMediaFile } = require('../lib/media-file-helpers');
const { log } = require('../lib/logger');

module.exports = createDataProvider;

function createDataProvider(musicDir) {
  const dirsMap  = new Map();  // hash -> release dir
  const jsonMap  = new Map();  // hash -> disco json
  const mediaMap = new Map();  // hash -> array of media files metadata
  const coversMap = new Map(); // hash -> file path of artwork image

  function getAllReleases() {
    return (jsonMap.size ?
      Promise.resolve() :
      findDiscoJsons(musicDir).then((items) => {
        items
          .forEach(({ dirname, json }) => {
            dirsMap.set(json.torrentHash, dirname);
            jsonMap.set(json.torrentHash, json);
          });
      })
    )
    .then(
      () => Array.from(jsonMap.values())
    );
  }

  function getReleaseCover(hash) {
    return new Promise((resolve) => {
      if (coversMap.has(hash)) {
        resolve(coversMap.get(hash));
      } else {
        const releaseDir = dirsMap.get(hash);
        const reject = () => resolve('');

        if (releaseDir) {
          findCovers(releaseDir)
            .then(([coverFilePath]) => {
              if (coverFilePath) {
                coversMap.set(hash, coverFilePath);
                resolve(coverFilePath);
              } {
                reject();
              }
            });
        } else {
          reject();
        }
      }
    });
  }

  function getRelease(hash) {
    return jsonMap.get(hash);
  }

  function getReleaseMediaFiles(hash) {
    return new Promise((resolve, reject) => {
       const releaseDir = dirsMap.get(hash);
       const mediaFiles = mediaMap.get(hash);

       if (mediaFiles && mediaFiles.length) {
         resolve(mediaFiles);
       } else if (releaseDir) {
         findFiles('**/@(*.flac|*.mp3)', releaseDir)
           .then((mediaFilesPaths) => {
             return Promise.all(
               mediaFilesPaths
                 .sort()
                 .map((filePath) => parseMediaFile(filePath))
             ).then(
               (metadata) => {
                 mediaMap.set(
                   hash,
                   metadata.map((item, index) => Object.assign({}, item, {
                     path: mediaFilesPaths[index]
                   }))
                 );
                 resolve(mediaMap.get(hash));
               },
               () => []
              );
           });
       } else {
         reject();
       }
    });
  }

  function getReleaseDir(hash) {
    return dirsMap.get(hash);
  }

  function updateRelease(hash, attrs) {
    return new Promise((resolve, reject) => {
      const release = jsonMap.get(hash);
      const dir = dirsMap.get(hash);

      if (release && dir) {
        writeFile(
          path.join(dir, 'disco.json'),
          Object.assign(release, attrs)
        ).then(
          () => {
            log(`disco.json for ${hash} has been updated`);
            resolve();
          },
          () => {
            log(`failed to update disco.json for ${hash}`);
            reject();
          }
        );
      } else {
        reject();
      }
    });
  }

  return {
    getAllReleases,
    getReleaseCover,
    getRelease,
    getReleaseMediaFiles,
    getReleaseDir,
    updateRelease
  };
}
