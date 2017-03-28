/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

////////////////////////////////////////////////////////////////////////////////
//// Global

const nsIAccessibleText = Components.interfaces.nsIAccessibleText;
const nsIAccessibleTableCell = Components.interfaces.nsIAccessibleTableCell;


////////////////////////////////////////////////////////////////////////////////
//// Accessible property viewer manager

/**
 * Used to show additional properties of the accessible in tabbox.
 *
 * @param aPaneElm
 *        A pane element where the view is hosted.
 */
function accessiblePropViewerMgr(aPaneElm)
{
  /**
   * Updates all property views for the given accessible.
   *
   * @param aAccessible
   *        The given accessible
   */
  this.updateViews = function accessiblePropViewerMgr_updateViews(aAccessible)
  {
    for (var id in this.viewers)
    {
      var tab = document.getElementById("tab_" + id);
      tab.hidden = !this.viewers[id].update(aAccessible);
    }

    this.tabboxElm.selectedIndex = this.getCurrentViewerIdx();
  }

  /**
   * Clear the data of property views.
   */
  this.clearViews = function accessiblePropViewerMgr_clearViews()
  {
    for (var id in this.viewers)
    {
      this.viewers[id].clear();

      var tab = document.getElementById("tab_" + id);
      tab.hidden = true;
    }
  }

  this.isCommandEnabled =
    function accessiblePropViewerMgr_isCommandEnabled(aCommand)
  {
    var tab = this.tabboxElm.selectedTab;
    var viewerid = tab.id.replace("tab_", "");
    var viewer = this.viewers[viewerid];
    if ("isCommandEnabled" in viewer) {
      return viewer.isCommandEnabled(aCommand);
    }
    return false;
  },

  /**
   * Process 'inspectInNewView' command for selected property view.
   */
  this.inspectInNewView = function accessiblePropViewerMgr_inspectInNewView()
  {
    var tab = this.tabboxElm.selectedTab;
    var viewerid = tab.id.replace("tab_", "");
    var viewer = this.viewers[viewerid];
    if ("inspectInNewView" in viewer)
      viewer.inspectInNewView();
  }

  this.doCommand = function accessiblePropViewerMgr_doCommand(aCommandId)
  {
    var tab = this.tabboxElm.selectedTab;
    var viewerid = tab.id.replace("tab_", "");
    var viewer = this.viewers[viewerid];
    if ("doCommand" in viewer)
      viewer.doCommand(aCommandId);
  }

  //////////////////////////////////////////////////////////////////////////////
  //// private

  this.handleEvent = function accessiblePropViewerMgr_handleEvent(aEvent)
  {
    this.setCurrentViewerIdx(this.tabboxElm.selectedIndex);
    viewer.pane.panelset.updateAllCommands();
  }

  this.setCurrentViewerIdx = function accessiblePropViewerMgr_setCurrentViewerIdx(aIdx)
  {
    this.paneElm.accessiblePropsCurrentViewerIdx = aIdx;
  }

  this.getCurrentViewerIdx = function accessiblePropViewerMgr_getCurrentViewerIdx()
  {
    var idx = this.paneElm.accessiblePropsCurrentViewerIdx;

    idx = idx ? idx : 0;
    var tab = this.tabsElm.children[idx];
    if (tab.hidden)
      return 0;

    return idx;
  }

  this.viewers = {
    "attributes": new attributesViewer(),
    "actions": new actionViewer(),
    "textattrs": new textAttrsViewer(),
    "tablecell": new tableCellViewer()
  };

  this.tabboxElm = document.getElementById("tabviewers");
  this.tabsElm = this.tabboxElm.tabs;
  this.tabsElm.addEventListener("select", this, false);
  this.paneElm = aPaneElm;
}


////////////////////////////////////////////////////////////////////////////////
//// Accessible property viewers

/**
 * Object attribute property view. Used to display accessible attributes.
 */
function attributesViewer()
{
  /**
   * Updates the view for the given accessible.
   *
   * @param aAccessible
   *        The given accessible
   */
  this.update = function attributesViewer_update(aAccessible)
  {
    var attrs = aAccessible.attributes;
    if (attrs) {
      var enumerate = attrs.enumerate();
      while (enumerate.hasMoreElements())
        this.addAttribute(enumerate.getNext());
    }

    return true;
  }

  /**
   * Clear the view's data.
   */
  this.clear = function attributesViewer_clear()
  {
    var trAttrBody = document.getElementById("trAttrBody");
    while (trAttrBody.hasChildNodes())
      trAttrBody.removeChild(trAttrBody.lastChild)
  }

  //////////////////////////////////////////////////////////////////////////////
  //// private

  this.addAttribute = function attrbiutesViewer_addAttribute(aElement)
  {
    var prop = XPCU.QI(aElement, nsIPropertyElement);
    
    var trAttrBody = document.getElementById("trAttrBody");
    
    var ti = document.createElement("treeitem");
    var tr = document.createElement("treerow");
    
    var tc = document.createElement("treecell");
    tc.setAttribute("label", prop.key);
    tr.appendChild(tc);
    
    tc = document.createElement("treecell");
    tc.setAttribute("label", prop.value);
    tr.appendChild(tc);
    
    ti.appendChild(tr);
    
    trAttrBody.appendChild(ti);
  }
}


/**
 * Action property view.
 */
function actionViewer()
{
  /**
   * Updates the view for the given accessible.
   *
   * @param aAccessible
   *        The given accessible
   */
  this.update = function actionViewer_update(aAccessible)
  {
    this.mAccessible = aAccessible;

    // nsIAccessible::numActions was renamed to actionCount in Mozilla 15.
    let count = ("actionCount" in aAccessible) ?
      aAccessible.actionCount : aAccessible.numActions;
    if (!count)
      return false;

    this.updateActionItem(this.mDefaultActionItem, 0);

    for (let idx = 1; idx < count; idx++) {
      let actionItem = this.mDefaultActionItem.cloneNode(true);
      this.updateActionItem(actionItem, idx);
      this.mActionItemContainer.appendChild(actionItem);
    }

    return true;
  }

  /**
   * Clear the view's data.
   */
  this.clear = function actionViewer_clear()
  {
    this.mAccessible = null;

    let cntr = this.mActionItemContainer;
    while (cntr.firstChild != cntr.lastChild)
      cntr.removeChild(cntr.lastChild);

    this.setValues(this.mDefaultActionItem, "", "", "", "", "");
  }

  /**
   * Performes a command.
   */
  this.doCommand = function actionViewer_doCommand(aCommandId)
  {
    this.mAccessible.doAction(aCommandId);
  }

  //////////////////////////////////////////////////////////////////////////////
  //// private

  this.updateActionItem = function actionViewer_updateActionItem(aActionItem,
                                                                 aActionIndex)
  {
    var index = (aActionIndex + 1) + ".";
    var name = this.mAccessible.getActionName(aActionIndex);
    var description = this.mAccessible.getActionDescription(aActionIndex);

    var keysStr = "";
    try {
      let keys = this.mAccessible.getKeyBindings(aActionIndex);
      for (let idx = 0; idx < keys.length; idx++)
        keysStr += keys.item(idx);

    } catch (e) { }

    let jsCommand = "viewer.doCommand(" + aActionIndex + ");";

    this.setValues(aActionItem, index, name, description, keysStr, jsCommand);
  }

  this.setValues = function actionViewer_setValues(aActionItem,
                                                   aIndex, aName, aDescription,
                                                   aKeyBindings, aJSCommand)
  {
    let elm = aActionItem.getElementsByAttribute("prop", "actionIndex")[0];
    elm.textContent = aIndex;

    elm = aActionItem.getElementsByAttribute("prop", "actionName")[0];
    elm.textContent = aName;

    elm = aActionItem.getElementsByAttribute("prop", "actionDescription")[0];
    elm.textContent = aDescription;

    elm = aActionItem.getElementsByAttribute("prop", "actionKeyBindings")[0];
    elm.textContent = aKeyBindings;

    elm = aActionItem.getElementsByAttribute("prop", "invokeAction")[0];
    if (aJSCommand)
      elm.setAttribute("oncommand", aJSCommand)
    else
      elm.removeAttribute("oncommand");
  }

  this.mAccessible = null;

  this.mActionItemContainer = document.getElementById("actionItemContainer");
  this.mDefaultActionItem = document.getElementById("actionItem");
}


/**
 * Text attributes property view.
 */
function textAttrsViewer()
{
  /**
   * Updates the view for the given accessible.
   */
  this.update = function textAttrsViewer_update(aAccessible)
  {
    if (!(aAccessible instanceof nsIAccessibleText))
      return false;

    // Default text attributes.
    this.addAttributes(aAccessible.defaultTextAttributes,
                       "textAttrs:default:treeBody");

    // Generate text ranges.
    var length = aAccessible.characterCount;
    var offset = 0;
    while (offset < length) {
      const kHTMLNS = "http://www.w3.org/1999/xhtml";
      var textRangeElm = document.createElementNS(kHTMLNS, "span");
      textRangeElm.setAttribute("class", "textAttrsTextRange");

      var endOffset = { };

      textRangeElm.textAttrs =
        aAccessible.getTextAttributes(false, offset, { }, endOffset);
      textRangeElm.startOffset = offset;
      textRangeElm.endOffset = endOffset.value;

      var text = aAccessible.getText(offset, endOffset.value);
      textRangeElm.textContent = text;

      textRangeElm.addEventListener("focus", this, false);
      textRangeElm.setAttribute("tabindex", 0);

      document.getElementById("textAttrs:content").appendChild(textRangeElm);

      offset = endOffset.value;
    }

    return true;
  }

  /**
   * Clear the view's data.
   */
  this.clear = function textAttrsViewer_clear()
  {
    var content = document.getElementById("textAttrs:content");
    while (content.hasChildNodes()) {
      content.removeChild(content.lastChild);
    }

    var treeBody = document.getElementById("textAttrs:default:treeBody");
    while (treeBody.hasChildNodes()) {
      treeBody.removeChild(treeBody.lastChild);
    }

    document.getElementById("textAttrs:startOffset").textContent = "";
    document.getElementById("textAttrs:endOffset").textContent = "";

    treeBody = document.getElementById("textAttrs:treeBody");
    while (treeBody.hasChildNodes()) {
      treeBody.removeChild(treeBody.lastChild);
    }
  }

  this.handleEvent = function textAttrsViewer_handleEvent(aEvent)
  {
    var treeBody = document.getElementById("textAttrs:treeBody");
    while (treeBody.hasChildNodes()) {
      treeBody.removeChild(treeBody.lastChild);
    }

    if (this.mLastElm) {
      this.mLastElm.removeAttribute("selected");
    }

    this.mLastElm = aEvent.target;
    this.mLastElm.setAttribute("selected", "true");

    document.getElementById("textAttrs:startOffset").textContent =
      this.mLastElm.startOffset;
    document.getElementById("textAttrs:endOffset").textContent =
      this.mLastElm.endOffset;

    this.addAttributes(this.mLastElm.textAttrs, "textAttrs:treeBody");
  }

  this.addAttributes = function textAttrsViewer_addAttributes(aTextAttrs,
                                                              aTreeID)
  {
    var enumerate = aTextAttrs.enumerate();
    while (enumerate.hasMoreElements()) {
      var prop = XPCU.QI(enumerate.getNext(), nsIPropertyElement);

      var treeBody = document.getElementById(aTreeID);

      var ti = document.createElement("treeitem");
      var tr = document.createElement("treerow");

      var tc = document.createElement("treecell");
      tc.setAttribute("label", prop.key);
      tr.appendChild(tc);

      tc = document.createElement("treecell");
      tc.setAttribute("label", prop.value);
      tr.appendChild(tc);

      ti.appendChild(tr);

      treeBody.appendChild(ti);
    }
  }

  this.mLastElm = null;
}


/**
 * Table cell property view. Used to display table cell properties of the
 * accessible implementing nsIAccessibleTableCell.
 */
function tableCellViewer()
{
  /**
   * Updates the view for the given accessible.
   *
   * @param aAccessible
   *        The given accessible
   */
  this.update = function tableCellViewer_update(aAccessible)
  {
    if (!(aAccessible instanceof nsIAccessibleTableCell))
      return false;

    // columnIndex
    var columnIndex = aAccessible.columnIndex;
    this.columnIndexElm.textContent = columnIndex;

    // rowIndex
    var rowIndex = aAccessible.rowIndex;
    this.rowIndexElm.textContent = rowIndex;

    // columnExtent
    var columnExtent = aAccessible.columnExtent;
    this.columnExtentElm.textContent = columnExtent;
    
    // rowIndex
    var rowExtent = aAccessible.rowExtent;
    this.rowExtentElm.textContent = rowExtent;

    // isSelected
    var isSelected = aAccessible.isSelected();
    this.isSelectedElm.textContent = isSelected;

    // table, columnHeaderCells, rowHeaderCells
    this.addRelated(aAccessible);

    return true;
  }

  /**
   * Clear the view's data.
   */
  this.clear = function tableCellViewer_clear()
  {
    this.mTreeBox.view = null;

    this.columnIndexElm.textContent = "";
    this.rowIndexElm.textContent = "";
    this.columnExtentElm.textContent = "";
    this.rowExtentElm.textContent = "";
    this.isSelectedElm.textContent = "";
  }

  this.isCommandEnabled = function tableCellViewer_isCommandEnable(aCommand)
  {
    if (aCommand == "cmdEditInspectInNewWindow") {
      return this.mTreeView.selection.count == 1;
    }
    return false;
  },

  /**
   * Prepares 'inspectInNewView' command.
   */
  this.inspectInNewView = function tableCellViewer_inspectInNewView()
  {
    if (this.mTreeView.selection.count == 1) {
      var minAndMax = {};
      this.mTreeView.selection.getRangeAt(0, minAndMax, minAndMax);
      var node = this.mTreeView.getDOMNode(minAndMax.value);
      if (node) {
        inspectObject(node);
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //// private

  this.addRelated = function tableCellViewer_addRelated(aAccessible)
  {
    this.mTreeView = new TableCellTreeView(aAccessible);
    this.mTreeBox.view = this.mTreeView;
  }

  this.mTree = document.getElementById("tableCell:accObjects");
  this.mTreeBox = this.mTree.treeBoxObject;

  this.columnIndexElm = document.getElementById("tableCell:columnIndex");
  this.rowIndexElm = document.getElementById("tableCell:rowIndex");
  this.columnExtentElm = document.getElementById("tableCell:columnExtent");
  this.rowExtentElm = document.getElementById("tableCell:rowExtent");
  this.isSelectedElm = document.getElementById("tableCell:isSelected");
}


///////////////////////////////////////////////////////////////////////////////
//// TableCellTreeView. nsITreeView

function TableCellTreeView(aTableCell)
{
  this.tableCell = aTableCell;
  this.mRowCount = this.getRowCount();
}

TableCellTreeView.prototype = new inBaseTreeView();

TableCellTreeView.prototype.getRowCount =
  function TableCellTreeView_rowCount()
{
  this.columnHeaderCells = this.tableCell.columnHeaderCells;
  this.columnHeaderCellsLen = (this.columnHeaderCells ?
                               this.columnHeaderCells.length : 0);

  this.rowHeaderCells = this.tableCell.rowHeaderCells;
  this.rowHeaderCellsLen = (this.rowHeaderCells ?
                            this.rowHeaderCells.length : 0);

  return 1 + this.columnHeaderCellsLen + this.rowHeaderCellsLen;
}

TableCellTreeView.prototype.getCellText =
  function TableCellTreeView_getCellText(aRow, aCol)
{
  var accessible = this.getAccessible(aRow);
  if (!accessible)
    return "";

  if (aCol.id == "tableCell:property") {
    return this.getPropertyName(aRow);

  } else if (aCol.id == "tableCell:role") {
    return gAccService.getStringRole(accessible.role);

  } else if (aCol.id == "tableCell:name") {
    return accessible.name;

  } else if (aCol.id == "tableCell:nodeName") {
    var node = this.getDOMNode(aRow);
    if (node)
      return node.nodeName;
  }

  return "";
}

///////////////////////////////////////////////////////////////////////////////
//// TableCellTreeView. Utils

/**
 * Return an accessible for the given row index.
 *
 * @param aRow
 *        Row index
 */
TableCellTreeView.prototype.getAccessible =
  function TableCellTreeView_getAccessible(aRow)
{
  if (aRow == 0)
    return this.tableCell.table;

  if (aRow <= this.columnHeaderCellsLen)
    return this.columnHeaderCells.queryElementAt(aRow - 1, nsIAccessible);

  return this.rowHeaderCells.queryElementAt(aRow - 1 - this.columnHeaderCellsLen, nsIAccessible);
}

/**
 * Retrun interface attribute name (property) used at the given row index.
 *
 * @param aRow
 *        Row index
 */
TableCellTreeView.prototype.getPropertyName =
  function TableCellTreeView_getPropertyName(aRow)
{
  if (aRow == 0)
    return "table";
  
  if (aRow <= this.columnHeaderCellsLen)
    return "column header cell";
  
  return "row header cell";
}

/**
 * Return DOM node at the given row index.
 *
 * @param aRow
 *        Row index
 */
TableCellTreeView.prototype.getDOMNode =
  function TableCellTreeView_getDOMNode(aRow)
{
  var accessNode = QIAccessNode(this.getAccessible(aRow));
  return accessNode && accessNode.DOMNode;
}
