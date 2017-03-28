Components.utils.import("resource://gre/modules/editorHelper.jsm");

var gNode = null;
var gEditor = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  InitDialog();

#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function onAccept()
{
  gEditor.beginTransaction();

  if (!gNode) {
    var doc = EditorUtils.getCurrentDocument();
    gNode = doc.createElement("button");
    gNode.appendChild(doc.createTextNode(gEditor.selection.toString()));
    gEditor.insertElementAtSelection(gNode, true);
  }

  ApplyAttributes();

  gEditor.endTransaction();
  gEditor.selection.collapse(gNode, 0);
}
