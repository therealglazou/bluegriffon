Components.utils.import("resource://gre/modules/Services.jsm");

var cmdMarkdownCommand =
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
    window.openDialog('chrome://markdown/content/markdown.xul',"_blank",
                      "chrome,resizable,modal,dialog=no,scrollbars=yes");
  }
};


var MarkdownHelper = {
  startup: function()
  {
    window.removeEventListener("load", MarkdownHelper.startup, false);
    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_insertMarkdown", cmdMarkdownCommand);
  }

};

window.addEventListener("load", MarkdownHelper.startup, false);
