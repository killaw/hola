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

let get = require('./get'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

require('http').createServer(function(req, res) {
  switch(req.method) {
    case 'GET':
      get(url.parse(req.url).pathname, res);
      break;

    case 'POST':
      if (req.headers['content-length'] >= 1048576) {
        res.statusCode = 413;
        res.end('File too big');

        return;
      }

      let filename = path.join(__dirname, 'public', 'files', decodeURIComponent(url.parse(req.url).pathname));

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
        }

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

      break;

    default:
      res.statusCode = 502;
      res.end('Not implemented');
  }
}).listen(3000);
