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
  gDialog.deactivateLicenseButton.disabled =
    (!gDialog.licenseKeyTextbox.value
     || !gDialog.licenseInvoiceTextbox.value
     || !email);
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
  var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                   .getService(Components.interfaces.nsIAppStartup);

  appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                  Components.interfaces.nsIAppStartup.eAttemptQuit);
}
