Components.utils.import("resource://gre/modules/Services.jsm");

var DOWNLOAD_URL = "http://bluegriffon.org/#download";

function ShowUpdatePage()
{
  loadExternalURL(DOWNLOAD_URL);
  window.close();
}

function Startup()
{
  GetUIElements();

  var message = window.arguments[0];
  var messageURL = window.arguments[1];
  var currentVersion = window.arguments[2];

  if (currentVersion) {
    gDialog.versionLabel.setAttribute("version", currentVersion);
    gDialog.versionLabel.setAttribute("value", "v" + currentVersion);
  }
  else {
    gDialog.skipVersionButton.hidden = true;
    gDialog.skipVersionButton.nextElementSibling.setAttribute("hidden", "true");
  }

  if (message) {
    gDialog.warningMessage2.firstChild.textContent = message;
  }
  if (messageURL) {
    DOWNLOAD_URL = messageURL;
  }

#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function SkipVersion()
{
  var v = gDialog.versionLabel.getAttribute("version");
  Services.prefs.setCharPref("bluegriffon.updates.skipped", v);
  window.close();
}