/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* AccessiblePropsViewer ------------------------------------------------------
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/events/ObserverManager.js
*   chrome://inspector/content/jsutil/system/PrefUtils.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/xul/FrameExchange.js
*****************************************************************************/
 
///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;
var gBundle;
var gAccService = null;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const nsIAccessibleRetrieval = Components.interfaces.nsIAccessibleRetrieval;
const nsIAccessible = Components.interfaces.nsIAccessible;

const nsIPropertyElement = Components.interfaces.nsIPropertyElement;

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
//// Initialization/Destruction

window.addEventListener("load", AccessiblePropsViewer_initialize, false);

function AccessiblePropsViewer_initialize()
{
  gBundle = document.getElementById("accessiblePropsBundle");

  viewer = new AccessiblePropsViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

///////////////////////////////////////////////////////////////////////////////
//// class AccessiblePropsViewer
function AccessiblePropsViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);

  gAccService = XPCU.getService(kAccessibleRetrievalCID,
                                nsIAccessibleRetrieval);
}

AccessiblePropsViewer.prototype =
{
  mSubject: null,
  mPane: null,
  mAccSubject: null,
  mAccService: null,
  mPropViewerMgr: null,

  get uid() { return "accessibleProps" },
  get pane() { return this.mPane },

  get subject() { return this.mSubject },
  set subject(aObject)
  {
    this.mSubject = aObject;
    this.updateView();
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
  },

  initialize: function initialize(aPane)
  {
    this.mPropViewerMgr = new accessiblePropViewerMgr(aPane);

    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  isCommandEnabled: function isCommandEnabled(aCommand)
  {
    return this.mPropViewerMgr.isCommandEnabled(aCommand);
  },
  
  getCommand: function getCommand(aCommand)
  {
    switch (aCommand) {
      case "cmdEditInspectInNewWindow":
        return new cmdEditInspectInNewWindow(this.mPropViewerMgr);
    }
    return null;
  },

  destroy: function destroy() {},

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

  doCommand: function doCommand(aCommandId)
  {
    this.mPropViewerMgr.doCommand(aCommandId);
  },

  // private
  updateView: function updateView()
  {
    this.clearView();

    this.mAccSubject = this.mSubject instanceof nsIAccessible ?
      this.mSubject : gAccService.getAccessibleFor(this.mSubject);

    // accessible properties.
    var propContainer = document.getElementById("mainPropContainer");
    var containers = propContainer.getElementsByAttribute("prop", "*");

    for (var i = 0; i < containers.length; ++i) {
      var value = "";
      try {
        var prop = containers[i].getAttribute("prop");
        value = this[prop];
      } catch (e) {
        dump("Accessibility " + prop + " property is not available.\n");
      }

      if (value instanceof Array)
        containers[i].value = value.join(", ");
      else
        containers[i].value = value;
    }

    this.mPropViewerMgr.updateViews(this.mAccSubject);
  },

  clearView: function clearView()
  {
    var containers = document.getElementsByAttribute("prop", "*");
    for (var i = 0; i < containers.length; ++i)
      containers[i].textContent = "";

    this.mPropViewerMgr.clearViews();
  },

  get role()
  {
    // 'finalRole' is replaced by 'role' property in Gecko 1.9.2.
    var role = "finalRole" in this.mAccSubject ?
      this.mAccSubject.finalRole : this.mAccSubject.role;
    return gAccService.getStringRole(role);
  },

  get name()
  {
    return this.mAccSubject.name;
  },

  get description()
  {
    return this.mAccSubject.description;
  },

  get value()
  {
    return this.mAccSubject.value;
  },

  get state()
  {
    var stateObj = {value: null};
    var extStateObj = {value: null};

    // Since Firefox 3.1 nsIAccessible::getFinalState has been renamed to
    // nsIAccessible::getState.
    if ("getState" in this.mAccSubject)
      this.mAccSubject.getState(stateObj, extStateObj);
    else
      this.mAccSubject.getFinalState(stateObj, extStateObj);

    var list = [];

    var states = gAccService.getStringStates(stateObj.value,
                                             extStateObj.value);

    for (var i = 0; i < states.length; i++)
      list.push(states.item(i));
    return list;
  },

  get bounds()
  {
    var x = { value: 0 };
    var y = { value: 0 };
    var width = { value: 0 };
    var height = { value: 0 };
    this.mAccSubject.getBounds(x, y, width, height);

    return gBundle.getFormattedString("accBounds",
                                      [x.value, y.value,
                                       width.value, height.value]);
  }
};

function cmdEditInspectInNewWindow(aMgr)
{
  this.mPropViewerMgr = aMgr;
}

cmdEditInspectInNewWindow.prototype = new inBaseCommand();

cmdEditInspectInNewWindow.prototype.doTransaction =
  function InspectInNewWindow_DoTransaction()
{
  if (this.mPropViewerMgr) {
    this.mPropViewerMgr.inspectInNewView();
  }
};
