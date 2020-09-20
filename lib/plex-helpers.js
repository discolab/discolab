const { fetchJSON } = require('./http-helpers');
const { createAsyncQueue } = require('./promise-helpers');
const { copy } = require('./fs-helpers');
const sanitizeFilename = require('filenamify');
const path = require('path');

module.exports = {
  copyPlaylistItems
}

const queue = createAsyncQueue(10);

function copyPlaylistItems(dest) {
  fetchJSON(playlistUrl())
    .then(data =>
      Promise.all(
        data.MediaContainer.Metadata
          .map(({originalTitle, grandparentTitle, title, Media}) => {
            const source =  Media[0].Part[0].file;
            const ext = path.extname(source);
            const artistName = originalTitle || grandparentTitle;
            const destPath = path.join(dest, sanitizeFilename(`${artistName} — ${title}${ext}`));

            return queue.add(() => copy(source, destPath, { overwrite: false }));
          })
      )
    );
}

function playlistUrl() {
  const {
    PLEX_HOST,
    PLEX_TOKEN,
    PLEX_PLAYLIST_ID
  } = process.env;

  return `${PLEX_HOST}/playlists/${PLEX_PLAYLIST_ID}/items?X-Plex-Token=${PLEX_TOKEN}`;
}
