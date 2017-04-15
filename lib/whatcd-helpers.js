const WhatCD = require('whatcd');
const { promisify } = require('./promise-helpers');
const inDelayedBatches = require('./in-delayed-batches');

const whatcd = new WhatCD(
  process.env.GAZELLE_HOSTNAME,
  process.env.GAZELLE_USERNAME,
  process.env.GAZELLE_PASSWORD
);

module.exports = {
  getTorrentData: inDelayedBatches(
    promisify(getTorrentData),
    {
      batchSize: 1,
      delay: process.env.NODE_ENV === 'development' ? 1000 : 5 * 1000
    }
  ),
  getReleaseData
};

function getTorrentData({ hash }, callback) {
  console.log(`calling whatcd.torrent for ${hash}`);
  return whatcd.torrent({ hash }, callback);
}

function getReleaseData(resp) {
  if (resp.group && resp.group.musicInfo) {
    return {
      torrentId: resp.torrent.id,
      torrentHash: resp.torrent.infoHash,
      artists: resp.group.musicInfo.artists || [],
      with: resp.group.musicInfo.with || [],
      name: resp.group.name,
      year: resp.group.year,
      image: resp.group.wikiImage,
      composers: resp.group.musicInfo.composers || [],
      conductor: resp.group.musicInfo.conductor || [],
      dj: resp.group.musicInfo.dj || [],
      recordLabel: resp.group.recordLabel,
      catalogueNumber: resp.group.catalogueNumber,
      tags: resp.group.tags || [],
      media: resp.torrent.media || ''
    };

  } else {
    throw new Error('Not a music torrent');
  }
}
