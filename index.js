const server = require('./server'),
      config = require('./config/index'),
      httpServer = require('redirect-to-https');

httpServer.listen(8080);
server.listen(config.get('app:port'));
