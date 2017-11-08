const kLIVEVIEW_UPDATE_DELAY = 500;
var gUpdateWysiwygLiveViewTimeOutID = null;
var gUpdateSourceLiveViewTimeOutID = null;

function _UpdateSourceLiveView()
{
  if (EditorUtils.getCurrentViewMode() == "liveview" &&
      EditorUtils.getLiveViewMode() == "wysiwyg") { // sanity check

    gUpdateSourceLiveViewTimeOutID = null;

    try {
      var editor = EditorUtils.getCurrentEditor();
      var editorElement = EditorUtils.getCurrentEditorElement();
      var deck = editorElement.parentNode;
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;

      var doctype = EditorUtils.getCurrentDocument().doctype;
      var systemId = doctype ? doctype.systemId : null;
      var isXML = false;
      switch (systemId) {
        case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
        case "http://www.w3.org/TR/html4/loose.dtd":
        case "http://www.w3.org/TR/REC-html40/strict.dtd":
        case "http://www.w3.org/TR/REC-html40/loose.dtd":
          isXML = false;
          break;
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
        case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
          isXML = true;
          break;
        case "":
        case "about:legacy-compat":
          isXML = (EditorUtils.getCurrentDocument().documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
          break;
        case null:
          isXML = (EditorUtils.getCurrentDocument().compatMode == "CSS1Compat");
          break;
      }

      EditorUtils.cleanup();

      var mimeType = EditorUtils.getCurrentDocumentMimeType();
      const nsIDE = Components.interfaces.nsIDocumentEncoder;
      var encoder = Components.classes["@mozilla.org/layout/documentEncoder;1?type=" + mimeType]
                     .createInstance(nsIDE);

      var flags = EditorUtils.getSerializationFlags(EditorUtils.getCurrentDocument());

      encoder.setCharset(editor.documentCharacterSet);
      encoder.init(EditorUtils.getCurrentDocument(), mimeType, flags.value);
      if (flags.value & nsIDE.OutputWrap)
        encoder.setWrapColumn(flags.maxColumnPref);

      var source = encoder.encodeToString();

      var lastEditableChild = editor.document.body.lastChild;
      if (lastEditableChild.nodeType == Node.TEXT_NODE)
        lastEditableChild.data = lastEditableChild.data.replace( /\s*$/, "\n");

      MarkSelection();
      source = encoder.encodeToString();
      UnmarkSelection();

      sourceEditor.setValue(source.replace( /\r\n/g, "\n").replace( /\r/g, "\n"));
      sourceIframe.contentWindow.wrappedJSObject.markSelection();
      sourceIframe.setUserData("oldSource", sourceEditor.getValue(), null);
      sourceIframe.setUserData("lastSaved", "", null);

      sourceIframe.contentWindow.wrappedJSObject.isXML = isXML;
    }
    catch(e) {Services.prompt.alert(null, "UpdateSourceLiveView", e);}
  }
}

function _UpdateWysiwygLiveView()
{
  try {
    if (EditorUtils.getCurrentViewMode() == "liveview") {
      if (EditorUtils.getLiveViewMode() == "source") {

        gUpdateWysiwygLiveViewTimeOutID = null;

        var editor = EditorUtils.getCurrentEditor();
        var editorElement = EditorUtils.getCurrentEditorElement();
        var deck = editorElement.parentNode;
        var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
        var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;

        var doctype = EditorUtils.getCurrentDocument().doctype;
        var systemId = doctype ? doctype.systemId : null;
        var isXML = false;
        switch (systemId) {
          case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
          case "http://www.w3.org/TR/html4/loose.dtd":
          case "http://www.w3.org/TR/REC-html40/strict.dtd":
          case "http://www.w3.org/TR/REC-html40/loose.dtd":
            isXML = false;
            break;
          case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
          case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
          case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
            isXML = true;
            break;
          case "":
          case "about:legacy-compat":
            isXML = (EditorUtils.getCurrentDocument().documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
            break;
          case null:
            isXML = (EditorUtils.getCurrentDocument().compatMode == "CSS1Compat");
            break;
        }

        var source = MarkSelectionInSourceEditor();
        var oldSource = sourceIframe.getUserData("oldSource");

        if (source != oldSource) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(source, isXML ? "text/xml" : "text/html");
          if (doc.documentElement.nodeName == "parsererror") {
            return;
          }
          sourceIframe.setUserData("oldSource", source, null);

          RebuildFromSource(doc, isXML, true);
        }
      }
    }
  }
  catch(e) {}
}

function WysiwygLiveViewEditorFocused()
{
  if (EditorUtils.getCurrentViewMode() == "liveview") {
    if (EditorUtils.getLiveViewMode() == "source") {
      // we switch from source to wysiwig in liveview mode
      gDialog.tabeditor.enableRulers(true);
      gDialog.structurebar.style.visibility = "";

      EditorUtils.getCurrentEditorWindow().updateCommands("style");
      EditorUtils.getCurrentEditorWindow().goUpdateCommand("cmd_renderedHTMLEnabler");
      EditorUtils.getCurrentEditorElement().focus();

      EditorUtils.setLiveViewMode("wysiwyg");
      NotifierUtils.notify("afterLeavingSourceMode");
      NotifierUtils.notify("modeSwitch");
    }
    else {
      // we're already in wysiwyg and have place the caret somwehere
      // or gain focus again; we should assume a change, at least of
      // caret position
      UpdateSourceLiveView();
    }
  }
}

function SourceLiveViewEditorFocused()
{
  if (EditorUtils.getCurrentViewMode() == "liveview") {
    if (EditorUtils.getLiveViewMode() == "wysiwyg") {
      // we switch from wysiwyg to source in liveview mode
      gDialog.tabeditor.enableRulers(false);
      gDialog.structurebar.style.visibility = "hidden";

      EditorUtils.setLiveViewMode("source");
      EditorUtils.getCurrentEditorWindow().updateCommands("style");
      EditorUtils.getCurrentEditorWindow().goUpdateCommand("cmd_renderedHTMLEnabler");
      NotifierUtils.notify("afterEnteringSourceMode");
      NotifierUtils.notify("modeSwitch");
    }
    else {
      // we're already in source and have place the caret somwehere
      // or gain focus again; we should assume a change, at least of
      // caret position
      UpdateWysiwygLiveView();
    }
  }
}

function UpdateWysiwygLiveView()
{
  if (EditorUtils.getCurrentViewMode() != "liveview" ||
      EditorUtils.getLiveViewMode() != "source")
    return;

  if (gUpdateWysiwygLiveViewTimeOutID) {
    clearTimeout(gUpdateWysiwygLiveViewTimeOutID);
  }

  gUpdateWysiwygLiveViewTimeOutID = setTimeout(_UpdateWysiwygLiveView, kLIVEVIEW_UPDATE_DELAY);
}

function UpdateSourceLiveView()
{
  if (EditorUtils.getCurrentViewMode() != "liveview" ||
      EditorUtils.getLiveViewMode() != "wysiwyg")
    return;

  if (gUpdateSourceLiveViewTimeOutID) {
    clearTimeout(gUpdateSourceLiveViewTimeOutID);
  }

  gUpdateSourceLiveViewTimeOutID = setTimeout(_UpdateSourceLiveView, kLIVEVIEW_UPDATE_DELAY);
}

function MarkSelectionInSourceEditor()
{
  var editor = EditorUtils.getCurrentEditor();
  var editorElement = EditorUtils.getCurrentEditorElement();
  var deck = editorElement.parentNode;
  var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;

  var cursor = sourceEditor.getCursor("from");
  var index  = sourceEditor.indexFromPos(cursor);

  var source = sourceEditor.getValue();

  // are we inside a tag
  if (source.lastIndexOf("<", index) > source.lastIndexOf(">", index)) {
    var found = false;
    while (!found && index >= 0) {
      let oldindex = index;
      index = source.lastIndexOf("<", index);
      if (index != -1) {
        found = /[a-zA-Z]/.test(source[index + 1]);
        if (!found)
          index--;
      }
      if (oldindex == index) // sanity case
        break;
    }

    if (found) {
      index = source.indexOf(">", index);
      if (index != -1) {
        if (source[index - 1] == "/")
          index--;
        if (source.toLowerCase().indexOf("<body") == -1) // only if after body start tag
          source = source.substr(0, index)
                   + " bluegriffonsourceselected='true'"
                   + source.substr(index);
      }
    }
  }
  else {
    var lastGtIndex = source.lastIndexOf("<", index);
    if (lastGtIndex != -1) {
      var lastGtTag = source.substring(lastGtIndex, index);
      if (lastGtTag.indexOf(">") == -1) // yep, in a tag
        return source;
    }
    // no, not inside a tag...
    if (source.toLowerCase().indexOf("<body") == -1) // only if after body start tag
      source = source.substr(0, index)
               + "<span bluegriffonstandalone='true' bluegriffonsourceselected='true'></span>"
               + source.substr(index);
  }

  return source;
}

var liveViewTransactionListener = {

  interfaces: [Components.interfaces.nsITransactionListener,
               Components.interfaces.nsISupports],

  // nsISupports

  QueryInterface: function(iid) {
    if (!this.interfaces.some( function(v) { return iid.equals(v) } ))
      throw Components.results.NS_ERROR_NO_INTERFACE;

    return this;
  },

  getInterface: function(iid) {
    return this.QueryInterface(iid);
  },

  willDo: function(aManager, aTransaction) { return false; },
  didDo: function(aManager, aTransaction, aDoResult) {
    UpdateSourceLiveView();
  },
  willUndo: function(aManager, aTransaction) { return false; },
  didUndo: function(aManager, aTransaction, aDoResult) {
    UpdateSourceLiveView();
  },
  willRedo: function(aManager, aTransaction) { return false; },
  didRedo: function(aManager, aTransaction, aDoResult) {
    UpdateSourceLiveView();
  },
  willBeginBatch: function(aManager) { return false; },
  didBeginBatch: function(aManager, aResult) {},
  willEndBatch: function(aManager) { return false; },
  didEndBatch: function(aManager, aResult) {},
  willMerge: function(aManager, aTopTransaction, aTransactionToMerge) { return false; },
  didMerge: function(aManager, aTopTransaction, aTransactionToMerge, aDidMerge, aMergeResult) {}
};
