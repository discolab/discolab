module.exports= {
  writeDiscoJson,
  findDiscoJsons
};

const glob = require('glob');
const path = require('path');
const { differenceBy } = require('lodash');
const { log } = require('./logger');
const { md5, hashIndex } = require('./hash');
const { writeFile, pathExists, findJsons } = require('./fs-helpers');
const { getDiscogsData } = require('./discogs-helpers');
const { getTorrentData } = require('./whatcd-helpers');
const { getTorrentDir } = require('./torrent-helpers');

const DISCO_JSON = 'disco.json';

function writeDiscoJson({ hash, discogsId }) {
  if (!hash && !discogsId) {
    return Promise.reject('please provide hash or discogsId parameter');
  }

  let jsonPath;

  return (hash ? getTorrentDir(hash) : Promise.resolve(process.cwd()))
    .then((dir) => {
      jsonPath = path.join(dir, DISCO_JSON);
      return isGazelle(dir) || discogsId
        ? pathExists(jsonPath)
        : Promise.reject('non-gazelle torrent')
    })
    .then((exists) =>
      exists
        ? Promise.reject('disco.json file already exists')
        : hash
          ? getTorrentData(hash).then(fromTorrentData)
          : getDiscogsData(discogsId).then(fromDiscogsData)
    )
    .then((data) => writeFile(jsonPath, data))
    .catch((error) => log(`Error - ${error} - ${jsonPath}`));
}

function findDiscoJsons(dir) {
  return findJsons(`**/${DISCO_JSON}`, dir);
}

function isGazelle(dir) {
  return (process.env.GAZELLE_DOWNLOAD_DIRS || '')
    .split(',')
    .some((downloadDir) => dir.startsWith(downloadDir));
}

function fromTorrentData(resp) {
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

function fromDiscogsData(resp)  {
  const { id, artists, extraartists, genres, styles, labels, year, title, formats, images } = resp;

  const label = labels[0] || {};
  const format = formats[0] || {};
  const composers = filterByRole(extraartists, 'compose');
  const conductors = filterByRole(extraartists, 'conduct');
  const mainArtists = differenceBy(artists, conductors, 'id');

  return {
    torrentId: hashIndex(id.toString()),
    torrentHash: md5(id.toString()).toUpperCase(),
    artists: mainArtists.map(pickName),
    composers: composers.map(pickName),
    conductor: conductors.map(pickName),
    name: title,
    year: year,
    recordLabel: label.name || '',
    catalogueNumber: label.catno || '',
    with: [],
    dj: [],
    image: '',
    tags: genres.concat(styles).map(toLowerCase),
    media: format.name
  };
}

const includes = (a, b) => toLowerCase(a).includes(toLowerCase(b));

const toLowerCase = (s) => s.toLowerCase();

const filterByRole = (artists, roleDesc) => artists.filter(
  ({ role }) => includes(role, roleDesc)
);

const pickName = ({ name }) => ({ name });



