/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* JSObjectViewer -------------------------------------------------------------
*  The viewer for all facets of a javascript object.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/hooks.js
*   chrome://inspector/content/jsutil/events/ObserverManager.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kClipboardHelperCID  = "@mozilla.org/widget/clipboardhelper;1";

//////////////////////////////////////////////////////////////////////////////
//// Class JSObjectViewer

function JSObjectViewer()
{
  this.mObsMan = new ObserverManager(this);
}

JSObjectViewer.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPane: null,

  ////////////////////////////////////////////////////////////////////////////
  //// interface inIViewer

  get uid()
  {
    return "jsObject";
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
    var object =
      "@mozilla.org/accessibleRetrieval;1" in Components.classes &&
      aObject instanceof Components.interfaces.nsIAccessible ?
      aObject.DOMNode : aObject;

    this.setSubject(object);
  },

  // The accessibleObject viewer extends JSObjectViewer.  This method is here
  // (and not just inlined above) so that the accessibleObject viewer can get
  // access to this function without having to use __lookupSetter__ before
  // overriding with its own subject setter.
  setSubject: function JSOVr_SetSubject(aObject)
  {
    this.mSubject = this.unwrapObject(aObject);
    this.mView = new JSObjectView(this.mSubject);
    this.mTree.view = this.mView;

    this.mObsMan.dispatchEvent("subjectChange", { subject: this.mSubject });

    // If the user has just switched to us from another viewer in the document
    // pane and we don't set the selection below, the object pane will
    // continue to show whatever now-irrelevant thing it was showing before.
    this.mView.selection.select(0);
    this.mView.toggleOpenState(0);
  },

  initialize: function JSOVr_Initialize(aPane)
  {
    this.mPane = aPane;
    this.mTree = document.getElementById("treeJSObject");

    aPane.notifyViewerReady(this);
  },

  destroy: function JSOVr_Destroy()
  {
  },

  isCommandEnabled: function JSOVr_IsCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdCopyValue":
      case "cmdEvalExpr":
        return this.getSelectedCount() == 1;
      case "cmdEditInspectInNewWindow":
        if (this.getSelectedCount() != 1) {
          return false;
        }
        let obj = this.getSelectedObject();
        return cmdEditInspectInNewWindowBase.isInspectable(obj);
    }
    return false;
  },

  getCommand: function JSOVr_GetCommand(aCommand)
  {
    if (aCommand in window) {
      return new window[aCommand]();
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Event Dispatching

  addObserver: function JSOVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function JSOVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// UI Commands

  cmdCopyValue: function JSOVr_CmdCopyValue()
  {
    if (this.getSelectedCount() != 1) {
      return;
    }

    var obj = this.getSelectedObject();
    var helper = XPCU.getService(kClipboardHelperCID, "nsIClipboardHelper");
    helper.copyString(obj);
  },

  cmdEvalExpr: function JSOVr_CmdEvalExpr()
  {
    if (this.getSelectedCount() != 1) {
      return;
    }

    var obj = this.getSelectedObject();
    openDialog("chrome://inspector/content/viewers/jsObject/evalExprDialog.xul",
               "_blank", "chrome", this, obj);
  },

  doEvalExpr: function JSOVr_DoEvalExpr(aExpr, aTarget, aNewView)
  {
    // TODO: I should really write some C++ code to execute the js code in the
    // js context of the inspected window

    try {
      var f = Function("target", aExpr);
      var result = f(aTarget);

      if (result) {
        if (aNewView) {
          inspectObject(result);
        }
        else {
          this.subject = result;
        }
      }
    }
    catch (ex) {
      dump("Error in expression.\n");
      throw (ex);
    }
  },

  getSelectedCount: function JSOVr_GetSelectedCount()
  {
    return this.mView.selection.count;
  },

  getSelectedObject: function JSOVr_GetSelectedObject()
  {
    if (this.getSelectedCount() != 1) {
      throw new Error("Selection count not 1");
    }
    return this.mView.getSelectedRowObjects()[0];
  },

  onTreeSelectionChange: function JSOVr_OnTreeSelectionChange()
  {
    // NB: This function gets called on selection *and* deselection.
    var view = this.mView;
    var currentIndex = view.selection.currentIndex;
    var currentValue = view.getRowObjectFromIndex(currentIndex);

    if (view.selection.isSelected(currentIndex)) {
      this.changeSelection(currentValue);
    }
    // Otherwise, the row at currentIndex was deselected.  If there are other
    // rows selected, use the nearest one for mSelection.  If not, we'll leave
    // mSelection alone and won't dispatch any event; if there's an object
    // panel linked to ours, just let it keep inspecting the value from the
    // deselected row.
    else if (this.mSelection == currentValue && view.selection.count) {
      var nearestSelectedIndex = 
        InsUtil.getNearestIndex(currentIndex, view.getSelectedIndices());
      this.changeSelection(view.getRowObjectFromIndex(nearestSelectedIndex));
    }

    this.updateAllCommands();
  },

  changeSelection: function JSOVr_ChangeSelection(aVal)
  {
    this.mSelection = aVal;
    this.mObsMan.dispatchEvent("selectionChange", { selection: aVal });
  },

  updateAllCommands: function JSOVr_UpdateAllCommands()
  {
    this.pane.panelset.updateAllCommands();

    // There's no need to worry about any other commands outside this
    // commandset; cmdInspectInNewWindow is global, so it just got updated.
    var commands = document.getElementById("cmdsJSObjectViewer").childNodes;
    for (let i = 0, n = commands.length; i < n; ++i) {
      let command = commands[i];
      if (this.isCommandEnabled(command.id)) {
        command.removeAttribute("disabled");
      }
      else {
        command.setAttribute("disabled", true);
      }
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Miscellaneous Utility Methods

  unwrapObject: function JSOVr_UnwrapObject(aObject)
  {
    /* unwrap() throws for primitive values, so don't call it for those */
    if (typeof(aObject) === "object" && aObject) {
      aObject = XPCNativeWrapper.unwrap(aObject);
    }
    return aObject;
  }
};

//////////////////////////////////////////////////////////////////////////////
//// JSObjectView

function JSObjectView(aObject)
{
  this.mKeys = [bundle.getString("root.title")];
  this.mValues = [aObject];
  this.mValueStrings = [this.jsValueToString(aObject)];

  this.mLevels = [0];
  this.mOpenStates = [false];

  this.mRowCount = 1;
}

JSObjectView.prototype = new inBaseTreeView();

JSObjectView.prototype.mLevels = null;
JSObjectView.prototype.mValues = null;
JSObjectView.prototype.mValueStrings = null;
JSObjectView.prototype.mLevels = null;
JSObjectView.prototype.mOpenStates = null;

JSObjectView.prototype.jsValueToString = function JSOV_JSValueToString(aVal)
{
  var str;
  try {
    str = String(aVal);
  }
  catch (ex) {
    str = Object.prototype.toString.call(aVal);
  }

  if (typeof(aVal) == "string") {
    str = "\"" + str + "\"";
  }

  return str;
};

/**
 * Sort the keys for an object into the following order:
 * - constants with numeric values sorted numerically by value
 *   - sorted alphanumerically by key in the event of a tie
 * - constants with non-numeric values sorted alphanumerically by key
 * - other numeric key names (e.g., array indices) sorted numerically
 * - other key names sorted alphanumerically
 * @param aObject
 *        The object whose keys we're sorting.
 * @param aKeys
 *        The list of property names of aObject being sorted.
 */
JSObjectView.prototype.sortKeys = function JSOV_SortKeys(aObject, aKeys)
{
  /**
   * A sort comparator for numeric values. Numerics come before non-numerics.
   * If both parameters are non-numeric, returns 0.
   */
  var numericSortComparator =
    function JSOV_SortKeys_NumericSortComparator(a, b)
  {
    if (isNaN(a)) {
      return isNaN(b) ? 0 : 1;
    }
    if (isNaN(b)) {
      return -1;
    }
    return a - b;
  };

  var keySortComparator = function JSOV_SortKeys_KeySortComparator(a, b)
  {
    var aIsConstant = a == a.toUpperCase() && isNaN(a);
    var bIsConstant = b == b.toUpperCase() && isNaN(b);
    // constants come first
    if (aIsConstant) {
      if (bIsConstant) {
        // both are constants. sort by numeric value, then non-numeric name
        return numericSortComparator(aObject[a], aObject[b]) ||
               a.localeCompare(b);
      }
      // a is constant, b is not
      return -1;
    }
    if (bIsConstant) {
      // b is constant, a is not
      return 1;
    }
    // neither are constants. go by numeric property name, then non-numeric
    // property name
    return numericSortComparator(a, b) || a.localeCompare(b);
  };

  aKeys.sort(keySortComparator);
};

/**
 * Get the number of rows that are descendants of the given row.
 * @param aIndex
 *        The index of the row.
 * @return The number of descendants, as above.
 */
JSObjectView.prototype.getDescendantCount =
  function JSOV_GetDescendantCount(aIndex)
{
  if (this.checkForBadIndex(aIndex)) {
    return 0;
  }

  var level = this.mLevels[aIndex];
  var currentIndex = aIndex + 1;
  var rowCount = this.mRowCount;
  while (this.mLevels[currentIndex] > level && currentIndex < rowCount) {
    ++currentIndex;
  }

  return currentIndex - aIndex - 1;
};

JSObjectView.prototype.getRowObjectFromIndex =
  function JSOV_GetRowObjectFromIndex(aIndex)
{
  if (this.checkForBadIndex(aIndex)) {
    throw new RangeError("Invalid index " + aIndex);
  }

  return this.mValues[aIndex];
}

JSObjectView.prototype.collapseRow = function JSOV_CollapseRow(aIndex)
{
  var rowsDeleted = this.getDescendantCount(aIndex);
  if (rowsDeleted) {
    let after = aIndex + 1;
    this.mKeys.splice(after, rowsDeleted);
    this.mValues.splice(after, rowsDeleted);
    this.mValueStrings.splice(after, rowsDeleted);
    this.mOpenStates.splice(after, rowsDeleted);
    this.mLevels.splice(after, rowsDeleted);
  }
  return rowsDeleted;
};

JSObjectView.prototype.expandRow = function JSOV_ExpandRow(aIndex)
{
  var insertedKeys = [];
  var insertedValues = [];
  var insertedValueStrings = [];
  var insertedOpenStates = [];
  var insertedLevels = [];

  // Get the new keys.
  var obj = this.mValues[aIndex];
  for (let key in obj) {
    // Not pretty, but we need some way to weed out properties that throw.
    // It's not as simple as just going ahead and caching the values now,
    // because when we sort the keys, we'd lose the correspondence between
    // array indices.
    try {
      let val = obj[key];
      insertedKeys.push(key);
    }
    catch (ex) {
      // Faked properties throw NOT_YET_IMPLEMENTED.  Discard them.
    }
  }
  this.sortKeys(obj, insertedKeys);

  // Get the new data.
  var rowsInserted = insertedKeys.length;
  var level = this.mLevels[aIndex] + 1;
  for (let i = 0; i < rowsInserted; ++i) {
    let val = viewer.unwrapObject(obj[insertedKeys[i]]);
    insertedValues.push(val);
    insertedValueStrings.push(this.jsValueToString(val));
    insertedOpenStates.push(false);
    insertedLevels.push(level);
  }

  // Splice in everything.
  var after = aIndex + 1;
  this.spliceFrom(this.mKeys, after, insertedKeys);
  this.spliceFrom(this.mValues, after, insertedValues);
  this.spliceFrom(this.mValueStrings, after, insertedValueStrings);
  this.spliceFrom(this.mOpenStates, after, insertedOpenStates);
  this.spliceFrom(this.mLevels, after, insertedLevels);

  return rowsInserted;
};

/**
 * Splice elements copied from one array into another at the given index.
 * There is no way to specify that any elements should be removed.
 * @param aDestination
 *        The array the data should be spliced into.
 * @param aIndex
 *        The index into aDestination that the data should be copied to.
 * @param aSource
 *        The array that should be copied into aDestination at aIndex.
 */
JSObjectView.prototype.spliceFrom =
  function JSOV_SpliceFrom(aDestination, aIndex, aSource)
{
  Array.prototype.splice.apply(aDestination, ([aIndex, 0]).concat(aSource));
};

/**
 * Check if the purported row is outside the range of valid row indexes.
 * @param aIndex
 *        The index of the given row.
 * @return true iff aIndex is outside the range
 */
JSObjectView.prototype.checkForBadIndex =
  function JSOV_CheckForBadIndex(aIndex)
{
  if (aIndex < 0 || aIndex >= this.mRowCount) {
    Components.utils.reportError("Bad index");
    return true;
  }

  return false;
};

//////////////////////////////////////////////////////////////////////////////
//// JSObjectView nsITreeView Implementation

JSObjectView.prototype.toggleOpenState = function JSOV_ToggleOpenState(aIndex)
{
  if (this.isContainerEmpty(aIndex)) {
    return;
  }

  var rowCountChange = 0;
  var isOpen = this.mOpenStates[aIndex];
  if (isOpen) {
    rowCountChange = -this.collapseRow(aIndex);
  }
  else {
    rowCountChange = this.expandRow(aIndex);
  }
  this.mOpenStates[aIndex] = !isOpen;

  this.mRowCount += rowCountChange;

  // Notify the box object.
  var bo = this.mTree;
  if (bo) {
    bo.rowCountChanged(aIndex + 1, rowCountChange);
    bo.invalidateRow(aIndex);
  }
};

JSObjectView.prototype.getCellText = function JSOV_GetCellText(aIndex, aCol)
{
  if (this.checkForBadIndex(aIndex)) {
    return "";
  }

  switch (aCol.id) {
    case "colProp":
      return this.mKeys[aIndex];
    case "colVal":
      return this.mValueStrings[aIndex];
  }
  return "";
};

JSObjectView.prototype.getParentIndex = function JSOV_GetParentIndex(aIndex)
{
  if (this.checkForBadIndex(aIndex) || aIndex == 0) {
    return -1;
  }

  var parentLevel = this.mLevels[aIndex] - 1;
  for (let i = aIndex - 1; i >= 0; --i) {
    if (this.mLevels[i] == parentLevel) {
      return i;
    }
  }

  Components.utils.reportError("Unrooted rows present");
  return -1;
};

JSObjectView.prototype.hasNextSibling =
  function JSOV_HasNextSibling(aIndex, aAfterIndex)
{
  if (this.checkForBadIndex(aIndex)) {
    return false;
  }

  var level = this.mLevels[aIndex];
  for (let i = aAfterIndex + 1, n = this.mRowCount; i < n; ++i) {
    if (this.mLevels[i] == level) {
      return true;
    }
    if (this.mLevels[i] < level) {
      break;
    }
  }

  return false;
};

JSObjectView.prototype.getLevel = function JSOV_GetLevel(aIndex)
{
  if (this.checkForBadIndex(aIndex)) {
    return -1;
  }

  return this.mLevels[aIndex];
};

JSObjectView.prototype.isContainer = function JSOV_IsContainer(aIndex)
{
  if (this.checkForBadIndex(aIndex)) {
    return false;
  }

  return cmdEditInspectInNewWindowBase.isInspectable(this.mValues[aIndex]);
};

JSObjectView.prototype.isContainerEmpty =
  function JSOV_IsContainerEmpty(aIndex)
{
  if (!this.isContainer(aIndex)) {
    return true;
  }

  var val = this.mValues[aIndex];
  for (let key in val) {
    return false;
  }

  return true;
};

JSObjectView.prototype.isContainerOpen = function JSOV_IsContainerOpen(aIndex)
{
  if (!this.isContainer(aIndex)) {
    return false;
  }

  return this.mOpenStates[aIndex];
}

//////////////////////////////////////////////////////////////////////////////
//// Transactions

function cmdEditInspectInNewWindow()
{
  if (viewer.getSelectedCount() == 1) {
    this.mObject = viewer.getSelectedObject();
  }
}

cmdEditInspectInNewWindow.prototype = new cmdEditInspectInNewWindowBase();
