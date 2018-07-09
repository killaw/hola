import Component from './Component.js';
import {get} from '../utils/get.js';

class Yourip extends Component {
  constructor (props) {
    super(props);
  }

  initState () {
    this.state = {
      id: undefined,
      ip: undefined
    };
  }

  render () {
    let wrapper = document.createElement('div'),
        icon = document.createElement('img'),
        div = document.createElement('div'),
        title = document.createElement('span'),
        ip = document.createElement('span');

    wrapper.classList.add('box', 'horizontal');
    wrapper.appendChild(icon);
    div.appendChild(title);
    this.children.ip = div.appendChild(ip);
    wrapper.appendChild(div);

    wrapper.style.cursor = 'pointer';
    wrapper.title = 'Нажмите, чтобы скопировать в буфер обмена';

    title.style.display = 'block';
    title.style.color = '#808080';
    title.style.fontSize = '1.5em';
    title.textContent = 'Ваш IP-адрес:';

    div.style.alignSelf = 'center';

    get('/myip', (response) => {
      ip.textContent = this.state.ip = response.ip;
    });
    ip.style.fontSize = '1.5em';

    icon.src = 'img/img001.png';
    icon.style.maxWidth = '100px';
    icon.style.backgroundColor = 'coral';

    this.element = wrapper;
  }

  events () {
    this.element.onclick = () => {
      this.element.style.boxShadow = '0px 0px 10px rgba(255, 127, 80, 1)';
      setTimeout(() => this.element.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)', 200);
      const selection = window.getSelection();
      const range = document.createRange();

      range.selectNodeContents(this.children.ip);
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        document.execCommand('copy');
        selection.removeAllRanges();
      } catch(err) {
        console.log('Somthing went wrong', err);
      }
    };
  }
}

export default Yourip;
