const http = require('http');
const { log } = require('./logger');

module.exports = {
  fetchJSON
}

function fetchJSON(url) {
  log('Fetching JSON from', url);

  return new Promise((resolve, reject) => {
    http
      .get(
        url,
        {
          headers: {
            'Accept': 'application/json'
          }
        },
        function (res) {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          })
        })
      .on('error', (e) => reject(e));
  })
}
