function throwMe() {
  // Note that it is pointless to try to put the next 2 statements on the same
  // line to control the line numbers reported: Babel will split them up on two
  // lines.
  window.errorThrown = new Error("failing on purpose");
  throw window.errorThrown;
}
window.throwMe = throwMe;

function trigger() {
  window.setTimeout(() => {
    window.throwMe();
  }, 10);
}
window.trigger = trigger;

window.unhandledRejectError = new Error("rejected");
function reject() {
  Promise.reject(window.unhandledRejectError);
}
window.reject = reject;
