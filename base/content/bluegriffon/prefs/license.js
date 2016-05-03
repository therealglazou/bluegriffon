Components.utils.import("resource://gre/modules/Services.jsm");

function OnLicensePaneLoad()
{
  GetUIElements();
  CheckDeactivationButton();
}


function onWindowLoaded()
{
  var collapseLicensePane = true;
  try {
    var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"].
      getService(Components.interfaces.nsIChromeRegistry);
  
    var ios = Components.classes["@mozilla.org/network/io-service;1"].
      getService(Components.interfaces.nsIIOService);
    var sourceURI = ios.newURI("chrome://csseditor/content/csseditor.js", null, null);
    // this throws for packages that are not registered
    var chromeURL = cr.convertChromeURL(sourceURI);
    if (chromeURL) {
      var file = chromeURL.QueryInterface(Components.interfaces.nsIFileURL).file;
      if (file.exists())
        collapseLicensePane = false;
    }
  }
  catch(e) {}

  if (collapseLicensePane) {
    var id = "";
    try {
      var currentPane = document.documentElement.currentPane;
      id = currentPane ? currentPane.getAttribute("id") : null;

      var licensePane  = document.getElementById('licensePrefPane');
      var licenseRadio = document.getAnonymousElementByAttribute(document.documentElement, "pane", "licensePrefPane");
      if (licenseRadio)
        licenseRadio.setAttribute("collapsed", "true");
      if (licensePane)
        licensePane.setAttribute("collapsed", "true");
  
      if (id == "licensePrefPane") {
        document.documentElement.showPane(document.getElementById("generalPrefPane"));
      }
    }
    catch(e) {}
  }
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

window.addEventListener("load", onWindowLoaded, false);
