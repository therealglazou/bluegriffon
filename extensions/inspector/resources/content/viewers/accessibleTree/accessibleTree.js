/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* AccessibleEventsViewer --------------------------------------------
*  The viewer for the accessible tree of a document.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/hooks.js
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/events/ObserverManager.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/xul/FrameExchange.js
****************************************************************/

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kObserverServiceCID = "@mozilla.org/observer-service;1";
const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const nsIObserverService = Components.interfaces.nsIObserverService;

const nsIAccessibleRetrieval = Components.interfaces.nsIAccessibleRetrieval;
const nsIAccessibleEvent = Components.interfaces.nsIAccessibleEvent;
const nsIAccessible = Components.interfaces.nsIAccessible;

const nsIDOMNode = Components.interfaces.nsIDOMNode;

/**
 * QI nsIAccessNode interface if any, used for compatibility with Gecko versions
 * prior to Gecko13.
 */
function QIAccessNode(aAccessible)
{
  return "nsIAccessNode" in Components.interfaces ?
    XPCU.QI(aAccessible, Components.interfaces.nsIAccessNode) : aAccessible;
}

///////////////////////////////////////////////////////////////////////////////
//// Initialization

window.addEventListener("load", AccessibleTreeViewer_initialize, false);

function AccessibleTreeViewer_initialize()
{
  viewer = new AccessibleTreeViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

///////////////////////////////////////////////////////////////////////////////
//// AccessibleEventsViewer

function AccessibleTreeViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);

  this.mTree = document.getElementById("olAccessibleTree");
  this.mOlBox = this.mTree.treeBoxObject;
}

AccessibleTreeViewer.prototype =
{
  //Initialization

  mSubject: null,
  mPane: null,
  mView: null,

  // interface inIViewer

  get uid() { return "accessibleTree"; },
  get pane() { return this.mPane; },
  get selection() { return this.mSelection; },

  get subject() { return this.mSubject; },
  set subject(aObject)
  {
    this.mView = new inAccTreeView(aObject);
    this.mOlBox.view = this.mView;
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
    this.mView.selection.select(0);
  },

  initialize: function initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function destroy()
  {
    this.mView.destroy();
    this.mOlBox.view = null;
  },

  isCommandEnabled: function isCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdEditInspectInNewWindow":
        return this.mTree.view.selection.count == 1;
    }
    return false;
  },

  getCommand: function getCommand(aCommand)
  {
    if (aCommand in window) {
      return new window[aCommand]();
    }
    return null;
  },

  // event dispatching

  addObserver: function addObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },
  removeObserver: function removeObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  // UI commands
  cmdEvalJS: function cmdEvalJS()
  {
    var sel = this.getSelectedAccessible();
    if (sel) {
      var win = openDialog("chrome://inspector/content/viewers/accessibleTree/evalJSDialog.xul", 
                           "_blank", "chrome,resizable=yes", sel, this.mView);
    }
  },

  // stuff

  onItemSelected: function onItemSelected()
  {
    var idx = this.mTree.currentIndex;
    this.mSelection = this.mView.getObject(idx);
    this.mObsMan.dispatchEvent("selectionChange",
                               { selection: this.mSelection } );

    if (this.mSelection) {
      var node = this.mSelection.DOMNode;
      if (node.nodeType == nsIDOMNode.ELEMENT_NODE) {
        var flasher = this.mPane.panelset.flasher;
        flasher.flashElementOnSelect(node);
      }
    }

    viewer.pane.panelset.updateAllCommands();
  },

  getSelectedAccessible: function getSelectedAccessible()
  {
    if (this.mTree.view.selection.count == 1) {
      var rangeMinAndMax = {};
      this.mTree.view.selection.getRangeAt(0, rangeMinAndMax, rangeMinAndMax);
      return this.mView.getAccessible(rangeMinAndMax.value);
    }
    return null;
  }
};

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeView

function inAccTreeView(aObject)
{
  this.mNodes = [];

  this.mAccService = XPCU.getService(kAccessibleRetrievalCID,
                                     nsIAccessibleRetrieval);

  this.mAccessible = aObject instanceof nsIAccessible ?
    aObject : this.mAccService.getAccessibleFor(aObject);

  this.mObserverService = XPCU.getService(kObserverServiceCID,
                                          nsIObserverService);

  this.mObserverService.addObserver(this, "accessible-event", false);

  var node = this.createNode(this.mAccessible);
  this.mNodes.push(node);
}

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeView. nsITreeView interface

inAccTreeView.prototype = new inBaseTreeView();

inAccTreeView.prototype.__defineGetter__("rowCount",
function rowCount()
{
  return this.mNodes.length;
});

inAccTreeView.prototype.getCellText =
function getCellText(aRow, aCol)
{
  var node = this.rowToNode(aRow);
  if (!node)
    return "";

  var accessible = node.accessible;

  if (aCol.id == "olcRole") {
    // 'finalRole' is replaced by 'role' property in Gecko 1.9.2.
    var role = "finalRole" in accessible ?
      accessible.finalRole : accessible.role;
    return this.mAccService.getStringRole(role);
  }

  if (aCol.id == "olcName")
    return accessible.name;

  if (aCol.id == "olcNodeName") {
    var node = QIAccessNode(accessible).DOMNode;
    return node ? node.nodeName : "";
  }

  return "";
}

inAccTreeView.prototype.isContainer =
function isContainer(aRow)
{
  var node = this.rowToNode(aRow);
  return node ? node.isContainer : false;
}

inAccTreeView.prototype.isContainerOpen =
function isContainerOpen(aRow)
{
  var node = this.rowToNode(aRow);
  return node ? node.isOpen : false;
}

inAccTreeView.prototype.isContainerEmpty =
function isContainerEmpty(aRow)
{
  return !this.isContainer(aRow);
}

inAccTreeView.prototype.getLevel =
function getLevel(aRow)
{
  var node = this.rowToNode(aRow);
  return node ? node.level : 0;
}

inAccTreeView.prototype.getParentIndex =
function getParentIndex(aRow)
{
  var node = this.rowToNode(aRow);
  if (!node)
    return -1;

  var checkNode = null;
  var i = aRow - 1;
  do {
    checkNode = this.rowToNode(i);
    if (!checkNode)
      return -1;

    if (checkNode == node.parent)
      return i;
    --i;
  } while (checkNode);

  return -1;
}

inAccTreeView.prototype.hasNextSibling =
function hasNextSibling(aRow, aAfterRow)
{
  var node = this.rowToNode(aRow);
  return node && (node.next != null);
}

inAccTreeView.prototype.toggleOpenState =
function toggleOpenState(aRow)
{
  var node = this.rowToNode(aRow);
  if (!node)
    return;

  var oldCount = this.rowCount;
  if (node.isOpen)
    this.collapseNode(aRow);
  else
    this.expandNode(aRow);

  this.mTree.invalidateRow(aRow);
  this.mTree.rowCountChanged(aRow + 1, this.rowCount - oldCount);
}

inAccTreeView.prototype.getRowProperties =
function getRowProperties(aRowIdx, aProperties)
{
  var node = this.rowToNode(aRowIdx);
  if (node && node.highlighted) {
    if (!aProperties)
      return "highlight";

    let atom = this.createAtom("highlight");
    aProperties.AppendElement(atom);
  }

  return "";
}

inAccTreeView.prototype.getCellProperties =
function getCellProperties(aRowIdx, aCol, aProperties)
{
  return this.getRowProperties(aRowIdx, aProperties);
}

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeView. Public.

/**
 * Destroy the view.
 */
inAccTreeView.prototype.destroy =
function inAccTreeView_destroy()
{
  this.mObserverService.removeObserver(this, "accessible-event");
}

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeView. Tree utils.

/**
 * Expands a tree node on the given row.
 *
 * @param aRow - row index.
 */
inAccTreeView.prototype.expandNode =
function expandNode(aRow)
{
  var node = this.rowToNode(aRow);
  if (!node)
    return;

  var kids = node.accessible.children;
  var kidCount = kids.length;

  var newNode = null;
  var prevNode = null;

  for (var i = 0; i < kidCount; ++i) {
    var accessible = kids.queryElementAt(i, nsIAccessible);
    newNode = this.createNode(accessible, node);
    this.mNodes.splice(aRow + i + 1, 0, newNode);

    if (prevNode)
      prevNode.next = newNode;
    newNode.previous = prevNode;
    prevNode = newNode;
  }

  node.isOpen = true;
}

/**
 * Collapse a tree node on the given row.
 *
 * @param aRow - row index.
 */
inAccTreeView.prototype.collapseNode =
function collapseNode(aRow)
{
  var node = this.rowToNode(aRow);
  if (!node)
    return;

  var row = this.getLastDescendantOf(node, aRow);
  this.mNodes.splice(aRow + 1, row - aRow);

  node.isOpen = false;
}

/**
 * Expand the tree and highlight accessibles in the given subtree that comply
 * to filter function.
 *
 * @param aRoot - the root accessible of subtree to search in
 * @param aFilterFunc - a function that returns true if the passed accessible
                        complies to search criteria.
 */
inAccTreeView.prototype.search =
function search(aRoot, aFilterFunc)
{
  QIAccessNode(aRoot);
  if (aFilterFunc(aRoot)) {
    let chain = [];
    let parent = aRoot;
    do {
      chain.push(parent);
      if (parent == aRoot.document)
        break;

      parent = parent.parent;
    } while (parent);

    let current = chain.pop();
    for (let idx = 0; idx < this.mNodes.length; idx++) {
      let node = this.mNodes[idx];
      if (node.accessible == current) {
        if (chain.length == 0) {
          node.highlighted = true;
          this.mTree.invalidateRow(idx);
        } else {
          if (!node.isOpen)
            this.toggleOpenState(idx);

          current = chain.pop();
        }
      }
    }
  }

  var count = aRoot.childCount;
  for (let idx = 0; idx < count; idx++) {
    let child = aRoot.getChildAt(idx);
    this.search(child, aFilterFunc);
  }
}

/**
 * Clear search results.
 */
inAccTreeView.prototype.clearSearch =
function clearSearch()
{
  for (let idx = 0; idx < this.mNodes.length; idx++) {
    if (this.mNodes[idx].highlighted) {
      this.mNodes[idx].highlighted = false;
      this.mTree.invalidateRow(idx);
    }
  }
}


/**
 * Create a tree node.
 *
 * @param aAccessible - an accessible object associated with created tree node.
 * @param aParent - parent tree node for the created tree node.
 * @retrurn - tree node object for the given accesible.
 */
inAccTreeView.prototype.createNode =
function createNode(aAccessible, aParent)
{
  var node = new inAccTreeViewNode(aAccessible);
  node.level = aParent ? aParent.level + 1 : 0;
  node.parent = aParent;
  node.isContainer = aAccessible.children.length > 0;

  return node;
}

/**
 * Return row index of the last node that is a descendant of the given node.
 * If there is no required node then return the given row.
 *
 * @param aNode - tree node for that last descedant is searched.
 * @param aRow - row index of the given tree node.
 */
inAccTreeView.prototype.getLastDescendantOf =
function getLastDescendantOf(aNode, aRow)
{
  var rowCount = this.rowCount;

  var row = aRow + 1;
  for (; row < rowCount; ++row) {
    if (this.mNodes[row].level <= aNode.level)
      return row - 1;
  }

  return rowCount - 1;
}

/**
 * Return a tree node by the given row.
 *
 * @param aRow - row index.
 */
inAccTreeView.prototype.rowToNode =
function rowToNode(aRow)
{
  if (aRow < 0 || aRow >= this.rowCount)
    return null;

  return this.mNodes[aRow];
}

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeView. Accessibility utils.

/**
 * Return DOM node for an accessible or accessible if there is no associated
 * DOM node by the tree node pointed by the given row index.
 *
 * @param aRow - row index.
 */
inAccTreeView.prototype.getObject =
function getObject(aRow)
{
  var node = this.mNodes[aRow];
  return node && QIAccessNode(node.accessible);
}

/**
 * Return accessible of the tree node pointed by the given
 * row index.
 *
 * @param aRow - the row index to get the accessible from.
 * @returns the accessible for the given index.
 */
inAccTreeView.prototype.getAccessible =
function getAccessible(aRow)
{
  var node = this.mNodes[aRow];
  if (!node)
    return null;

  return node.accessible;
}

inAccTreeView.prototype.observe =
function inAccTreeView_observe(aSubject, aTopic, aData)
{
  let event = XPCU.QI(aSubject, nsIAccessibleEvent);

  // Update the children if they were changed.
  if (event.eventType != nsIAccessibleEvent.EVENT_REORDER)
    return;

  var accessible = event.accessible;
  if (!accessible)
    return;

  // Ignore the event if its target is from anther document.
  var parentAccessible = accessible;
  while (parentAccessible != this.mAccessible) {
    parentAccessible = parentAccessible.parent;
    if (!parentAccessible) {
      return;
    }
  }

  for (let idx = 0; idx < this.mNodes.length; idx++) {
    let node = this.mNodes[idx];
    if (node.accessible == accessible) {
      if (node.isOpen) {
        // Toggle open state twice to update the children.
        this.toggleOpenState(idx);
        this.toggleOpenState(idx);
      }
      break;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//// inAccTreeViewNode

function inAccTreeViewNode(aAccessible)
{
  this.accessible = aAccessible;

  this.parent = null;
  this.next = null;
  this.previous = null;

  this.level = 0;
  this.isOpen = false;
  this.isContainer = false;
}

//////////////////////////////////////////////////////////////////////////////
//// Transactions

function cmdEditInspectInNewWindow()
{
  this.mObject = viewer.getSelectedAccessible();
}

cmdEditInspectInNewWindow.prototype = new cmdEditInspectInNewWindowBase();
