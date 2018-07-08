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

const normalizeRequest = require('./normalize-request'),
      config = require('config'),
      del = require('./delete'),
      post = require('./post'),
      http = require('http'),
      get = require('./get'),
      url = require('url'),
      fs = require('fs');

module.exports = http.createServer(function(req, res) {
  for (let pattern of config.get('misc:hackers'))
    if (~req.url.toLowerCase().indexOf(pattern)) {
      fs.appendFile(config.get('path:log'), `${(new Date).toLocaleString()} Client with ip address ${req.connection.remoteAddress} requested strange url: ${req.url}\r\n`, (err) => err);
      res.statusCode = 404;
      res.end('File not found');

      return;
    }

  switch(req.method) {
    case 'GET':
      normalizeRequest(
        url.parse(req.url).pathname,
        res,
        (pathname) => get(pathname, res)
      );
      break;
/*
    case 'POST':
      normalizeRequest(
        url.parse(req.url).pathname,
        res,
        (pathname) => post(pathname, req, res)
      );
      break;

    case 'DELETE':
      normalizeRequest(
        url.parse(req.url).pathname,
        res,
        (pathname) => del(pathname, res)
      );
      break;
*/
    default:
      res.statusCode = 502;
      res.end('Not implemented');
  }
});

/*
  res.on('error')
  как бы никакие проблемы сетевого соединения не вызовут error
  Оно может произойти только если мы например попробуем что-то записать в res
  уже после закрытия соединения. Т.е. это не ошибка рантайма.
*/
