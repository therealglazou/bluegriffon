Components.utils.import("resource://app/modules/editorHelper.jsm");

function Startup()
{
  GetUIElements();
}

function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();

  editor.beginTransaction();
  editor.insertHTML(gDialog.htmlTextbox.value);
  window.opener.MakePhpAndCommentsVisible(EditorUtils.getCurrentDocument());
  editor.endTransaction();

  return true;
}
