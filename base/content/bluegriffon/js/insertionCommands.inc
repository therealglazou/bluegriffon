
var cmdInsertOrEditTableCommand =
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
    if (EditorUtils.isWysiwygMode()) {
      var element = EditorUtils.getObjectForProperties(
            ["table", "thead", "tfoot", "tbody", "tr", "th", "td", "caption"]);
      if (element) {
        window.openDialog("chrome://bluegriffon/content/dialogs/insertTable.xul","_blank",
                          "chrome,modal,titlebar,resizable=yes,dialog=no", element);
        return;
      }
    }

    // reset the table insertion panel
    AutoInsertTable.reset();
    gDialog.AutoInsertTableSheetPopup.openPopup(gDialog["tableButton"], "after_start", 0, 0, false);
  }
};


var cmdInsertImageCommand =
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
    var element = (EditorUtils.isWysiwygMode())
                  ? EditorUtils.getObjectForProperties(["img"])
                  : null;
    window.openDialog("chrome://bluegriffon/content/dialogs/insertImage.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element, null);
  }
};

var cmdInsertAnchorCommand =
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
    var element = (EditorUtils.isWysiwygMode())
                  ? EditorUtils.getObjectForProperties(["a"])
                  : null;
    window.openDialog("chrome://bluegriffon/content/dialogs/insertAnchor.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertLinkCommand =
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
    var element = EditorUtils.getObjectForProperties(["a"], "href");
    window.openDialog("chrome://bluegriffon/content/dialogs/insertLink.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdCssPanelCommand =
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
    start_panel(gDialog["panel-cssproperties-menuitem"]);
  }
};

var cmdDomExplorerPanelCommand =
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
    start_panel(gDialog["panel-domexplorer-menuitem"]);
  }
};

var cmdInsertVideoCommand =
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
    var element = EditorUtils.getObjectForProperties(["video"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertVideo.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element, null);
  }
};

var cmdInsertAudioCommand =
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
    var element = EditorUtils.getObjectForProperties(["audio"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertAudio.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element, null);
  }
};

var cmdInsertHRCommand = 
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
    var element = EditorUtils.getObjectForProperties(["hr"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertHR.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertHTMLCommand =
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
    window.openDialog("chrome://bluegriffon/content/dialogs/insertHTML.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes");
  }
};

var cmdInsertFormCommand =
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
    var element = EditorUtils.getObjectForProperties(["form"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertForm.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", element);
  }
};

var cmdInsertFormInputCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {
    var type = aParams.getCStringValue("type");
    var element = EditorUtils.getObjectForProperties(["input"]);
    if (element) {
      if (!type || type != element.getAttribute("type"))
        element = null;
    }
    window.openDialog("chrome://bluegriffon/content/dialogs/insertFormInput.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", element, type);
  },

  doCommand: function(aCommand) {}
};

var cmdInsertFieldsetCommand =
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
    var element = EditorUtils.getObjectForProperties(["fieldset"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertFieldset.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", element);
  }
};

var cmdInsertLabelCommand =
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
    var element = EditorUtils.getObjectForProperties(["label"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertLabel.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", element);
  }
};

var cmdInsertButtonCommand =
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
    var element = EditorUtils.getObjectForProperties(["button"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertButton.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", element);
  }
};

var cmdInsertSelectCommand =
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
    var element = EditorUtils.getObjectForProperties(["select"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertSelect.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertTextareaCommand =
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
    var element = EditorUtils.getObjectForProperties(["textarea"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertTextarea.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertKeygenCommand =
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
    var element = EditorUtils.getObjectForProperties(["keygen"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertKeygen.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertOutputCommand =
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
    var element = EditorUtils.getObjectForProperties(["output"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertOutput.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertProgressCommand =
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
    var element = EditorUtils.getObjectForProperties(["progress"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertProgress.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertMeterCommand =
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
    var element = EditorUtils.getObjectForProperties(["meter"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertMeter.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdInsertDatalistCommand =
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
    var element = EditorUtils.getObjectForProperties(["datalist"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertDatalist.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", element);
  }
};

var cmdStylesheetsCommand =
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
    OpenAppModalWindow(window, "chrome://bluegriffon/content/dialogs/insertStylesheet.xul", "", true); 
  }
};

var cmdSpanCommand =
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
    EditorUtils.setTextProperty("span", null, null);
    ComposerCommands.updateSelectionBased(false);
  }
};

var cmdBlockquoteCommand =
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
    var editor = EditorUtils.getCurrentEditor();
    var isCSSEnabled = editor.isCSSEnabled;
    editor.isCSSEnabled = false;
    editor.indent("indent");
    editor.isCSSEnabled = isCSSEnabled;
  }
};

var cmdRebuildTOCCommand =
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
    if (EditorUtils.getCurrentDocument().getElementById("mozToc"))
      TOCrebuilder.rebuild();
    else
      CreateOrUpdateTableOfContents();
  }
};
