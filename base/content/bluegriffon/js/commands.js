/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *   EVENTRIC LLC.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/urlHelper.jsm");

const kBASE_COMMAND_CONTROLLER_CID = "@mozilla.org/embedcomp/base-command-controller;1";

const nsIControllerContext = interfaces.nsIControllerContext;
const nsIInterfaceRequestor = interfaces.nsIInterfaceRequestor;
const nsIControllerCommandTable = interfaces.nsIControllerCommandTable;

var ComposerCommands = {

  mComposerJSCommandControllerID: null,
  mSelectionTimeOutId: null,

  mLastSelectedElement: null,
  mLastSelectedElementPath: null,

  getComposerCommandTable: function getComposerCommandTable()
  {
    var controller;
    if (this.mComposerJSCommandControllerID)
    {
      try { 
        controller = GetWindowContent().controllers.getControllerById(this.mComposerJSCommandControllerID);
      } catch (e) {}
    }
    if (!controller)
    {
      //create it
      controller = Components.classes[kBASE_COMMAND_CONTROLLER_CID].createInstance();
  
      var editorController = controller.QueryInterface(nsIControllerContext);
      editorController.init(null);
      editorController.setCommandContext(null);
      window.controllers.insertControllerAt(0, controller);
    
      // Store the controller ID so we can be sure to get the right one later
      this.mComposerJSCommandControllerID = window.controllers.getControllerId(controller);
    }
  
    if (controller)
    {
      var interfaceRequestor = controller.QueryInterface(nsIInterfaceRequestor);
      return interfaceRequestor.getInterface(nsIControllerCommandTable);
    }
    return null;
  },

  goUpdateComposerMenuItems: function goUpdateComposerMenuItems(commandset)
  {
    for (var i = 0; i < commandset.childNodes.length; i++)
    {
      var commandNode = commandset.childNodes[i];
      var commandID = commandNode.id;
      if (commandID)
      {
       if (EditorUtils.getCurrentEditorElement() &&
           EditorUtils.isDocumentEditable() &&
           EditorUtils.isEditingRenderedHTML() &&
           !EditorUtils.activeViewActive  &&
           (commandID == "cmd_viewModeEnabler" || EditorUtils.isWysiwygMode()))
          commandNode.removeAttribute("disabled");
        else
          commandNode.setAttribute("disabled", "true");

        this.goUpdateCommand(commandID);  // enable or disable
        if (commandNode.hasAttribute("state"))
          this.goUpdateCommandState(commandID);
      }
    }
  },

  goUpdateCommand: function(aCommand)
  {
    try {
      var controller = EditorUtils.getCurrentEditorElement()
                       ? EditorUtils.getCurrentEditorElement().contentWindow.controllers.getControllerForCommand(aCommand)
                       : null;
      if (!controller)
        controller = top.document.commandDispatcher.getControllerForCommand(aCommand)
      var enabled = false;
      if (controller)
        enabled = controller.isCommandEnabled(aCommand);
  
      goSetCommandEnabled(aCommand, enabled);
    }
    catch (e) {
      Components.utils.reportError("An error occurred updating the " +
                                   aCommand + " command: " + e);
    }
  },

  goUpdateCommandState: function goUpdateCommandState(command)
  {
    try
    {
      var controller = top.document.commandDispatcher.getControllerForCommand(command);
      if (!(controller instanceof Components.interfaces.nsICommandController))
        return;

      var params = this.newCommandParams();
      if (!params) return;

      controller.getCommandStateWithParams(command, params);

      switch (command)
      {
        case "cmd_bold":
        case "cmd_italic":
        case "cmd_underline":
        case "cmd_strong":
        case "cmd_em":
        case "cmd_code":
        case "cmd_strikethrough":
        case "cmd_superscript":
        case "cmd_subscript":
        case "cmd_nobreak":
        case "cmd_var":
        case "cmd_samp":
        case "cmd_code":
        case "cmd_acronym":
        case "cmd_abbr":
        case "cmd_cite":
        case "cmd_tt":

        case "cmd_ul":
        case "cmd_ol":

        case "cmd_dd":
        case "cmd_dt":
          this.pokeStyleUI(command, params.getBooleanValue("state_all"));
          break;

        case "cmd_paragraphState":
        case "cmd_align":
        case "cmd_fontFace":
        case "cmd_class":
        case "cmd_id":
        case "cmd_ariaRole":
        case "cmd_bgFontColor":
        case "cmd_bgBackgroundColor":
          this.pokeMultiStateUI(command, params);
          break;

        case "cmd_indent":
        case "cmd_outdent":
          break;

        default: break;
      }
    }
    catch (e) {  }
  },

  pokeStyleUI: function pokeStyleUI(uiID, aDesiredState)
  {
   try {
    var commandNode = top.document.getElementById(uiID);
    if (!commandNode)
      return;

    var uiState = ("true" == commandNode.getAttribute("state"));
    if (aDesiredState != uiState)
    {
      var newState;
      if (aDesiredState)
        newState = "true";
      else
        newState = "false";
      commandNode.setAttribute("state", newState);
    }
   } catch(e) {  }
  },

  newCommandParams: function newCommandParams()
  {
    try {
      return Components.classes["@mozilla.org/embedcomp/command-params;1"].createInstance(Components.interfaces.nsICommandParams);
    }
    catch(e) {  }
    return null;
  },

  pokeMultiStateUI: function pokeMultiStateUI(uiID, cmdParams)
  {
    try
    {
      var commandNode = document.getElementById(uiID);
      if (!commandNode)
        return;

      var isMixed = cmdParams.getBooleanValue("state_mixed");
      var desiredAttrib;
      if (isMixed)
        desiredAttrib = "mixed";
      else
        desiredAttrib = cmdParams.getCStringValue("state_attribute");

      var uiState = commandNode.getAttribute("state");
      if (desiredAttrib != uiState)
      {
        commandNode.setAttribute("state", desiredAttrib);
      }
    } catch(e) {}
  },

  doStyleUICommand: function doStyleUICommand(cmdStr)
  {
    try
    {
      var cmdParams = this.newCommandParams();
      this.goDoCommandParams(cmdStr, cmdParams);
      if (cmdParams)
        this.pokeStyleUI(cmdStr, cmdParams.getBooleanValue("state_all"));
    } catch(e) {}
  },

  doStatefulCSSCommand: function doStatefulCSSCommand(commandID, newState)
  {
    var editor = EditorUtils.getCurrentEditor();
    var isCSSEnabled = editor.isCSSEnabled;
    editor.isCSSEnabled = true;
    this.doStatefulCommand(commandID, newState);
    editor.isCSSEnabled = isCSSEnabled;
  },

  doStatefulCommand: function doStatefulCommand(commandID, newState)
  {
    var commandNode = document.getElementById(commandID);
    if (commandNode)
        commandNode.setAttribute("state", newState);

    try
    {
      var cmdParams = this.newCommandParams();
      if (!cmdParams) return;

      cmdParams.setCStringValue("state_attribute", newState);
      this.goDoCommandParams(commandID, cmdParams);

      this.pokeMultiStateUI(commandID, cmdParams);

    } catch(e) {  }
  },

  doCommandWithValue: function doCommandWithValueFromAttribute(commandID, aValue)
  {
    try
    {
      var cmdParams = this.newCommandParams();
      if (!cmdParams) return;

      cmdParams.setCStringValue("type", aValue);
      this.goDoCommandParams(commandID, cmdParams);

      this.pokeMultiStateUI(commandID, cmdParams);

    } catch(e) { }
  },

  goDoCommandParams: function goDoCommandParams(command, params)
  {
    try
    {
      var controller = top.document.commandDispatcher.getControllerForCommand(command);
      if (controller && controller.isCommandEnabled(command))
      {
        if (controller instanceof Components.interfaces.nsICommandController)
        {
          controller.doCommandWithParams(command, params);

          // the following two lines should be removed when we implement observers
          if (params)
            controller.getCommandStateWithParams(command, params);
        }
        else
        {
          controller.doCommand(command);
        }
      }
    }
    catch (e) { }
  },

  setupMainCommands: function setupMainCommands()
  {
    var commandTable = this.getComposerCommandTable();
    if (!commandTable)
      return;

    commandTable.registerCommand("cmd_BGcopy",       cmdBGCopyCommand);
    commandTable.registerCommand("cmd_BGcut",        cmdBGCutCommand);
    commandTable.registerCommand("cmd_BGpaste",      cmdBGPasteCommand);
    commandTable.registerCommand("cmd_BGundo",       cmdBGUndoCommand);
    commandTable.registerCommand("cmd_BGredo",       cmdBGRedoCommand);
    commandTable.registerCommand("cmd_BGselectAll",  cmdBGselectAllCommand);
    commandTable.registerCommand("cmd_BGpasteNoFormatting",  cmdBGpasteNoFormattingCommand);
    commandTable.registerCommand("cmd_BGdelete",     cmdBGdeleteCommand);

    commandTable.registerCommand("cmd_stopLoading", cmdStopLoading);
    commandTable.registerCommand("cmd_open",        cmdOpen);
    commandTable.registerCommand("cmd_openFile",    cmdOpenFile);
    commandTable.registerCommand("cmd_save",        cmdSave);
    commandTable.registerCommand("cmd_saveAs",      cmdSaveAs);
    commandTable.registerCommand("cmd_print",       cmdPrint);
    commandTable.registerCommand("cmd_printSettings", cmdPrintSetup);
    commandTable.registerCommand("cmd_saveAs",      cmdSaveAs);
    commandTable.registerCommand("cmd_closeEbook",  cmdCloseEbook);
    commandTable.registerCommand("cmd_closeTab",    cmdCloseTab);
    commandTable.registerCommand("cmd_toggleView",  cmdToggleView);
    commandTable.registerCommand("cmd_fullScreen",  cmdFullScreen);
    commandTable.registerCommand("cmd_new",         cmdNew);
    commandTable.registerCommand("cmd_newEbook",    cmdNewEbook);
    commandTable.registerCommand("cmd_newWindow",   cmdNewWindow);
    commandTable.registerCommand("cmd_newWizard",   cmdNewWizard);
    commandTable.registerCommand("cmd_renderedHTMLEnabler",    cmdDummyHTML);
    commandTable.registerCommand("cmd_renderedSourceEnabler",  cmdDummySource);
    commandTable.registerCommand("cmd_renderedAllEnabler",     cmdDummyAll);
    commandTable.registerCommand("cmd_viewModeEnabler", cmdViewModeEnabler);
    commandTable.registerCommand("cmd_cleanup",     cmdMarkupCleaner);
    commandTable.registerCommand("cmd_browse",      cmdBrowseCommand);

    commandTable.registerCommand("cmd_list",                 cmdEditListCommand);

    commandTable.registerCommand("cmd_table",                cmdInsertOrEditTableCommand);
    commandTable.registerCommand("cmd_editTable",            bgEditTableCommand);
    commandTable.registerCommand("cmd_SelectTable",          bgSelectTableCommand);
    commandTable.registerCommand("cmd_SelectTableCaption",   bgSelectTableCaptionCommand);
    commandTable.registerCommand("cmd_SelectRow",            bgSelectTableRowCommand);
    commandTable.registerCommand("cmd_SelectColumn",         bgSelectTableColumnCommand);
    commandTable.registerCommand("cmd_SelectCell",           bgSelectTableCellCommand);
    commandTable.registerCommand("cmd_SelectAllCells",       bgSelectAllTableCellsCommand);
    commandTable.registerCommand("cmd_InsertTable",          bgInsertTableCommand);
    commandTable.registerCommand("cmd_InsertTableCaption",   bgInsertTableCaptionCommand);
    commandTable.registerCommand("cmd_InsertRowAbove",       bgInsertTableRowAboveCommand);
    commandTable.registerCommand("cmd_InsertRowBelow",       bgInsertTableRowBelowCommand);
    commandTable.registerCommand("cmd_InsertColumnBefore",   bgInsertTableColumnBeforeCommand);
    commandTable.registerCommand("cmd_InsertColumnAfter",    bgInsertTableColumnAfterCommand);
    commandTable.registerCommand("cmd_InsertCellBefore",     bgInsertTableCellBeforeCommand);
    commandTable.registerCommand("cmd_InsertCellAfter",      bgInsertTableCellAfterCommand);
    commandTable.registerCommand("cmd_DeleteTable",          bgDeleteTableCommand);
    commandTable.registerCommand("cmd_DeleteTableCaption",   bgDeleteTableCaptionCommand);
    commandTable.registerCommand("cmd_DeleteRow",            bgDeleteTableRowCommand);
    commandTable.registerCommand("cmd_DeleteColumn",         bgDeleteTableColumnCommand);
    commandTable.registerCommand("cmd_DeleteCell",           bgDeleteTableCellCommand);
    commandTable.registerCommand("cmd_DeleteCellContents",   bgDeleteTableCellContentsCommand);
    commandTable.registerCommand("cmd_JoinTableCells",       bgJoinTableCellsCommand);
    commandTable.registerCommand("cmd_SplitTableCell",       bgSplitTableCellCommand);
    commandTable.registerCommand("cmd_NormalizeTable",       bgNormalizeTableCommand);
    commandTable.registerCommand("cmd_ConvertToTable",       bgConvertToTable);
    commandTable.registerCommand("cmd_ConvertClipboardToTable", bgConvertClipboardToTable);

    commandTable.registerCommand("cmd_image",       cmdInsertImageCommand);
    commandTable.registerCommand("cmd_anchor",      cmdInsertAnchorCommand);
    commandTable.registerCommand("cmd_link",        cmdInsertLinkCommand);
    commandTable.registerCommand("cmd_hr",          cmdInsertHRCommand);
    commandTable.registerCommand("cmd_html",        cmdInsertHTMLCommand);
    commandTable.registerCommand("cmd_form",        cmdInsertFormCommand);
    commandTable.registerCommand("cmd_formInput",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_fieldset",    cmdInsertFieldsetCommand);
    commandTable.registerCommand("cmd_label",       cmdInsertLabelCommand);
    commandTable.registerCommand("cmd_button",      cmdInsertButtonCommand);
    commandTable.registerCommand("cmd_select",      cmdInsertSelectCommand);
    commandTable.registerCommand("cmd_textarea",    cmdInsertTextareaCommand);
    commandTable.registerCommand("cmd_keygen",      cmdInsertKeygenCommand);
    commandTable.registerCommand("cmd_output",      cmdInsertOutputCommand);
    commandTable.registerCommand("cmd_progress",    cmdInsertProgressCommand);
    commandTable.registerCommand("cmd_meter",       cmdInsertMeterCommand);
    commandTable.registerCommand("cmd_datalist",    cmdInsertDatalistCommand);
    commandTable.registerCommand("cmd_rebuildTOC",  cmdRebuildTOCCommand);

    commandTable.registerCommand("cmd_formInputHidden",  cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputHidden",  cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputText",    cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputSearch",  cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputTel",     cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputUrl",     cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputEmail",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputPassword",cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputDatetime",cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputDate",    cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputMonth",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputWeek",    cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputTime",    cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputDatetimelocal",cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputNumber",  cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputRange",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputColor",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputCheckbox",cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputRadio",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputFile",    cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputSubmit",  cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputImage",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputReset",   cmdInsertFormInputCommand);
    commandTable.registerCommand("cmd_formInputButton",  cmdInsertFormInputCommand);

    commandTable.registerCommand("cmd_css",         cmdCssPanelCommand);
    commandTable.registerCommand("cmd_domexplorer", cmdDomExplorerPanelCommand);
    commandTable.registerCommand("cmd_video",       cmdInsertVideoCommand);
    commandTable.registerCommand("cmd_audio",       cmdInsertAudioCommand);

    commandTable.registerCommand("cmd_class",       cmdClass);
    commandTable.registerCommand("cmd_id",          cmdId);
    commandTable.registerCommand("cmd_ariaRole",    cmdAriaRole);

    commandTable.registerCommand("cmd_bgFontColor",       cmdBgFontColorCommand);
    commandTable.registerCommand("cmd_bgBackgroundColor", cmdBgBackgroundColorCommand);

    commandTable.registerCommand("cmd_bgfind",      cmdBgFindCommand);
    commandTable.registerCommand("cmd_bgfindagain", cmdBgFindAgainCommand);
    commandTable.registerCommand("cmd_replace",     cmdBgFindCommand);

    commandTable.registerCommand("cmd_span",        cmdSpanCommand);
    commandTable.registerCommand("cmd_blockquote",  cmdBlockquoteCommand);

    commandTable.registerCommand("cmd_pageProperties", cmdPagePropertiesCommand);

    commandTable.registerCommand("cmd_spellCheck",  bgSpellingCommand);

    commandTable.registerCommand("cmd_copyHTMLCode", cmdCopyHTMLCodeCommand);
    commandTable.registerCommand("cmd_gotoLink",    cmdGotoLinkCommand);
    commandTable.registerCommand("cmd_editLink",    cmdEditLinkCommand);

    commandTable.registerCommand("cmd_structureClimb", cmdStructureClimbCommand);
    commandTable.registerCommand("cmd_structureFirstChild", cmdStructureFirstChildCommand);
    commandTable.registerCommand("cmd_structureNext", cmdStructureNextCommand);
    commandTable.registerCommand("cmd_structurePrevious", cmdStructurePreviousCommand);

    commandTable.registerCommand("cmd_commentOrPI",  cmdCommentOrPICommand);
  },

  setupFormatCommands: function setupFormatCommands()
  {
    try {
      var commandManager = EditorUtils.getCurrentCommandManager();

      commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentCreated");
      commandManager.addCommandObserver(gEditorDocumentObserver, "cmd_setDocumentModified");
      commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentWillBeDestroyed");
      commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentLocationChanged");

      // cmd_bold is a proxy, that's the only style command we add here
      commandManager.addCommandObserver(gEditorDocumentObserver, "cmd_bold");
    } catch (e) { alert(e); }
  },

  updateSelectionBased: function updateSelectionBased(aDontNotify)
  {
    try {
      var mixed = EditorUtils.getSelectionContainer();
      if (!mixed) return;
      var element = mixed.node;
      var oneElementSelected = mixed.oneElementSelected;

      if (!element) return;

      if (this.mSelectionTimeOutId)
        clearTimeout(this.mSelectionTimeOutId);

      this.mSelectionTimeOutId = setTimeout(this._updateSelectionBased, 100, element, oneElementSelected, aDontNotify);
    }
    catch(e) {}
  },

  _updateSelectionBased: function _updateSelectionBased(aElement, aOneElementSelected, aDontNotify)
  {
    NotifierUtils.notify("selection_strict", aElement, aOneElementSelected);

    var path = "";
    var node = aElement;
    while (node && node.nodeType == Node.ELEMENT_NODE) {
      path += node.nodeName.toLowerCase() + ":";
      var child = node;
      var j = 0;
      while (child.previousElementSibling) {
        j++;
        child = child.previousElementSibling;
      }
      path += j;
      for (var i = 0; i < node.attributes.length; i++) {
        path += "[" + node.attributes[i].nodeName + "=" +
                      node.attributes[i].nodeValue + "]";
      }
  
      node = node.parentNode;
      path += " ";
    }

    // trivial case
    if (ComposerCommands.mLastSelectedElement != aElement) {
      ComposerCommands.mLastSelectedElement = aElement;
      ComposerCommands.mLastSelectedElementPath = path;
      if (!aDontNotify)
        NotifierUtils.notify("selection", aElement, aOneElementSelected);
    }

    if (ComposerCommands.mLastSelectedElementPath != path) {
      // now we're sure something changed in the selection, element or attribute
      // on the selected element
      if (!aDontNotify)
        NotifierUtils.notify("selection", aElement, aOneElementSelected);
      ComposerCommands.mLastSelectedElementPath = path;
    }
  },

  onStateButtonUpdate: function onStateButtonUpdate(button, commmandID, onState)
  {
    var commandNode = document.getElementById(commmandID);
    var state = commandNode.getAttribute("state");
  
    button.checked = state == onState;
  },

  selectionListener: {
    //Interfaces this component implements.
    interfaces: [Components.interfaces.nsIEditorObserver,
                 Components.interfaces.nsIEditorMouseObserver,
                 Components.interfaces.nsISelectionListener,
                 Components.interfaces.nsITransactionListener,
                 Components.interfaces.nsISupports],
  
    // nsISupports
  
    QueryInterface: function(iid) {
      if (!this.interfaces.some( function(v) { return iid.equals(v) } ))
        throw Components.results.NS_ERROR_NO_INTERFACE;
  
      return this;
    },
  
    getInterface: function(iid) {
      return this.QueryInterface(iid);
    },

    notifySelectionChanged: function(doc, sel, reason)
    {
      ComposerCommands.updateSelectionBased(false);
    },

    EditAction: function()
    {
      ComposerCommands.updateSelectionBased(false);
    },

    MouseDown: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      return TableResizer.MouseDown(aClientX, aClientY, aTarget, aIsShiftKey);
    },

    MouseMove: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      return TableResizer.MouseMove(aClientX, aClientY, aTarget, aIsShiftKey);
    },

    MouseUp: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      return TableResizer.MouseUp(aClientX, aClientY, aTarget, aIsShiftKey);
    },

    willDo: function(aManager, aTransaction) { return false; },
    didDo: function(aManager, aTransaction, aDoResult) { },
    willUndo: function(aManager, aTransaction) { return false; },
    didUndo: function(aManager, aTransaction, aDoResult) {
      ComposerCommands.updateSelectionBased(false);
      if ("ResponsiveRulerHelper" in window)
        setTimeout(function() { ResponsiveRulerHelper.refresh() }, 100);
    },
    willRedo: function(aManager, aTransaction) { return false; },
    didRedo: function(aManager, aTransaction, aDoResult) {
      ComposerCommands.updateSelectionBased(false);
      if ("ResponsiveRulerHelper" in window)
        setTimeout(function() { ResponsiveRulerHelper.refresh() }, 100);
    },
    willBeginBatch: function(aManager) { return false; },
    didBeginBatch: function(aManager, aResult) {},
    willEndBatch: function(aManager) { return false; },
    didEndBatch: function(aManager, aResult) {},
    willMerge: function(aManager, aTopTransaction, aTransactionToMerge) { return false; },
    didMerge: function(aManager, aTopTransaction, aTransactionToMerge, aDidMerge, aMergeResult) {}
  }
};

#include navigationCommands.inc
#include fileCommands.inc
#include viewCommands.inc
#include dummyCommands.inc
#include formatCommands.inc
#include insertionCommands.inc
#include editCommands.inc
#include tableCommands.inc
#include printCommands.inc

function goDoNoCSSCommand(aCommand)
{
  try {
    var controller = top.document.commandDispatcher
                        .getControllerForCommand(aCommand);
    if (controller && controller.isCommandEnabled(aCommand)) {
      var editor = EditorUtils.getCurrentEditor();
      var isCSSEnabled = editor.isCSSEnabled;
      editor.isCSSEnabled = false;
      controller.doCommand(aCommand);
      editor.isCSSEnabled = isCSSEnabled;
    }
  }
  catch (e) {
    Components.utils.reportError("An error occurred executing the " +
                                 aCommand + " command: " + e);
  }
}
