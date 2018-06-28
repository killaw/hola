const fs = require('fs');

const del = function (filename, res) {
  fs.stat(filename, (err, stats) => {
    if (err && err.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('File not found');

      return;
    }

    if (!stats.isFile()) {
      res.statusCode = 400;
      res.end('Bad request');

      return;
    }

    fs.unlink(filename, (err) => {
      if (err) {
        res.statusCode = 500;
        res.end('Server error');
        console.error(err);
      } else {
        res.statusCode = 200;
        res.end('OK');
      }
    });
  });
};

module.exports = del;
