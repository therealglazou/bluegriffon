Components.utils.import("resource://app/modules/editorHelper.jsm");

var cmdFsCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            GetCurrentViewMode() == "wysiwyg");
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    window.openDialog('chrome://fs/content/fs.xul',"_blank",
                      "chrome,resizable,scrollbars=yes");
  }
};

var FsHelper = {
  startup: function()
  {
    window.removeEventListener("load", FsHelper.startup, false);
    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_fsManager", cmdFsCommand);
  }
};

window.addEventListener("load", FsHelper.startup, false);
