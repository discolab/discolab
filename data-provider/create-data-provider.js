const path = require('path');
const { findDiscoJsons } = require('../lib/disco-helpers');
const { downloadFile } = require('../lib/request-helpers');
const { findFiles, writeFile } = require('../lib/fs-helpers');
const { parseMediaFile } = require('../lib/media-file-helpers');
const { log } = require('../lib/logger');

module.exports = createDataProvider;

function createDataProvider(musicDir) {
  const dirsMap  = new Map();  // hash -> release dir
  const jsonMap  = new Map();  // hash -> disco json
  const mediaMap = new Map();  // hash -> array of media files metadata

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
    return new Promise((resolve, reject) => {
      const releaseDir = dirsMap.get(hash);
      const imageUrl = jsonMap.get(hash) && jsonMap.get(hash).image;

      if (releaseDir) {
        findFiles('@(cover.jpg|cover.png|folder.jpg|folder.png)', releaseDir)
          .then(([coverFile]) => {
            if (coverFile) {
              resolve(coverFile);
            } else if (imageUrl) {
              const downloadTo = path.join(releaseDir, 'cover.jpg');
              downloadFile(imageUrl, downloadTo).then(resolve, reject);
            } else {
              reject();
            }
          });
      } else {
        reject();
      }
    });
  }

  function getRelease(hash) {
    return jsonMap.get(hash);
  }

  function getReleaseMediaFiles(hash) {
    return new Promise((resolve, reject) => {
       const releaseDir = dirsMap.get(hash);

       if (releaseDir) {
         findFiles('**/@(*.flac|*.mp3)', releaseDir)
           .then((mediaFilesPaths) => {
             return Promise.all(
               mediaFilesPaths
                 .sort()
                 .map((filePath) => parseMediaFile(filePath))
             ).then((metadata) => {
               mediaMap.set(
                 hash,
                 metadata.map((item, index) => Object.assign({}, item, {
                   path: mediaFilesPaths[index]
                 }))
               );
               log(mediaMap.get(hash));
               resolve(mediaMap.get(hash));
             });
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
        return writeFile(
          path.join(dir, 'disco.json'),
          Object.assign(release, attrs)
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
