const path = require('path');
const mime = require('mime');
const mm = require('music-metadata');
const { log } = require('../lib/logger');
const { createReadStream } = require('fs');

function parseMediaFile(filePath) {
  return new Promise((resolve) => {
    const mimeType = mime.lookup(filePath);

    log('parsing media file', filePath);

    mm.parseStream(createReadStream(filePath), mimeType, { duration: true, skipCovers: true })
      .then(
        (metadata) => {
          resolve({
            title: metadata.common.title,
            artist: metadata.common.artist,
            duration: metadata.format.duration,
            mimeType
          });
        },
        () => {
          log('parsing of media file failed');
          resolve({
            title: path.basename(filePath),
            artist: '',
            duration: 0,
            mimeType
          });
        }
      )
  });
}

module.exports = {
  parseMediaFile
};


const temp = {
  format:
    {
      tagTypes: ['ID3v2.3', 'vorbis'],
      dataformat: 'flac',
      lossless: true,
      numberOfChannels: 2,
      bitsPerSample: 16,
      sampleRate: 44100,
      duration: 486.8,
      bitrate: 482708.67707477405
    },
  native: undefined,
  common:
    {
      track: {no: 1, of: null},
      disk: {no: null, of: null},
      artists: ['Frank S. Dodge', 'Naomi Niskala'],
      artist: 'Frank S. Dodge',
      albumartist: '',
      conductor: [''],
      title: 'Duo for Violoncello and Piano (1977) - Duo for Violoncello and Piano (1977)',
      album: 'Robert Helps in Berlin - Chamber Music with Piano',
      year: 2017,
      composer: ['Robert Helps'],
      replaygain_track_gain: '+4.50 dB',
      replaygain_track_peak: 0.65768433
    }
}
