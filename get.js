const path = require('path'),
      fs = require('fs');
const rootFolder = path.join(__dirname, '/public/');

const get = function (pathname, res) {
  if (pathname == rootFolder)
    pathname = path.join(pathname, '/index.html');

  let stream = fs.createReadStream(pathname);
  /*
    stream.emit = function (...rest) {
      console.log('stream', rest[0]);
      stream.constructor.prototype.emit.apply(this, rest);
    };

    res.emit = function (...rest) {
      console.log('response', rest[0]);
      res.constructor.prototype.emit.apply(this, rest);
    }
  */
  let mimeTypes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.txt': 'text/text',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'text/javascript'
  };

  /*
    Не смотря на то, что всякие проверки на существование файла были проведены ранее,
    обработку error нужно реализовать, т.к. могут быть проблемы и во время чтения файла
  */
  stream
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File not found');
      } else {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/html');
          res.statusCode = 500;
          res.end('Server error');
        } else {
          res.end();
        }
      }

      console.error(err);
    })
    .on('open', () => {
      /*
        Событие open происходит до события error (в случае если открытие завершается ошибкой)
      */
      /*
        метод writeHead как раз отправит заголовки, а не просто их устновит. И после него
        параметр res.headersSent будет true
      */
      // res.writeHead(200, { 'Content-Type': `${mimeTypes[path.extname(pathname)] || 'application/octet-stream'}; chastreamet=utf-8`, });
      res.setHeader('Content-Type', `${mimeTypes[path.extname(pathname)] || 'application/octet-stream'}; chastreamet=utf-8`);
    })
    .pipe(res);
  /*
    Событие close у response нужно отлавливать, чтобы принудительно уничтожать поток,
    т.к. close - событие разрыва соединения (finish - правильное завершение соединения).
    В случае разрыва соединения, у потока не наступит ни событие end, ни событие close,
    соответственно не будут освобождены ресурсы и файл, открытый потоком также останется
    в памяти
  */
  res.on('close', () => stream.destroy());
  /*
    Данная конструкция делает похожие на stream.pipe(res) действия:
    при заполнении буфера res, res.write вернет false;
    отписываемся от события readable, таким образом чтение из потока приостанавливается;
    когда возникает событие drain - освобождение буфера res (т.к. данные переданы клиенту),
    мы снова подписываемся на событие readable и сразу выполняем stream.read(), т.к. в буфере
    stream почти наверняка уже есть данные.

    const read = () => {
      let chunk = stream.read();
      // проверка на chunk нужна, т.к. в последнем событии readable он будет null
      if (chunk && !res.write(chunk))
        stream.removeListener('readable', read);
    }
    stream.on('readable', read);
    res.on('drain', () => {
      stream.on('readable', read);
      stream.read();
    });
    // в случае с pipe отдельный res.end не нужен
    stream.on('close', () => {
      res.end();
    });
  */
  /*
    Событие readable говорит о том, что в буфере потока появились данные для считывания
    Effectively, the 'readable' event indicates that the stream has new information:
    either new data is available or the end of the stream has been reached.
    In the former case, stream.read() will return the available data.
    In the latter case, stream.read() will return null.

    stream.on('readable', () => {
      stream.read() вернет null в последней итерации.
      Преимущество события readable перед data в том, что в первом случае я сам
      решаю, когда начать чтение с помощью метода read, таким образом приостанавливая чтение.
      В случае с data, у меня нет выбора, я должен обработать чтение сразу же.
      Если я использую readable, событие data произойдет после метода read.
      stream.read();
    });
    stream.on('data', (chunk) => {
      res.write(chunk);
    });
  */

  /*
    fs.stat вернет сведения о файле, если файл (или директория) существуют, или
    ошибку, если не существуют. Далее проверим, что запрошенный ресурс действительно
    файл и, если нет, то вернем 404
  */
  /*
    Оказалось, что довольно опасно проверять наличие файла перед его открытием.
    Дело в том, что stat будет помещен macrotask и ReadStream какбы тоже, но вполне
    вероятно, что перед тем как ReadStream будет потавлен в очередь, там уже будет
    выполнен unlink (например другим пользователем). Таким образом ReadStream
    выбросит исплючение и завалит процесс. Вместо этого достаточно повесить onerror
    на ReadStream и там обработать ошибку ENOENT, если она возникнет
    fs.stat(pathname, (err, stats) => {
      if (err || !stats.isFile()) {
        res.statusCode = 404;

        return res.end('File not found');
      }

      sendFile();
    });
  */
};

module.exports = get;
