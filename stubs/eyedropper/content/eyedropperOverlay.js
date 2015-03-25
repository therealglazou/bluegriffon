Components.utils.import("resource://gre/modules/Services.jsm");

var EyeDropperHelper = {

  init: function() {
    window.removeEventListener("load", EyeDropperHelper.init, false);

    var elt = document.getElementById("eyedropperStatusbarButton");
    elt.addEventListener("mousedown", EyeDropperHelper.mouseDown, false);
  },

  mouseDown: function(e) {
    var bundle = document.getElementById("eyedropperOverlayBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/EyeDropper");
  }
};

window.addEventListener("load", EyeDropperHelper.init, false);
