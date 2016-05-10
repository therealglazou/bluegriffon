/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 
///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const nsIAccessibleRetrieval = Components.interfaces.nsIAccessibleRetrieval;

const nsIAccessibleEvent = Components.interfaces.nsIAccessibleEvent;
const nsIAccessibleStateChangeEvent =
  Components.interfaces.nsIAccessibleStateChangeEvent;
const nsIAccessibleTextChangeEvent =
  Components.interfaces.nsIAccessibleTextChangeEvent;
const nsIAccessibleCaretMoveEvent =
  Components.interfaces.nsIAccessibleCaretMoveEvent;

const nsIDOMNode = Components.interfaces.nsIDOMNode;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", AccessibleEventViewer_initialize, false);

function AccessibleEventViewer_initialize()
{
  viewer = new AccessibleEventViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

///////////////////////////////////////////////////////////////////////////////
//// class AccessibleEventViewer
function AccessibleEventViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);
  this.mAccService = XPCU.getService(kAccessibleRetrievalCID,
                                     nsIAccessibleRetrieval);
}

AccessibleEventViewer.prototype =
{
  mSubject: null,
  mPane: null,
  mAccEventSubject: null,
  mAccService: null,

  get uid() { return "accessibleEvent"; },
  get pane() { return this.mPane; },

  get subject() { return this.mSubject; },
  set subject(aObject)
  {
    this.mSubject = aObject;
    this.updateView();
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
  },

  initialize: function initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  isCommandEnabled: function isCommandEnabled(aCommand)
  {
    return false;
  },

  getCommand: function getCommand(aCommand)
  {
    return null;
  },

  destroy: function destroy() {},

  // event dispatching

  addObserver: function addObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },
  removeObserver: function removeObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  // private
  updateView: function updateView()
  {
    this.clearView();

    if (!this.pane.params) {
      return;
    }

    this.mAccEventSubject = this.pane.params.accessibleEvent;
    if (!this.mAccEventSubject)
      return;

    XPCU.QI(this.mAccEventSubject, nsIAccessibleEvent);

    // Update accessible event properties.
    var shownPropsId = "";
    if (this.mAccEventSubject instanceof nsIAccessibleStateChangeEvent)
      shownPropsId = "stateChangeEvent";
    else if (this.mAccEventSubject instanceof nsIAccessibleTextChangeEvent)
      shownPropsId = "textChangeEvent";
    else if (this.mAccEventSubject instanceof nsIAccessibleCaretMoveEvent)
      shownPropsId = "caretMoveEvent";

    var props = document.getElementsByAttribute("prop", "*");
    for (var i = 0; i < props.length; i++) {
      var propElm = props[i];
      var isActive = !propElm.hasAttribute("class") ||
                     (propElm.getAttribute("class") == shownPropsId);

      if (isActive) {
        var prop = propElm.getAttribute("prop");
        propElm.textContent = this[prop];
        propElm.parentNode.removeAttribute("hidden");
      } else {
        propElm.parentNode.setAttribute("hidden", "true");
      }
    }

    // Update handler output.
    var outputElm = document.getElementById("handlerOutput");
    var outputList = this.pane.params.accessibleEventHandlerOutput;
    if (outputList) {
      while (outputElm.firstChild) {
        outputElm.removeChild(outputElm.lastChild);
      }

      for (let i = 0; i < outputList.length; i++) {
        var output = outputList[i];

        // Generate a tree.
        if (typeof output == "object" && "cols" in output && "view" in output) {
          var tree = document.createElement("tree");
          tree.setAttribute("flex", "1");
          tree.setAttribute("treelines", "true");

          var treecols = document.createElement("treecols");
          for (let col in output.cols) {
            var treecol = document.createElement("treecol");
            treecol.setAttribute("id", col);
            treecol.setAttribute("label", output.cols[col].name);
            treecol.setAttribute("flex", output.cols[col].flex);
            if (output.cols[col].isPrimary) {
              treecol.setAttribute("primary", "true");
            }
            treecol.setAttribute("persist", "width,hidden,ordinal");
            treecols.appendChild(treecol);

            var splitter = document.createElement("splitter");
            splitter.setAttribute("class", "tree-splitter");
            treecols.appendChild(splitter);
          }
          tree.appendChild(treecols);

          var treechildren = document.createElement("treechildren");
          tree.appendChild(treechildren);
          outputElm.appendChild(tree);
          tree.treeBoxObject.view = output.view;

        }
        else {
          // Output text.
          var node = document.createElement("description");
          node.textContent = output;
          outputElm.appendChild(node);
        }
      }

      outputElm.parentNode.removeAttribute("hidden");
    }
    else {
      outputElm.parentNode.setAttribute("hidden", "true");
    }
  },

  clearView: function clearView()
  {
    var containers = document.getElementsByAttribute("prop", "*");
    for (var i = 0; i < containers.length; ++i)
      containers[i].textContent = "";
  },

  get isFromUserInput()
  {
    return this.mAccEventSubject.isFromUserInput;
  },

  get state()
  {
    var state = 0, extraState = 0;
    var isExtraState = typeof this.mAccEventSubject.isExtraState == "function" ?
      this.mAccEventSubject.isExtraState() : this.mAccEventSubject.isExtraState;
    if (isExtraState) {
      extraState = this.mAccEventSubject.state;
    }
    else {
      state = this.mAccEventSubject.state;
    }

    var states = this.mAccService.getStringStates(state, extraState);

    var list = [];
    for (var i = 0; i < states.length; i++)
      list.push(states.item(i));
    return list.join();
  },

  get isEnabled()
  {
    return typeof this.mAccEventSubject.isEnabled == "function" ?
      this.mAccEventSubject.isEnabled() : this.mAccEventSubject.isEnabled;
  },

  get startOffset()
  {
    return this.mAccEventSubject.start;
  },

  get length()
  {
    return this.mAccEventSubject.length;
  },

  get isInserted()
  {
    return typeof this.mAccEventSubject.isInserted == "function" ?
      this.mAccEventSubject.isInserted() : this.mAccEventSubject.isInserted;
  },

  get modifiedText()
  {
    return this.mAccEventSubject.modifiedText;
  },

  get caretOffset()
  {
    return this.mAccEventSubject.caretOffset;
  }
};

