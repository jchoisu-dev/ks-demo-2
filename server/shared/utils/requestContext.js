const { AsyncLocalStorage } = require("async_hooks");
const storage = new AsyncLocalStorage();
const run = (context, callback) => storage.run({ ...context, entries: new Map() }, callback);
const get = () => storage.getStore() || null;
module.exports = {
  run,
  get
}
