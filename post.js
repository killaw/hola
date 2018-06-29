let fs = require('fs');

const post = function (filename, req, res) {
  if (+req.headers['content-length'] >= 1048576) {
    res.statusCode = 413;
    res.end('File too big');

    return;
  }

  let stream = new fs.WriteStream(filename, {flags: 'wx'});
  let length = 0;

  const writeFile = function (chunk) {
    length += chunk.length;
    if (length >= 1048576) {
      /*
        Обязательно нужно отправлять заголовок Connection:close, т.к. браузеры,
        не смотря на то, что мы делаем res.end(), всё равно продолжат отдавать
        данные поддерживая соединение
        // if we just res.end w/o connection close, browser may keep on sending the file
        // the connection will be kept alive, and the browser will hang (trying to send more data)
        // this header tells node to close the connection
        // also see http://stackoverflow.com/questions/18367824/how-to-cancel-http-upload-from-data-events/18370751#18370751
      */
      res.setHeader('Connection', 'close');
      res.statusCode = 413;
      res.end('File is too big');
      // req.removeListener('data', writeFile);

      /*
        unpipe делает хер пойми что. Т.е. поток не будет приостановлен, данные
        можут потеряться неизвестно где. (Так исторически сложилось)
        Если хочется при пайпе поставить поток на паузу, то нужно делать pause(),
        а потом resume()
        req.unpipe(stream);
      */
      stream.destroy();

      // stream.once('close', () => {
        fs.unlink(filename, (err) => {
          if (err)
            console.error(err);
        });
      // });
    }
  };

  stream.on('error', (err) => {
    if (err.code === 'EEXIST') {
      res.statusCode = 409;
      res.end('Alredy exists');
    } else {
      res.statusCode = 500;
      res.end('Server error');
    }

    console.error(err);
  });


  req
    .on('data', writeFile)
    .on('close', () => {
      // req.unpipe(stream);
      stream.destroy();
      // stream.once('close', () => {
        fs.unlink(filename, (err) => {
          if (err)
            console.error(err);
        });
      // });
    })
    .on('end', () => {
      res.statusCode = 200;
      res.end('Upload completed');
    })
    .pipe(stream); // здесь уже вернется WriteStream, т.е. не объект req
};

module.exports = post;
