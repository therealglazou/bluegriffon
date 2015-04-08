Components.utils.import("resource://app/modules/editorHelper.jsm");

var gNode = null;
var gEditor = null;
var gWhere = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  InitDialog();
  InitDialog2(gNode, gDialog.contentsTree);
}

function onAccept()
{
  gEditor.beginTransaction();

  var doc = EditorUtils.getCurrentDocument();
  if (!gNode) {
    gNode = doc.createElement("select");
    gEditor.insertElementAtSelection(gNode, true);
  }

  ApplyAttributes();

  var child = gNode.lastChild;
  while (child) {
    var tmp = child.previousSibling;
    gEditor.deleteNode(child);
    child = tmp;
  }

  var treeitems = gDialog.contentsTree.querySelectorAll("treeitem");
  var parent = gNode;
  for (var i = 0; i < treeitems.length; i++)
  {
    var treeitem = treeitems[i];
    if (treeitem.hasAttribute("container")) {
      var child = doc.createElement("optgroup");
      child.setAttribute("label", treeitem.firstChild.childNodes[1].getAttribute("label"));
      if (treeitem.firstChild.childNodes[2].getAttribute("label") == "✔")
        child.setAttribute("disabled", "disabled");
      parent = child;
      gEditor.insertNode(child, gNode, gNode.childNodes.length);
    }
    else {
      if (treeitem.parentNode.parentNode.id == "contentsTree")
        parent = gNode;
      var child = doc.createElement("option");
      child.setAttribute("value", treeitem.firstChild.childNodes[0].getAttribute("label"));
      child.textContent = treeitem.firstChild.childNodes[1].getAttribute("label");
      if (treeitem.firstChild.childNodes[2].getAttribute("label") == "✔")
        child.setAttribute("disabled", "disabled");
      if (treeitem.firstChild.childNodes[3].getAttribute("label"))
      child.setAttribute("selected", "selected");
      gEditor.insertNode(child, parent, parent.childNodes.length);
    }
  }

  gEditor.endTransaction();
  gEditor.selection.collapse(gNode, 0);
}

function AddTreeItem(aElt)
{
  var treechildren = aElt.querySelector("treechildren")
  if (!treechildren) {
    treechildren = document.createElement("treechildren");
    aElt.appendChild(treechildren);
    if (aElt != gDialog.contentsTree) {
      aElt.setAttribute("container", "true");
      aElt.setAttribute("open", "true");
    }
  }
  var treeitem = document.createElement("treeitem");
  var treerow = document.createElement("treerow");
  treeitem.appendChild(treerow);
  treechildren.appendChild(treeitem);
  return treeitem;
}

function InitDialog2(node, refTree)
{
  if (!node)
    return;

  var child = node.firstElementChild;
  while (child) {
    var item = null;
    switch (child.nodeName.toLowerCase()) {
      case "option":
        item = AddTreeItem(refTree);
        var cell1 = document.createElement("treecell");
        cell1.setAttribute("label", child.getAttribute("value"));
        var cell2 = document.createElement("treecell");
        cell2.setAttribute("label", child.hasAttribute("label") ? child.getAttribute("label") : child.textContent);
        var cell3 = document.createElement("treecell");
        cell3.setAttribute("label", child.hasAttribute("disabled") ? "✔" : "");
        var cell4 = document.createElement("treecell");
        cell4.setAttribute("label", child.hasAttribute("selected") ? "✔" : "");
        item.firstChild.appendChild(cell1);
        item.firstChild.appendChild(cell2);
        item.firstChild.appendChild(cell3);
        item.firstChild.appendChild(cell4);
        break;
      case "optgroup":
        item = AddTreeItem(refTree);
        var cell1 = document.createElement("treecell");
        cell1.setAttribute("label", child.getAttribute("value"));
        var cell2 = document.createElement("treecell");
        cell2.setAttribute("label", child.hasAttribute("label") ? child.getAttribute("label") : child.textContent);
        var cell3 = document.createElement("treecell");
        cell3.setAttribute("label", child.hasAttribute("disabled") ? "✔" : "");
        var cell4 = document.createElement("treecell");
        cell4.setAttribute("label", child.hasAttribute("selected") ? "✔" : "");
        item.firstChild.appendChild(cell1);
        item.firstChild.appendChild(cell2);
        item.firstChild.appendChild(cell3);
        item.firstChild.appendChild(cell4);
        InitDialog2(child, item)
        break;
      default: break;
    }

    child = child.nextElementSibling;
  }
}

function UpdateButtons()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusButton.disabled = true;
    gDialog.ConfigButton.disabled = true;
    gDialog.DownButton.disabled = true;
    gDialog.UpButton.disabled = true;
    return;
  }

  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  gDialog.MinusButton.disabled = false;
  gDialog.ConfigButton.disabled = false;
  gDialog.UpButton.disabled = !treeitem.previousElementSibling;
  gDialog.DownButton.disabled = !treeitem.nextElementSibling;
}

function AddOptgroup(aWhere)
{
  gWhere = aWhere;
  gDialog.doUpdateOptGroupButton.hidden = true;
  gDialog.doAddOptGroupButton.hidden = false;
  gDialog.optGroupLabelTextbox.value = "";
  gDialog.optGroupDisabledCheckbox.checked = false;
  gDialog.optGroupPanel.openPopup(gDialog.PlusButton,
                                 "after_start", 0, 0,
                                 false, true);
}

function DeleteOpt()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var treechildren = treeitem.parentNode;
  treechildren.removeChild(treeitem);
  if (treechildren.childNode.length == 0)
    treechildren.parentNode.removeChild(treechildren);
  UpdateButtons();
}

function doAddOptGroup()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection) { // nothing in the tree
    item = AddTreeItem(tree);
  }
  else {
    var index = view.selection.currentIndex;
    var treeitem = contentView.getItemAtIndex(index);
  
    if (gWhere == "before" || gWhere == "after") {
      item = document.createElement("treeitem");
      var row = document.createElement("treerow");
      item.appendChild(row);
      if (gWhere == "before")
        treeitem.parentNode.insertBefore(item, treeitem);
      else
        treeitem.parentNode.insertBefore(item, treeitem.nextSibling);
    }
    else if (gWhere == "inside")
      item = AddTreeItem(treeitem);
  }

  var cell1 = document.createElement("treecell");
  cell1.setAttribute("label", "");
  var cell2 = document.createElement("treecell");
  cell2.setAttribute("label", gDialog.optGroupLabelTextbox.value);
  var cell3 = document.createElement("treecell");
  cell3.setAttribute("label", gDialog.optGroupDisabledCheckbox.checked ? "✔" : "");
  var cell4 = document.createElement("treecell");
  cell4.setAttribute("label", "");
  item.firstChild.appendChild(cell1);
  item.firstChild.appendChild(cell2);
  item.firstChild.appendChild(cell3);
  item.firstChild.appendChild(cell4);
  item.setAttribute("container", "true");
  gDialog.optGroupPanel.hidePopup();
  gDialog.contentsTree.view.selection.select(gDialog.contentsTree.contentView.getIndexOfItem(item));
  UpdateButtons();
}

function AddOption(aWhere)
{
  gWhere = aWhere;
  gDialog.doUpdateOptionButton.hidden = true;
  gDialog.doAddOptionButton.hidden = false;
  gDialog.optionLabelTextbox.value = "";
  gDialog.optionValueTextbox.value = "";
  gDialog.optionSelectedCheckbox.checked = false;
  gDialog.optionDisabledCheckbox.checked = false;
  gDialog.optionPanel.openPopup(gDialog.PlusButton,
                                 "after_start", 0, 0,
                                 false, true);
}

function doAddOption()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection) { // nothing in the tree
    item = AddTreeItem(tree);
  }
  else {
    var index = view.selection.currentIndex;
    var treeitem = contentView.getItemAtIndex(index);
  
    if (gWhere == "before" || gWhere == "after") {
      item = document.createElement("treeitem");
      var row = document.createElement("treerow");
      item.appendChild(row);
      if (gWhere == "before")
        treeitem.parentNode.insertBefore(item, treeitem);
      else
        treeitem.parentNode.insertBefore(item, treeitem.nextSibling);
    }
    else if (gWhere == "inside")
      item = AddTreeItem(treeitem);
  }

  var cell1 = document.createElement("treecell");
  cell1.setAttribute("label", gDialog.optionValueTextbox.value);
  var cell2 = document.createElement("treecell");
  cell2.setAttribute("label", gDialog.optionLabelTextbox.value);
  var cell3 = document.createElement("treecell");
  cell3.setAttribute("label", gDialog.optionDisabledCheckbox.checked ? "✔" : "");
  var cell4 = document.createElement("treecell");
  cell4.setAttribute("label", gDialog.optionSelectedCheckbox.checked ? "✔" : "");
  item.firstChild.appendChild(cell1);
  item.firstChild.appendChild(cell2);
  item.firstChild.appendChild(cell3);
  item.firstChild.appendChild(cell4);


  gDialog.optionPanel.hidePopup();
  gDialog.contentsTree.view.selection.select(gDialog.contentsTree.contentView.getIndexOfItem(item));
  UpdateButtons();
}

function UpdateOptions()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection) { // no selection...
    //gDialog.insideMenu.disabled = true;
    gDialog.insideMenu.disabled = true;
    gDialog.addOptionInsideMenuitem.disabled = true;
    gDialog.addOptgroupInsideMenuitem.disabled = true;
    gDialog.beforeMenu.disabled = true;
    gDialog.afterMenu.disabled = false;
    return;
  }

  gDialog.beforeMenu.disabled = false;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var isTopLevel = (treeitem.parentNode.parentNode.id == "contentsTree");
  gDialog.addOptgroupBeforeMenuitem.disabled = !isTopLevel;
  gDialog.addOptgroupAfterMenuitem.disabled = !isTopLevel;

  gDialog.insideMenu.disabled = false;
  gDialog.addOptionInsideMenuitem.disabled = !treeitem.hasAttribute("container");
  gDialog.addOptGroupInsideMenuitem.disabled = true;
}

function Down()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var treechildren = treeitem.parentNode;

  treechildren.insertBefore(treeitem, treeitem.nextSibling.nextSibling);
  gDialog.contentsTree.view.selection.select(contentView.getIndexOfItem(treeitem));
  UpdateButtons();
}

function Up()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var treechildren = treeitem.parentNode;

  treechildren.insertBefore(treeitem, treeitem.previousSibling);
  gDialog.contentsTree.view.selection.select(contentView.getIndexOfItem(treeitem));
  UpdateButtons();
}

function CheckCRInOptGroupPanel(aEvent)
{
  if (aEvent.keyCode == 13) { // CR key
    aEvent.preventDefault();
    doAddOptGroup();
  }
}

function CheckCRInOptionPanel(aEvent)
{
  if (aEvent.keyCode == 13) { // CR key
    aEvent.preventDefault();
    doAddOption();
  }
}

function UpdateUrl()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var isContainer = treeitem.hasAttribute("container");
  if (isContainer) {
    gDialog.doUpdateOptGroupButton.hidden = false;
    gDialog.doAddOptGroupButton.hidden = true;
    gDialog.optGroupLabelTextbox.value = treeitem.firstChild.childNodes[1].getAttribute("label");
    gDialog.optGroupDisabledCheckbox.checked = (treeitem.firstChild.childNodes[2].getAttribute("label") == "✔");
    gDialog.optGroupPanel.openPopup(gDialog.ConfigButton,
                                    "after_start", 0, 0,
                                    false, true);
  }
  else {
    gDialog.doUpdateOptionButton.hidden = false;
    gDialog.doAddOptionButton.hidden = true;
    gDialog.optionLabelTextbox.value = treeitem.firstChild.childNodes[0].getAttribute("label");
    gDialog.optionValueTextbox.value = treeitem.firstChild.childNodes[1].getAttribute("label");
    gDialog.optionSelectedCheckbox.checked = (treeitem.firstChild.childNodes[2].getAttribute("label") == "✔");;
    gDialog.optionDisabledCheckbox.checked = (treeitem.firstChild.childNodes[3].getAttribute("label") == "✔");;
    gDialog.optionPanel.openPopup(gDialog.ConfigButton,
                                   "after_start", 0, 0,
                                   false, true);
  }
}

function doUpdateOptGroup()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var item = contentView.getItemAtIndex(index);
  item.removeChild(item.firstChild);
  var treerow = document.createElement("treerow");
  item.appendChild(treerow);

  var cell1 = document.createElement("treecell");
  cell1.setAttribute("label", "");
  var cell2 = document.createElement("treecell");
  cell2.setAttribute("label", gDialog.optGroupLabelTextbox.value);
  var cell3 = document.createElement("treecell");
  cell3.setAttribute("label", gDialog.optGroupDisabledCheckbox.checked ? "✔" : "");
  var cell4 = document.createElement("treecell");
  cell4.setAttribute("label", "");
  item.firstChild.appendChild(cell1);
  item.firstChild.appendChild(cell2);
  item.firstChild.appendChild(cell3);
  item.firstChild.appendChild(cell4);
  item.setAttribute("container", "true");
  gDialog.optGroupPanel.hidePopup();
  gDialog.contentsTree.view.selection.select(gDialog.contentsTree.contentView.getIndexOfItem(item));
  UpdateButtons();
}

function doUpdateOption()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var item = contentView.getItemAtIndex(index);
  item.removeChild(item.firstChild);
  var treerow = document.createElement("treerow");
  item.appendChild(treerow);

  var cell1 = document.createElement("treecell");
  cell1.setAttribute("label", gDialog.optionLabelTextbox.value);
  var cell2 = document.createElement("treecell");
  cell2.setAttribute("label", gDialog.optionValueTextbox.value);
  var cell3 = document.createElement("treecell");
  cell3.setAttribute("label", gDialog.optionDisabledCheckbox.checked ? "✔" : "");
  var cell4 = document.createElement("treecell");
  cell4.setAttribute("label", gDialog.optionSelectedCheckbox.checked ? "✔" : "");
  item.firstChild.appendChild(cell1);
  item.firstChild.appendChild(cell2);
  item.firstChild.appendChild(cell3);
  item.firstChild.appendChild(cell4);


  gDialog.optionPanel.hidePopup();
  gDialog.contentsTree.view.selection.select(gDialog.contentsTree.contentView.getIndexOfItem(item));
  UpdateButtons();
}
