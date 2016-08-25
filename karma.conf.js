/* global module require */
/* eslint-env node */
"use strict";
var _ = require("lodash");
var thisPackage = require("./package");

// Minimal localConfig if there is not one locally.
var localConfig = {
  browserStack: {},
};
try {
  // eslint-disable-next-line import/no-unresolved, global-require
  localConfig = require("./local_config");
}
catch (ex) {} // eslint-disable-line no-empty

module.exports = function karmaConfig(config) {
  var options = {
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
      { pattern: "src/last-resort.ts", included: false },
      { pattern: "test/frame.html", included: false },
      { pattern: "test/!(karma-main).js", included: false },
      { pattern: "node_modules/bluebird/js/browser/bluebird.js",
      included: false },
    ],
    exclude: [],
    preprocessors: {
      "test/**/!(karma-main|frame_script|worker).js": ["babelModule"],
      "test/@(karma-main|frame_script|worker).js": ["babel"],
      "src/last-resort.ts": ["typescript", "wrap"],
    },
    wrapPreprocessor: {
      file: "src/wrap.js",
      options: {
        interpolate: /\/\*\s*<%=([\s\S]+?)%>\s*\*\//,
      },
    },
    typescriptPreprocessor: {
      tsconfigPath: "./tsconfig.json",
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
    browsers: ["Chrome", "Firefox"],
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

  // Bring in the options from the localConfig file.
  _.merge(options.browserStack, localConfig.browserStack);

  var browsers = config.browsers;
  if (browsers.length === 1 && browsers[0] === "all") {
    var newList = options.browsers.concat(Object.keys(options.customLaunchers));

    // Yes, we must modify this array in place.
    browsers.splice.apply(browsers, [0, browsers.length].concat(newList));
  }

  var found = _.find(browsers, function find(x) {
    var custom = options.customLaunchers[x];
    return custom && custom.base === "BrowserStack";
  });

  var remote = found !== undefined;
  if (remote) {
    _.merge(options, {
      captureTimeout: 3e5,
      browserNoActivityTimeout: 3e5,
      browserDisconnectTimeout: 3e5,
      browserDisconnectTolerance: 3,
    });

    options.client.slow = true;
  }

  config.set(options);
};
