Components.utils.import("resource://app/modules/editorHelper.jsm");

var gNode = null;
var gEditor = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  var doc = EditorUtils.getCurrentDocument();
  var elts = doc.querySelectorAll("button[id], input[id]:not([type='hidden']), keygen[id], meter[id], output[id], progress[id], select[id], textarea[id]");
  var ids = [];
  for (var i = 0; i < elts.length; i++)
    ids.push(elts[i].id);
  ids.sort;
  for (var i = 0; i < ids.length; i++)
    gDialog.forMenulist.appendItem(ids[i], ids[i]);

  if (gNode) {
    InitDialog();
  }
}

function onAccept()
{
  gEditor.beginTransaction();

  if (!gNode) {
    var doc = EditorUtils.getCurrentDocument();
    gNode = doc.createElement("label");
    //gNode.appendChild(doc.createElement("br"));
    gEditor.insertElementAtSelection(gNode, true);
  }

  ApplyAttributes();

  gEditor.endTransaction();
  gEditor.selection.collapse(gNode, 0);
}
