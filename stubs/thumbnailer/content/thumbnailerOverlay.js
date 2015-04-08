/**
 * Table Layout extension for BlueGriffon
 * Copyright (c) Disruptive Innovations SARL 2008
 * All rights reserved.
 */

Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

function  Thumbnail_setupComposerCommands()
{
  window.removeEventListener('load',
                             Thumbnail_setupComposerCommands,
                             false);
  var commandTable = ComposerCommands.getComposerCommandTable();
  if (!commandTable)
    return;
  commandTable.registerCommand("cmd_thumbnail",       cmdInsertThumbnailCommand);
}

var cmdInsertThumbnailCommand =
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
    var bundle = document.getElementById("thumbnailerBundle");
    Services.prompt.alert(window,
                          bundle.getString("FeatureRequiresAnAddOn"),
                          bundle.getString("VisitBlueGriffonCom"));
    loadExternalURL("http://www.bluegriffon.com/index.php?pages/Thumbnailer");
  }
};

window.addEventListener('load',
                        Thumbnail_setupComposerCommands,
                        false);
