/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* UsedFontFacesViewer --------------------------------------------------------
*  The viewer for the font faces used for a DOM node.
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

window.addEventListener("load", UsedFontFacesViewer_initialize, false);

function UsedFontFacesViewer_initialize()
{
  viewer = new UsedFontFacesViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

//////////////////////////////////////////////////////////////////////////////
//// class UsedFontFacesViewer

function UsedFontFacesViewer()
{
  this.mObsMan = new ObserverManager(this);

  this.mDOMUtils = XPCU.getService("@mozilla.org/inspector/dom-utils;1",
                                   "inIDOMUtils");

  this.mTree = document.getElementById("olFonts");
}

UsedFontFacesViewer.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPane: null,

  ////////////////////////////////////////////////////////////////////////////
  //// interface inIViewer

  get uid()
  {
    return "usedFontFaces";
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
    this.mTreeView = new UsedFontFacesView(this.mSubject);
    this.mTree.view = this.mTreeView;
    this.mObsMan.dispatchEvent("subjectChange", { subject: this.mSubject });
  },

  initialize: function UFFVr_Initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function UFFVr_Destroy()
  {
    // We need to remove the view at this time or else it will attempt to
    // re-paint while the document is being deconstructed, resulting in some
    // nasty XPConnect assertions
    this.mTree.view = null;
  },

  isCommandEnabled: function UFFVr_IsCommandEnabled(aCommand)
  {
    switch (aCommand) {
      // ppUsedFontFacesContext
      case "cmdEditCopy":
        return this.mTree.view.selection.count > 0;
      case "cmdEditCopyFileURI":
        return this.mTreeView.getSelectedRowObjects()
                             .some(function(aFont) { return !!aFont.URI; });
    }
    return false;
  },

  getCommand: function UFFVr_GetCommand(aCommand)
  {
    switch (aCommand) {
      case "cmdEditCopy":
        return new cmdEditCopy(this.mTreeView.getSelectedRowObjects());
      case "cmdEditCopyFileURI":
        return new cmdEditCopyFileURI(this.mTreeView.getSelectedRowObjects());
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// event dispatching

  addObserver: function UFFVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function UFFVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Miscellaneous

  onItemSelected: function UFFVr_OnItemSelected()
  {
    // This will (eventually) call isCommandEnabled on Copy
    viewer.pane.panelset.updateAllCommands();
  },

  onPopupShowing: function UFFVr_OnPopupShowing(aCommandSetId)
  {
    var commandset = document.getElementById(aCommandSetId);
    for (let i = 0; i < commandset.childNodes.length; i++) {
      var command = commandset.childNodes[i];
      command.setAttribute("disabled", !viewer.isCommandEnabled(command.id));
    }
  }
};

////////////////////////////////////////////////////////////////////////////
//// UsedFontFacesView

function UsedFontFacesView(aObject)
{
  // XXX Can't create a range for a DocumentType object
  if (aObject instanceof Components.interfaces.nsIDOMDocumentType) {
    this.mFontList = [];
    this.mRowCount = 0;
  }
  else {
    var range = (aObject.ownerDocument || aObject).createRange();
    range.selectNodeContents(aObject);
    this.mFontList = viewer.mDOMUtils.getUsedFontFaces(range);
    this.mRowCount = this.mFontList.length;
  }
}

UsedFontFacesView.prototype = new inBaseTreeView();

UsedFontFacesView.prototype.getCellText = function UFFV_GetCellText(aRow, aCol)
{
  var font = this.mFontList.item(aRow);
  if (aCol.id == "olcFontName") {
    return font.name;
  }
  else if (aCol.id == "olcCSSFamilyName") {
    return font.CSSFamilyName;
  }
  else if (aCol.id == "olcURI") {
    return font.URI;
  }
  else if (aCol.id == "olcLocalName") {
    return font.localName;
  }
  else if (aCol.id == "olcFormat") {
    return font.format;
  }

  return null;
};

/**
  * Returns a FontFace for the row in the tree corresponding to the passed
  * index.
  * @param aIndex
  *        index of the row in the tree
  * @return a FontFace
  */
UsedFontFacesView.prototype.getRowObjectFromIndex =
  function UFFV_GetRowObjectFromIndex(aIndex)
{
  return this.mFontList.item(aIndex);
};

/**
 * Copy the names of fonts onto the clipboard.
 * @param aFonts
 *        The font faces whose names should be copied.
 */
function cmdEditCopy(aFonts)
{
  this.mString = aFonts.map(function(aFont) { return aFont.name; }).join("\n");
}

cmdEditCopy.prototype = new cmdEditCopySimpleStringBase();

/**
 * Copy the URIs for downloaded fonts onto the clipboard.
 * @param aFonts
 *        The font faces whose URIs should be copied.
 */
function cmdEditCopyFileURI(aFonts)
{
  this.mString = aFonts.map(function(aFont) { return aFont.URI; })
                       .filter(function(aURI) { return !!aURI; })
                       .join("\n");
}

cmdEditCopyFileURI.prototype = new cmdEditCopySimpleStringBase();
