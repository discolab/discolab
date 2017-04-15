const fs = require('fs');
const rangeParser = require('range-parser');
const mime = require('mime');

module.exports = serveMediaFile;

function serveMediaFile(req, res, filePath) {
  const { size } = fs.statSync(filePath);
  const { range } = req.headers;

  res.setHeader('Content-Type', mime.lookup(filePath));
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log('serving media file', range, filePath);

  if (range) {
    const { start, end } = rangeParser(size, range)[0];
    const chunksize = end - start + 1;

    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunksize);
    res.statusCode = 206;

    return fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', size);
    res.statusCode = 200;

    return fs.createReadStream(filePath).pipe(res);
  }
}
