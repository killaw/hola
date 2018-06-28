const path = require('path');

const normalizeRequest = function (pathname, res, cb) {
  const fn = function () {
    let rootFolder = path.join(__dirname, 'public');

    const sendResponse = function (statusCode, message) {
      res.statusCode = statusCode;
      res.end(message);
    };

    /*
      Декодирование url. Если decodeURIComponent не сможет его декодировать, то
      это значит, что он закодирован неверно. Поэтому вернем 400 Bad request
    */
    try {
      pathname = decodeURIComponent(pathname);
    } catch (e) {
      return sendResponse(400, 'Bad request');
    }

    /*
      Проверка на нулевой байт. Его не должно быть в запросе. Если есть - значит
      его кто-то передал намерено. Есть функции Node.js, который будут работать
      с ним чуть-чуть не корректно
    */
    if (~pathname.indexOf('\0'))
      return sendResponse(400, 'Bad request');

    /*
      path.normalize убирает из пути различные . .. /\
      path.join прилепляет к пути рутовую директорию для файлов, чтобы node дальше
      знал абсолютный путь к запрашиваемому файлу
    */
    pathname = path.normalize(path.join(rootFolder, pathname));

    /*
      На мой взгляд это дополнительная проверка, что действительно в pathname в начале
      стоит пусть к rootFolder
    */
    if (pathname.indexOf(rootFolder) !== 0)
      return sendResponse(404, 'File not found');

    cb(pathname);
  };

  setImmediate(fn);
};

module.exports = normalizeRequest;
