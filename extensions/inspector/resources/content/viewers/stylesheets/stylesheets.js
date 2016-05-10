/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* StyleSheetsViewer ----------------------------------------------------------
*  The viewer for the style sheets loaded by a document.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://global/content/viewSourceUtils.js
*   chrome://inspector/content/jsutil/commands/baseCommands.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", StyleSheetsViewer_initialize, false);

function StyleSheetsViewer_initialize()
{
  viewer = new StyleSheetsViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

//////////////////////////////////////////////////////////////////////////////
//// Class StyleSheetsViewer

function StyleSheetsViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);

  this.mTree = document.getElementById("olStyleSheets");
  this.mOlBox = this.mTree.treeBoxObject;
}

StyleSheetsViewer.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPane: null,
  mView: null,

  ////////////////////////////////////////////////////////////////////////////
  //// Interface inIViewer

  get uid()
  {
    return "stylesheets";
  },

  get pane()
  {
    return this.mPane;
  },

  get selection()
  {
    return this.mSelection;
  },

  get subject()
  {
    return this.mSubject;
  },

  set subject(aObject)
  {
    this.mView = new StyleSheetsView(aObject);
    this.mOlBox.view = this.mView;
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
    this.mView.selection.select(0);
  },

  initialize: function SSVr_Initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function SSVr_Destroy()
  {
    this.mOlBox.view = null;
  },

  isCommandEnabled: function SSVr_IsCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdEditCopyFileURI":
      case "cmdEditViewFileURI":
      case "cmdEditInspectInNewWindow":
        return !!this.getSelectedSheet();
    }
    return false;
  },

  getCommand: function SSVr_GetCommand(aCommand)
  {
    if (aCommand in window) {
      return new window[aCommand]();
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Event Dispatching

  addObserver: function SSVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function SSVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Stuff

  onItemSelected: function SSVr_OnItemSelected()
  {
    this.pane.panelset.updateAllCommands();

    var idx = this.mTree.currentIndex;
    this.mSelection = this.mView.getSheet(idx);
    this.mObsMan.dispatchEvent("selectionChange",
                               { selection: this.mSelection });
  },

  getSelectedSheet: function SSVr_GetSelectedSheet()
  {
    if (this.mView.selection.count == 1) {
      let minAndMax = {};
      this.mView.selection.getRangeAt(0, minAndMax, minAndMax);
      return this.mView.getSheet(minAndMax.value);
    }
    return null;
  },

  onPopupShowing: function SRVr_OnPopupShowing(aCommandSetId)
  {
    // cmdEditInspectInNewWindow should already be up to date, but we need to
    // make sure the others are as well.
    var commandset = document.getElementById(aCommandSetId);
    for (let i = 0; i < commandset.childNodes.length; i++) {
      var command = commandset.childNodes[i];
      if (viewer.isCommandEnabled(command.id)) {
        command.removeAttribute("disabled");
      }
      else {
        command.setAttribute("disabled", "true");
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
//// StyleSheetsView

function StyleSheetsView(aDocument)
{
  this.mDocument = aDocument;
  this.mSheets = [];
  this.mLevels = [];
  this.mOpen = [];
  this.mChildCount = [];
  this.mRowCount = 0;

  var ss = aDocument.styleSheets;
  for (let i = 0; i < ss.length; ++i) {
    this.insertSheet(ss[i], 0, -1);
  }
}

StyleSheetsView.prototype = new inBaseTreeView();

StyleSheetsView.prototype.getSheet =
function SSV_GetSheet(aRow)
{
  return this.mSheets[aRow];
}

StyleSheetsView.prototype.insertSheet =
function SSV_InsertSheet(aSheet, aLevel, aRow)
{
  var row = aRow < 0 ? this.mSheets.length : aRow;

  this.mSheets[row] = aSheet;
  this.mLevels[row] = aLevel;
  this.mOpen[row] = false;

  var count = 0;
  var rules = aSheet.cssRules;
  for (let i = 0; i < rules.length; ++i) {
    if (rules[i].type == CSSRule.IMPORT_RULE) {
      ++count;
    }
  }
  this.mChildCount[row] = count;
  ++this.mRowCount;
}

//////////////////////////////////////////////////////////////////////////////
//// Interface nsITreeView

StyleSheetsView.prototype.getCellText =
function SSV_GetCellText(aRow, aCol)
{
  var rule = this.mSheets[aRow];
  if (aCol.id == "olcHref") {
    if (rule.href) {
      return rule.href;
    }
    // fall back for style elements
    if (rule.ownerNode && rule.ownerNode.ownerDocument) {
      return rule.ownerNode.ownerDocument.documentURI;
    }
  }
  else if (aCol.id == "olcRules") {
    return this.mSheets[aRow].cssRules.length;
  }
  return "";
}

StyleSheetsView.prototype.getLevel =
function SSV_GetLevel(aRow)
{
  return this.mLevels[aRow];
}

StyleSheetsView.prototype.isContainer =
function SSV_IsContainer(aRow)
{
  return this.mChildCount[aRow] > 0;
}

StyleSheetsView.prototype.isContainerEmpty =
function SSV_IsContainerEmpty(aRow)
{
  return !this.isContainer(aRow);
}

StyleSheetsView.prototype.getParentIndex =
function SSV_GetParentIndex(aRow)
{
  var baseLevel = this.mLevels[aRow];
  for (let i = aRow - 1; i >= 0; --i) {
    if (this.mLevels[i] < baseLevel) {
      return i;
    }
  }
  return -1;
}

StyleSheetsView.prototype.hasNextSibling =
function SSV_HasNextSibling(aRow, aAfter)
{
  var baseLevel = this.mLevels[aRow];
  for (let i = aAfter + 1; i < this.mRowCount; ++i) {
    if (this.mLevels[i] < baseLevel) {
      break;
    }
    if (this.mLevels[i] == baseLevel) {
      return true;
    }
  }
  return false;
}

StyleSheetsView.prototype.isContainerOpen =
function SSV_IsContainerOpen(aRow)
{
  return this.mOpen[aRow];
}

StyleSheetsView.prototype.toggleOpenState =
function SSV_ToggleOpenState(aRow)
{
  var changeCount = 0;
  if (this.mOpen[aRow]) {
    var baseLevel = this.mLevels[aRow];
    for (let i = aRow + 1; i < this.mRowCount; ++i) {
      if (this.mLevels[i] <= baseLevel) {
        break;
      }
      ++changeCount;
    }
    // shift data up
    this.mSheets.splice(aRow + 1, changeCount);
    this.mLevels.splice(aRow + 1, changeCount);
    this.mOpen.splice(aRow + 1, changeCount);
    this.mChildCount.splice(aRow + 1, changeCount);
    changeCount = -changeCount;
    this.mRowCount += changeCount;
  }
  else {
    // for quick access
    var rules = this.mSheets[aRow].cssRules;
    var level = this.mLevels[aRow] + 1;
    var childCount = this.mChildCount[aRow];
    // shift data down
    for (let i = this.mRowCount - 1; i > aRow; --i) {
      this.mSheets[i + childCount] = this.mSheets[i];
      this.mLevels[i + childCount] = this.mLevels[i];
      this.mOpen[i + childCount] = this.mOpen[i];
      this.mChildCount[i + childCount] = this.mChildCount[i];
    }
    // fill in new rows
    for (let i = 0; i < rules.length; ++i) {
      if (rules[i].type == CSSRule.IMPORT_RULE) {
        ++changeCount;
        this.insertSheet(rules[i].styleSheet, level, aRow + changeCount);
      }
      else if (rules[i].type != CSSRule.CHARSET_RULE) {
        // only @charset and other @imports may precede @import, so exit now
        break;
      }
    }
  }

  this.mOpen[aRow] = !this.mOpen[aRow];
  this.mTree.rowCountChanged(aRow + 1, changeCount);
  this.mTree.invalidateRow(aRow);
}

//////////////////////////////////////////////////////////////////////////////
//// Transactions

function cmdEditInspectInNewWindow()
{
  this.mObject = viewer.getSelectedSheet();
}

cmdEditInspectInNewWindow.prototype = new cmdEditInspectInNewWindowBase();

function cmdEditCopyFileURI()
{
  var sheet = viewer.getSelectedSheet();
  this.mString = sheet && sheet.href;
}

cmdEditCopyFileURI.prototype = new cmdEditCopySimpleStringBase();

function cmdEditViewFileURI()
{
  var sheet = viewer.getSelectedSheet();
  this.mURI = sheet && sheet.href;
}

cmdEditViewFileURI.prototype = new cmdEditViewFileURIBase();
