/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* ComputedStyleViewer --------------------------------------------------------
*  The viewer for the computed CSS styles on a DOM element.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/events/ObserverManager.js
*   chrome://inspector/content/commands/baseCommands.js
*   chrome://inspector/content/system/clipboardFlavors.js
*   chrome://inspector/content/xul/inBaseTreeView.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", ComputedStyleViewer_initialize, false);

function ComputedStyleViewer_initialize()
{
  viewer = new ComputedStyleViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

//////////////////////////////////////////////////////////////////////////////
//// class ComputedStyleViewer

function ComputedStyleViewer()
{
  this.mObsMan = new ObserverManager(this);
  this.mURL = window.location;

  this.mTree = document.getElementById("olStyles");
}

//XXX Don't use anonymous functions
ComputedStyleViewer.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPane: null,

  ////////////////////////////////////////////////////////////////////////////
  //// interface inIViewer

  get uid()
  {
    return "computedStyle";
  },

  get pane()
  {
    return this.mPane;
  },

  get subject()
  {
    return this.mSubject;
  },

  set subject(aObject)
  {
    this.mSubject = aObject instanceof Components.interfaces.nsIDOMNode ?
      aObject : aObject.DOMNode;

    var bo = this.mTree.treeBoxObject;
    var firstVisibleRow = -1;
    var selectedIndices;
    var currentIndex;
    if (this.mTreeView) {
      firstVisibleRow = bo.getFirstVisibleRow();
      selectedIndices = this.mTreeView.getSelectedIndices();
      currentIndex = this.mTreeView.selection.currentIndex;
    }

    this.mTreeView = new ComputedStyleView(this.mSubject);
    this.mTree.view = this.mTreeView;

    if (firstVisibleRow >= 0) {
      bo.beginUpdateBatch();
      try {
        bo.scrollToRow(firstVisibleRow);
        let selection = this.mTreeView.selection;
        for (let i = 0, n = selectedIndices.length; i < n; ++i) {
          selection.toggleSelect(selectedIndices[i]);
        }
        selection.currentIndex = currentIndex;
      }
      catch (ex) {
        Components.utils.reportError(ex);
      }
      bo.endUpdateBatch();
    }

    this.mObsMan.dispatchEvent("subjectChange", { subject: this.mSubject });
  },

  initialize: function CSVr_Initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function CSVr_Destroy()
  {
    // We need to remove the view at this time or else it will attempt to
    // re-paint while the document is being deconstructed, resulting in some
    // nasty XPConnect assertions
    this.mTree.view = null;
  },

  isCommandEnabled: function CSVr_IsCommandEnabled(aCommand)
  {
    if (aCommand == "cmdEditCopy") {
      return this.mTree.view.selection.count > 0;
    }
    return false;
  },

  getCommand: function CSVr_GetCommand(aCommand)
  {
    if (aCommand == "cmdEditCopy") {
      return new cmdEditCopy(this.mTreeView.getSelectedRowObjects());
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// event dispatching

  addObserver: function CSVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function CSVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Miscellaneous

  onItemSelected: function CSVr_OnItemSelected()
  {
    // This will (eventually) call isCommandEnabled on Copy
    viewer.pane.panelset.updateAllCommands();
  }
};

////////////////////////////////////////////////////////////////////////////
//// ComputedStyleView

function ComputedStyleView(aObject)
{
  var view = aObject.ownerDocument.defaultView;
  this.mStyleList = view.getComputedStyle(aObject, "");
  this.mRowCount = this.mStyleList.length;
}

ComputedStyleView.prototype = new inBaseTreeView();

ComputedStyleView.prototype.getCellText = function CSV_GetCellText(aRow, aCol)
{
  var prop = this.mStyleList.item(aRow);
  if (aCol.id == "olcStyleName") {
    return prop;
  }
  else if (aCol.id == "olcStyleValue") {
    return this.mStyleList.getPropertyValue(prop);
  }

  return null;
}

/**
  * Returns a CSSProperty for the row in the tree corresponding to the passed
  * index.
  * @param aIndex
  *        index of the row in the tree
  * @return a CSSProperty
  */
ComputedStyleView.prototype.getRowObjectFromIndex =
  function CSV_GetRowObjectFromIndex(aIndex)
{
  var prop = this.mStyleList.item(aIndex);
  return new CSSProperty(prop, this.mStyleList.getPropertyValue(prop));
}
