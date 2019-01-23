// Configurable flat file database

const findUp = require("find-up");
const tryGet = require("try-get");
const fs = require("fs");
const walk = require("walk");

const customWalker = (path) =>
  new Promise(resolve => {
    var files = [];

    // Walker options
    var walker = walk.walk(path, { followLinks: false });

    walker.on("file", function(root, stat, next) {
      // Add this file to the list of files
      files.push(root + "/" + stat.name);
      next();
    });

    walker.on("end", function() {
      resolve(files);
    });
  });

module.exports = (rootPath, options={}) => {
  let blockers = [];
  const setup = async () => {
    await Promise.all(blockers);
    const filePaths = await customWalker(rootPath);
    const folderStructure = {};
    filePaths.forEach(path => {
      if (options.exclude && options.exlude.some(regex => path.match(regex)))
        return;
      const relPath = path.slice(rootPath.length + 1);
      const components = relPath.split("/");
      const lastComponent = components.pop();
      const lastDirObj = components.reduce((acc, component) => {
        acc[component] = acc[component] || {};
        return acc[component];
      }, folderStructure);
      if (lastComponent.indexOf(".js") === -1) return;
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
      let currentPath = rootPath;
      let fileData;
      components.forEach((component, i) => {
        currentPath = [currentPath, component].join("/");
        if (!fileData) {
          if (Object.keys(ref).includes("__filePath")) {
            fileData = ref;
          } else if (
            ref[component] &&
            Object.keys(ref[component]).includes("__filePath")
          ) {
            fileData = ref[component];
          }
          if (!ref[component]) {
            ref[component] = { __filePath: currentPath + ".js" };
            fileData = ref[component];
          }
        }
        if (components.length - 1 === i) {
          if (typeof ref[component] === "object" && typeof value === "object") {
            Object.assign(ref[component], value);
          } else {
            ref[component] = value;
          }
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
