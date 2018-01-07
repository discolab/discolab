const WhatCD = require('whatcd');
const { promisify } = require('./promise-helpers');
const { log } = require('../lib/logger');
const inDelayedBatches = require('./in-delayed-batches');

let whatcd;

module.exports = {
  getTorrentData: inDelayedBatches(
    promisify(getTorrentData),
    {
      batchSize: 1,
      delay: process.env.NODE_ENV === 'development' ? 1000 : 5 * 1000
    }
  )
};

function getWhatcdClient() {
  if (!whatcd) {
    whatcd = new WhatCD(
      process.env.GAZELLE_HOSTNAME,
      process.env.GAZELLE_USERNAME,
      process.env.GAZELLE_PASSWORD
    )
  }

  return whatcd;
}

function getTorrentData(hash, callback) {
  log(`calling whatcd.torrent for ${hash}`);
  return getWhatcdClient().torrent({ hash }, callback);
}
