const fs = require('fs');
const mime = require('mime');
const sharp = require('sharp');

module.exports = serveImage;

function serveImage(req, res, imageFilePath, size) {
  fs.exists(imageFilePath, (exists) => {
     if (exists) {
       res.statusCode = 200;
       res.setHeader('Content-Type', mime.lookup(imageFilePath));

       const image = sharp(imageFilePath);
       const readStream = fs.createReadStream(imageFilePath);
       const streamSourceImage = () => readStream.pipe(res);

       image.metadata().then(
         ({ width }) => {
           if (width <= size) {
             return streamSourceImage();
           } else {
             return readStream
               .pipe(sharp().resize(Math.round(size)))
               .pipe(res);
           }
         },
         () => streamSourceImage()
       );
     } else {
       return res.send(404);
     }
  });
}
