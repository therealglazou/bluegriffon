Components.utils.import("resource://app/modules/editorHelper.jsm");

function UpdateStructureBarContextMenu()
{
  var target = GetSelectedElementInTree();
  if (target) // sanity check
    try {
      gMain.ScrollToElement(target);
      try {
        EditorUtils.getCurrentEditor().selectElement(target);
      }
      catch(e) {}
    }
    catch(e) {}

  if (target && target.hasAttribute("lang"))
    gDialog.resetElementLanguageMenuitem.removeAttribute("disabled");
  else
    gDialog.resetElementLanguageMenuitem.setAttribute("disabled", "true");

  if (target && (target.nodeName.toLowerCase() == "body"
                 || target.nodeName.toLowerCase() == "head"
                 || target.nodeName.toLowerCase() == "html"))
  {
    gDialog.deleteElementMenuitem.setAttribute("disabled", "true");
    gDialog.removeTagMenuitem.setAttribute("disabled", "true");
    gDialog.changeTagMenuitem.setAttribute("disabled", "true");
  }
  else
  {
    gDialog.deleteElementMenuitem.removeAttribute("disabled");
    gDialog.removeTagMenuitem.removeAttribute("disabled");
    gDialog.changeTagMenuitem.removeAttribute("disabled");
  }
}

function ResetLanguage(aEvent)
{
  var target = GetSelectedElementInTree();
  if (target)
  {
    var editor = EditorUtils.getCurrentEditor();
    editor.removeAttribute(target, "lang");
    SelectionChanged(null, target, true);
  }
}

function ShowLanguageDialog(aEvent)
{
  var target = GetSelectedElementInTree();
  if (target) {
    window.openDialog("chrome://bluegriffon/content/dialogs/languages.xul","_blank",
                      "chrome,modal,titlebar,resizable", target);
    SelectionChanged(null, target, true);
  }
}

function DeleteElement(aEvent)
{
  var target = GetSelectedElementInTree();
  if (target)
  {
    var editor = EditorUtils.getCurrentEditor();
    editor.deleteNode(target);
  }
}

function ExplodeElement(aEvent)
{
  var target = GetSelectedElementInTree();
  if (target)
  {
    var editor = EditorUtils.getCurrentEditor();
    var parent = target.parentNode;
    editor.beginTransaction();

    var child = target.lastChild;
    while (child) {
      var tmp = child.previousSibling;
      var clone = child.cloneNode(true)
      var txn = new diNodeInsertionTxn(clone, parent, target);
      editor.transactionManager.doTransaction(txn);

      child = tmp;
    }
    editor.deleteNode(target);

    editor.endTransaction();
    var c = gMain.EditorUtils.getSelectionContainer();
    if (c)
      SelectionChanged(null, c.node, c.oneElementSelected);
  }
}

function ChangeTag(aEvent)
{
  var target = GetSelectedElementInTree();
  var name = target.nodeName.toLowerCase();
  if (name == "html" || name == "body" || name == "head")
    return;

  var tree = gDialog.elementsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  gDialog.elementsTree.startEditing(index, gDialog.elementsTree.columns[0]);
}

function onElementsTreeModified(aEvent)
{
  var target = aEvent.target;
  if (target != gDialog.elementsTree)
    return;

  var attrChange = aEvent.attrChange;
  var attrName = aEvent.attrName;
  var newValue = aEvent.newValue;

  if (attrName == "editing") {
    if (attrChange == 2) { // start editing
      var target = GetSelectedElementInTree();
      var name = target.nodeName.toLowerCase();
      if (name == "html" || name == "body" || name == "head")
        gDialog.elementsTree.stopEditing(false);
    }
    else if (attrChange == 3) { // end editing
      var tree = gDialog.elementsTree;
      var contentView = tree.contentView;
      var view = tree.view;
      var index = view.selection.currentIndex;
      var newName  = gDialog.elementsTree.view.getCellText(index, gDialog.elementsTree.columns[0]);
      if (newName == "html" || newName == "body" || newName == "head")
        return;
      var target = GetSelectedElementInTree();
      var name = target.nodeName.toLowerCase();
      if (newName == name)
        return;

      var editor = EditorUtils.getCurrentEditor();
      var offset = 0;
      var childNodes = target.parentNode.childNodes;
      while (childNodes.item(offset) != target) {
        offset++;
      }
  
      editor.beginTransaction();
  
      try {
        var newElt = editor.document.createElement(newName);
        for (var i = 0; i < target.attributes.length; i++) {
          var attr = target.attributes[i];
          newElt.setAttributeNS(attr.namespaceURI,
                                attr.localName,
                                attr.nodeValue);
        }
        if (newElt) {
          childNodes = target.childNodes;
          var childNodesLength = childNodes.length;
          var i;
          for (i = 0; i < childNodesLength; i++) {
            var clone = childNodes.item(i).cloneNode(true);
            newElt.appendChild(clone);
          }
          editor.insertNode(newElt, target.parentNode, offset+1);
          editor.deleteNode(target);
          editor.selectElement(newElt);
  
          window.content.focus();
        }
      }
      catch (e) {}
  
      editor.endTransaction();
      gMain.ComposerCommands.updateSelectionBased(false);
    }
  }
}

function onARIARoleChangeStructureBar()
{
  var node = GetSelectedElementInTree();
  var state = node.getAttribute("role");
  var popup = gDialog.ARIARoleStructureBarPopup;
  var child = popup.firstElementChild;
  while (child) {
    if (child.getAttribute("value") == state)
      child.setAttribute("checked", "true");
    else
      child.removeAttribute("checked");
    child = child.nextElementSibling;
  }
}
