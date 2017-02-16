Components.utils.import("resource://gre/modules/Services.jsm");

function OnSourcePaneLoad()
{
  GetUIElements();

  var elt = document.getElementById("sourceThemeMenupopup");
  for (var i = 0; i < kTHEMES.length; i++) {
    var s = document.createElement("menuitem");
    s.setAttribute("label", kTHEMES[i]);
    s.setAttribute("value", kTHEMES[i]);
    elt.appendChild(s);
  }
  var currentTheme = Services.prefs.getCharPref("bluegriffon.source.theme");
  document.getElementById("sourceThemeMenulist").value = currentTheme;

  toggleWrapping();

  var zoom = Math.floor(parseFloat(Services.prefs.getCharPref("bluegriffon.source.zoom.default")) * 100);
  gDialog.sourceZoomScale.value = zoom;
  OnSourceScaleChange(false);
}

function toggleWrapping()
{
  var wrapArray = ["maxColumnLabel", "maxColumnCheckbox", "noWrapForLanguagesCheckbox",
                   "langExclusionsTextbox", "langExclusionExampleLabel"];
  var wrapping = gDialog.wrapCheckbox.checked;
  for (var i = 0; i < wrapArray.length; i++)
    if (wrapping)
      gDialog[wrapArray[i]].removeAttribute("disabled");
    else
      gDialog[wrapArray[i]].setAttribute("disabled", "true");
}

function OnSourceScaleChange(aChangePref)
{
  if (gDialog.sourceZoomText) {
    gDialog.sourceZoomText.value = gDialog.sourceZoomScale.value;
    if (aChangePref)
      Services.prefs.setCharPref("bluegriffon.source.zoom.default", gDialog.sourceZoomScale.value/100);
  }
}

function OnSourceZoomTextInput(aElt)
{
  var value = parseInt(aElt.value);
  gDialog.sourceZoomScale.value = value;
}