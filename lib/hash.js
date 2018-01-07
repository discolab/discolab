const crypto = require('crypto');

module.exports = {
  md5,
  hashIndex
};

function md5(str) {
  return createHash(str, 'md5').digest('hex')
}

function createHash(str, algo) {
  return crypto.createHash(algo).update(str);
}

function hashIndex(str, max = 10e12) {
  return bufToNumber(createHash(str, 'sha1').digest()) % max;
}

function bufToNumber(buf) {
  return buf.readUInt16BE(0) * 0xffffffff + buf.readUInt32BE(2)
}


