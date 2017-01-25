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
