Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/l10nHelper.jsm");
Components.utils.import("resource://gre/modules/prompterHelper.jsm");

function Startup()
{
  //window.sizeToContent();
  GetUIElements();

  var site = "";
  try {
    site = Services.prefs.getBoolPref("bluegriffon.license.site");
  }
  catch(e) {}

  if (site) {
    document.documentElement.setAttribute("sitelicense", "true");
    document.documentElement.showPane(gDialog.generalPrefPane);
  }
}
