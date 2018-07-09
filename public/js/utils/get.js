export const get = function (url, cb) {
  let xhr = new XMLHttpRequest();

  xhr.open('GET', url);
  xhr.setRequestHeader('Content-Type', 'text/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4)
      return;
    if (xhr.status !== 200) {
      return console.log(xhr.statusText);
    }

    try {
      cb(JSON.parse(xhr.responseText));
    } catch (err) {
      console.log(err);
    }
  };

  xhr.send();
};
