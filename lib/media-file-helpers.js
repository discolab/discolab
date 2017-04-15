const path = require('path');
const mime = require('mime');
const { createReadStream } = require('fs');
const FLACParser = require('flac-parser');
const ID3Parser = require('id3v2-parser');

const AUDIO_MPEG = 'audio/mpeg';
const AUDIO_FLAC = 'audio/x-flac';

const parsers = {
  [AUDIO_MPEG]: ID3Parser,
  [AUDIO_FLAC]: FLACParser
};

const tags = {
  [AUDIO_MPEG]: {
    tpe1: 'artist',
    tit2: 'title'
  },
  [AUDIO_FLAC]: {
    artist: 'artist',
    title:  'title',
    duration: 'duration'
  }
};

function parseMediaFile(filePath) {
  return new Promise((resolve) => {
    const mimeType = mime.lookup(filePath);
    const Parser = parsers[mimeType];

    console.log('parsing media file', filePath);

    const fallback = (reason) => () => {
      console.log(`${reason} - parsing of media file finished or failed`);
      resolve({
        title: path.basename(filePath),
        artist: '',
        duration: 0,
        mimeType
      });
    };

    if (Parser) {
      const parseStream = createReadStream(filePath).pipe(new Parser());
      const tagsToParse = Object.keys(tags[mimeType]);
      const metadata = {};

      parseStream
        .on('error', fallback('error'))
        .on('finish', fallback('finish'))
        .on('close', fallback('close'))
        .on('data', ({ type, value }) => {
          const tag = type.toLowerCase();

          if (tagsToParse.indexOf(tag) > -1) {
            metadata[tags[mimeType][tag]] = value;
          }

          if (tagsToParse.length === Object.keys(metadata).length) {
            metadata.mimeType = mimeType;
            resolve(metadata);
          }
        });
    } else {
      fallback('no parser found')();
    }
  });
}

module.exports = {
  parseMediaFile
};
