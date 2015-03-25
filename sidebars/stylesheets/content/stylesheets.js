Components.utils.import("resource://app/modules/editorHelper.jsm");

Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/fileChanges.jsm");

var gMain = null;
var gDoc = null;
var gEditor = null;

var gMutationObserver = null;

var gIsPanelActive = true;

function Startup()
{
  GetUIElements();

  if (window.top &&
      "NotifierUtils" in window.top)
    gMain = window.top;
  else if (window.top && window.top.opener &&
           "NotifierUtils" in window.top.opener)
    gMain = window.top.opener;

  if (!gMain)
    return;

  gMain.NotifierUtils.addNotifierCallback("tabClosed",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.addNotifierCallback("tabCreated",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.addNotifierCallback("tabSelected",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("redrawPanel",
                                    RedrawAll,
                                    window);
  gMain.NotifierUtils.addNotifierCallback("panelClosed",
                                    PanelClosed,
                                    window);
  gMain.NotifierUtils.addNotifierCallback("afterEnteringSourceMode",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("afterLeavingSourceMode",
                                          Inspect,
                                          window);
  gDialog.contentsTree.addEventListener("DOMAttrModified", onTreeModified, true);
  gMutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.getAttribute("class") == "enabledCheckbox") {
        var treeitem = mutation.target.parentNode.parentNode;
        var elt = treeitem.getUserData("element");
        var sheet = elt.sheet;
        sheet.disabled = !(mutation.target.getAttribute("value") == "true");
      }
    });    
  });
  Inspect();
}

function Shutdown()
{
  gDialog.contentsTree.removeEventListener("DOMAttrModified", onTreeModified, true);
  gMutationObserver.disconnect();

  gMain.NotifierUtils.removeNotifierCallback("tabClosed",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("tabCreated",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("tabSelected",
                                             Inspect,
                                             window);
  gMain.NotifierUtils.removeNotifierCallback("redrawPanel",
                                    RedrawAll,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("panelClosed",
                                    PanelClosed,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("afterEnteringSourceMode",
                                             Inspect,
                                             window);
  gMain.NotifierUtils.removeNotifierCallback("afterLeavingSourceMode",
                                             Inspect,
                                             window);
}

function RedrawAll(aNotification, aPanelId)
{
  if (aPanelId == "panel-stylesheets") {
    gIsPanelActive = true;
  }
}

function PanelClosed(aNotification, aPanelId)
{
  if (aPanelId == "panel-stylesheets")
    gIsPanelActive = false;
}

function Inspect()
{
  var editor = gMain.EditorUtils.getCurrentEditor();
  var visible = editor && (gMain.GetCurrentViewMode() == "wysiwyg");
  gDialog.mainBox.style.visibility = visible ? "" : "hidden";
  if (!visible) {
    return;
  }

  if (!editor || !editor.document)
    return;

  var sets = editor.document.styleSheetSets;
  deleteAllChildren(gDialog.stylesheetSetsMenupopup);
  if (sets.length) {
    gDialog.stylesheetSetsMenulist.disabled = false;
    var preferred = editor.document.preferredStyleSheetSet;
    if (preferred) {
      gDialog.stylesheetSetsMenulist.appendItem(preferred, preferred);
      if (sets.length > 1)
        gDialog.stylesheetSetsMenupopup.appendChild(document.createElement("menuseparator"));
    }
    for (var i = 0; i < sets.length; i++) {
      var sset = sets.item(i);
      if (sset != preferred)
        gDialog.stylesheetSetsMenulist.appendItem(sset, sset);
    }
    // WARNING: plagged by https://bugzilla.mozilla.org/show_bug.cgi?id=894874
    gDialog.stylesheetSetsMenulist.value = editor.document.selectedStyleSheetSet;
  }
  else {
    gDialog.stylesheetSetsMenulist.appendItem("--", "--");
    gDialog.stylesheetSetsMenulist.value = "--";
    gDialog.stylesheetSetsMenulist.disabled = true;
  }

  var treechildren = gDialog.contentsTree.querySelector("treechildren");
  if (treechildren)
    treechildren.parentNode.removeChild(treechildren);

  gEditor = editor;
  gDoc = gMain.EditorUtils.getCurrentDocument();
  var headElt = gDoc.querySelector("head");
  var styleElts = headElt.querySelectorAll("style,link[rel='stylesheet'],link[rel='alternate stylesheet']");
  for (var i = 0; i < styleElts.length; i++) {
    var item = AddTreeItem(gDialog.contentsTree);
    var s = styleElts[i];
    var t1, t2, t3, t4, tooltip;
    if (s.nodeName.toLowerCase() == "style") {
      t1 = "<style>";
      t2 = "";
      t3 = s.hasAttribute("title") ? s.getAttribute("title") : "";
      t4 = s.hasAttribute("media") ? s.getAttribute("media") : "";
      tooltip = s.textContent;
    }
    else {
      t1 = s.getAttribute("href");
      t2 = ((s.getAttribute("rel").toLowerCase().trim() == "alternate stylesheet") ? "✔" : "");
      t3 = s.hasAttribute("title") ? s.getAttribute("title") : "";
      t4 = s.hasAttribute("media") ? s.getAttribute("media") : "";
      tooltip = "";
    }
    var cell0 = document.createElement("treecell");
    cell0.setAttribute("value", s.sheet.disabled ? "false" : "true");
    cell0.setAttribute("class", "enabledCheckbox");
    var config = { attributes: true };
    gMutationObserver.observe(cell0, config);

    var cell1 = document.createElement("treecell");
    cell1.setAttribute("label", t1);
    var cell2 = document.createElement("treecell");
    cell2.setAttribute("label", t2);
    var cell3 = document.createElement("treecell");
    cell3.setAttribute("label", t3);
    var cell4 = document.createElement("treecell");
    cell4.setAttribute("label", t4);
    item.firstChild.appendChild(cell0);
    item.firstChild.appendChild(cell1);
    item.firstChild.appendChild(cell2);
    item.firstChild.appendChild(cell3);
    item.firstChild.appendChild(cell4);
    item.setAttribute("tooltiptext", tooltip);
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
  Inspect();
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
  Inspect();
}

function OpenStylesheet()
{
  var tree = gDialog.contentsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var elt = treeitem.getUserData("element");

  var editor = gMain.EditorUtils.getCurrentEditor();

  var href = elt.href;
  if (!href || href.substr(0, 8) == "file:///")
  {
    if (elt.nodeName.toLowerCase() == "style")
      source = elt.textContent;
    else
      source = GetFileContents(href);
    var rv = {value: source, cancelled: true};
    window.openDialog("chrome://stylesheets/content/editor.xul","_blank",
                      "chrome,modal=yes,titlebar,resizable=yes,dialog=no", rv, href);
    if (!rv.cancelled)
    {
      if (elt.nodeName.toLowerCase() == "style") {
        editor.beginTransaction();
        var child = elt.lastChild;
        while (child) {
          var tmp = child.previousSibling;
          editor.deleteNode(child);
          child = tmp;
        }
        editor.insertNode(editor.document.createTextNode(rv.value), elt, 0);
        editor.endTransaction();
      }
      else {
        SaveFileContents(href, rv.value);

        var parent = elt.parentNode;
        var nextElt = elt.nextSibling;
        parent.removeChild(elt);

        // reinsert the owner element to force reload of stylesheet
        parent.insertBefore(elt, nextElt);
        gMain.EditorUtils.getCurrentEditor().incrementModificationCount(1);
      }
      Inspect();
    }
  }
}

function GetFileContents(aSpec)
{
  var data = "";
  var file = UrlUtils.newLocalFile(aSpec);
  var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                createInstance(Components.interfaces.nsIFileInputStream);
  var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                createInstance(Components.interfaces.nsIConverterInputStream);
  fstream.init(file, -1, 0, 0);
  cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
  
  let (str = {}) {
    let read = 0;
    do { 
      read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
      data += str.value;
    } while (read != 0);
  }
  cstream.close(); // this closes fstream
  return data;
}

function SaveFileContents(aSpec, aSource)
{
  try {
    var file = UrlUtils.newLocalFile(aSpec);
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                   createInstance(Components.interfaces.nsIFileOutputStream);
    
    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.
    
    // if you are sure there will never ever be any non-ascii text in data you can 
    // also call foStream.writeData directly
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                    createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foStream, "UTF-8", 0, 0);
    converter.writeString(aSource);
    converter.close(); // this closes foStream
    FileChangeUtils.notifyFileModifiedByBlueGriffon(aSpec);
  }
  catch(e) {}
}

function onTreeModified(aEvent)
{
  if (aEvent.target != gDialog.contentsTree) // sanity check
    return;

  if (aEvent.attrName == "editing" && aEvent.attrChange == 2) { // we started editing
    // stop it immediately
    gDialog.contentsTree.stopEditing(false);
  }
}

function SelectStyleSet(aList)
{
  var editor = gMain.EditorUtils.getCurrentEditor();
  editor.document.selectedStyleSheetSet = aList.value;
  Inspect();
}
