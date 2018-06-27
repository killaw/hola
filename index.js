/**
 ЗАДАЧА - научиться работать с потоками (streams)
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
   GET /file.ext
   - выдаёт файл file.ext из директории files,

   POST /file.ext
   - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
   - если файл уже есть, то выдаёт ошибку 409
   - при превышении файлом размера 1MB выдаёт ошибку 413

   DELETE /file
   - удаляет файл
   - выводит 200 OK
   - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400.

- Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла)
- index.html или curl для тестирования

 */

// Пример простого сервера в качестве основы

'use strict';

let path = require('path'),
    url = require('url'),
    fs = require('fs');

require('http').createServer(function(req, res) {
  let pathname = decodeURI(url.parse(req.url).pathname),
      rootFolder = path.join(__dirname, '/public');

  switch(req.method) {
    case 'GET':
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
      let rs = fs.createReadStream(path.join(rootFolder, pathname));

      rs.emit = function (...rest) {
        if (!['data', 'pause', 'resume'].includes(rest[0]))
          console.log('stream', rest[0]);
        rs.constructor.prototype.emit.apply(this, rest);
      };

      res.emit = function (...rest) {
        console.log('response', rest[0]);
        res.constructor.prototype.emit.apply(this, rest);
      }

      let mimeTypes = {
        '.zip': 'application/zip'
      };

      rs.on('error', (err) => {
        res.end(err.toString());
      });

      rs.on('open', () => {
        /*
          Событие close у response нужно отлавливать, чтобы принудительно уничтожать поток,
          т.к. close - событие разрыва соединения (finish - правильное завершение соединения).
          В случае разрыва соединения, у потока не наступит ни событие end, ни событие close,
          соответственно не будут освобождены ресурсы и файл, открытый потоком также останется
          в памяти
        */
        res.on('close', () => rs.destroy());
        res.writeHead(200, { 'Content-Type': `${mimeTypes[path.extname(pathname)] || 'text/html'}; charset=utf-8`, });
        rs.pipe(res);
      });

      /*
        Данная конструкция делает похожие на rs.pipe(res) действия:
        при заполнении буфера res, res.write вернет false;
        отписываемся от события readable, таким образом чтение из потока приостанавливается;
        когда возникает событие drain - освобождение буфера res (т.к. данные переданы клиенту),
        мы снова подписываемся на событие readable и сразу выполняем rs.read(), т.к. в буфере
        rs почти наверняка уже есть данные.

        const read = () => {
          let chunk = rs.read();
          // проверка на chunk нужна, т.к. в последнем событии readable он будет null
          if (chunk && !res.write(chunk))
            rs.removeListener('readable', read);
        }
        rs.on('readable', read);
        res.on('drain', () => {
          rs.on('readable', read);
          rs.read();
        });
        // в случае с pipe отдельный res.end не нужен
        rs.on('close', () => {
          res.end();
        });
      */
      /*
        Событие readable говорит о том, что в буфере потока появились данные для считывания
        Effectively, the 'readable' event indicates that the stream has new information:
        either new data is available or the end of the stream has been reached.
        In the former case, stream.read() will return the available data.
        In the latter case, stream.read() will return null.

        rs.on('readable', () => {
          rs.read() вернет null в последней итерации.
          Преимущество события readable перед data в том, что в первом случае я сам
          решаю, когда начать чтение с помощью метода read, таким образом приостанавливая чтение.
          В случае с data, у меня нет выбора, я должен обработать чтение сразу же.
          Если я использую readable, событие data произойдет после метода read.
          rs.read();
        });
        rs.on('data', (chunk) => {
          res.write(chunk);
        });
      */

      break;

    default:
      res.statusCode = 502;
      res.end("Not implemented");
  }

}).listen(3000);
