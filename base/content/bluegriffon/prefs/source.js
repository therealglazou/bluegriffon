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
