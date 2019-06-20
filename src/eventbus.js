function EventBus(name = 'anonymous', debug = function () {}, listenerConfigs = {}) {
  // this.name = `event bus (${name})`;
  // this.debug = debug;
  // this.listenerConfigs = initialConfigs;
  Object.assign(this, {name: `event bus (${name})`, debug, listenerConfigs});
}

Object.assign(EventBus.prototype, {
  cleanupEvent: function (event) {
    const {name, debug, listenerConfigs} = this;
    if (listenerConfigs[event].length === 0) {
      debug(name, 'removing all listeners for', event);
      delete listenerConfigs[event];
    }
  },
  subscribe: function (event, listener, once = false) {
    const {name, debug, listenerConfigs} = this;
    const eventConfigs = listenerConfigs[event] = (listenerConfigs[event] || []);
    const listenerName = listener.name || '(anonymous)';

    // We will manage at most one instance of a given listener for any event
    let listenerCfg = eventConfigs.find(function listenerFound({callback}) {
      return callback === listener;
    });
    if (!listenerCfg) {
      debug('%s for event "%s" adding listener %s', name, event, listenerName);
      listenerCfg = {once, date: new Date(), callback: listener};
      eventConfigs.push(listenerCfg);
    } else {
      debug('%s listener %s already subscribed to event "%s"', name, listenerName, event);
    }
  },
  fire: function (event, ...listenerArgs) {
    const {name, debug, listenerConfigs} = this;
    if (Object.keys(listenerConfigs).includes(event)) {
      const eventConfigs = listenerConfigs[event];
      debug('%s firing event "%s" to %d listener(s)', name, event, eventConfigs.length);
      eventConfigs.forEach(function executeCallback({callback}) {
        debug('%s notifying listener %s of event "%s"', name, callback.name || '(anonymous)', event);
        callback(...listenerArgs);
      });
      // Remove those listeners that were configured to run only once
      listenerConfigs[event] = eventConfigs.filter(function listenersThatRunMoreThanOnce({once}) {
        return !once;
      });
      this.cleanupEvent(event);
    }
  }
});

export default EventBus;