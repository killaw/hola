const server = require('./server'),
      config = require('./config/index'),
      httpServer = require('redirect-to-https');

httpServer.listen(80);
server.listen(config.get('app:port'));
