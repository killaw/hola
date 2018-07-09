class EventEmitter {
  constructor () {
    this.subscriptions = {};
  }

  on (event, cb) {
    this.subscriptions[event] = this.subscriptions[event] || [];
    this.subscriptions[event].push(cb);
  }

  emit (event, data) {
    if (this.subscriptions[event]) {
      for (let cb of this.subscriptions[event])
        if (cb(data, this) === false)
          return false;
    }
      // this.subscriptions[event].forEach((cb) => cb(data, this));
  }
}

export default EventEmitter;
