let path = require('path'),
    url = require('url'),
    fs = require('fs');

const post = function (filename, req, res) {
  if (req.headers['content-length'] >= 1048576) {
    res.statusCode = 413;
    res.end('File too big');

    return;
  }

  // let filename = path.join(__dirname, 'public', 'files', decodeURIComponent(url.parse(req.url).pathname));

  fs.stat(filename, (err) => {
    if (err && err.code !== 'ENOENT') {
      res.statusCode = 500;
      res.end('Server error');

      return;
    } else if (!err) {
      res.statusCode = 409;
      res.end('Alredy exists');

      return;
    }

    let stream = new fs.WriteStream(filename);
    let length = 0;

    const writeFile = function (chunk) {
      length += chunk.length;
      if (length >= 1048576) {
        console.log(length);
        stream.once('close', () => {
          fs.unlink(filename, (err) => {
            if (err)
              console.error(err);
          });
        });
        req.unpipe(stream);
        stream.destroy();
        res.statusCode = 413;
        res.end('File is too big');
        req.removeListener('data', writeFile);
      }
    };

    stream.on('error', (err) => {
      res.statusCode = 500;
      res.end('Server error');
      console.error(err);
    });

    req.pipe(stream);

    req
      .on('data', writeFile)
      .on('close', () => {
        stream.once('close', () => {
          fs.unlink(filename, (err) => {
            if (err)
              console.error(err);
          });
        });
        req.unpipe(stream);
        stream.destroy();
      })
      .on('end', () => {
        res.statusCode = 200;
        res.end('Upload completed');
      });
  });
};

module.exports = post;
