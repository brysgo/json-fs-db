# JSON FS DB

Database split between folders and json files.

By introspecting on folder structure, JSON FS DB stores information where you
wanted it to go, crossing the boundary between filesystem and JSON.

## Usage

See [OpenSourceOutdoors/OpenSourceOutdoors](https://github.com/OpenSourceOutdoors/OpenSourceOutdoors) for an example of usage.

1. Basically, start by building a folder heirarchy that makes sense for your data.
2. Put empty js files where you want files of data to be stored.
3. Now you can `get`, `set`, and `link` your data with the API.

First require the lib and tell it your root:

    const { get, set, link } = require("json-fs-db")("./data");

Pretend this is your folder structure:

    data/
    ├── one/
    │   ├── red.js
    └── two/
        ├── fish/
        │   └── eggs.js
        └── blue/
            └── green.js

Now, say you wanted to add a key called `ham` with the value `yum` to `eggs.js`.

    await set("two.fish.eggs.ham", "yum");

That was easy, but what if you want to nest something in `green.js`.

    await set("two.blue.green.something.nested.deep", "okay");

Yeah, whatever, just saving things to a file, what if you want to link something in `red.js` to something in `green.js`.

    await set("one.red.something", link("two.blue.green.something"));

Now how do I get the value of something nested deep in red?

    const result = await get("one.red.something.nested.deep");

    console.log(result); // prints "okay" 

## What it isn't

This is not a database that you would want to build and scale an app on.

## Why?

I want to manage data in a curated/decentralized way that uses github to manage
the source of truth. I would just write the data manually, but I would rather
be able to manipulate this data programmatically to make my life easier. This
database will make it easy to manage my data while still structuring the files
in a way that makes sense to me.


