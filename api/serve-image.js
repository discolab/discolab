const fs = require('fs');
const mime = require('mime');
const sharp = require('sharp');

module.exports = serveImage;

function serveImage(req, res, imageFilePath, size) {
  fs.exists(imageFilePath, (exists) => {
     if (exists) {
       sharp(imageFilePath).metadata().then(
         ({ width }) => {
           res.statusCode = 200;
           res.setHeader('Content-Type', mime.lookup(imageFilePath));

           if (width <= size) {
             return fs.createReadStream(imageFilePath).pipe(res);
           } else {
             return resizeImage(imageFilePath, size).pipe(res);
           }
         },
         () => res.send(500)
       );
    } else {
       return res.send(404);
     }
  });
}

function resizeImage(imageFilePath, size) {
  return fs.createReadStream(imageFilePath)
    .pipe(
      sharp().resize(Math.round(size))
    );
}

