Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/cssInspector.jsm");

var gNode = null;
var gEditor = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  InitDialog();
}

function InitDialog()
{
  if (!gNode)
    return;

  var ruleset = CssInspector.getCSSStyleRules(gNode, false, "");
  var ml = CssInspector.getCascadedValue(ruleset, "margin-left");
  var mr = CssInspector.getCascadedValue(ruleset, "margin-right");
  if (ml == "0px" && mr == "auto")
    gDialog.leftAlignButton.setAttribute("checked", "true");
  else if (ml == "auto" && mr == "0px")
    gDialog.rightAlignButton.setAttribute("checked", "true");
  else if (ml == "auto" && mr == "auto")
    gDialog.centerAlignButton.setAttribute("checked", "true");
  else if ((ml == "" && mr == "") ||
           (ml == "auto" && mr == "auto")) {
    var align = gNode.getAttribute("align");
    if (align)
      gDialog[align.toLowerCase() + "AlignButton"].setAttribute("checked", "true");
  }

  var bs = CssInspector.getCascadedValue(ruleset, "border-style");
  if (bs == "") {
    bs = gNode.hasAttribute("noshade");
    if (bs)
      gDialog.shadedCheckbox.checked = false;
    else
      gDialog.shadedCheckbox.checked = true;
  }
  else if (bs == "solid")
    gDialog.shadedCheckbox.checked = false;

  var c = CssInspector.getCascadedValue(ruleset, "color");
  if (c)
    gDialog.colorColorpicker.color = c;
  else if (gNode.hasAttribute("color"))
    gDialog.colorColorpicker.color = gNode.getAttribute("color");

  var w = CssInspector.getCascadedValue(ruleset, "width");
  if (w)
    gDialog.widthMenulist.value = w;
  else if (gNode.hasAttribute("width")) {
    w = gNode.getAttribute("width");
    w += (w.indexOf("%") == -1) ? "px" : "";
    gDialog.widthMenulist.value = w;
  }

  var h = CssInspector.getCascadedValue(ruleset, "height");
  gDialog.heightMenulist.value = h;
}

function IncreaseLength(aElt, aUnitsString, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v += 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "ex":
        v += 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v += 1;
        break;
    }
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', false, aCallback);
  }
}

function DecreaseLength(aElt, aUnitsString, aAllowNegative, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v -= 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "ex":
        v -= 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v -= 1;
        break;
    }
    if (!aAllowNegative && v < 0)
      v = 0;
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', aAllowNegative, aCallback);
  }
}

function onLengthMenulistCommand(aElt, aUnitsString, aAllowNegative, aCallback)
{
  var value;
  if (aElt.selectedItem)
    value = aElt.selectedItem.value;
  else
    value = aElt.value;
  aElt.value = value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    if (!aAllowNegative && v < 0) {
      v = 0;
      menulist.value = v + (unit ? unit : "");
    }
  }
}

function PopulateLengths(aElt, aUnitsString)
{
  var menuseparator = aElt.querySelector("menuseparator");
  if (menuseparator) {
    var child = aElt.firstChild;
    while (child && child != menuseparator) {
      var tmp = child.nextSibling;
      aElt.removeChild(child);
      child = tmp;
    }
  }
  else
    deleteAllChildren(aElt);

  var v = parseFloat(aElt.parentNode.value);
  if (isNaN(v))
    v = 0;
  var unitsArray;
  if (aUnitsString == " ")
    unitsArray = [""];
  else
    unitsArray = aUnitsString.split(" ");
  unitsArray.forEach(function(aArrayElt, aIndex, aArray) {
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", v + aArrayElt);
    menuitem.setAttribute("value", v + aArrayElt);
    aElt.insertBefore(menuitem, menuseparator);
  });
}

function ToggleAlignment(aElt)
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

function onAccept()
{
  gEditor.beginTransaction();

  if (!gNode) {
    gNode = EditorUtils.getCurrentDocument().createElement("hr");
    gEditor.insertElementAtSelection(gNode, true);
  }

  var attributeLess = false;
  if(!gDialog.colorColorpicker.shownColor
     && !gDialog.widthMenulist.value
     && !gDialog.heightMenulist.value
     && gDialog.shadedCheckbox.checked
     && !gDialog.leftAlignButton.hasAttribute("checked")
     && !gDialog.centerAlignButton.hasAttribute("checked")
     && !gDialog.rightAlignButton.hasAttribute("checked")) {
    attributeLess = true;
   }

  gEditor.removeAttribute(gNode, "width");
  var txn = new diStyleAttrChangeTxn(gNode, "width", gDialog.widthMenulist.value, "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  

  gEditor.removeAttribute(gNode, "height");
  txn = new diStyleAttrChangeTxn(gNode, "height", gDialog.heightMenulist.value, "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  

  gEditor.removeAttribute(gNode, "color");
  txn = new diStyleAttrChangeTxn(gNode, "color",
                                 attributeLess ? gDialog.colorColorpicker.shownColor
                                               : gDialog.colorColorpicker.color,
                                 "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  

  gEditor.removeAttribute(gNode, "noshade");
  txn = new diStyleAttrChangeTxn(gNode, "border-style",
                                     gDialog.shadedCheckbox.checked ? "" : "solid", "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  

  gEditor.removeAttribute(gNode, "align");
  var ml = "", mr = "";
  if (!attributeLess) {
    if (gDialog.leftAlignButton.hasAttribute("checked")) {
      ml = "0px";
      mr = "auto";
    }
    else if (gDialog.centerAlignButton.hasAttribute("checked")) {
      ml = "auto";
      mr = "auto";
    }
    else if (gDialog.rightAlignButton.hasAttribute("checked")) {
      ml = "auto";
      mr = "0px";
    }
  }
  txn = new diStyleAttrChangeTxn(gNode, "margin-left", ml, "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  
  txn = new diStyleAttrChangeTxn(gNode, "margin-right", mr, "");
  gEditor.transactionManager.doTransaction(txn);
  gEditor.incrementModificationCount(1);  

  gEditor.endTransaction();
}
