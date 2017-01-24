Components.utils.import("resource://gre/modules/Services.jsm");

function Startup()
{
  GetUIElements();
}

function onError()
{
  gDialog.alertBox.style.visibility = "visible";
}

function onAccept()
{
  gDialog.throbberBox.removeAttribute("hidden");
  var appid = Services.prefs.getCharPref("bluegriffon.updates.id");

  var url = ("gEPUB" in window)
            ? "http://www.bluegriffon-epubedition.com/deac.php?appid=" + appid
            : "http://www.bluegriffon-epubedition.com/deac-bg.php?appid=" + appid;

  var rq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
             .createInstance();

  var loadHandler = {
    _self: this,

    handleEvent: function(aEvent) {
      gDialog.throbberBox.setAttribute("hidden", "true");
      document.documentElement.getButton("accept").setAttribute("disabled", "true");
      if (rq.status >= 400) {
        onError();
        return;
      }

      Services.prefs.setCharPref("bluegriffon.license.key", "");
      Services.prefs.setCharPref("bluegriffon.license.invoice", "");
      Services.prefs.setCharPref("bluegriffon.license.email", "");

      var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                       .getService(Components.interfaces.nsIAppStartup);
    
      appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                      Components.interfaces.nsIAppStartup.eAttemptQuit);
    }
  };

  var errorHandler = {
    _self: this,

    handleEvent: function(event) {
      document.documentElement.getButton("accept").setAttribute("disabled", "true");
      gDialog.throbberBox.setAttribute("hidden", "true");
      onError();
    }
  };

  rq = rq.QueryInterface(Components.interfaces.nsIDOMEventTarget);
  rq.addEventListener("load", loadHandler, false);
  rq.addEventListener("error", errorHandler, false);

  rq = rq.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
  rq.open("GET", url, true);
  rq.setRequestHeader("Pragma", "no-cache");
  rq.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
  // Register ourselves as a listener for notification callbacks so we
  // can handle authorization requests and SSL issues like cert mismatches.
  // XMLHttpRequest will handle the notifications we don't handle.
  rq.channel.notificationCallbacks = this;

  rq.send(null);

  return false;
}