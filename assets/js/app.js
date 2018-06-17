function LoadSrc(filenames) {
  var scripts = document.getElementsByTagName("script");
  var script = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf("app") > 0) {
      script = scripts[i];
      break;
    }
  }
  for (var i = 0; i < arguments.length; i++) {
    var filename = arguments[i];
    if (!filename) continue;
    var selt = document.createElement("script");
    selt.async = false;
    selt.defer = false;
    selt.src = filename;
    script.parentNode.insertBefore(selt, script.nextSibling);
    script = selt;
  }
};

LoadSrc('assets/vendor/jquery/jquery.min.js', 
  'assets/vendor/popper.js/popper.js',
  'assets/vendor/bootstrap/js/bootstrap.min.js',
  'assets/vendor/fileSaver/fileSaver.js'
);
