Components.utils.import("resource://gre/modules/Services.jsm");

function OnLicensePaneLoad()
{
  GetUIElements();
  CheckDeactivationButton();
}

function CheckDeactivationButton()
{
  var email = "";
  try {
    email = Services.prefs.getCharPref("bluegriffon.license.email");
  }
  catch(e) {}

  if ("gValidBasic" in window) {
    gDialog.invalidLicense.setAttribute("hidden", "true");
  }
  else {
    gDialog.validBasicLicense.setAttribute("hidden", "true");
  }

  if ("gValidExtended" in window) {
    gDialog.invalidLicense.setAttribute("hidden", "true");
    gDialog.validBasicLicense.setAttribute("hidden", "true");
  }
  else {
    gDialog.validEPUBLicense.setAttribute("hidden", "true");
  }

  if (!gDialog.licenseKeyTextbox.value
       && !gDialog.licenseInvoiceTextbox.value) {
    gDialog.invalidLicense.setAttribute("hidden", "true");
  }

  gDialog.deactivateLicenseButton.disabled =
    (!gDialog.licenseKeyTextbox.value
     || !gDialog.licenseInvoiceTextbox.value
     || !("gValidBasic" in window));

     gDialog.activateLicenseButton.disabled = !gDialog.deactivateLicenseButton.disabled ||
    !gDialog.licenseKeyTextbox.value ||
    !gDialog.licenseInvoiceTextbox.value;

  gDialog.troubleshootButton.disabled = !gDialog.licenseInvoiceTextbox.value;
}

function DeactivateLicense()
{
  window.openDialog("chrome://bluegriffon/content/prefs/deactivateLicense.xul",
                    "_blank",
                    "chrome,modal,dialog=yes,titlebar,resizable=no");
  CheckDeactivationButton();
}

function ActivateLicense()
{
  var rv = Services.prompt.confirm(window,
                                   gDialog.activationBundle.getString("confirmRestart"),
                                   gDialog.activationBundle.getString("activateWarning"));
  if (rv) {
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                     .getService(Components.interfaces.nsIAppStartup);
  
    appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                    Components.interfaces.nsIAppStartup.eAttemptQuit);
  }
}

function onResetError()
{
  Services.prompt.alert(null,
                        gDialog.activationBundle.getString("fullResetTitle"),
                        gDialog.activationBundle.getString("fullResetErrorLabel"));
}

function Troubleshoot()
{
  var url = "http://www.bluegriffon-epubedition.com/request-full-reset.php?invoice="
            + gDialog.licenseInvoiceTextbox.value.trim();

  var rq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
             .createInstance();

  var loadHandler = {
    _self: this,

    handleEvent: function(aEvent) {
      if (rq.status >= 400) {
        onResetError();
        return;
      }

      var ok = (rq.responseText == "ok");
      Services.prompt.alert(null,
                            gDialog.activationBundle.getString("fullResetTitle"),
                            ok ? gDialog.activationBundle.getString("fullResetRequested")
                               : gDialog.activationBundle.getString("fullResetInvalid"));

      Services.prefs.setCharPref("bluegriffon.license.key", "");
      Services.prefs.setCharPref("bluegriffon.license.invoice", "");
      Services.prefs.setCharPref("bluegriffon.license.email", "");

      gDialog.licenseKeyTextbox.value = "";
      gDialog.licenseInvoiceTextbox.value = "";

      if (ok) {
        var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                         .getService(Components.interfaces.nsIAppStartup);

        appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                        Components.interfaces.nsIAppStartup.eAttemptQuit);
      }
    }
  };

  var errorHandler = {
    _self: this,

    handleEvent: function(event) {
      onResetError();
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
