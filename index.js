// Configurable flat file database

const findUp = require("find-up");
const { promiseFiles } = require("node-dir");
const tryGet = require("try-get");
const fs = require("fs");

module.exports = rootPath => {
  let blockers = [];
  const setup = async () => {
    await Promise.all(blockers);
    const filePaths = await promiseFiles(rootPath);
    const folderStructure = {};
    filePaths.forEach(path => {
      const relPath = path.slice(rootPath.length + 1);
      const components = relPath.split("/");
      const lastComponent = components.pop();
      if (lastComponent.indexOf(".js") === -1) return;
      const lastDirObj = components.reduce((acc, component) => {
        acc[component] = acc[component] || {};
        return acc[component];
      }, folderStructure);
      try {
        const fileContents = {
          __filePath: path,
          ...require(path)
        };
        lastDirObj[lastComponent.split(".")[0]] = fileContents;
      } catch (error) {
        console.error(error);
        folderStructure.errors = folderStructure.errors || [];
        folderStructure.errors.push({ path, error });
      }
    });
    return folderStructure;
  };
  const db = {
    async get(path) {
      const folderStructure = await setup();
      return tryGet(folderStructure, path);
    },
    async set(path, value) {
      const folderStructure = await setup();
      const components = path.split(".");
      let ref = folderStructure;
      let fileData;
      components.forEach((component, i) => {
        if (!fileData && Object.keys(ref).includes("__filePath")) {
          fileData = ref;
        }
        if (components.length - 1 === i) {
          ref[component] = value;
        } else {
          if (ref[component] === undefined) {
            ref[component] = {};
          }
          ref = ref[component];
        }
      });
      const filePath = fileData.__filePath;
      const relPath = filePath.slice(rootPath.length + 1);
      const toRoot = relPath.split("/").reduce((acc, cur) => acc + "../", "");
      delete fileData.__filePath;
      const serialized = JSON.stringify(fileData, null, 2);
      const output = `const { link } = require("json-fs-db")("${toRoot}");
module.exports = ${serialized
        .replace('"$$json-fs-db$$', 'link("')
        .replace('$$json-fs-db$$"', '")')};`;
      fs.writeFileSync(filePath, output);
      fileData.__filePath = filePath;
    },
    link(path) {
      const result = {};
      blockers.push(
        db.get(path).then(data => {
          Object.assign(result, data);
        })
      );
      result.toJSON = () => `$$json-fs-db$$${path}$$json-fs-db$$`;
      return result;
    }
  };
  return db;
};
