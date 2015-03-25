Components.utils.import("resource://gre/modules/Services.jsm");

var cmdMathMLPanelCommand =
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
    var bundle = document.getElementById("mathmlBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/MathML");
  }
};

// LINUX ONLY :-(
function start_mathml()
{
  var w = null;
  try {
    var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
    w = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow("BlueGriffon:mathml");
  }
  catch(e){}
  if (w)
    w.focus();
  else
    window.open('chrome://mathml/content/mathml.xul',"_blank",
               "chrome,resizable,scrollbars=yes");
}

var MathMLHelper = {

  startup: function()
  {
    var commandTable = ComposerCommands.getComposerCommandTable();
    commandTable.registerCommand("cmd_mathml", cmdMathMLPanelCommand);
  }
};

window.addEventListener("load", MathMLHelper.startup, false);
