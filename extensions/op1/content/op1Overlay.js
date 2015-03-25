Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/l10nHelper.jsm");

if (typeof com == "undefined") com = {};
if (typeof com.bluegriffon == "undefined") com.bluegriffon = {};

var cmdOp1Command =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditor() != null);
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var op1Window = Services.wm.getMostRecentWindow("Opquast:a11yFirstStep");
    if (op1Window) {
      op1Window.focus()
    }
    else
      window.openDialog("chrome://op1/content/op1.xul","_blank",
                        "chrome,dialog=no,modal=no,titlebar=yes,resizable=yes");
  }
};

com.bluegriffon.op1 = {

  startup: function()
  {
    window.removeEventListener("load", com.bluegriffon.op1.startup, false);

    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_op1", cmdOp1Command);
  }

};

window.addEventListener("load", com.bluegriffon.op1.startup, false);
