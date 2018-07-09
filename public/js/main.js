import Yourip from './components/Yourip.js';
import File from './components/File.js';

window.onload = function () {
  let mainWrapper = document.getElementById('main-wrapper');

  mainWrapper.appendChild((new Yourip()).element);
  mainWrapper.appendChild((new File({ icon: 'img/img002.png', title: 'Скачать TeamViewer QS', iconBGColor: '#3eb5fd', href: '/TeamViewerQS.exe' })).element);
};
