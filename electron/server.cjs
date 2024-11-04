const next = require("next");
const path = require("path");
const dotenv = require("dotenv");
const nextBuild = require("next/dist/build/index.js");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const start = async () => {
  if (process.env.NEXT_BUILD) {
    app.listen(PORT, async () => {
      console.log(`Next.js is now building...`);
      // @ts-expect-error
      await nextBuild(path.join(__dirname, ".."));
      process.exit();
    });

    return;
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== "production",
  });

  const nextHandler = nextApp.getRequestHandler();

  app.use((req, res) => nextHandler(req, res));

  nextApp.prepare().then(() => {
    console.log("Next.js started");

    app.listen(PORT, async () => {
      console.log(`Next.js App URL: http://localhost:3000`);
    });
  });
};

start();
