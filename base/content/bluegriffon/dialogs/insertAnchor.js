Components.utils.import("resource://app/modules/cssHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");

var gDoc = null;
var gNode = null;
var gIsHTML5 = false;
var gIsWysiwyg = true;
var gIsXml = false;

function Startup()
{
  gNode = window.arguments[0];

  GetUIElements();

  InitDialog();
}

function InitDialog()
{
  document.documentElement.getButton("accept").setAttribute("disabled", "true");

  var doctype = EditorUtils.getCurrentDocument().doctype;
  var systemId = doctype ? doctype.systemId : null;
  gIsXml = false;
  switch (systemId) {
    case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
    case "http://www.w3.org/TR/html4/loose.dtd":
    case "http://www.w3.org/TR/REC-html40/strict.dtd":
    case "http://www.w3.org/TR/REC-html40/loose.dtd":
      gIsXml = false;
      break;
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
    case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
      gIsXml = true;
      break;
    case "":
      gIsXml = (EditorUtils.getCurrentDocument().documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
      break;
    case null:
      gIsXml = (EditorUtils.getCurrentDocument().compatMode == "CSS1Compat");
      break;
  }


  gIsWysiwyg = (EditorUtils.getCurrentViewMode() == "wysiwyg");
  if (!gIsWysiwyg) {
    var source = EditorUtils.getCurrentSourceEditor().getValue();
    var parser = new DOMParser();
    try {
      gDoc = parser.parseFromString(source, gIsXml ? "text/xml" : "text/html");
      if (gDoc.documentElement.nodeName == "parsererror") {
        gDoc = null;
      }
    }
    catch (e) { gDoc = null;}
  }

  if (!gDoc)
    gDoc = EditorUtils.getCurrentDocument();
  gIsHTML5 = (gDoc.doctype && gDoc.doctype.publicId == "");

  var ids = CssUtils.getAllIdsForDocument(gDoc);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (!gDoc.getElementById(id)
        && (gIsHTML5 || !gDoc.querySelector("a[name='" + id + "']"))) {
      gDialog.anchorNameMenulist.appendItem(id, id);
    }
  }

  if (gNode) {
    if (gNode.id)
      gDialog.anchorNameMenulist.value = gNode.id;
    else if (!gIsHTML5 && gNode.nodeName.toLowerCase() == "a" && gNode.hasAttribute("name"))
      gDialog.anchorNameMenulist.value = gNode.getAttribute("name");
    gOriginalAnchor = gDialog.anchorNameMenulist.value;
  }
}

function UpdateButtons()
{
  var id = gDialog.anchorNameMenulist.value;
  if (gNode && id == gOriginalAnchor) {
    document.documentElement.getButton("accept").removeAttribute("disabled");
    return;
  }
  
  if (!id
      || gDoc.getElementById(id)
      || (!gIsHTML5 && gDoc.querySelector("a[name='" + id + "']")))
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
  else
    document.documentElement.getButton("accept").removeAttribute("disabled");
}

function onAccept()
{
  var id = gDialog.anchorNameMenulist.value;

  if (gIsWysiwyg) {
    var editor = EditorUtils.getCurrentEditor();
    if (gNode) {
      if (gOriginalAnchor) {
        if (gNode.id == gOriginalAnchor)
          gNode.id = id;
        else if (gNode.nodeName.toLowerCase() == "a" && gNode.getAttribute("name") == gOriginalAnchor)
          gNode.setAttribute("name", id);
      }
      else
        gNode.id = id;
    }
    else {
      var isCollapsed = editor.selection.isCollapsed;
      if (isCollapsed) {
        editor.beginTransaction();
        var anchor = editor.document.createElement("a")
        anchor.setAttribute("name", id);
        try {
          editor.insertElementAtSelection(anchor, false);
          editor.endTransaction();
          if (gIsHTML5) {
            editor.setAttribute(anchor, "id", id);
            //editor.removeAttribute(anchor, "name");
            //editor.setCaretAfterElement(anchor);
          }
        }
        catch (e) {}
      }
      else
        editor.setInlineProperty("a", gIsHTML5 ? "id" : "name", id)
    }
  }
  else { // SOURCE VIEW
    var srcEditor = EditorUtils.getCurrentSourceEditor();
    var from = srcEditor.getCursor(true);
    var to = srcEditor.getCursor(false);
    isCollapsed = (to.line == from.line && to.ch == from.ch);
    if (isCollapsed) {
      var src = "<a " +
                (gIsHTML5 ? 'id="' + id + '" ': '') +
                'name="' + id +
                '"' +
                (gIsXml ? " />" : "></a>");
      srcEditor.replaceSelection(src);
    }
    else { // not collapsed
      src = "<a " +
            (gIsHTML5 ? 'id="' : 'name="') +
            id +
            '">';
      srcEditor.setCursor(to);
      srcEditor.replaceSelection("</a>");
      to.ch += 4;
      srcEditor.setCursor(from);
      srcEditor.replaceSelection(src);
      if (to.line == from.line)
        to.ch += src.length;
      srcEditor.setSelection(from, to);
    }
  }
}

