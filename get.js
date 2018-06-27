const path = require('path'),
      fs = require('fs');
const rootFolder = path.join(__dirname, '/public');

const get = function (pathname, res) {
  if (pathname == '/')
    pathname = '/index.html';
    // отдачу файлов следует переделать "правильно", через потоки, с нормальной обработкой ошибок
    /*
      - чтение потоком по кускам
      - отдача по кускам
      - обработка ситуации с преждевременно закрывшемся соединением
      - нормализация запроса (устранение возможности выйти за пределы public)
      - убрать нулевой бит?
    */
  let stream = fs.createReadStream(path.join(rootFolder, pathname));
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
    '.zip': 'application/zip'
  };

  stream.on('error', (err) => {
    res.end(err.toString());
  });

  stream.on('open', () => {
    /*
      Событие close у response нужно отлавливать, чтобы принудительно уничтожать поток,
      т.к. close - событие разрыва соединения (finish - правильное завершение соединения).
      В случае разрыва соединения, у потока не наступит ни событие end, ни событие close,
      соответственно не будут освобождены ресурсы и файл, открытый потоком также останется
      в памяти
    */
    res.on('close', () => stream.destroy());
    res.writeHead(200, { 'Content-Type': `${mimeTypes[path.extname(pathname)] || 'text/html'}; chastreamet=utf-8`, });
    stream.pipe(res);
  });

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
};

module.exports = get;
