Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

var EXPORTED_SYMBOLS = ["BlueGriffonQuitHelper"];

var BlueGriffonQuitHelper = {

  mReady: false,

  init: function()
  {
    if (this.mReady)
      return;
    this.mReady = true;
    Services.obs.addObserver(BlueGriffonQuitHelper, "quit-application-requested", false);
  },

  observe: function(aSubject, topic, data)
  {
    switch (topic) {
      case "quit-application-requested":
      {
        var windowMediator = Services.wm;
        var e = windowMediator.getEnumerator("bluegriffon");
        var windows = [];
        while (e.hasMoreElements()) {
          var w = e.getNext();
          windows.push(w);
        }
        for (var i = 0; i < windows.length; i++) {
          var w = windows[i];
          if ("doQuit" in w) {
            w.focus();
            if (!w.doQuit()) {
              aSubject.QueryInterface(Components.interfaces.nsISupportsPRBool);
              aSubject.data = true;
              break;
            }
          }
        }
        break;
      }
    }
  }
};
