/**
 * Table Layout extension for BlueGriffon
 * Copyright (c) Disruptive Innovations SARL 2008
 * All rights reserved.
 */

Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

function  TableLayout_setupComposerCommands()
{
  window.removeEventListener('load',
                             TableLayout_setupComposerCommands,
                             false);
  var commandTable = ComposerCommands.getComposerCommandTable();
  if (!commandTable)
    return;
  commandTable.registerCommand("cmd_tableLayout",       cmdTableLayoutCommand);
}

var cmdTableLayoutCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var editor = EditorUtils.getCurrentEditor();
    try {
      return editor.getElementOrParentByTagName("table", null);
    } catch (e) {}
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var bundle = document.getElementById("tablelayoutBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/Table-Layouts");
  }
};
