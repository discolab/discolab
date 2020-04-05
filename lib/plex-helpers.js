const { fetchJSON } = require('./http-helpers');
const { createAsyncQueue } = require('./promise-helpers');
const { copy } = require('./fs-helpers');
const path = require('path');

module.exports = {
  copyPlaylistItems
}

const queue = createAsyncQueue(5);

function copyPlaylistItems(dest) {
  fetchJSON(playlistUrl())
    .then(data => {
      data.MediaContainer.Metadata
        .map(({originalTitle, title, Media}) => ({
          source: Media[0].Part[0].file,
          dest: path.join(dest, `${originalTitle} — ${title}`)
        }))
        .forEach(({source, dest}) => {
          queue.add(() => copy(source, dest, { overwrite: false }));
        })
    });
}

function playlistUrl() {
  const {
    PLEX_HOST,
    PLEX_TOKEN,
    PLEX_PLAYLIST_ID
  } = process.env;

  return `${PLEX_HOST}/playlists/${PLEX_PLAYLIST_ID}/items?X-Plex-Token=${PLEX_TOKEN}`;
}
