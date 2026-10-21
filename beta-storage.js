// GitHub project sites share an origin. Keep beta progress off production keys.
(() => {
  const prefix = 'crownfall-beta-journey-';
  const proto = Storage.prototype;
  const get = proto.getItem, set = proto.setItem, remove = proto.removeItem;
  const clear = proto.clear, key = proto.key;
  let local;
  try { local = window.localStorage; } catch { return; }
  const scoped = (storage, name) => storage === local ? prefix + String(name) : name;
  proto.getItem = function(name) { return get.call(this, scoped(this, name)); };
  proto.setItem = function(name, value) { return set.call(this, scoped(this, name), value); };
  proto.removeItem = function(name) { return remove.call(this, scoped(this, name)); };
  proto.clear = function() {
    if (this !== local) return clear.call(this);
    for (let i = this.length - 1; i >= 0; i--) {
      const name = key.call(this, i);
      if (name && name.startsWith(prefix)) remove.call(this, name);
    }
  };
})();
