module.exports= {
  writeDiscoJson,
  findCovers,
  findDiscoJsons
};

const glob = require('glob');
const path = require('path');
const { differenceBy, uniqBy } = require('lodash');
const { log } = require('./logger');
const { md5, hashIndex } = require('./hash');
const { writeFile, pathExists, findJsons, findFiles } = require('./fs-helpers');
const { getDiscogsData, downloadDiscogsImage } = require('./discogs-helpers');
const { getTorrentData } = require('./whatcd-helpers');
const { getTorrentDir } = require('./torrent-helpers');
const { downloadFile } = require('./request-helpers');

const DISCO_JSON = 'disco.json';
const COVER_FILE = 'cover.jpg';

function writeDiscoJson({ hash, discogsId }) {
  if (!hash && !discogsId) {
    return Promise.reject('please provide hash or discogsId parameter');
  }

  let jsonPath, coverPath, dir;

  return (hash ? getTorrentDir(hash) : Promise.resolve(process.cwd()))
    .then((releaseDir) => {
      dir = releaseDir;
      jsonPath = path.join(dir, DISCO_JSON);
      coverPath= path.join(dir, COVER_FILE);

      return isGazelleDir(dir) || discogsId
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
    .then((data) => Promise.all([
      data.image
        ? findCovers(dir).then(
            ([existingCover]) => existingCover
              ? Promise.resolve()
              : downloadCover(data.image, coverPath)
          )
        : Promise.resolve(),
      writeFile(jsonPath, data)
    ]))
    .catch((error) => log(`Error - ${error} - ${jsonPath}`));
}

function downloadCover(url, downloadTo) {
  return isDiscogsImageUrl(url)
    ? downloadDiscogsImage(url, downloadTo)
    : downloadFile(url, downloadTo);
}

function findDiscoJsons(dir) {
  return findJsons(`**/${DISCO_JSON}`, dir);
}

function findCovers(dir) {
  return findFiles('@(cover.jpg|cover.png|folder.jpg|folder.png)', dir)
}

function isDiscogsImageUrl(url) {
  return url.includes('discogs.com');
}

function isGazelleDir(dir) {
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

function fromDiscogsData(resp) {
  const { id, artists, extraartists, genres, styles, labels, year, title, formats, images, tracklist } = resp;

  const tracksArtists = fromTracklist(tracklist, 'artists');
  const tracksExtraArtists = fromTracklist(tracklist, 'extraartists');

  const composers = filterByRole(extraartists, 'compose');
  const conductors = filterByRole(extraartists, 'conduct');
  const tracksComposers = filterByRole(tracksExtraArtists, 'compose');
  const mainArtists = differenceBy(artists, composers, 'id');

  return {
    torrentId: hashIndex(id.toString()),
    torrentHash: md5(id.toString()).toUpperCase(),
    artists: (
      isVA(artists[0])
        ? tracksArtists
        : mainArtists.length ? mainArtists : artists
    ).map(pickName),
    composers: (
      isClassical(genres[0])
        ? composers.concat(tracksComposers)
        : composers
    ).map(pickName),
    conductor: conductors.map(pickName),
    name: (title || '').trim(),
    year: year,
    image: pickPropFromFirst(images, 'resource_url'),
    recordLabel: parseName(pickPropFromFirst(labels, 'name')),
    catalogueNumber: pickPropFromFirst(labels, 'catno'),
    media: pickPropFromFirst(formats, 'name'),
    tags: genres.concat(styles).filter(Boolean).map(toLowerCase),
    with: [],
    dj: [],
  };
}

const includes = (a, b) => toLowerCase(a).includes(toLowerCase(b));

const toLowerCase = (s) => s.toLowerCase();

const fromTracklist = (tracklist = [], prop) =>
  uniqBy(
    (tracklist || [])
      .filter(({ type_ }) => type_ === 'track')
      .reduce((acc, track) => acc.concat(track[prop] || []), []),
    'id'
  );

const filterByRole = (artists, roleDesc) => artists.filter(
  ({ role }) => includes(role, roleDesc)
);

const isVA = ({ name } = {}) => name.toLowerCase() === 'various';

const isClassical = (genre = '') => genre.toLowerCase() === 'classical';

const pickName = ({ name }) => ({ name: parseName(name) });

const parseName = (name) => name.replace(/\s+\([0-9]+\)/, '').trim();

const pickPropFromFirst = (items, prop) => (items[0] || {})[prop] || '';
