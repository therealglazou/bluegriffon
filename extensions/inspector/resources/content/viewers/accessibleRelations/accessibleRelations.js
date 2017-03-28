/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* AccessibleRelationsViewer --------------------------------------------
*  The viewer for the accessible relations for the inspected accessible.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
****************************************************************/

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;
var gAccService = null;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const nsIAccessibleRetrieval = Components.interfaces.nsIAccessibleRetrieval;
const nsIAccessibleRelation = Components.interfaces.nsIAccessibleRelation;
const nsIAccessible = Components.interfaces.nsIAccessible;

/**
 * Used for compatibility with Gecko versions prior to Gecko13.
 */
const nsIAccessNode = Components.interfaces.nsIAccessNode || nsIAccessible;

///////////////////////////////////////////////////////////////////////////////
//// Initialization

window.addEventListener("load", AccessibleRelationsViewer_initialize, false);

function AccessibleRelationsViewer_initialize()
{
  gAccService = XPCU.getService(kAccessibleRetrievalCID,
                                nsIAccessibleRetrieval);

  viewer = new AccessibleRelationsViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

///////////////////////////////////////////////////////////////////////////////
//// class AccessibleRelationsViewer

function AccessibleRelationsViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);

  this.mTree = document.getElementById("olAccessibleRelations");
  this.mTreeBox = this.mTree.treeBoxObject;

  this.mTargetsTree = document.getElementById("olAccessibleTargets");
  this.mTargetsTreeBox = this.mTargetsTree.treeBoxObject;
}

AccessibleRelationsViewer.prototype =
{
  /////////////////////////
  //// initialization

  mSubject: null,
  mPane: null,
  mView: null,
  mTargetsView: null,

  /////////////////////////
  //// interface inIViewer

  get uid() { return "accessibleRelations"; },
  get pane() { return this.mPane; },
  get selection() { return this.mSelection; },

  get subject() { return this.mSubject; },
  set subject(aObject)
  {
    this.mView = new AccessibleRelationsView(aObject);
    this.mTreeBox.view = this.mView;
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
  },

  initialize: function initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function destroy()
  {
    this.mTreeBox.view = null;
    this.mTargetsTreeBox.view = null;
  },

  isCommandEnabled: function isCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdEditInspectInNewWindow":
        return !!this.getSelectedTargetDOMNode();
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

  /////////////////////////
  //// event dispatching

  addObserver: function addObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },
  removeObserver: function removeObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  /////////////////////////
  //// utils

  onItemSelected: function onItemSelected()
  {
    var idx = this.mTree.currentIndex;
    var relation = this.mView.getRelationObject(idx);
    this.mTargetsView = new AccessibleTargetsView(relation);
    this.mTargetsTreeBox.view = this.mTargetsView;
  },

  getSelectedTargetDOMNode: function getSelectedTargetDOMNode()
  {
    return this.mTargetsView.getSelectedDOMNode();
  }
};

///////////////////////////////////////////////////////////////////////////////
//// AccessibleRelationsView

function AccessibleRelationsView(aObject)
{
  this.mAccessible = aObject instanceof nsIAccessible ?
    aObject : gAccService.getAccessibleFor(aObject);

  this.mRelations = this.mAccessible.getRelations();
}

AccessibleRelationsView.prototype = new inBaseTreeView();

AccessibleRelationsView.prototype.__defineGetter__("rowCount",
function rowCount()
{
  return this.mRelations.length;
});

AccessibleRelationsView.prototype.getRelationObject =
function getRelationObject(aRow)
{
  return this.mRelations.queryElementAt(aRow, nsIAccessibleRelation);
}

AccessibleRelationsView.prototype.getCellText =
function getCellText(aRow, aCol)
{
  if (aCol.id == "olcRelationType") {
    var relation = this.getRelationObject(aRow);
    if (relation)
      return gAccService.getStringRelationType(relation.relationType);
  }

  return "";
}

///////////////////////////////////////////////////////////////////////////////
//// AccessibleTargetsView

function AccessibleTargetsView(aRelation)
{
  this.mRelation = aRelation;
  this.mTargets = this.mRelation.getTargets();
}

///////////////////////////////////////////////////////////////////////////////
//// AccessibleTargetsView. nsITreeView

AccessibleTargetsView.prototype = new inBaseTreeView();

AccessibleTargetsView.prototype.__defineGetter__("rowCount",
function rowCount()
{
  return this.mTargets.length;
});

AccessibleTargetsView.prototype.getCellText =
function getCellText(aRow, aCol)
{
  if (aCol.id == "olcRole") {
    var accessible = this.getAccessible(aRow);
    if (accessible) {
      // 'finalRole' is replaced by 'role' property in Gecko 1.9.2.
      var role = "finalRole" in accessible ?
        accessible.finalRole : accessible.role;
      return gAccService.getStringRole(role);
    }
  } else if (aCol.id == "olcNodeName") {
    var node = this.getDOMNode(aRow);
    if (node)
      return node.nodeName;
  }

  return "";
}

///////////////////////////////////////////////////////////////////////////////
//// AccessibleTargetsView. Utils

AccessibleTargetsView.prototype.getAccessible =
function getAccessible(aRow)
{
  return this.mTargets.queryElementAt(aRow, nsIAccessible);
}

AccessibleTargetsView.prototype.getDOMNode =
function getDOMNode(aRow)
{
  var accessNode = this.mTargets.queryElementAt(aRow, nsIAccessNode);
  return accessNode && accessNode.DOMNode;
}

AccessibleTargetsView.prototype.getSelectedDOMNode =
  function getSelectedDOMNode()
{
  if (this.selection.count == 1) {
    var rangeMinAndMax = {};
    this.selection.getRangeAt(0, rangeMinAndMax, rangeMinAndMax);
    return this.getDOMNode(rangeMinAndMax.value);
  }
  return null;
}

//////////////////////////////////////////////////////////////////////////////
// Transactions

function cmdEditInspectInNewWindow() {
  this.mObject = viewer.getSelectedTargetDOMNode();
}

cmdEditInspectInNewWindow.prototype = new cmdEditInspectInNewWindowBase();
