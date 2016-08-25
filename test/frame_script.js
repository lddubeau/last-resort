function throwMe() {
  // We want these on the same line because ``throw`` messes the line
  // number.
  window.errorThrown = new Error("failing on purpose"); throw window.errorThrown;
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
