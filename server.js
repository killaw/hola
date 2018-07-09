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
      if (req.url === '/myip') {
        res.statusCode = 200;
        res.end(JSON.stringify({ ip: req.connection.remoteAddress.replace(/^.+:/, '') }));

        return;
      }

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
