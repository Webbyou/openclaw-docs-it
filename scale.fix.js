// Scale Fix per OpenClaw Docs Italiana
// Fix per viewport scaling su dispositivi mobili
(function() {
  var viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
})();
