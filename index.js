// Configurable flat file database

const findUp = require("find-up");
const { promiseFiles } = require("node-dir");
const tryGet = require("try-get");
const fs = require("fs");
const serialize = require("serialize-javascript");

module.exports = rootPath => {
  const setup = async () => {
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
        folderStructure.errors = folderStructure.errors || [];
        folderStructure.errors.push({ path, error });
      }
    });
    return folderStructure;
  };
  return {
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
          if (!ref[component]) {
            ref[component] = {};
          }
          ref = ref[component];
        }
      });
      const filePath = fileData.__filePath;
      delete fileData.__filePath;
      fs.writeFileSync(filePath, `module.exports = ${serialize(fileData, {space: 2})};`);
      fileData.__filePath = filePath;
    },
    async link(path) {}
  };
};
