const Discogs = require('disconnect').Client;

module.exports = {
  getDiscogsData
};

let db;

const getDiscogsDb = () => {
  if (!db) {
    const userToken = process.env.DISCOGS_TOKEN;
    db = new Discogs({ userToken }).database()
  }

  return db;
};

function getDiscogsData(releaseId) {
  return new Promise(
    (resolve, reject) =>
      getDiscogsDb().getRelease(
        releaseId,
        (err, data) => err ? reject(err) : resolve(data)
      )
  );
}
