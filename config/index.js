const config = require('nconf'),
      path = require('path');

if (process.env.NODE_ENV == 'DEV') {
  config.argv().env().file('dev', __dirname + '/dev-config.json').file('prod', __dirname + '/config.json');
  config.set('path:log', path.join(__dirname, '../log.txt'));
} else {
  config.argv().env().file({file: __dirname + '/config.json'});
}

config.set('path:public', path.join(__dirname, '../public/'));
config.set('path:files', path.join(__dirname, '../files/'));

module.exports = config;
