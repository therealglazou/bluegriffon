var cmdBgFindCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var isSource = !EditorUtils.isWysiwygMode();
    WysiwygShowFindBar();
    gDialog.bespinLineLabel.hidden = !isSource;
    gDialog.bespinLineTextbox.hidden = !isSource;
  }
};

var cmdBgFindAgainCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    BespinFind(true, false);
  }
};

var bgSpellingCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    window.cancelSendMessage = false;
    try {
      OpenAppModalWindow(window,
                         "chrome://bluegriffon/content/dialogs/spellCheck.xul",
                         "Spell Check",
                         false); 
    }
    catch(ex) {}
    GetWindowContent().focus();
  }
};

var cmdCopyHTMLCodeCommand = {
  isCommandEnabled: function(aCommand, dummy)
  {
    var isHTMLView = (EditorUtils.getCurrentEditorElement() &&
                      EditorUtils.isDocumentEditable() &&
                      EditorUtils.isEditingRenderedHTML() &&
                      EditorUtils.isWysiwygMode());
    if (isHTMLView) {
      var editor = EditorUtils.getCurrentEditor();
      var selection = editor.selection;
      if (selection.rangeCount == 1)
      {
        // We have a "normal" single-range selection
        if (!selection.isCollapsed) {
           return true;
         }
      }
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var editor    = EditorUtils.getCurrentEditor();
    var selection = editor.selection;
    selection instanceof Components.interfaces.nsISelectionPrivate;
    var mimeType = EditorUtils.getCurrentDocument().contentType;

    var flags = 1 << 1; // OutputFormatted
    flags |= 1 << 5; // OutputWrap
    flags |= 1 << 10; // OutputLF

    var source = selection.toStringWithFormat(mimeType,
                                              flags,
                                              0);

    var clipboardSvc = Components.classes["@mozilla.org/widget/clipboard;1"]
                         .getService(Components.interfaces.nsIClipboard);
    var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                     .createInstance(Components.interfaces.nsITransferable);
    xferable.addDataFlavor("text/unicode");
    var s = Components.classes["@mozilla.org/supports-string;1"]
              .createInstance(Components.interfaces.nsISupportsString);
    s.data = source;
    xferable.setTransferData("text/unicode", s, source.length * 2);
    clipboardSvc.setData(xferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
  }
};

var cmdBGCopyCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        if (!EditorUtils.isWysiwygMode()) {
          var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
          var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
          return sourceEditor.somethingSelected();
        }
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        return editor.canCopy();
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canCopy = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canCopy);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      var text = sourceEditor.getSelection();

      var clipboardSvc = Components.classes["@mozilla.org/widget/clipboard;1"]
                           .getService(Components.interfaces.nsIClipboard);
      var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                       .createInstance(Components.interfaces.nsITransferable);
      xferable.addDataFlavor("text/unicode");
      var s = Components.classes["@mozilla.org/supports-string;1"]
                .createInstance(Components.interfaces.nsISupportsString);
      s.data = text;
      xferable.setTransferData("text/unicode", s, text.length * 2);
      clipboardSvc.setData(xferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.copy();
    }
  }
};

var cmdBGCutCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        if (!EditorUtils.isWysiwygMode()) {
          var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
          var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
          return sourceEditor.somethingSelected();
        }
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        return editor.canCut();
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canCut = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canCut);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      var text = sourceEditor.getSelection();

      var clipboardSvc = Components.classes["@mozilla.org/widget/clipboard;1"]
                           .getService(Components.interfaces.nsIClipboard);
      var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                       .createInstance(Components.interfaces.nsITransferable);
      xferable.addDataFlavor("text/unicode");
      var s = Components.classes["@mozilla.org/supports-string;1"]
                .createInstance(Components.interfaces.nsISupportsString);
      s.data = text;
      xferable.setTransferData("text/unicode", s, text.length * 2);
      clipboardSvc.setData(xferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);

      sourceEditor.replaceSelection("");
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.cut();
    }
  }
};

var cmdBGPasteCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        return editor.canPaste(Components.interfaces.nsIClipboard.kGlobalClipboard);
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canPaste = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canPaste);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      var text = sourceEditor.getSelection();

      var clipboardSvc = Components.classes["@mozilla.org/widget/clipboard;1"]
                           .getService(Components.interfaces.nsIClipboard);
      var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                       .createInstance(Components.interfaces.nsITransferable);
      xferable.addDataFlavor("text/unicode");
      clipboardSvc.getData(xferable, Components.interfaces.nsIClipboard.kGlobalClipboard);

      var data = {};
      var dataLen = {};
      xferable.getTransferData("text/unicode", data, dataLen);
  
      var text = ""
      if (data) {
        data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
        text = data.data.substring(0, dataLen.value / 2);
      }
      sourceEditor.replaceSelection(text, "end");
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.paste(Components.interfaces.nsIClipboard.kGlobalClipboard);
    }
  }
};

var cmdBGUndoCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        if (!EditorUtils.isWysiwygMode()) {
          var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
          var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
          return (0 < sourceEditor.historySize().undo);
        }
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        var isEnabled = {}, canUndo = {};
        editor.canUndo(isEnabled, canUndo);
        return isEnabled.value && canUndo.value;
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canUndo = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canUndo);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      sourceEditor.undo();
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.undo(1);
    }
  }
};

var cmdBGRedoCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        if (!EditorUtils.isWysiwygMode()) {
          var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
          var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
          return (0 < sourceEditor.historySize().redo);
        }
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        var isEnabled = {}, canRedo = {};
        editor.canRedo(isEnabled, canRedo);
        return isEnabled.value && canRedo.value;
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canRedo = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canRedo);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      sourceEditor.redo();
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.redo(1);
    }
  }
};

var cmdBGselectAllCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement()
            && EditorUtils.isDocumentEditable()
            && EditorUtils.isEditingRenderedHTML());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canRedo = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canRedo);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (!EditorUtils.isWysiwygMode()) {
      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
      var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
      sourceEditor.selectAll();
    }
    else {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.selectAll();
    }
  }
};

var cmdBGpasteNoFormattingCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()
          && EditorUtils.isWysiwygMode()) {
        var editor = EditorUtils.getCurrentEditor();
        editor instanceof Components.interfaces.nsIEditor;
        return editor.canPaste(Components.interfaces.nsIClipboard.kGlobalClipboard);
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canPaste = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canPaste);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (EditorUtils.isWysiwygMode()) {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.pasteNoFormatting(Components.interfaces.nsIClipboard.kGlobalClipboard);
    }
  }
};

var cmdBGdeleteCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement()
        && EditorUtils.isDocumentEditable()
        && EditorUtils.isEditingRenderedHTML()
        && EditorUtils.isWysiwygMode()) {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      return editor.canCut();
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {
    var canDelete = this.isCommandEnabled();
    aParams.setBooleanValue("state_enabled", canDelete);
  },
  doCommandParams: function(aCommand, aParams, aRefCon) {
    this.doCommand();
  },

  doCommand: function(aCommand)
  {
    if (EditorUtils.isWysiwygMode()) {
      var editor = EditorUtils.getCurrentEditor();
      editor instanceof Components.interfaces.nsIEditor;
      editor.deleteSelection(Components.interfaces.nsIEditor.ePrevious, Components.interfaces.nsIEditor.eStrip);
    }
  }
};
