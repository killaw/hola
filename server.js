'use strict';

const normalizeRequest = require('./normalize-request'),
      config = require('config'),
      del = require('./delete'),
      post = require('./post'),
      https = require('https'),
      get = require('./get'),
      url = require('url'),
      fs = require('fs');

let httpsOptions = {
  cert: fs.readFileSync(config.get('app:cert')),
  key: fs.readFileSync(config.get('app:key')),
  /*
    To use Perfect Forward Secrecy using DHE with the tls module,
    it is required to generate Diffie-Hellman parameters and specify them with
    the dhparam option to tls.createSecureContext(). The following illustrates
    the use of the OpenSSL command-line interface to generate such parameters:
      openssl dhparam -outform PEM -out dhparam.pem 2048
    If using Perfect Forward Secrecy using ECDHE, Diffie-Hellman parameters are not required
    and a default ECDHE curve will be used. The ecdhCurve property can be used
    when creating a TLS Server to specify the list of names of supported curves to use
  */
  dhparam: fs.readFileSync(config.get('app:dhparam')),
  ciphers: [
    // DHE-RSA-AES128-SHA1 is a cipher spec that uses Diffie-Hellman to generate the key, RSA for authentication, AES-128 for encryption, and SHA1 for digests
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-SHA256',
    'DHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'DHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES256-SHA256',
    'DHE-RSA-AES256-SHA256',
    'DHE-RSA-AES128-SHA',
    'DHE-RSA-AES256-SHA',
    'HIGH',
    '!AES256-GCM-SHA384',
    '!AES128-GCM-SHA256',
    '!AES256-SHA256',
    '!AES128-SHA256',
    '!AES128-SHA',
    '!AES256-SHA',
    '!aNULL',
    '!eNULL',
    '!EXPORT',
    '!DES',
    '!RC4',
    '!MD5',
    '!PSK',
    '!SRP',
    '!CAMELLIA'
  ].join(':'),
  honorCipherOrder: true
};

// let tlsSessionStore = {};

module.exports = https.createServer(httpsOptions, function(req, res) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'); //https://ru.wikipedia.org/wiki/HSTS

  for (let pattern of config.get('misc:hackers'))
    if (~req.url.toLowerCase().indexOf(pattern)) {
      fs.appendFile(config.get('path:log'), `${(new Date).toLocaleString()} Client with ip address ${req.connection.remoteAddress} requested suspicious url: ${req.url}\r\n`, (err) => err);
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
https://github.com/nodejs/node/issues/3132
https://strongloop.com/strongblog/improve-the-performance-of-the-node-js-https-server/
.on('newSession', function(id, data, cb) {
  tlsSessionStore[id.toString('hex')] = data;
  cb();
})
.on('resumeSession', function(id, cb) {
  cb(null, tlsSessionStore[id.toString('hex')] || null);
});
*/
/*
  res.on('error')
  как бы никакие проблемы сетевого соединения не вызовут error
  Оно может произойти только если мы например попробуем что-то записать в res
  уже после закрытия соединения. Т.е. это не ошибка рантайма.
*/
