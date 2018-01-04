const { promisify } = require("util");

module.exports = {
  promisify,
  promisifyAll: m =>
    m.entries(([key, value]) => [
      key,
      typeof value === "function" ? promisify(value) : value
    ])
};
