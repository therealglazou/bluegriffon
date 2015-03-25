Components.utils.import("resource://gre/modules/Services.jsm");

var cmdFullScreen =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return true;    // we can always do this
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var bundle = document.getElementById("fullscreenBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/FullScreen");
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
    window.removeEventListener("load", cmdFullScreen.install, false);

    var commandTable = ComposerCommands.getComposerCommandTable();
    if (!commandTable)
      return;
    
    commandTable.registerCommand("cmd_fullScreen",  cmdFullScreen);
  }
};

window.addEventListener("load", cmdFullScreen.install, false);