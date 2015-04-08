Components.utils.import("resource://app/modules/editorHelper.jsm");

var gNode = null;
var gEditor = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  InitDialog();
  //window.sizeToContent();
}

function CheckFormName(aElt)
{
  aElt.value = aElt.value.replace( /[^a-zA-Z0-9]/g , "");
  if (aElt.value.length) {
    var c = aElt.value[0];
    if (c >= '0' && c <= '9')
      aElt.value = aElt.value.substr(1);
  }
}

function ToggleMultibuttons(aElt)
{
  if (!aElt.checked)
    return;
  var buttons = aElt.parentNode.querySelectorAll(".multibutton");
  for (var i = 0; i < buttons.length; i++) {
    var b = buttons[i];
    if (b != aElt)
      b.removeAttribute("checked");
  }
}

function InitDialog()
{
  if (!gNode)
    return;

  gDialog.formNameTextbox.value = gNode.getAttribute("name");
  gDialog.formURLTextbox.value  = gNode.getAttribute("action");
  switch (gNode.getAttribute("autocomplete")) {
    case "on": gDialog.autocompleteOnButton.setAttribute("checked", "true"); break;
    case "off": gDialog.autocompleteOffButton.setAttribute("checked", "true"); break;
    default: break;
  }
  switch (gNode.getAttribute("method")) {
    case "GET":  gDialog.methodGETButton.setAttribute("checked", "true"); break;
    case "POST": gDialog.methodPOSTButton.setAttribute("checked", "true"); break;
    default: break;
  }
  gDialog.formEnctypeMenulist.value = gNode.getAttribute("enctype");
  gDialog.novalidateButton.checked = (gNode.getAttribute("novalidate") == "novalidate");
  gDialog.formTargetMenulist.value = gNode.getAttribute("target");
  gDialog.formAcceptcharsetTextbox.value = gNode.getAttribute("accept-charset");
}

function onAccept()
{
  gEditor.beginTransaction();

  var br = null;
  if (!gNode) {
    gNode = EditorUtils.getCurrentDocument().createElement("form");
    br = EditorUtils.getCurrentDocument().createElement("br");
    gNode.appendChild(br);
    gEditor.insertElementAtSelection(gNode, true);
  }

  gEditor.setAttribute(gNode, "name", gDialog.formNameTextbox.value);
  gEditor.setAttribute(gNode, "action", gDialog.formURLTextbox.value);

  if (gDialog.methodGETButton.hasAttribute("checked") ||
      gDialog.methodPOSTButton.hasAttribute("checked"))
    gEditor.setAttribute(gNode, "method",
                         gDialog.methodGETButton.hasAttribute("checked") ? "GET" :
                           (gDialog.methodPOSTButton.hasAttribute("checked") ? "POST" : ""));
    else
    gEditor.removeAttribute(gNode, "method");

  if (gDialog.autocompleteOnButton.hasAttribute("checked") ||
      gDialog.autocompleteOffButton.hasAttribute("checked"))
    gEditor.setAttribute(gNode, "autocomplete",
                         gDialog.autocompleteOnButton.hasAttribute("checked") ? "on" :
                           (gDialog.autocompleteOffButton.hasAttribute("checked") ? "off" : ""));
  else
    gEditor.removeAttribute(gNode, "autocomplete");

  if (gDialog.formEnctypeMenulist.value)
    gEditor.setAttribute(gNode, "enctype", gDialog.formEnctypeMenulist.value);
  else
    gEditor.removeAttribute(gNode, "enctype")

  if (gDialog.novalidateButton.checked)
    gEditor.setAttribute(gNode, "novalidate", "novalidate");
  else
    gEditor.removeAttribute(gNode, "novalidate");

  if (gDialog.formTargetMenulist.value)
    gEditor.setAttribute(gNode, "target", gDialog.formTargetMenulist.value);
  else
    gEditor.removeAttribute(gNode, "target");

  if (gDialog.formAcceptcharsetTextbox.value)
    gEditor.setAttribute(gNode, "accept-charset", gDialog.formAcceptcharsetTextbox.value);
  else
    gEditor.removeAttribute(gNode, "accept-charset");

  gEditor.endTransaction();
  if (br)
    gEditor.selectElement(br);
}
