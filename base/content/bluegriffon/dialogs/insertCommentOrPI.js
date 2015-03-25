const BLUEGRIFFON_NS = "http://disruptive-innovations.com/zoo/bluegriffon";

var gNode = null;

function Startup()
{
  gNode = window.arguments[0]; 
  GetUIElements();

  if (gNode) {
    switch (gNode.nodeName) {
      case "comment":
      case "php":
        gDialog.dataTextbox.value = gNode.lastChild.data;
        break;
      case "pi":
        gDialog.targetTextbox.value = gNode.lastChild.target;
        gDialog.targetTextbox.setAttribute("readonly", "true");
        gDialog.dataTextbox.value = gNode.lastChild.data;
        break;
    }
  }
  Toggle();
}

function Toggle()
{
  var value = gDialog.typeRadiogroup.value;
  switch (value) {
    case "comment":
      gDialog.targetBox.setAttribute("style", "visibility: hidden");
      gDialog.dataLabel.hidden = true;
      gDialog.dataTextbox.focus();
      break;
    case "php":
      gDialog.targetBox.setAttribute("style", "visibility: hidden");
      gDialog.dataLabel.hidden = true;
      gDialog.dataTextbox.focus();
      break;
    case "pi":
      gDialog.targetBox.removeAttribute("style");
      gDialog.dataLabel.hidden = false;
      if (gNode)
        gDialog.dataTextbox.focus();
      else
        gDialog.targetTextbox.focus();
      break;
    default: break;
  }
}

function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();
  var doc = editor.document;

  var value = gDialog.typeRadiogroup.value;
  var text;
  switch (value) {
    case "comment":
      text = gDialog.dataTextbox.value;
      break;
    case "php":
      text = gDialog.dataTextbox.value;
      break;
    case "pi":
      text = gDialog.targetTextbox.value + " " + gDialog.dataTextbox.value;
      break;
  }
  if (text.length > 22)
    text = text.substr(0, 22) + "...";

  if (gNode) {
    editor.beginTransaction();
    editor.setAttribute(gNode, "title", text);
    var txn = new diCommentOrPIChangeTxn(gNode.lastChild, gDialog.dataTextbox.value);
    editor.transactionManager.doTransaction(txn);
    editor.endTransaction();

    return true;
  }

  var node, container;
  switch (value) {
    case "comment":
      node = doc.createComment(gDialog.dataTextbox.value);
      container = doc.createElementNS(BLUEGRIFFON_NS, "comment");
      break;
    case "php":
      node = doc.createProcessingInstruction("php", gDialog.dataTextbox.value);
      container = doc.createElementNS(BLUEGRIFFON_NS, "php");
      break;
    case "pi":
      node = doc.createProcessingInstruction(gDialog.targetTextbox.value, gDialog.dataTextbox.value);
      container = doc.createElementNS(BLUEGRIFFON_NS, "pi");
      break;
  }
  container.setAttribute("xmlns", BLUEGRIFFON_NS);
  container.appendChild(node);
  container.setAttribute("title", text);
  editor.insertElementAtSelection(container, true);

  return true;
}
