Components.utils.import("resource://gre/modules/Services.jsm");

var cmdCssEditor =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return true;    // we can always do this
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var bundle = document.getElementById("csseditorBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/CssEditor");
  },

  showToolbars: function(aShow)
  {
    if (aShow)
      window.document.documentElement.setAttribute("forcetoolbars", "true");
    else
      window.document.documentElement.removeAttribute("forcetoolbars");
  },

  install: function()
  {
    window.removeEventListener("load", cmdCssEditor.install, false);

    var commandTable = ComposerCommands.getComposerCommandTable();
    if (!commandTable)
      return;
    
    commandTable.registerCommand("cmd_csseditor",  cmdCssEditor);
  }
};

window.addEventListener("load", cmdCssEditor.install, false);