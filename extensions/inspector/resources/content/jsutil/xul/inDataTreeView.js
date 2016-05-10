/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


///////////////////////////////////////////////////////////////////////////////
//// inDataTreeView

function inDataTreeView()
{
  this.mRows = [];
}

///////////////////////////////////////////////////////////////////////////////
//// inDataTreeView. nsITreeView interface implementation

inDataTreeView.prototype = new inBaseTreeView();

inDataTreeView.prototype.__defineGetter__("rowCount",
  function inDataTreeView_rowCount()
  {
    return this.mRows.length;
  }
);

inDataTreeView.prototype.getCellText =
  function inDataTreeView_getCellText(aRowIdx, aCol)
{
  var row = this.getRowAt(aRowIdx);
  return row ? row.node.data[aCol.id] : "";
};

inDataTreeView.prototype.isContainer =
  function inDataTreeView_isContainer(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  return row ? row.node.children.length > 0 : false;
};

inDataTreeView.prototype.isContainerOpen =
  function inDataTreeView_isContainerOpen(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  return row ? row.isOpen : false;
};

inDataTreeView.prototype.isContainerEmpty =
  function inDataTreeView_isContainerEmpty(aRowIdx)
{
  return !this.isContainer(aRowIdx);
};

inDataTreeView.prototype.getLevel =
  function inDataTreeView_getLevel(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  return row ? row.node.level : 0;
};

inDataTreeView.prototype.getParentIndex =
  function inDataTreeView_getParentIndex(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  if (!row) {
    return -1;
  }

  for (let i = aRowIdx - 1; i >= 0; --i) {
    let checkRow = this.getRowAt(i);
    if (checkRow.node == row.node.parent) {
      return i;
    }
  }

  return -1;
};

inDataTreeView.prototype.hasNextSibling =
  function inDataTreeView_hasNextSibling(aRowIdx, aAfterRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  if (!row || !row.node.parent) {
    return false;
  }

  var lastIdx = row.node.parent.children.length - 1;
  return row.node.parent.children[lastIdx] != row.node;
};

inDataTreeView.prototype.toggleOpenState =
  function inDataTreeView_toggleOpenState(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  if (!row) {
    return;
  }

  var oldCount = this.rowCount;
  if (row.isOpen) {
    this.collapseRowAt(aRowIdx);
  }
  else {
    this.expandRowAt(aRowIdx);
  }

  this.mTree.invalidateRow(aRowIdx);
  this.mTree.rowCountChanged(aRowIdx + 1, this.rowCount - oldCount);
};

///////////////////////////////////////////////////////////////////////////////
//// inDataTreeView. Public.

/**
 * Append the child row to the row at the given index.
 */
inDataTreeView.prototype.appendChild =
  function inDataTreeView_appendChild(aParent, aData)
{
  var node = new inDataTreeViewNode(aData);
  if (aParent) {
    node.level = aParent.level + 1;
    node.parent = aParent;
    aParent.children.push(node);
    return node;
  }

  this.mRows.push(new inDataTreeViewRow(node));
  return node;
};

/**
 * Expand nodes from the given list. The caller should ensure that every node
 * to expand precedes its ancestors in the list, in other words the list should
 * be in reverse order, and include all ancestor nodes.
 */
inDataTreeView.prototype.expandNodes =
  function inDataTreeView_expandNodes(aNodes)
{
  var node = aNodes.pop();
  for (let rowIdx = 0; node && rowIdx < this.mRows.length; rowIdx++) {
    if (this.getRowAt(rowIdx).node == node) {
      this.expandRowAt(rowIdx);
      node = aNodes.pop();
    }
  }
}


///////////////////////////////////////////////////////////////////////////////
//// inDataTreeView. Tree utils.

/**
 * Expands a tree node on the given row.
 */
inDataTreeView.prototype.expandRowAt =
  function inDataTreeView_expandRowAt(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  if (!row || row.isOpen) {
    return;
  }

  var kids = row.node.children;
  var kidCount = kids.length;

  for (let i = this.rowCount - 1; i > aRowIdx; --i) {
    this.mRows[i + kidCount] = this.mRows[i];
  }

  for (let i = 0; i < kidCount; ++i) {
    this.mRows[aRowIdx + i + 1] = new inDataTreeViewRow(kids[i]);
  }

  row.isOpen = true;
};

/**
 * Collapse a tree node on the given row.
 */
inDataTreeView.prototype.collapseRowAt =
  function inDataTreeView_collapseRowAt(aRowIdx)
{
  var row = this.getRowAt(aRowIdx);
  if (!row || !row.isOpen) {
    return;
  }

  var removeCount = 0;
  var rowLevel = row.node.level;
  for (let idx = aRowIdx + 1; idx < this.rowCount; idx++) {
    if (this.getRowAt(idx).node.level <= rowLevel) {
      removeCount = idx - aRowIdx - 1;
      break;
    }
  }
  this.mRows.splice(aRowIdx + 1, removeCount);

  row.isOpen = false;
};

/**
 * Return a tree row object by the given row index.
 */
inDataTreeView.prototype.getRowAt =
  function inDataTreeView_getRowAt(aRowIdx)
{
  if (aRowIdx < 0 || aRowIdx >= this.rowCount) {
    return null;
  }

  return this.mRows[aRowIdx];
}

/**
 * Return a tree row data object by the given row index.
 */
inDataTreeView.prototype.getDataAt =
  function inDataTreeView_getDataAt(aRowIdx)
{
  if (aRowIdx < 0 || aRowIdx >= this.rowCount) {
    return null;
  }

  return this.mRows[aRowIdx].node.data;
};

///////////////////////////////////////////////////////////////////////////////
//// inDataTreeViewNode

function inDataTreeViewNode(aData)
{
  this.parent = null;
  this.children = [];

  this.level = 0;
  this.data = aData;
}

function inDataTreeViewRow(aNode)
{
  this.node = aNode;
  this.isOpen = false;
}
