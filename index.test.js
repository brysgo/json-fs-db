const path = require("path");
const fs = require("fs");

const { get, set, link } = require("./")(path.resolve("./fixtures"));

test("getting simple attribute from json", async () => {
  expect(await get("foo.stuff")).toBe("things");
});

test("getting an attribute that lives in a file in a folder", async () => {
  expect(await get("blah.baz.nested.simple")).toBe("object");
});

test("setting an attribute in a json file", async () => {
  expect(await get("blah.baz.nested.justSet")).toBe(undefined);
  await set("blah.baz.nested.justSet", "to something");
  expect(await get("blah.baz.nested.justSet")).toBe("to something");
  await set("blah.baz.nested.justSet", undefined);
  expect(await get("blah.baz.nested.justSet")).toBe(undefined);
  expect(fs.readFileSync("./fixtures/blah/baz.js").toString('utf8')).toMatchSnapshot();
});

test("relational links between models", async () => {
  expect(await get("foo.bar.testLink")).toBe(undefined);
  await set("foo.bar.testLink", link("blah.baz"));
  expect(await get("foo.bar.testLink.confirmed")).toBe("here it is");
  await set("foo.bar.testLink", undefined);
  expect(await get("foo.bar.testLink")).toBe(undefined);
});
