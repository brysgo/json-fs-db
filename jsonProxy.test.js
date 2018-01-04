const jsonProxy = require("./jsonProxy");

test("loads a root key from a json file", async () => {
  const jsonFile = jsonProxy("./fixtures/foo");
  expect(jsonFile.stuff).toBe("things");
})

test("loads a nested key from a json file", async () => {
  const jsonFile = jsonProxy("./fixtures/foo");
  expect(jsonFile.bar.aNestedKey).toBe("here");
})

test("sets a key on a json file", async () => {
  const jsonFile = jsonProxy("./fixtures/foo");
  jsonFile.bar.somethingElse = "set this in the test";
  expect(jsonFile.bar.somethingElse).toBe("set this in the test");
  jsonFile.bar.somethingElse = "changed this!";
  const jsonFile2 = jsonProxy("./fixtures/foo");
  expect(jsonFile2.bar.somethingElse).toBe("changed this!");
})
