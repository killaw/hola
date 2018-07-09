import EventEmitter from './EventEmitter.js';

class Component extends EventEmitter {
  constructor (props = {}) {
    super();
    this.props = props;
    this.view = {};
    this.children = {};
    if (props.parent)
      this.parent = props.parent;
    this.eventListeners();
    if (props.on)
      for (let event in props.on)
        this.on(event, props.on[event]);
    this.initState();
    if (!props.id)
      this.id = Symbol();
    this.render(props);
    this.events(props);
    this.setState(props);
    if (props.parent) {
      props.parent.children[this.id] = this;
      props.parent.view[this.id] = this.element;
    }

    this.update();
  }

  eventListeners () {
    return null;
  }

  initState () {
    this.state = {};
  }

  render () {
    return null;
  }

  setState (newState) {
    for (let prop in newState) {
      if (isSetter(prop, this))
        this[prop] = newState[prop];
    }
  }

  set id (id) {
    this.state.id = id;
  }

  get id () {
    return this.state.id;
  }

  events () {
    return null;
  }

  update () {
    return null;
  }

  isChanged () {
    return this.state.value !== this.state.initialValue;
  }

  destroy () {
    this.element.remove();
    for (let child of [...Object.keys(this.children), ...Object.getOwnPropertySymbols(this.children)])
      this.children[child].destroy();
    if (this.parent) {
      delete this.parent.children[this.id];
      delete this.parent.view[this.id];
    }

    this.emit('destroy');
  }
}

const isSetter = function isSetter (prop, obj) {
  if (Object.getOwnPropertyDescriptor(obj, prop) && Object.getOwnPropertyDescriptor(obj, prop).set)
    return true;
  let prototype = Object.getPrototypeOf(obj);

  if (prototype === null)
    return false;

  return isSetter(prop, prototype);
};

export default Component;
