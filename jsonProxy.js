const { readFileSync, writeFileSync } = require("fs");
const tryGet = require("try-get");

const jsonProxy = (filePath, keyPath) =>
  new Proxy(
    {},
    {
      get: function(target, key) {
        const newKey = [keyPath, key].filter(k => k).join(".");
        const result = tryGet(require(filePath), newKey);
        if (typeof result === "object") {
          return jsonProxy(filePath, newKey);
        } else {
          return result;
        }
      },
      set: function(target, key, value) {
        const toRoot = filePath.split("/").reduce((acc, cur) => acc + "../", "");
        const fileContents = require(filePath);
        tryGet(fileContents, keyPath)[key] = value;
        const serialized = JSON.stringify(fileContents, null, 2);
        const output = `const { link } = require("json-fs-db")("${toRoot}");
module.exports = ${serialized
          .replace('"$$json-fs-db$$', 'link("')
          .replace('$$json-fs-db$$"', '")')};`;
        writeFileSync((filePath.includes(".js")) ? filePath : filePath + ".js", output);
      }
    }
  );

module.exports = jsonProxy;
