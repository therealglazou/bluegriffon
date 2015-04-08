Components.utils.import("resource://app/modules/editorHelper.jsm");

const kSPEEDS = [1, 10, 50, 100, 150, 250, 350, 500, 750, 1000];
var dontFocus = false;

function Startup()
{
  GetUIElements();

  for (var i = 0; i < OPQUAST_CRITERIA.length; i++) {
    var item = document.createElement("richlistitem");
    var label = document.createElement("label");
    label.className = "index";
    label.setAttribute("value", (i+1) + ".");
    var desc = document.createElement("description");
    item.appendChild(label);
    item.appendChild(desc);
    gDialog.items.appendChild(item);
    desc.textContent = gDialog.a11yBundle.getString(OPQUAST_CRITERIA[i].label);
  }

}

function onFocus()
{
  if (dontFocus) {
    dontFocus = false;
    return;
  }
  GetUIElements();
  gDialog.greens.style.width = "0px";
  gDialog.reds.style.width = "0px";

  var doc, source;
  if (EditorUtils.getCurrentEditorWindow().GetCurrentViewMode() == "wysiwyg") {
    doc = EditorUtils.getCurrentDocument();
    source = false;
  }
  else {
    source = true;
    var editorElement = EditorUtils.getCurrentEditorElement();
    var sourceIframe = editorElement.previousSibling;
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    if (sourceEditor)
    {
      source = sourceEditor.getValue();
      var doctype = EditorUtils.getCurrentDocument().doctype;
      var systemId = doctype ? doctype.systemId : null;
      var isXML = false;
      switch (systemId) {
        case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
        case "http://www.w3.org/TR/html4/loose.dtd":
        case "http://www.w3.org/TR/REC-html40/strict.dtd":
        case "http://www.w3.org/TR/REC-html40/loose.dtd":
        case null:
          isXML = false;
          break;
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
        case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
          isXML = true;
          break;
        case "":
          isXML = (EditorUtils.getCurrentDocument().documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
          break;
      }
      var parser = new DOMParser();
      try {
        doc = parser.parseFromString(source, isXML ? "text/xml" : "text/html");
        if (doc.documentElement.nodeName == "parsererror") {
          doc = null
        }
      }
      catch(e) {alert(e)}
    }
  }
  
  var child = gDialog.items.firstElementChild;
  while (child) {
    child.className = "";
    child = child.nextElementSibling;
  }

  if (doc) {
    Scheduler(0, doc, 0, 0, source);
  }
}

function Scheduler(i, doc, greens, reds, source)
{
  var length = OPQUAST_CRITERIA.length;
  if (i >= length)
    return;

  var op = OPQUAST_CRITERIA[i];

  var item = gDialog.items.childNodes.item(i);
  gDialog.items.ensureElementIsVisible(item)
  var check = op.checker(doc, source);
  if (true == check) {
    greens++;
    item.className = "passed";
  }
  else if (false == check) {
    reds++;
    item.className = "failed";
  }

  gDialog.greens.style.width = (greens * 300 /length) + "px";
  gDialog.reds.style.width = (reds * 300 /length) + "px";

  setTimeout(Scheduler, kSPEEDS[10 - parseInt(gDialog.speedBox.value)], i+1, doc, greens, reds, source);
}

function Show(aEvent, aMode)
{
  gDialog.items.setAttribute("class", aMode);
  aEvent.stopPropagation();
}
