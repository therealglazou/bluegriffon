Components.utils.import("resource://app/modules/editorHelper.jsm");

function Startup()
{
  GetUIElements();

  var doc = EditorUtils.getCurrentDocument();
  var query = "head > link[href^='" + kLOADER_URL + "'][rel='stylesheet'], " +
              "head > link[href^='" + kLOADER_URL.replace( /\&/g, "&amp;") + "'][rel='stylesheet'] ";
  var links = doc.querySelectorAll(query);
  for (var i = 0; i < links.length; i++) {
    var l = links[i];
    var url = l.getAttribute("href");
    var params = url.substr(kLOADER_URL.length);

    var families = params.split("|");
    for (var j = 0; j < families.length; j++) {
      var f = families[j];
      var m = f.match( /([^\:|\&]*)(:([^|&]*))?((&|&amp;)subset=(.*))?/ );
      var family = m[1].replace(/\+/g, " ");
      var variants = m[3];
      var subsets = m[6];

      var treeitem  = document.createElement("treeitem");
      var treerow   = document.createElement("treerow");
      var treecell1 = document.createElement("treecell");
      var treecell2 = document.createElement("treecell");
      var treecell3 = document.createElement("treecell");
      treecell1.setAttribute("label", family);
      treecell2.setAttribute("label", variants ? variants : "");
      treecell3.setAttribute("label", subsets ? subsets : "");
      treerow.appendChild(treecell1);
      treerow.appendChild(treecell2);
      treerow.appendChild(treecell3);
      treeitem.appendChild(treerow)
      gDialog.installedFontsTreechildren.appendChild(treeitem);
    }
  }
}

function UpdateButtons()
{
  var tree = gDialog.installedFontsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusButton.disabled = true;
    return;
  }

  gDialog.MinusButton.disabled = false;
}

function DeleteFontFamily()
{
  var tree = gDialog.installedFontsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  treeitem.parentNode.removeChild(treeitem);
 }
 
 function AddFontFamily()
 {
    var rv = {value: false};
    window.openDialog('chrome://gfd/content/addFont.xul',"_blank",
                      "chrome,resizable=no,modal,scrollbars=yes", rv);
    if (rv.value) {
      var treeitem  = document.createElement("treeitem");
      var treerow   = document.createElement("treerow");
      var treecell1 = document.createElement("treecell");
      var treecell2 = document.createElement("treecell");
      var treecell3 = document.createElement("treecell");
      treecell1.setAttribute("label", rv.family);
      treecell2.setAttribute("label", rv.variants ? rv.variants : "");
      treecell3.setAttribute("label", rv.subsets ? rv.subsets : "");
      treerow.appendChild(treecell1);
      treerow.appendChild(treecell2);
      treerow.appendChild(treecell3);
      treeitem.appendChild(treerow)
      gDialog.installedFontsTreechildren.appendChild(treeitem);
    }
 }
 
 function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();
  editor.beginTransaction();

  // clean the existing calls to the GFD
  var doc = EditorUtils.getCurrentDocument();
  var query = "head > link[href^='" + kLOADER_URL + "'][rel='stylesheet'], " +
              "head > link[href^='" + kLOADER_URL.replace( /\&/g, "&amp;") + "'][rel='stylesheet'] ";
  var links = doc.querySelectorAll(query);
  for (var i = links.length -1; i >= 0; i--) {
    var l = links[i];
    editor.deleteNode(l);
  }

  // now reinstall the new calls
  var treerows = document.querySelectorAll("treerow");
  var head = doc.querySelector("head");
  var ref = head.firstChild;
  for (var i = 0; i < treerows.length; i++) {
    var treerow = treerows[i];
    var family   = treerow.firstElementChild.getAttribute("label");
    var variants = treerow.firstElementChild.nextSibling.getAttribute("label");
    var subsets  = treerow.lastElementChild.getAttribute("label");

    var url = kLOADER_URL + family.replace(/ /g, "+");
    if (variants)
      url += ":" + variants;
    if (subsets)
      url += "&subsets=" + subsets;

    var link = doc.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", url);
    editor.insertNode(link, head, 0);
  }

  editor.endTransaction();

  return true;
}

