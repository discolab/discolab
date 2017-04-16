const mime = require('mime');
const restify = require('restify');
const path = require('path');
const internalIp = require('internal-ip');
const serveMediaFile = require('./serve-media-file');
const serveImageFile = require('./serve-image');
const { showInFinder } = require('../lib/shell-helpers');
const createDataProvider = require('../data-provider/create-data-provider');

module.exports = startApiServer;

function startApiServer(port, musicDir) {
  const {
    getAllReleases,
    getReleaseCover,
    getRelease,
    getReleaseMediaFiles,
    getReleaseDir,
    updateRelease
  } = createDataProvider(musicDir);

  const server = restify.createServer();
  const hostname = `http://${internalIp()}:${port}`;

  server.use(restify.CORS());

  server.get('/disco/all', (req, res) => {
    getAllReleases()
      .then(
        (items) => res.send(200, items.map(addArtworkUrl)),
        (items) => res.send(200, [])
      );
  });

  server.get('/disco/:hash', (req, res) => {
    const release = getRelease(req.params.hash);

    if (release) {
      res.send(200, addArtworkUrl(release));
    } else {
      res.send(404);
    }
  });

  server.get('/disco/:hash/open', (req, res) => {
    const dir = getReleaseDir(req.params.hash);

    if (dir) {
      showInFinder(dir).then(() => res.send(200, {}));
    } else {
      res.send(404);
    }
  });

  server.get('/disco/:hash/like', (req, res) => {
    const { hash } = req.params;
    const release = getRelease(hash);
    const send = (code) => res.send(code, {});

    if (release) {
      updateRelease(hash, { liked: !release.liked })
        .then(send(200), send(404));
    } else {
      send(404);
    }
  });

  server.get('/disco/:hash/files', (req, res) => {
    const { hash } = req.params;

    getReleaseMediaFiles(hash)
      .then(
        (metadata) => {
          res.send(200, metadata.map((item, index) => Object.assign({}, item, {
              streamUrl: getStreamUrl(hash, index),
              coverUrl: getArtworkUrl(hash)
            })
          ));
        },
        () => res.send(404, [])
      )
  });

  server.get('/cover/:hash', (req, res) => {
    getReleaseCover(req.params.hash)
      .then(
        (coverFile) => serveImageFile(req, res, coverFile),
        () => res.send(404)
      );
  });

  server.get('/stream/:streamId', (req, res) => {
    const {index, hash} = getMediaFileDescriptor(req.params.streamId);

    getReleaseMediaFiles(hash)
      .then(
        (metadata) => {
          const fileMetadata = metadata[index];

          if (fileMetadata && fileMetadata.path) {
            serveMediaFile(req, res, fileMetadata.path);
          } else {
            res.send(404);
          }
        },
        () => res.send(404)
      );
  });

  server.listen(port, () => console.log(`disco server listening at ${port}`));

  function addArtworkUrl(release) {
    return Object.assign({}, release, {
      artworkUrl: getArtworkUrl(release.torrentHash)
    });
  }

  function getArtworkUrl(hash) {
    return `${hostname}/cover/${hash}`;
  }

  function getStreamUrl(hash, index) {
    return `${hostname}/stream/${getStreamId(hash, index)}`;
  }

  function getStreamId(hash, index) {
    return `${hash}__${index}`;
  }

  function getMediaFileDescriptor(streamId) {
    const [ hash, index ] = streamId.split('__');

    return { hash, index };
  }
}
