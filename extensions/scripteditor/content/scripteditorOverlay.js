var cmdScriptEditorCommand =
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
#ifdef XP_UNIX
#ifdef XP_MACOSX
    var panel = gDialog["panel-scripteditor"];
    panel.openPanel(null, false);
    NotifierUtils.notify("redrawPanel", panel.id);
#else
    start_scripteditor();
#endif
#else
    var panel = gDialog["panel-scripteditor"];
    panel.openPanel(null, false);
    NotifierUtils.notify("redrawPanel", panel.id);
#endif

  }
};

// LINUX ONLY :-(
function start_scripteditor()
{
  var w = null;
  try {
    var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
    w = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow("BlueGriffon:ScriptEditor");
  }
  catch(e){}
  if (w)
    w.focus();
  else
    window.open('chrome://scripteditor/content/scripteditor.xul',"_blank",
               "chrome,resizable,scrollbars=yes");
}

var ScriptEditorHelper = {

  startup: function()
  {
    window.removeEventListener("load", ScriptEditorHelper.startup, false);
    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_scriptEditor", cmdScriptEditorCommand);
  }
};

window.addEventListener("load", ScriptEditorHelper.startup, false);
