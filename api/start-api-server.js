module.exports = startApiServer;

const mime = require('mime');
const restify = require('restify');
const path = require('path');
const internalIp = require('internal-ip');
const serveMediaFile = require('./serve-media-file');
const { parseMediaFile } = require('../lib/media-file-helpers');
const { findDiscoJsons } = require('../lib/disco-helpers');
const { downloadFile } = require('../lib/request-helpers');
const { showInFinder, playInVox } = require('../lib/shell-helpers');
const { readFile, findFiles, writeFile } = require('../lib/fs-helpers');

function startApiServer(port, musicDir) {
  const dirsMap = new Map();  // hash -> dir
  const jsonMap = new Map();  // hash -> disco json
  const mediaMap = new Map(); // hash -> array of media files

  const whatcdDupes = [];

  const server = restify.createServer();
  const hostname = `http://${internalIp()}:${port}`;

  server.use(restify.CORS());

  server.get('/disco/all', (req, res) => {
    findDiscoJsons(musicDir)
      .then((items) => {
        console.log('items found:', items.length);
        items
          .forEach(({ dirname, json }) => {
            json.artwork_url = `${hostname}/cover/${json.torrentHash}`;

            if (!dirsMap.has(json.torrentHash)) {
              dirsMap.set(json.torrentHash, dirname);
              jsonMap.set(json.torrentHash, json);
            } else if (dirname.indexOf('whatcd') > -1) {
              whatcdDupes.push(json.torrentHash);
            } else {
              dirsMap.set(json.torrentHash, dirname);
              jsonMap.set(json.torrentHash, json);
            }
          });

        console.log('The number of whatcdDupes', whatcdDupes);

        res.send(200, items.map(({ json }) => json));
      });
  });

  server.get('/cover/:hash', (req, res) => {
    const { hash } = req.params;
    const dir = dirsMap.get(hash);
    const imageUrl = jsonMap.get(hash) && jsonMap.get(hash).image;

    const sendCover = (coverFile) => sendImage(res, coverFile);
    const sendNotFound = () => res.send(404);

    findFiles('@(cover.jpg|cover.png|folder.jpg|folder.png)', dir)
      .then(([coverFile]) => {
        if (coverFile) {
          sendCover(coverFile)
        } else if (imageUrl) {
          const downloadTo = path.join(dir, 'cover.jpg');
          downloadFile(imageUrl, downloadTo).then(sendCover, sendNotFound);
        } else {
          sendNotFound();
        }
      });
  });

  server.get('/disco/:hash/open', (req, res) => {
    const dir = dirsMap.get(req.params.hash);

    if (dir) {
      showInFinder(dir).then(() => res.send(200, {}));
    } else {
      res.send(404);
    }
  });

  server.get('/disco/:hash/like', (req, res) => {
    const { hash } = req.params;

    const discoJson = jsonMap.get(hash);
    discoJson.liked = !discoJson.liked;

    console.log(`Liked - Saving disco.json to ${dirsMap.get(hash)}`);

    writeFile(path.join(dirsMap.get(hash), 'disco.json'), discoJson)
      .then(() => res.send(200, {}))
      .catch(() => res.send(404, {}));
  });

  server.get('/disco/:hash/files', (req, res) => {
    const hash = req.params.hash;
    const dir = dirsMap.get(hash);

    Promise.resolve(
      mediaMap.get(hash) ||
      findMediaFiles(dir, hash).then((mediaFiles) => {
        mediaMap.set(hash, mediaFiles);
        console.log('media files', mediaFiles);
        return mediaFiles;
      })
    )
    .then((mediaFiles) => res.send(200, mediaFiles))
    .catch(() => res.send(404, []));
  });

  server.get('/disco/stream/:streamId', (req, res) => {
    const { index, hash } = getMediaFileData(req.params.streamId);
    const mediaFIlePath = mediaMap.get(hash) && mediaMap.get(hash)[index] && mediaMap.get(hash)[index].path;

    console.log('stream route', req.params.streamId);

    if (mediaFIlePath) {
      serveMediaFile(req, res, mediaFIlePath);
    } else {
      res.send(404);
    }
  });

  server.listen(port, () => {
    console.log(`disco server listening at ${port}`);
  });

  function findMediaFiles(dirPath, hash) {
    return findFiles('**/@(*.flac|*.mp3)', dirPath)
      .then((mediaFilesPaths) => {
        return Promise.all(mediaFilesPaths.sort().map((filePath) => parseMediaFile(filePath)))
          .then(metadata => {
            return metadata.map(({ title, artist, mimeType, duration }, index) => {
              return {
                artist,
                title,
                mimeType,
                duration,
                path: mediaFilesPaths[index],
                streamUrl: `${hostname}/disco/stream/${getStreamId(hash, index)}`,
                coverUrl: `${hostname}/cover/${hash}`
              };
            });
          })
      });
  }
}

  server.listen(port, () => console.log(`disco server listening at ${port}`));
}

function getStreamId(hash, fileIndex) {
  return `${hash}__${fileIndex}`;
}

function getMediaFileData(streamId) {
  const [ hash, index ] = streamId.split('__');

  return { hash, index };
}
