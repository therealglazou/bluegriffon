Components.utils.import("resource://app/modules/cssHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");

var gNodes = [];
var gList = null;
var gLis = [];
var gFirstLi = null;
var gInfo = { lst: null, lsp: null, lsi: null, start: null };

function Startup()
{
  GetUIElements();

  var s = EditorUtils.getCurrentEditor().selection;
  GetAllListItems(s);

  InitDialog();
}

function InitDialog()
{
  if (!gNodes || !gNodes.length) // sanity check
    return;

  var gFirstLi = gNodes[0];
  if (gFirstLi.nodeName.toLowerCase() != "li")
    gFirstLi = gFirstLi.firstElementChild;
  gList = gFirstLi.parentNode;

  var doc = EditorUtils.getCurrentDocument();
  var cs = doc.defaultView.getComputedStyle(gFirstLi, "");
  var lst = cs.getPropertyValue("list-style-type");
  if (!lst) { // bug 665857 
    switch (gFirstLi.getAttribute("type")) {
      case "i": lst = "lower-roman"; break;
      case "I": lst = "upper-roman"; break;
      case "a": lst = "lower-alpha"; break;
      case "A": lst = "upper-alpha"; break;
      default: break;
    }
    if (!lst) // get the list's type
      lst = doc.defaultView.getComputedStyle(gList, "")
            .getPropertyValue("list-style-type");
  }
  gDialog.listStyleTypeMenulist.value = lst;

  var lsp = cs.getPropertyValue("list-style-position");
  CheckToggle(gDialog.insideListStylePositionButton,   lsp == "inside");
  CheckToggle(gDialog.outsideListStylePositionButton,  lsp == "outside");

  var lsi = cs.getPropertyValue("list-style-image");
  var match = lsi.match ( /^url\(\s*"([^"]*)"\s*\)|^url\(\s*'([^']*)'\s*\)|^url\(\s*([^\)]*)\s*\)/ );
  var item = gDialog.listStyleImageURLTextbox;
  if (match) {
    if (match[1]) item.value = match[1];
    else if (match[2]) item.value = match[2];
    else if (match[3]) item.value = match[3];
  }

  gInfo.lst = lst;
  gInfo.lsp = lsp;
  gInfo.lsi = item.value;  

  gInfo.start = gFirstLi.getAttribute("value");
  if (!gInfo.start && gList.firstElementChild == gFirstLi) {
    gInfo.start = gList.getAttribute("start");
  }
  if (gInfo.start) {
    gDialog.dontSetStartValueCheckbox.checked = false;
    gDialog.listStartValueTextbox.disabled = false;
    gDialog.listStartValueTextbox.value = gInfo.start;
    gInfo.startDisabled = false;
  }
  else {
    gDialog.dontSetStartValueCheckbox.checked = true;
    gDialog.listStartValueTextbox.disabled = true;
    gDialog.listStartValueTextbox.value = 1;
    gInfo.startDisabled = true;
    gInfo.start = "1";
  }

  ListStyleImageSet();
  ToggleRelativeOrAbsoluteStyleImage();
}

function CheckToggle(aToggle, aChecked)
{
  if (aChecked)
    aToggle.setAttribute("checked", "true");
  else
    aToggle.removeAttribute("checked");
}

function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();

  var lsp = gDialog.insideListStylePositionButton.getAttribute("checked")
            ? "inside"
            : (gDialog.outsideListStylePositionButton.getAttribute("checked")
               ? "outside"
               : "");

  editor.beginTransaction();
  //cleanup first
  for (var i = 0; i < gLis.length; i++) {
    var li = gLis[i];

    if (gInfo.lst != gDialog.listStyleTypeMenulist.value) {
      if (li.hasAttribute("type"))
        editor.removeAttribute(li, "type");
      if (li.style.listStyleType) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-type", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.lsp != lsp) {
      if (li.style.listStylePosition) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-position", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.lsi != gDialog.listStyleImageURLTextbox.value) {
      if (li.style.listStyleImage) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-image", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.startDisabled != gDialog.dontSetStartValueCheckbox.checked
        || gInfo.start != gDialog.listStartValueTextbox.value) {
      if (li.hasAttribute("value")) {
        editor.removeAttribute(li, "value");
      }
    }
  }
  for (var i = 0; i < gNodes.length; i++) {
    var li = gNodes[i];
    if (li.nodeName.toLowerCase() == "li")
      continue;

    if (gInfo.lst != gDialog.listStyleTypeMenulist.value) {
      if (li.hasAttribute("type"))
        editor.removeAttribute(li, "type");
      if (li.style.listStyleType) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-type", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.lsp != lsp) {
      if (li.style.listStylePosition) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-position", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.lsi != gDialog.listStyleImageURLTextbox.value) {
      if (li.style.listStyleImage) {
        var txn = new diStyleAttrChangeTxn(li, "list-style-image", "", "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
      }
    }

    if (gInfo.startDisabled != gDialog.dontSetStartValueCheckbox.checked
        || gInfo.start != gDialog.listStartValueTextbox.value) {
      if (li.hasAttribute("start")) {
        editor.removeAttribute(li, "start");
      }
    }
  }

  // now set the value
  for (var i = 0; i < gNodes.length; i++) {
    var li = gNodes[i];

    if (gInfo.lst != gDialog.listStyleTypeMenulist.value && gDialog.listStyleTypeMenulist.value) {
      var txn = new diStyleAttrChangeTxn(li, "list-style-type", gDialog.listStyleTypeMenulist.value, "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
    }

    if (gInfo.lsp != lsp && lsp) {
      var txn = new diStyleAttrChangeTxn(li, "list-style-position", lsp, "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
    }

    if (gInfo.lsi != gDialog.listStyleImageURLTextbox.value && gDialog.listStyleImageURLTextbox.value) {
      var txn = new diStyleAttrChangeTxn(li, "list-style-image", "url(" + gDialog.listStyleImageURLTextbox.value + ")", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
    }

    if (gInfo.startDisabled != gDialog.dontSetStartValueCheckbox.checked
        || gInfo.start != gDialog.listStartValueTextbox.value) {
      if (!gDialog.dontSetStartValueCheckbox.checked && !i && gDialog.listStartValueTextbox.value) {
        if (li.nodeName.toLowerCase() == "li")
          editor.setAttribute(li, "value", gDialog.listStartValueTextbox.value);
        else
          editor.setAttribute(li, "start", gDialog.listStartValueTextbox.value);
      }
    }
  }
  editor.endTransaction();
}

function ToggleMultiButton(aElt)
{
  if (aElt.getAttribute("checked")) {
    var value = aElt.getAttribute("value");
    switch (value) {
      case "inside":
        gDialog.outsideListStylePositionButton.removeAttribute("checked");
        break;
      case "outside":
        gDialog.insideListStylePositionButton.removeAttribute("checked");
        break;
       default: break; //never happens
    }
  }
}

function MakeRelativeUrl()
{
  var spec = gDialog.listStyleImageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.listStyleImageURLTextbox.value = spec;
  }
}

function MakeAbsoluteUrl()
{
  var spec = gDialog.listStyleImageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog.listStyleImageURLTextbox.value = spec;
  }
  return spec;
}

function ToggleRelativeOrAbsoluteStyleImage()
{
  if (gDialog.relativeStyleImageURLCheckbox.checked)
    MakeRelativeUrl()
  else
    MakeAbsoluteUrl();
}

function ListStyleImageSet()
{
  var disabled = false;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (!gDialog.listStyleImageURLTextbox.value || !docUrlScheme || docUrlScheme == "resource")
    disabled = true;
  gDialog.relativeStyleImageURLCheckbox.disabled = disabled;
}

function GetAllListItems(aSelection)
{
  for (var k = 0; k < aSelection.rangeCount; k++) {
    var range = aSelection.getRangeAt(k);
    var nodes = [];

    if (range.commonAncestorContainer.nodeType == Node.ELEMENT_NODE) {
      var allWithinRangeParent = range.commonAncestorContainer.querySelectorAll("ul,ol,li");
      for (var i = 0; i < allWithinRangeParent.length; i++) {
        var el = allWithinRangeParent[i];
        var name = el.nodeName.toLowerCase();
        if (name == "li")
          gLis.push(el);

        if ((name == "ol" || name == "ul")
            && aSelection.containsNode(el, false))
          nodes.push(el)
        else if (name =="li"
                 && aSelection.containsNode(el, true)
                 && !aSelection.containsNode(el.parentNode, false)) {
          nodes.push(el);
        }
      }
    }
    if (!nodes.length) {
      var node = range.commonAncestorContainer;
      while (node && node.nodeName.toLowerCase() != "li")
        node = node.parentNode;
      if (node)
        nodes.push(node);
    }

    gNodes = gNodes.concat(nodes);
  }
}

function ToggleLiValue(aElt)
{
  gDialog.listStartValueTextbox.disabled = aElt.checked;
}
