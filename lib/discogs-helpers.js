const {writeFile} = require('./fs-helpers');
const Discogs = require('disconnect').Client;

module.exports = {
  getDiscogsData,
  downloadDiscogsImage
};

let db;

const getDiscogsDb = () => {
  if (!db) {
    const userToken = process.env.DISCOGS_TOKEN;
    db = new Discogs({userToken}).database()
  }

  return db;
};

function downloadDiscogsImage(imageUrl, downloadTo) {
  return new Promise((resolve, reject) =>
    getDiscogsDb().getImage(
      imageUrl,
      (err, data) =>
        writeFile(downloadTo, data, 'binary').then(resolve, reject)
    )
  );
}

function getDiscogsData(releaseId) {
  return new Promise((resolve, reject) =>
    getDiscogsDb().getRelease(
      releaseId,
      (err, data) => err ? reject(err) : resolve(data)
    )
  );
}
