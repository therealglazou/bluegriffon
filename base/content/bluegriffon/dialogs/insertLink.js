Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");

var gNode = null;
var gEditor = null;
var gDocUrlScheme = null;
var gCollapsedSelection = false;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();

  var docUrl = EditorUtils.getDocumentUrl();
  gDocUrlScheme = UrlUtils.getScheme(docUrl);

  GetUIElements();

  InitDialog();
  CheckURL();
  //window.sizeToContent();
}

function InitDialog()
{
  //document.documentElement.getButton("accept").setAttribute("disabled", "true");

  var url;
  if (gNode) {
    gDialog.linkTextbox.hidden = true;
    gDialog.linkLabel.setAttribute("value", gNode.textContent.trim());
    url = gNode.getAttribute("href");
    gDialog.urlMenulist.value = url;

    gDialog.titleTextbox.value = gNode.getAttribute("title");

    gDialog.relativeURLCheckbox.checked =
       !(url.substr(0,7) == "http://" ||
         url.substr(0,8) == "https://" ||
         url.substr(0,6) == "ftp://" ||
         url.substr(0,7) == "file://");
    if (gNode.hasAttribute("target")) {
      gDialog.applyTargetAttributeCheckbox.checked = true;
      var target = gNode.getAttribute("target");
      switch (target) {
        case "_top":
        case "_parent":
        case "_blank":
        case "_self":
          gDialog.targetAttributeMenulist.value = target;
          gDialog.userDefinedValueTextbox.value = "";
          break;
        default:
          gDialog.targetAttributeMenulist.value = "x";
          gDialog.userDefinedValueTextbox.value = target;
          break;
      }
      ToggleTargetAttribute();
    }
    if (url.substr(0, 7) == "mailto:") {
      gDialog.urlMenulist.value = url.substr(7);
      gDialog.emailCheckbox.checked = true;
    }
    else
      gDialog.emailCheckbox.checked = false;

    gDialog.urlMenulist.focus();
  }
  else {
    gCollapsedSelection = gEditor.selection.isCollapsed;
    if (gCollapsedSelection) {
      gDialog.linkTextbox.hidden = false;
      gDialog.linkLabel.hidden = true;
      gDialog.linkTextbox.focus();
    }
    else {
      gDialog.linkTextbox.hidden = true;
      gDialog.linkLabel.hidden = false;
      gDialog.linkLabel.setAttribute("value", GetSelectionAsText().trim());
      gDialog.urlMenulist.focus();
    }

    url = UrlUtils.getClipboardAsString();
    if (url)
      gDialog.urlMenulist.value = url;
  }

  var targets = gEditor.document.querySelectorAll("[id],a[name]");
  var targetsArray = [];
  for (var i = 0; i< targets.length; i++) {
    var t = targets[i];
    if (t.id)
      targetsArray.push(t.id);
    if (t.nodeName.toLowerCase() == "a" && t.hasAttribute("name"))
      targetsArray.push(t.getAttribute("name"));
  }
  targetsArray.sort();
  if (targetsArray.length) {
    for (var i = 0; i < targetsArray.length; i++) {
      if (!i || targetsArray[i] != targetsArray[i-1]) {
        var item = "#" + targetsArray[i];
        gDialog.urlMenulist.appendItem(item, item);
      }
    }
  }
  else {
    var s = gDialog.bundleString.getString("noAnchorsInDocument");
    var item = gDialog.urlMenulist.appendItem(s);
    item.setAttribute("disabled", "true");
  }
}

function GetSelectionAsText()
{
  try {
    return gEditor.outputToString("text/plain", 1); // OutputSelectionOnly
  } catch (e) {}

  return "";
}


function CheckURL()
{
  var url = gDialog.urlMenulist.value;
  if (url) {
    gDialog.emailCheckbox.disabled = false;
    gDialog.relativeURLCheckbox.disabled = !(gDocUrlScheme && gDocUrlScheme != "resource");
  }
  else {
    gDialog.emailCheckbox.checked = false;
    gDialog.relativeURLCheckbox.checked = false;
    gDialog.emailCheckbox.disabled = true;
    gDialog.relativeURLCheckbox.disabled = true;
  }
}

function MakeRelativeUrl()
{
  var spec = gDialog.urlMenulist.value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.urlMenulist.value = spec;
    gDialog.relativeURLCheckbox.checked = true;
  }
}

function MakeAbsoluteUrl()
{
  var spec = gDialog.urlMenulist.value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog.urlMenulist.value = spec;
    gDialog.relativeURLCheckbox.checked = false;
  }
}

function ToggleRelativeOrAbsolute()
{
  if (gDialog.relativeURLCheckbox.checked) {
    MakeRelativeUrl();
  }
  else {
    MakeAbsoluteUrl();
  }
}

function onAccept()
{
  var url = gDialog.urlMenulist.value;
  if (url && gDialog.emailCheckbox.checked) {
    if (url.substr(0, 7) != "mailto:")
      url = "mailto:" + url;
  }
  var target = gDialog.applyTargetAttributeCheckbox.checked
               ? ((gDialog.targetAttributeMenulist.value == "x")
                   ? gDialog.userDefinedValueTextbox.value
                   : gDialog.targetAttributeMenulist.value)
               : "";

  gEditor.beginTransaction();

  if (gNode) {
    if (url) {
      if (gDialog.titleTextbox.value)
        gEditor.setAttribute(gNode, "title", gDialog.titleTextbox.value);
      else
        gEditor.removeAttribute(gNode, "title");

      gEditor.setAttribute(gNode, "href", url);

      if (target)
        gEditor.setAttribute(gNode, "target", target);
      else
        gEditor.removeAttribute(gNode, "target");
    }
    else {
      var offset = 0;
      var parent = gNode.parentNode;
      var childNodes = parent.childNodes;
      gEditor.setShouldTxnSetSelection(false);

      while (childNodes[offset] != gNode)
        ++offset;

      childNodes = gNode.childNodes;
      var childNodesLength = childNodes.length;
      for (var i = childNodesLength - 1; i >= 0; i--) {
        var clone = childNodes.item(i).cloneNode(true);
        gEditor.insertNode(clone, parent, offset + 1);
      }

      gEditor.deleteNode(gNode);

      gEditor.setShouldTxnSetSelection(true);
    }
  }
  else if (gCollapsedSelection) {
    var textNode = gEditor.document.createTextNode(gDialog.linkTextbox.value);
    var anchor = gEditor.document.createElement("a");
    anchor.appendChild(textNode);
    anchor.setAttribute("href", url);
    if (target)
      anchor.setAttribute("target", target);
    try {
      gEditor.insertElementAtSelection(anchor, false);
    }
    catch (e) {}
  }
  else {
    var anchor = gEditor.document.createElement("a");
    anchor.setAttribute("href", url);
    if (gDialog.titleTextbox.value)
      gEditor.setAttribute(anchor, "title", gDialog.titleTextbox.value);
    else
      gEditor.removeAttribute(anchor, "title");
    if (target)
      anchor.setAttribute("target", target);
    try {
      gEditor.insertLinkAroundSelection(anchor);
    }
    catch (e) {}
  }

  gEditor.endTransaction();
}

function ToggleTargetAttribute()
{
  var enabled = gDialog.applyTargetAttributeCheckbox.checked;
  SetEnabledElement(gDialog.targetAttributeMenulist, enabled);
  SetEnabledElement(gDialog.userDefinedValueTextbox, enabled && (gDialog.targetAttributeMenulist.value == "x"));
}

function TargetAttributeSelected(aMenulist)
{
  SetEnabledElement(gDialog.userDefinedValueTextbox, aMenulist.value == "x");
}
