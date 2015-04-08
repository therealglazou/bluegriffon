Components.utils.import("resource://app/modules/editorHelper.jsm");

var gNode = null;
var gType = null;
var gEditor = null;

const kPARAMETERS = [
  ["name", "value", "disabled", "form"],
  ["name", "value", "disabled", "form", "autocomplete", "list", "maxlength", "pattern", "placeholder", "readonly", "required", "size"],
  ["name", "value", "disabled", "form", "autocomplete", "list", "maxlength", "multiple", "pattern", "placeholder", "readonly", "required", "size"],
  ["name", "value", "disabled", "form", "autocomplete", "maxlength", "pattern", "placeholder", "readonly", "required", "size"],
  ["name", "value", "disabled", "form", "autocomplete", "list", "max", "min", "readonly", "required", "step"],
  ["name", "value", "disabled", "form", "autocomplete", "list", "max", "min", "readonly", "required", "step"],
  ["name", "value", "disabled", "form", "autocomplete", "list", "max", "min", "step"],
  ["name", "value", "disabled", "form", "autocomplete", "list"],
  ["name", "value", "disabled", "form", "checked", "required"],
  ["name", "value", "disabled", "form", "accept", "multiple", "required"],
  ["name", "value", "disabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"],
  ["name", "value", "disabled", "form", "alt", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "src", "width"],
  ["name", "value", "disabled", "form"]
];

const kTYPES = {
  "hidden":         0,
  "text":           1,
  "search":         1,
  "url":            1,
  "tel":            1,
  "email":          2,
  "password":       3,
  "datetime":       4,
  "date":           4,
  "month":          4,
  "week":           4,
  "time":           4,
  "datetime-local": 5,
  "number":         5,
  "range":          6,
  "color":          7,
  "checkbox":       8,
  "radio":          8,
  "file":           9,
  "submit":         10,
  "image":          11,
  "reset":          12,
  "button":         12
};

function Startup()
{
  gNode = window.arguments[0];
  gType = window.arguments[1];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  gDialog.typeMenulist.value = gType;
  InitDialog();
  if (gNode) {
    gDialog.typeMenulist.disabled = true;
    document.documentElement.getButton("accept").disabled = false;
  }

  //window.sizeToContent();
  AdaptDialog();
}

function AdaptDialog()
{
  if (!("typeMenulist" in gDialog))
    return;

  var type = gDialog.typeMenulist.value;
  var attrType = kTYPES[type];
  var visibleAttributes = kPARAMETERS[attrType];
  var rows = gDialog.mainGrid.querySelectorAll("row");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var attr = row.getAttribute("attribute");
    row.collapsed = (visibleAttributes.indexOf(attr) == -1);
  }
  //window.sizeToContent();
}

function onAccept()
{
  gEditor.beginTransaction();

  if (!gNode) {
    gNode = EditorUtils.getCurrentDocument().createElement("input");
    gNode.setAttribute("type", gDialog.typeMenulist.value);
    gEditor.insertElementAtSelection(gNode, true);
  }

  ApplyAttributes();

  gEditor.endTransaction();
}