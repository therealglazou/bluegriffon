Components.utils.import("resource://gre/modules/Services.jsm");

function OnNewPagePaneLoad()
{
  GetUIElements();
  var zoom = Math.floor(parseFloat(Services.prefs.getCharPref("bluegriffon.zoom.default")) * 100);
  gDialog.zoomScale.value = zoom;
  OnScaleChange(false);
}

function OnScaleChange(aChangePref)
{
  if (gDialog.zoomText) {
    gDialog.zoomText.value = gDialog.zoomScale.value;
    if (aChangePref)
      Services.prefs.setCharPref("bluegriffon.zoom.default", gDialog.zoomScale.value/100);
  }
}

function OnZoomTextInput(aElt)
{
  var value = parseInt(aElt.value);
  gDialog.zoomScale.value = value;
}