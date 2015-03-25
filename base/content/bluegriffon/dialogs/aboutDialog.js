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
}

function onIframeLoaded()
{
  document.getElementById("iframe").contentWindow.
    setCallback(onUrlClicked);
}

function onUrlClicked(url)
{
  loadExternalURL(url);
}
