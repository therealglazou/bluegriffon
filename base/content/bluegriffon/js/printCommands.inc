/* ***** BEGIN LICENSE BLOCK *****
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * The Original Code is BlueGriffon
 *
 * Contributor(s):
 *   EVENTRIC LLC.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/printHelper.jsm");

//-----------------------------------------------------------------------------------
var cmdPrint =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    if (EditorUtils.isWysiwygMode())
      PrintHelper.print(EditorUtils.getCurrentEditorElement().contentWindow);
    else {
	    var editorElement = EditorUtils.getCurrentEditorElement();
	    if (editorElement) {
	      var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
	      var sourceWindow = sourceIframe.contentWindow;

        PrintHelper.print(sourceWindow);
      }
    }
  }
};

//-----------------------------------------------------------------------------------
var cmdPrintSetup =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    PrintHelper.showPageSetup(window);
  }
};
