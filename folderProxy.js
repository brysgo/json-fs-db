const { join, resolve } = require("path");
const { existsSync, readdirSync, lstatSync } = require("fs");
const folderProxy = path => (
  new Proxy(
    {},
    {
      get: function(target, key) {
        if (key === "__path") return path;
        if (typeof key !== "string" || !this.has(target, key)) return target[key];
        const targetPath = join(path, key);
        const stats = lstatSync(targetPath);
        if (stats.isDirectory()) {
          return folderProxy(targetPath);
        } else {
          return jsonProxy(targetPath);
        }
      },
      set: () => {},
      has: function(target, key) {
        return existsSync(join(path, key));
      },
      ownKeys: function(target) {
        return readdirSync(path);
      },
      deleteProperty: function(target, key) {},
      defineProperty: () => {}
    }
  ));

module.exports = folderProxy;
