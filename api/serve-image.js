const path = require('path');
const { readFile } = require('../lib/fs-helpers');

module.exports = serveImage;

function serveImage(req, res, imageFile) {
  readFile(imageFile, 'binary').then((imageData) => {
    res.writeHead(200, {
      'Content-Type': path.extname(imageFile) === 'png' ? 'image/png' : 'image/jpeg'
    });
    res.end(new Buffer(imageData, 'binary'));
  });
}
