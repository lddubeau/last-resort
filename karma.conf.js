/* global module require */
/* eslint-env node */

"use strict";

const thisPackage = require("./package");

// Minimal localConfig if there is not one locally.
let localConfig = {
  browserStack: {},
};
try {
  // eslint-disable-next-line import/no-unresolved, global-require
  localConfig = require("./local_config");
}
catch (ex) {} // eslint-disable-line no-empty

module.exports = function karmaConfig(config) {
  const options = {
    basePath: "",
    frameworks: ["requirejs", "mocha", "chai-as-promised", "chai", "sinon"],
    client: {
      mocha: {
        asyncOnly: true,
        grep: config.grep,
      },
    },
    files: [
      "test/karma-main.js",
      "node_modules/babel-polyfill/dist/polyfill.js",
      { pattern: "build/dist/last-resort.js", included: false },
      { pattern: "test/frame.html", included: false },
      { pattern: "test/!(karma-main).js", included: false },
      {
        pattern: "node_modules/bluebird/js/browser/bluebird.js",
        included: false,
      },
    ],
    exclude: [],
    preprocessors: {
      "test/**/!(karma-main|frame_script|worker).js": ["babelModule"],
      "test/@(karma-main|frame_script|worker).js": ["babel"],
    },
    customPreprocessors: {
      babelModule: {
        base: "babel",
        options: {
          plugins: ["transform-es2015-modules-amd"],
        },
      },
    },
    babelPreprocessor: {
      options: {
        presets: ["es2015"],
        sourceMap: "inline",
      },
      filename: function filename(file) {
        return file.originalPath.replace(/\.js$/, ".es5.js");
      },
      sourceFileName: function sourceFileName(file) {
        return file.originalPath;
      },
    },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadless", "FirefoxHeadless"],
    browserStack: {
      project: thisPackage.name,
    },
    customLaunchers: {
      ChromeWin: {
        base: "BrowserStack",
        browser: "Chrome",
        os: "Windows",
        os_version: "10",
      },
      FirefoxWin: {
        base: "BrowserStack",
        browser: "Firefox",
        os: "Windows",
        os_version: "10",
      },
      IE11: {
        base: "BrowserStack",
        browser: "IE",
        browser_version: "11",
        os: "Windows",
        os_version: "10",
      },
      IE10: {
        base: "BrowserStack",
        browser: "IE",
        browser_version: "10",
        os: "Windows",
        os_version: "8",
      },
      IE9: {
        base: "BrowserStack",
        browser: "IE",
        browser_version: "9",
        os: "Windows",
        os_version: "7",
      },
      Edge: {
        base: "BrowserStack",
        browser: "Edge",
        os: "Windows",
        os_version: "10",
      },
      Opera: {
        base: "BrowserStack",
        browser: "Opera",
        os: "Windows",
        os_version: "10",
      },
      SafariElCapitan: {
        base: "BrowserStack",
        browser: "Safari",
        os: "OS X",
        os_version: "El Capitan",
      },
      SafariYosemite: {
        base: "BrowserStack",
        browser: "Safari",
        os: "OS X",
        os_version: "Yosemite",
      },
      SafariMavericks: {
        base: "BrowserStack",
        browser: "Safari",
        os: "OS X",
        os_version: "Mavericks",
      },
      //
      // Tunnel seems to fail on all nexus devices.
      //
      // Android5: {
      //   base: "BrowserStack",
      //   browser: "android",
      //   os: "android",
      //   device: "Google Nexus 6",
      //   os_version: "5.0",
      // },
      //
      Android4_4: {
        base: "BrowserStack",
        browser: "android",
        os: "android",
        device: "Samsung Galaxy Tab 4 10.1",
        os_version: "4.4",
      },
      iOS9_3: {
        base: "BrowserStack",
        browser: "iOS",
        os: "iOS",
        device: "iPhone 6S",
        os_version: "9.3",
      },
      iOS5: {
        base: "BrowserStack",
        browser: "iOS",
        os: "iOS",
        device: "iPhone 5",
        os_version: "6.0",
      },
      //
      // Fails on this platform, in workers. It is unclear why. Could just as
      // well being iSO 5.1 that is unable to pass errors properly to an onerror
      // handler set in a worker.
      //
      // iPhone4S: {
      //   base: "BrowserStack",
      //   browser: "iOS",
      //   os: "iOS",
      //   device: "iPhone 4S",
      //   os_version: "5.1",
      // },
      //
      // Karma cannot connect on this platform...
      //
      // iPhone4: {
      //   base: "BrowserStack",
      //   browser: "iOS",
      //   os: "iOS",
      //   device: "iPhone 4",
      //   os_version: "4.0",
      // },
      //
      // Tunnel seems to fail on this device.
      //
      // WindowsPhone8_1: {
      //   base: "BrowserStack",
      //   browser: "winphone",
      //   os: "winphone",
      //   device: "Nokia Lumia 520",
      //   os_version: "8.1",
      // },
    },
    singleRun: false,
    concurrency: 2,
  };

  // Merge the browserStack configuration we got with the base values in our
  // config.
  Object.assign(options.browserStack, localConfig.browserStack);

  const { browsers } = config;
  if (browsers.length === 1 && browsers[0] === "all") {
    const newList = options.browsers.concat(Object.keys(options.customLaunchers));

    // Yes, we must modify this array in place.
    // eslint-disable-next-line prefer-spread
    browsers.splice.apply(browsers, [0, browsers.length].concat(newList));
  }

  const found = browsers.some((x) => {
    const custom = options.customLaunchers[x];
    return custom && custom.base === "BrowserStack";
  });

  if (found) {
    options.captureTimeout = 3e5;
    options.browserNoActivityTimeout = 3e5;
    options.browserDisconnectTimeout = 3e5;
    options.browserDisconnectTolerance = 3;
    options.client.slow = true;
  }

  config.set(options);
};
