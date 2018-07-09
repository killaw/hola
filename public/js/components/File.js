import Component from './Component.js';

class File extends Component {
  constructor (props) {
    super(props);
  }

  initState () {
    this.state = {
      id: undefined,
      href: undefined
    };
  }

  render () {
    let wrapper = document.createElement('div'),
        icon = document.createElement('img'),
        div = document.createElement('div');

    wrapper.classList.add('box', 'horizontal');
    wrapper.appendChild(icon);
    wrapper.appendChild(div);

    wrapper.style.cursor = 'pointer';
    wrapper.title = 'Нажмите, чтобы скачать';

    div.style.alignSelf = 'center';
    div.style.fontSize = '1.5em';
    div.textContent = this.props.title;

    icon.src = this.props.icon || 'img/img003.png';
    icon.style.maxWidth = '100px';
    icon.style.backgroundColor = this.props.iconBGColor || 'coral';

    this.element = wrapper;
  }

  set href (href) {
    if (href === this.state.href)
      return;
    this.state.href = href;
  }

  events () {
    this.element.onclick = () => {
      this.element.style.boxShadow = '0px 0px 10px rgba(62, 181, 252, 1)';
      setTimeout(() => this.element.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)', 1000);
      window.location = this.state.href;
    };
  }
}

export default File;
