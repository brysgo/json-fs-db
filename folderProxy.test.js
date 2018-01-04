const folderProxy = require("./folderProxy");

test("is like an object, but for folders", async () => {
  const topFolder = folderProxy("./fixtures");
  expect(topFolder.blah.__path).toBe("fixtures/blah");
  expect(topFolder.blah.again.__path).toBe("fixtures/blah/again");
  expect(topFolder.baz).toBe(undefined);
})
