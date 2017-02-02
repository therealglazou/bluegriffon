
var gUpdateLiveViewTimeOutID = null;
var gDisableLiveViewUpdates = false;
var gCancelNextLiveViewUpdate = false;

function WysiwygEditorFocused()
{
  try {
    if (!gDisableLiveViewUpdates &&
        EditorUtils.getCurrentViewMode() == "liveview") {
      if (EditorUtils.getLiveViewMode() == "source") {
  
        if (gUpdateLiveViewTimeOutID) {
          clearTimeout(gUpdateLiveViewTimeOutID);
        }
        gUpdateLiveViewTimeOutID = null;
  
        var editor = EditorUtils.getCurrentEditor();
        var editorElement = EditorUtils.getCurrentEditorElement();
        var deck = editorElement.parentNode;
        var sourceIframe = editorElement.parentNode.firstElementChild;
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
        gDisableLiveViewUpdates = true;
        if (source != oldSource) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(source, isXML ? "text/xml" : "text/html");
          if (doc.documentElement.nodeName == "parsererror") {
            var message = doc.documentElement.firstChild.data
                             .replace( /Location\: chrome\:\/\/bluegriffon\/content\/xul\/bluegriffon.xul/g ,
                                       ", ");
            var error = doc.documentElement.lastChild.textContent;
            window.openDialog("chrome://bluegriffon/content/dialogs/parsingError.xul", "_blank",
                              "chrome,modal,titlebar", message, error);
            gDisableLiveViewUpdates = false;
            return;
          }
          sourceIframe.setUserData("oldSource", source, null);

          RebuildFromSource(doc, isXML, true);
        }
  
        EditorUtils.getCurrentEditorWindow().updateCommands("style");
        EditorUtils.getCurrentEditorWindow().goUpdateCommand("cmd_renderedHTMLEnabler");
        NotifierUtils.notify("afterLeavingSourceMode");
        EditorUtils.getCurrentEditorElement().focus();

        EditorUtils.setLiveViewMode("wysiwyg");

        gDisableLiveViewUpdates = false;
        gCancelNextLiveViewUpdate = true;
      }
    }
  }
  catch(e) {Services.prompt.alert(null, "WysiwygEditorFocused", e);}
}

function SourceEditorFocused()
{
  if (EditorUtils.getCurrentViewMode() == "liveview") {
    if (EditorUtils.getLiveViewMode() != "source") {
      EditorUtils.setLiveViewMode("source");
      EditorUtils.getCurrentEditorWindow().updateCommands("style");
      EditorUtils.getCurrentEditorWindow().goUpdateCommand("cmd_renderedHTMLEnabler");
      NotifierUtils.notify("afterEnteringSourceMode");
    }
  }
}

function _UpdateLiveView()
{
  if (gCancelNextLiveViewUpdate) {
    gCancelNextLiveViewUpdate = false;
    return;
  }
  if (EditorUtils.getCurrentViewMode() == "liveview" &&
      EditorUtils.getLiveViewMode() == "wysiwyg") {

    try {
      var editor = EditorUtils.getCurrentEditor();
      var editorElement = EditorUtils.getCurrentEditorElement();
      var deck = editorElement.parentNode;
      var sourceIframe = editorElement.parentNode.firstElementChild;
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
      sourceIframe.contentWindow.wrappedJSObject.gChangeCallback = onSourceChangeCallback;
  
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
    catch(e) {Services.prompt.alert(null, "_UpdateLiveView", e);}
  }
}

function UpdateLiveView()
{
  if (gUpdateLiveViewTimeOutID) {
    clearTimeout(gUpdateLiveViewTimeOutID);
    gUpdateLiveViewTimeOutID = null;
  }

  if (gDisableLiveViewUpdates ||
      EditorUtils.getCurrentViewMode() != "liveview" ||
      EditorUtils.getLiveViewMode() != "wysiwyg")
    return;

  gUpdateLiveViewTimeOutID = setTimeout(_UpdateLiveView, 1000);
}

function MarkSelectionInSourceEditor()
{
  var editor = EditorUtils.getCurrentEditor();
  var editorElement = EditorUtils.getCurrentEditorElement();
  var deck = editorElement.parentNode;
  var sourceIframe = editorElement.parentNode.firstElementChild;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;

  var cursor = sourceEditor.getCursor("from");
  var index  = sourceEditor.indexFromPos(cursor);

  var source = sourceEditor.getValue();

  // are we inside a tag
  if (source.lastIndexOf("<", index) > source.lastIndexOf(">", index)) {
    var found = false;
    while (!found && index <= 0) {
      index = source.lastIndexOf("<", index);
      if (index != -1) {
        found = /[a-zA-Z]/.test(source[index + 1]);
      }
    }

    if (found) {
      index = source.indexOf(">", index);
      if (index != -1) {
        if (source[index - 1] == "/")
          index--;
        source = source.substr(0, index)
                 + " bluegriffonsourceselected='true'"
                 + source.substr(index);
      }
    }
  }
  else {
    var lastGtIndex = source.lastIndexOf("<", index);
    if (lastGtIndex != -1) {
      var lastGtTag = source.substr(lastGtIndex, 6).toLowerCase();
      if (lastGtTag == "</body" || lastGtTag == "</html" ||
          source[lastGtIndex + 1] == "!" || source[lastGtIndex + 1] == "?")
        return source;
    }
    // no, not inside a tag...
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
    UpdateLiveView();
  },
  willUndo: function(aManager, aTransaction) { return false; },
  didUndo: function(aManager, aTransaction, aDoResult) {
    UpdateLiveView();
  },
  willRedo: function(aManager, aTransaction) { return false; },
  didRedo: function(aManager, aTransaction, aDoResult) {
    UpdateLiveView();
  },
  willBeginBatch: function(aManager) { return false; },
  didBeginBatch: function(aManager, aResult) {},
  willEndBatch: function(aManager) { return false; },
  didEndBatch: function(aManager, aResult) {},
  willMerge: function(aManager, aTopTransaction, aTransactionToMerge) { return false; },
  didMerge: function(aManager, aTopTransaction, aTransactionToMerge, aDidMerge, aMergeResult) {}
};

