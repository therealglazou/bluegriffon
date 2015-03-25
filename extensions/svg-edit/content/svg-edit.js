Components.utils.import("resource://gre/modules/Services.jsm");

function Startup()
{
  GetUIElements();
}

function CloseWindowRequest(event)
{
  var svgWindow = document.getElementById("mainIframe")
                    .contentWindow;
  var undoMgr = svgWindow.undoMgr;
  if (undoMgr.getUndoStackSize()
      && !Services.prompt.confirm(window, gDialog.bundleString.getString("SvgEdit"),
                                  gDialog.bundleString.getString("ConfirmClose"))) {
    return false;
  }
  return true;
}
