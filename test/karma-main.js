/* global require */

const allTestFiles = [];
const TEST_REGEXP = /test\/(?!karma-main|worker|frame_script).*\.js$/i;

Object.keys(window.__karma__.files).forEach((file) => {
  if (TEST_REGEXP.test(file)) {
    const normalizedTestModule = file.replace(/^\/base\/|\.js$/g, "");
    allTestFiles.push(normalizedTestModule);
  }
});

require.config({
  baseUrl: "/base",
  paths: {
    bluebird: "node_modules/bluebird/js/browser/bluebird",
    "last-resort": "build/dist/last-resort",
  },
});

// eslint-disable-next-line import/no-amd, import/no-dynamic-require
require(["bluebird"], (bluebird) => {
  bluebird.Promise.config({
    warnings: true,
    longStackTraces: true,
  });

  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(allTestFiles, window.__karma__.start);
});
