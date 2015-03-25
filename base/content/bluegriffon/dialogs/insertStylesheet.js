Components.utils.import("resource://app/modules/editorHelper.jsm");

var gDoc = null;
var gEditor = null;

function Startup()
{
  GetUIElements();
  gEditor = EditorUtils.getCurrentEditor();
  gDoc = gEditor.document;
  ListStylesheets();
}

function ListStylesheets()
{
  var treechildren = gDialog.contentsTree.querySelector("treechildren");
  if (treechildren)
    treechildren.parentNode.removeChild(treechildren);

  var headElt = gDoc.querySelector("head");
  var styleElts = headElt.querySelectorAll("style,link[rel='stylesheet'],link[rel='alternate stylesheet']");
  for (var i = 0; i < styleElts.length; i++) {
    var item = AddTreeItem(gDialog.contentsTree);
    var s = styleElts[i];
    var t1, t2, t3, t4;
    if (s.nodeName.toLowerCase() == "style") {
      t1 = "<style>";
      t2 = "";
      t3 = s.getAttribute("title");
      t4 = s.getAttribute("media");
    }
    else {
      t1 = s.getAttribute("href");
      t2 = ((s.getAttribute("rel").toLowerCase().trim() == "alternate stylesheet") ? "✔" : "");
      t3 = s.getAttribute("title");
      t4 = s.getAttribute("media");
    }
    var cell1 = document.createElement("treecell");
    cell1.setAttribute("label", t1);
    var cell2 = document.createElement("treecell");
    cell2.setAttribute("label", t2);
    var cell3 = document.createElement("treecell");
    cell3.setAttribute("label", t3);
    var cell4 = document.createElement("treecell");
    cell4.setAttribute("label", t4);
    item.firstChild.appendChild(cell1);
    item.firstChild.appendChild(cell2);
    item.firstChild.appendChild(cell3);
    item.firstChild.appendChild(cell4);
    item.setUserData("element", s, null);
  }
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

function AddStylesheet()
{
  window.openDialog("chrome://bluegriffon/content/dialogs/editStylesheet.xul",
                    "_blank",
                    "chrome,modal,titlebar,resizable=yes,dialog=yes",
                    null);
  ListStylesheets();
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

function DeleteStylesheet()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var elt = treeitem.getUserData("element");
  gEditor.deleteNode(elt);
  treeitem.parentNode.removeChild(treeitem);
}

function Up()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var previous = contentView.getItemAtIndex(index-1);

  var elt = treeitem.getUserData("element");
  var previousElt = previous.getUserData("element");
  var child = previousElt.parentNode.firstChild;
  var index = 0;
  while (child && child != previousElt) {
    index++;
    child = child.nextSibling;
  }
  gEditor.insertNode(elt, elt.parentNode, index);
  treeitem.parentNode.insertBefore(treeitem, previous);
}

function Down()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var next = contentView.getItemAtIndex(index+1);

  var elt = treeitem.getUserData("element");
  var nextElt = next.getUserData("element");
  var child = nextElt.parentNode.firstChild;
  var index = 0;
  while (child && child != nextElt) {
    index++;
    child = child.nextSibling;
  }
  gEditor.insertNode(elt, elt.parentNode, index+1);
  treeitem.parentNode.insertBefore(treeitem, next.nextSibling);
}

function UpdateStylesheet()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var elt = treeitem.getUserData("element");

  window.openDialog("chrome://bluegriffon/content/dialogs/editStylesheet.xul",
                    "_blank",
                    "chrome,modal,titlebar,resizable=yes,dialog=yes",
                    elt);
  ListStylesheets();
}

