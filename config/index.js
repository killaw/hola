const config = require('nconf'),
      path = require('path');

config.argv().env().file({file: __dirname + '/config.json'});

if (process.env.NODE_ENV == 'DEV') {
  config.set('app:port', 3000);
  config.set('path:log', path.join(__dirname, '../log.txt'));
}

config.set('path:public', path.join(__dirname, '../public/'));
config.set('path:files', path.join(__dirname, '../files/'));

module.exports = config;
