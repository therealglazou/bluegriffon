Components.utils.import("resource://gre/modules/editorHelper.jsm");

var cmdGfdCommand =
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
    window.openDialog('chrome://gfd/content/gfd.xul',"_blank",
                      "chrome,resizable,modal,scrollbars=yes");
  }
};

var GfdHelper = {
  startup: function()
  {
    window.removeEventListener("load", GfdHelper.startup, false);
    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_gfdManager", cmdGfdCommand);
  }
};

window.addEventListener("load", GfdHelper.startup, false);
