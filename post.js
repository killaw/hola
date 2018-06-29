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

  stream
    .on('error', (err) => {
      if (err.code === 'EEXIST') {
        res.statusCode = 409;
        res.end('Alredy exists');
      } else {
        /*
          Дело в том, что протокол http отсылает заголовки отдельно от тела, поэтому
          (видимо чтобы избежать ошибки) можно проверить свойство headersSent. Почему
          тут может быть ситуация, когда заголовки уже отправлены, я не знаю
        */
        if (!res.headersSent) {
          res.writeHead(500, {'Connection': 'close'});
          res.write('Server error');
        }
      }

      fs.unlink(filename, (err) => {
        if (err)
          console.error(err);
        res.end();
      });
      console.error(err);
    })
    .on('close', () => {
      // Note: can't use on('finish')
      // finish = data flushed, for zero files happens immediately,
      // even before 'file exists' check

      // for zero files the event sequence may be:
      //   finish -> error

      // we must use 'close' event to track if the file has really been written down
      res.statusCode = 200;
      res.end('Upload completed');
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
    // .on('end', () => {
    //   res.statusCode = 200;
    //   res.end('Upload completed');
    // })
    .pipe(stream); // здесь уже вернется WriteStream, т.е. не объект req
};

module.exports = post;
