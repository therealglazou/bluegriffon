Components.utils.import("resource://gre/modules/Services.jsm");

var gTree = null;
var gReferenceParent = null;
var gReference = null;
var gRv = null;

function Startup()
{
  gTree             = window.arguments[0];
  gReferenceParent  = window.arguments[1];
  gReference        = window.arguments[2];

  gRv = window.arguments[3];

  GetUIElements();

  var count = gTree.view.rowCount;
  if (count)
    gDialog.noneRadio.disabled = true;
  gDialog.textEntryTextbox.focus();
}

function Shutdown()
{
  
}

function Accept()
{
  if (gDialog.valueRadiogroup.selectedItem == gDialog.noneRadio)
    gRv.value = "none";
  else
    gRv.value = gDialog.textEntryTextbox.value;
  gRv.cancelled = false;
}

function onRadioSelected(aElt)
{
  gDialog.textEntryTextbox.disabled = (aElt.value == "none");
  if (aElt.value == "new")
    gDialog.textEntryTextbox.focus();
  else
    gDialog.textEntryTextbox.blur();
}
