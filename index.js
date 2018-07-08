const server = require('./server'),
      config = require('./config/index');

server.listen(config.get('app:port'));
