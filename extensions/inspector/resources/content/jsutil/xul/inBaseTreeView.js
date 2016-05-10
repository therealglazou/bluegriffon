/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* inBaseTreeView -------------------------------------------------
*  Simple tree view object meant to be extended.
*  
* Usage example: MyView.prototype = new inBaseTreeView();
****************************************************************/

//XXX Don't use anonymous functions
function inBaseTreeView() { }

inBaseTreeView.prototype = 
{
  mRowCount: 0,
  mTree: null,
  
  get rowCount() { return this.mRowCount; },
  setTree: function(aTree) { this.mTree = aTree; },
  getCellText: function(aRow, aCol) { return ""; },
  getRowProperties: function(aIndex, aProperties) { return ""; },
  getCellProperties: function(aIndex, aCol, aProperties) { return ""; },
  getColumnProperties: function(aCol, aProperties) { return ""; },
  getParentIndex: function(aRowIndex) { },
  hasNextSibling: function(aRowIndex, aAfterIndex) { },
  getLevel: function(aIndex) {},
  getImageSrc: function(aRow, aCol) {},
  getProgressMode: function(aRow, aCol) {},
  getCellValue: function(aRow, aCol) {},
  isContainer: function(aIndex) {},
  isContainerOpen: function(aIndex) {},
  isContainerEmpty: function(aIndex) {},
  isSeparator: function(aIndex) {},
  isSorted: function() {},
  toggleOpenState: function(aIndex) {},
  selectionChanged: function() {},
  cycleHeader: function(aCol) {},
  cycleCell: function(aRow, aCol) {},
  isEditable: function(aRow, aCol) {},
  isSelectable: function(aRow, aCol) {},
  setCellValue: function(aRow, aCol, aValue) {},
  setCellText: function(aRow, aCol, aValue) {},
  performAction: function(aAction) {},
  performActionOnRow: function(aAction, aRow) {},
  performActionOnCell: function(aAction, aRow, aCol) {},
  
  
  // extra utility stuff

  createAtom: function createAtom(aVal)
  {
    try {
      var i = Components.interfaces.nsIAtomService;
      var svc = Components.classes["@mozilla.org/atom-service;1"].getService(i);
      return svc.getAtom(aVal);
    } catch(ex) {
      return null;
    }
  },

 /**
  * Returns an array of selected indices in the tree.
  * @return an array of indices
  */
  getSelectedIndices: function getSelectedIndices()
  {
    var indices = [];
    var rangeCount = this.selection.getRangeCount();
    for (var i = 0; i < rangeCount; i++) {
      var start = {};
      var end = {};
      this.selection.getRangeAt(i,start,end);
      for (var c = start.value; c <= end.value; c++) {
        indices.push(c);
      }
    }
    return indices;
  },

 /**
  * Returns an array of row objects selected in the tree.
  * @return an array of row objects
  */
  getSelectedRowObjects: function getSelectedRowObjects()
  {
    var declarations = [];
    var indices = this.getSelectedIndices();
    for (var i = 0; i < indices.length; i++) {
      declarations.push(this.getRowObjectFromIndex(indices[i]));
    }
    return declarations;
  }
  
};
