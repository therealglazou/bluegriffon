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
}

function DeactivateLicense()
{
  window.openDialog("chrome://bluegriffon/content/prefs/deactivateLicense.xul",
                    "_blank",
                    "chrome,modal,dialog=yes,titlebar,resizable=no");
  CheckDeactivationButton();
}
