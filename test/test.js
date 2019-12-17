/* global chai beforeEach before afterEach sinon describe it
   __karma__ mocha */
/* eslint-disable import/no-unresolved */
import require from "require";
import * as lr from "last-resort";
import Promise from "bluebird";

window.Promise = Promise;

let frame;
let frameWindow;
const { assert } = chai;

const agent = navigator.userAgent;
// const CHROME = agent.indexOf(" Chrome/") !== -1 &&
//         // Edge also contains Chrome/
//         agent.indexOf(" Edge/") === -1;
const IE9 = agent.indexOf("; MSIE 9.0;") !== -1;
const ANDROID_4_0_TO_4_3 = agent.search(/ Android 4.[0-3][^\d]/) !== -1;


if (__karma__.config.slow) {
  // eslint-disable-next-line no-console
  console.log("Increasing timeout!");
  mocha.timeout(5000);
}

beforeEach((done) => {
  frame = document.createElement("iframe");
  frame.id = "test";
  // We tried to load this through a Blob. However, using the Blob prevented the
  // script load events from being generated in loadInFrame.
  document.body.appendChild(frame);
  frameWindow = frame.contentWindow;
  const listener = () => {
    frame.removeEventListener("load", listener);
    done();
  };
  frame.addEventListener("load", listener);
  frame.src = "/base/test/frame.html";
});

afterEach(() => frame.parentNode.removeChild(frame));

function fail() {
  return new Promise((resolve) => {
    // This, on the other hand, we want on the main window. So mocha can trap
    // any errors that occur in the resolution...
    window.setTimeout(resolve, 50);

    frameWindow.trigger();
  });
}


function unhandledReject() {
  frameWindow.reject();
}

// We have to return something because we run with --async-only
const DONE = Promise.resolve();

describe("install", () => {
  it("throws if called twice on the same window without force", () => {
    lr.install(frameWindow);
    assert.throws(
      lr.install.bind(undefined, frameWindow),
      Error,
      /^trying to set onerror more than once on the same context.$/);
    return DONE;
  });

  it("does not throw if called twice on the same window with force", () => {
    lr.install(frameWindow);
    lr.install(frameWindow, { force: true });
    return DONE;
  });

  it("uninstalls the previous handlers if called again with force", () => {
    let onerror = lr.install(frameWindow, { force: true });
    const cb = sinon.spy();
    onerror.register(cb);

    const cb2 = sinon.spy();
    return fail().then(() => {
      assert.isTrue(cb.calledOnce,
                    "the initial callback should have been called once");

      // This removes the old handlers.
      onerror = lr.install(frameWindow, { force: true });
      onerror.register(cb2);
      return fail();
    }).then(() => {
      assert.isTrue(cb.calledOnce,
                    "the initial callback should not have been called again");
      assert.isTrue(cb2.calledOnce,
                    "the second callback should have been called once");
    });
  });
});

function loadInFrame(source) {
  const where = frameWindow.document.getElementsByTagName("head")[0];
  const script = where.ownerDocument.createElement("script");
  script.src = source;
  script.async = true;
  return new Promise((resolve, _reject) => {
    script.addEventListener("load", () => resolve());
    where.appendChild(script);
  });
}

function loadBluebirdInFrame() {
  return loadInFrame(`${require.toUrl("bluebird")}.js`);
}

// We cannot use the last-resort loaded in the main window for some
// tests because its state is not what we want, so we load it into the
// frame and test from that.
function loadLastResortInFrame() {
  return loadInFrame(require.toUrl(`${require.toUrl("last-resort")}.js`))
    .then(loadBluebirdInFrame);
}

function rjsLoadLastResortInFrame() {
  return loadInFrame("/base/node_modules/requirejs/require.js").then(() => {
    frameWindow.require.config({
      baseUrl: "/base",
      paths: {
        bluebird: "node_modules/bluebird/js/browser/bluebird",
        "last-resort": "build/dist/last-resort",
      },
    });
    return new Promise(
      resolve => frameWindow.require(["last-resort", "bluebird"],
                                     (lr_, bb) => {
                                       frameWindow.Promise = bb;
                                       resolve(lr_);
                                     }));
  });
}

describe("wasTriggered", () => {
  it("returns false when there has been no error",
     () => loadLastResortInFrame().then(() => {
       frameWindow.LastResort.install(frameWindow);
       assert.isFalse(frameWindow.LastResort.wasTriggered());
     }));

  it("returns true when there has been an error",
     () => loadLastResortInFrame().then(() => {
       frameWindow.LastResort.install(frameWindow);
       assert.isFalse(frameWindow.LastResort.wasTriggered());

       return fail();
     })
     .then(() => assert.isTrue(frameWindow.LastResort.wasTriggered())));

  it("returns true if there was an unhandled rejection",
     () => loadLastResortInFrame().then(() => {
       const onerror = frameWindow.LastResort.install(frameWindow);
       assert.isFalse(frameWindow.LastResort.wasTriggered());
       return new Promise((resolve) => {
         onerror.register((ev) => {
           ev.preventDefault();
           resolve(ev);
         });
         unhandledReject();
       });
     }).then(() => assert.isTrue(frameWindow.LastResort.wasTriggered())));
});

describe("isInstalled", () => {
  it("returns false when install has not been called on the window", () => {
    assert.isFalse(lr.isInstalled(frameWindow));
    return DONE;
  });

  it("returns true when install has been called on the window", () => {
    lr.install(frameWindow);
    assert.isTrue(lr.isInstalled(frameWindow));
    return DONE;
  });
});

describe("Last Resort", () => {
  it("loads through an AMD loader", () => {
    frameWindow.requirejs = {
      paths: {
        "last-resort": require.toUrl("last-resort"),
      },
    };

    return rjsLoadLastResortInFrame().then(assert.isDefined);
  });

  it("loads through `script` and then through an AMD loader", () => {
    frameWindow.requirejs = {
      paths: {
        "last-resort": require.toUrl("last-resort"),
      },
    };

    return loadLastResortInFrame().then(rjsLoadLastResortInFrame)
      .then((amdLr) => {
        assert.isDefined(amdLr);
        assert.equal(frameWindow.LastResort, amdLr);
      });
  });

  it("causes the registered function to be called", () => {
    const onerror = lr.install(frameWindow);
    const cb = sinon.spy();
    onerror.register(cb);

    return fail().then(() => assert.isTrue(cb.calledOnce));
  });

  it("does not call the registered function more than once when it fails",
     () => {
       const onerror = lr.install(frameWindow);
       let called = 0;
       onerror.register(() => {
         called++;
         // We reinstall so that the error thrown is not causing a Mocha
         // error.
         lr.install(frameWindow);
         frameWindow.trigger();
       });

       return fail().then(() => assert.equal(called, 1));
     });

  it("calls the registered function with the right values on " +
     "uncaught exception", () => {
    const onerror = lr.install(frameWindow);

    return new Promise((resolve) => {
      onerror.register(resolve);
      fail();
    }).then((event) => {
      const { message, filename, lineno, colno } = event;
      const err = event.error;

      //
      // On IE9 we do not check the values. There are a whole bunch of quirky
      // things going on. (e.g. ``message`` is undefined, there's no stack.) If
      // someone wants to update the test to inspect values on IE9, then great.
      //
      // There is a similar problem for Android 4.0 to 4.3.
      //
      if (IE9 || ANDROID_4_0_TO_4_3) {
        return;
      }

      assert.include(["Error: failing on purpose",
                      "Uncaught Error: failing on purpose",
                      "failing on purpose"], message);

      const { errorThrown } = frameWindow;

      // Some plaforms do put stack traces on their Error objects. It is not the
      // role of Last Resort to fix this. So we stop testing here.
      if (!errorThrown.stack) {
        return;
      }

      const match =
              errorThrown.stack.match(/^\s+at (?:.* \()(.*):(\d+):(\d+)\)?$/m) ||
              errorThrown.stack.match(/^.*@(.*):(\d+):(\d+)$/m) ||
              // iOS 6 has no colno, hence the optional colno here.
              errorThrown.stack.match(/^.*@(.*):(\d+)$/m);

      if (!match) {
        throw new Error("cannot match trace");
      }
      const [, errFilename, errLineno, errColno] = match;
      assert.equal(filename, errFilename);

      //
      // We used to check that the line numbers of the event and the error
      // object were the same but that generally cannot be guaranteed. Some
      // browsers (e.g. Chrome) will generate the event line number from the
      // location of the ``throw`` statement, whereas the Error object gets the
      // line number of the line where it was created. THE TWO ARE NOT
      // NECESSARILY EQUAL.
      //
      // So we check that the two are defined.
      //
      assert.isDefined(errLineno);
      assert.isDefined(lineno);

      // If there was a colno in the trace, then we must get a colno in the
      // event.
      if (errColno !== undefined) {
        // On Chrome the colno provided to onerror differs from the
        // stack trace. :-/
        assert.isDefined(colno);
      }

      if (err) {
        assert.equal(err.toString(), errorThrown.toString());
      }
    });
  });

  function globalLRTest() {
    const onerror = lr.install(frameWindow);

    return new Promise((resolve) => {
      onerror.register((ev) => {
        ev.preventDefault();
        resolve(ev);
      });
      unhandledReject();
    }).then((ev) => {
      if (frameWindow.PromiseRejectionEvent) {
        assert.isTrue(ev instanceof frameWindow.PromiseRejectionEvent);
      }

      assert.equal(ev.type, "unhandledrejection");

      let { reason, promise } = ev;

      if (!reason && !promise) {
        ({ reason, promise } = ev.detail);
      }

      assert.equal(reason, frameWindow.unhandledRejectError);
      return promise.catch(ex => assert.equal(ex,
                                              frameWindow.unhandledRejectError));
    });
  }

  // On platforms where PromiseRejectionEvent exists, we do not need to load
  // Bluebird to be able to listen to PromiseRejectionEvent. Chrome is one such
  // platform.
  const preExists = (typeof PromiseRejectionEvent !== "undefined");
  it("(global lr) calls the registered function with the right values on " +
     "unhandled rejection",
     preExists ? globalLRTest : () => loadBluebirdInFrame().then(globalLRTest));

  it("does not call the registered function on unhanndled rejection" +
     "if noUnhandledRejection is set", () => {
    const onerror = lr.install(frameWindow, { noUnhandledRejection: true });
    const spy = sinon.spy();
    onerror.register(spy);
    unhandledReject();

    // This is a tricky test. The delay here is arbitrary. The fact is that
    // unhandled rejections are detected asynchronously.
    return Promise.delay(500).then(() => assert.isTrue(spy.notCalled));
  });

  describe("when loaded in a worker causes the registered function", () => {
    let worker;

    before(function before() {
      // This effectively skips the whole `describe`.
      if (typeof Worker === "undefined") {
        this.skip();
      }
    });

    beforeEach(() => {
      worker = new Worker("/base/test/worker.es5.js");
    });

    afterEach(() => worker && worker.terminate());

    // Calling .terminate() is necessary on Firefox for Windows, for some
    // reason...
    it("to be called on uncaught exceptions", () => new Promise((resolve) => {
      worker.onmessage = resolve;
      worker.postMessage("throw");
    }));

    it("to be called on unhandled rejections", () => new Promise((resolve) => {
      worker.onmessage = resolve;
      worker.postMessage("reject");
    }));
  });
});
