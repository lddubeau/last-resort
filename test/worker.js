self.importScripts("/base/node_modules/bluebird/js/browser/bluebird.js",
                   "/base/src/last-resort.js");

/* global LastResort */
const oe = LastResort.install(self);
oe.register(() => {
  self.postMessage("done");
  self.close();
});

self.onmessage = function onmessage(ev) {
  if (ev.data === "throw") {
    throw new Error("worker failed");
  }

  if (ev.data === "reject") {
    Promise.reject(new Error("rejected"));
  }
};
