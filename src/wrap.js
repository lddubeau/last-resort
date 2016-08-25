/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Louis-Dominique Dubeau
 */
/* global define module require Promise */
(function boot(root, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) {
    define(["module", "exports"], function stub(module, exports) {
      if (root.LastResort) {
        module.exports = root.LastResort;
        return;
      }

      factory(exports);
    });
  }
  else if (typeof module === "object" && module.exports) {
    if (root.LastResort) {
      module.exports = root.LastResort;
      return;
    }

    factory(module.exports);
  }
  else {
    var exports = root.LastResort = {};
    factory(exports);
  }
}(this, function factory(exports) {
  "use strict";
/* <%= contents %> */
}));
