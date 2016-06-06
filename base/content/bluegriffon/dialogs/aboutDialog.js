Components.utils.import("resource://gre/modules/Services.jsm");

function Startup()
{
  var windowElt = document.documentElement;
  /*if (!windowElt.hasAttribute("width") &&
      !windowElt.hasAttribute("height"))
    window.sizeToContent();*/
  document.getElementById("iframe").addEventListener(
    "pageshow",
    onIframeLoaded,
    false);
  document.getElementById("iframe").setAttribute("src",
    "chrome://bluegriffon/content/credits.xhtml");

#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function onIframeLoaded()
{
  ApplyWysiwygThemeChange(document, Services.prefs.getCharPref("bluegriffon.wysiwyg.theme"));
  document.getElementById("iframe").contentWindow.
    setCallback(onUrlClicked);
}

function onUrlClicked(url)
{
  loadExternalURL(url);
}
