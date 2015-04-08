Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/cssInspector.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

var gNode = null;
var gTable = null;
var gRows, gColumns, gRowsInHeader, gRowsInFooter;
var gDataChanged = false;

function DataChanged()
{
  gDataChanged = true;
  document.documentElement.getButton("extra1").disabled = false;
}

function Startup()
{
  GetUIElements();

  try {
    gNode = window.arguments[0];
  }
  catch(e) { return; }

  document.documentElement.getButton("extra1").disabled = true;

  InitTableData(gNode);
  InitCellsData(gNode);
}

function onCssPolicyChange(aElt)
{
  var cssPolicy = aElt.value;
  gDialog.classPicker.style.visibility = (cssPolicy !="class") ? "hidden" : "visible";
  if (cssPolicy == "class")
    gDialog.classPicker.focus();
}

function IncreaseLength(aElt, aUnitsString, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v += 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "ex":
        v += 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v += 1;
        break;
    }
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', false, aCallback);
  }
}

function DecreaseLength(aElt, aUnitsString, aAllowNegative, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v -= 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "ex":
        v -= 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v -= 1;
        break;
    }
    if (!aAllowNegative && v < 0)
      v = 0;
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', aAllowNegative, aCallback);
  }
}

function onLengthMenulistCommand(aElt, aUnitsString, aAllowNegative, aCallback)
{
  var value;
  if (aElt.selectedItem)
    value = aElt.selectedItem.value;
  else
    value = aElt.value;
  aElt.value = value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    if (!aAllowNegative && v < 0) {
      v = 0;
      menulist.value = v + (unit ? unit : "");
    }
  }
}

function PopulateLengths(aElt, aUnitsString)
{
  var menuseparator = aElt.querySelector("menuseparator");
  if (menuseparator) {
    var child = aElt.firstChild;
    while (child && child != menuseparator) {
      var tmp = child.nextSibling;
      aElt.removeChild(child);
      child = tmp;
    }
  }
  else
    deleteAllChildren(aElt);

  var v = parseFloat(aElt.parentNode.value);
  if (isNaN(v))
    v = 0;
  var unitsArray;
  if (aUnitsString == " ")
    unitsArray = [""];
  else
    unitsArray = aUnitsString.split(" ");
  unitsArray.forEach(function(aArrayElt, aIndex, aArray) {
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", v + aArrayElt);
    menuitem.setAttribute("value", v + aArrayElt);
    aElt.insertBefore(menuitem, menuseparator);
  });
}

function InitTableData(aNode)
{
  var node = aNode;
  while (node && node.nodeName.toLowerCase() != "table")
    node = node.parentNode;
  gTable = node;

  var ruleset = CssInspector.getCSSStyleRules(gTable, false);

  var w = CssInspector.getCascadedValue(ruleset, "width");
  if (!w && gTable.hasAttribute("width")) {
    w = gTable.getAttribute("width");
    if (w.indexOf("%") == -1)
      w += "px";
  }
  gDialog.widthMenulist.value = w;

  var h = CssInspector.getCascadedValue(ruleset, "height");
  if (!h && gTable.hasAttribute("height")) {
    h = gTable.getAttribute("height");
    if (h.indexOf("%") == -1)
      h += "px";
  }
  gDialog.heightMenulist.value = h;

  //var rows = gTable.querySelectorAll("tbody > tr");
  var rows = collectDescendants(gTable, "tbody", "tr");
  gDialog.tableRowsTextbox.value = rows.length;
  gRows = rows.length;
  var columns = 0;
  for (var i = 0; i < rows.length; i++) {
    //columns = Math.max(columns, rows[i].querySelectorAll("td,th").length);
    columns = Math.max(columns, collectDescendants(rows[i], "td").length + collectDescendants(rows[i], "th").length);
  }
  gDialog.tableColumnsTextbox.value = columns;
  gColumns = columns;

  //var headerRows = gTable.querySelectorAll("thead > tr");
  var headerRows = collectDescendants(gTable, "thead", "tr");
  gRowsInHeader = headerRows ? headerRows.length : 0;
  gDialog.rowsInHeaderTextbox.value = gRowsInHeader;
  //gDialog.onlyHeaderCellsInHeaderCheckbox.checked = gRowsInHeader && !gTable.querySelector("thead > tr > td");
  gDialog.onlyHeaderCellsInHeaderCheckbox.checked = gRowsInHeader && !collectFirstDescendant(gTable, "thead", "tr", "td");

  //var footerRows = gTable.querySelectorAll("tfoot > tr");
  var footerRows = collectDescendants(gTable, "tfoot", "tr");
  gRowsInFooter = footerRows ? footerRows.length : 0;
  gDialog.rowsInFooterTextbox.value = gRowsInFooter;
  gDialog.onlyHeaderCellsInFooterCheckbox.checked = gRowsInFooter && !collectFirstDescendant(gTable, "tfoot", "tr", "td");
  //gDialog.onlyHeaderCellsInFooterCheckbox.checked = gRowsInFooter && !gTable.querySelector("tfoot > tr > td");

  var border = gTable.getAttribute("border");
  border = border ? border : 0;
  gDialog.tableBorderTextbox.value = border;

  var cellSpacing = gTable.getAttribute("cellspacing");
  gDialog.tableCellSpacingTextbox.value = cellSpacing;
  gDialog.tableCellSpacingUnitMenulist.value =
    (cellSpacing && cellSpacing.indexOf("%") != -1) ? "%" : "";

  var cellPadding = gTable.getAttribute("cellpadding");
  gDialog.tableCellPaddingTextbox.value = cellPadding;
  gDialog.tableCellPaddingUnitMenulist.value =
    (cellPadding && cellPadding.indexOf("%") != -1) ? "%" : ""; 
}

function ValidateData(aTabValue)
{
  if (gDataChanged) {
    var tab = aTabValue || gDialog.tabbox.selectedTab.value;
    var editor = EditorUtils.getCurrentEditor();
    editor instanceof Components.interfaces.nsITableEditor;
    editor.beginTransaction();
    switch (tab) {
      case "table":
        editor.setAttribute(gTable, "border", gDialog.tableBorderTextbox.value);
        if (gDialog.tableCellPaddingTextbox.value)
          editor.setAttribute(gTable, "cellpadding", gDialog.tableCellPaddingTextbox.value + gDialog.tableCellPaddingUnitMenulist.value);
        else
          editor.removeAttribute(gTable, "cellpadding");
        if (gDialog.tableCellSpacingTextbox.value)
          editor.setAttribute(gTable, "cellspacing", gDialog.tableCellSpacingTextbox.value + gDialog.tableCellSpacingUnitMenulist.value);
        else
          editor.removeAttribute(gTable, "cellspacing");
        editor.removeAttribute(gTable, "width");
        editor.removeAttribute(gTable, "height");
        var txn = new diStyleAttrChangeTxn(gTable, "width", gDialog.widthMenulist.value, "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
        txn = new diStyleAttrChangeTxn(gTable, "height", gDialog.heightMenulist.value, "");
        editor.doTransaction(txn);
        editor.incrementModificationCount(1);  
        //var header = gTable.querySelector("thead");
        var header = collectFirstDescendant(gTable, "thead");
        if (!parseInt(gDialog.rowsInHeaderTextbox.value)) {
          // delete the header if it exists...
          if (header)
            editor.deleteNode(header);
        }
        else {
          // add or remove rows as needed
          if (!header) {
            // ah, we need to create the header first...
            header = editor.document.createElement("thead");
            //var where = gTable.querySelector("tfoot") || gTable.querySelector("tbody");
            var where = collectFirstDescendant(gTable, "tfoot") || collectFirstDescendant(gTable, "tbody");
            txn = new diInsertNodeBeforeTxn(header, gTable, where);
            editor.doTransaction(txn);
          }
          UpdateListOfRows(header, gRowsInHeader, gDialog.rowsInHeaderTextbox.value,
                           gDialog.onlyHeaderCellsInHeaderCheckbox.checked ? "th" : "td");
        }
        //var footer = gTable.querySelector("tfoot");
        var footer = collectFirstDescendant(gTable, "tfoot");
        if (!parseInt(gDialog.rowsInFooterTextbox.value)) {
          // delete the header if it exists...
          if (footer)
            editor.deleteNode(footer);
        }
        else {
          // add or remove rows as needed
          if (!footer) {
            // ah, we need to create the header first...
            footer = editor.document.createElement("tfoot");
            //var where = gTable.querySelector("tbody");
            var where = collectFirstDescendant(gTable, "tbody");
            txn = new diInsertNodeBeforeTxn(footer, gTable, where);
            editor.doTransaction(txn);
          }
          UpdateListOfRows(footer, gRowsInFooter, gDialog.rowsInFooterTextbox.value,
                           gDialog.onlyHeaderCellsInFooterCheckbox.checked ? "th" : "td");
        }
  
        UpdateListOfRows(collectFirstDescendant(gTable, "tbody"), gRows, gDialog.tableRowsTextbox.value,
                         "td");
        break;
  
      case "cell":
        switch (gDialog.selectionType.value) {
          case "cells":   UpdateCells(editor); break;
          case "rows":    UpdateRows(editor);  break;
          case "columns": UpdateColumns(editor); break;
          default: break;
        }
        break;
  
      default: break;
    }
    editor.endTransaction();
  }
}

function ApplyChanges()
{
  ValidateData();
  gDataChanged = false;
  document.documentElement.getButton("extra1").disabled = true;
}

function onAccept()
{
  ValidateData();
  return true;
}

function OnlyDigits(aElt)
{
  aElt.value = aElt.value.replace( /[^\d]/g, "");
}

function Increase(aId)
{
  var value = gDialog[aId].value ? gDialog[aId].value : "0";
  gDialog[aId].value = parseInt(value) + 1;
}

function Decrease(aId)
{
  var value = gDialog[aId].value ? gDialog[aId].value : "0";
  value = Math.max( 0, parseInt(value) - 1);
  gDialog[aId].value = value;
}


function UpdateListOfRows(aElement, aOldRows, aNewRows, aCellTag)
{
  var editor = EditorUtils.getCurrentEditor();

  // add missing rows if any
  for (var i = aOldRows; i < aNewRows; i++) {
    var tr = editor.document.createElement("tr");
    for (var j = 0; j < gDialog.tableColumnsTextbox.value; j++) {
      var cell = editor.document.createElement(aCellTag);
      var br = editor.document.createElement("br");
      cell.appendChild(br);
      tr.appendChild(cell);
    }
    editor.insertNode(tr, aElement, aElement.childNodes.length);
  }

  // browse the existing rows
  //var rows = aElement.querySelectorAll("tr");
  var rows = collectDescendants(aElement, "tr");
  for (var i = 0; i < aOldRows; i++) {
    var row = rows[i];
    var cellCount = 0;
    var cell = row.firstElementChild;
    while (cell) {
      var tmp = cell.nextElementSibling;
      cellCount += (cell.hasAttribute("colspan") ? parseInt(cell.getAttribute("colspan")) : 1);
      if (cellCount > gDialog.tableColumnsTextbox.value)
        editor.deleteNode(cell);
      cell = tmp;
    }
    // now add potential missing cells
    for (var j = cellCount; j < gDialog.tableColumnsTextbox.value; j++) {
      var cell = editor.document.createElement(aCellTag);
      var br = editor.document.createElement("br");
      cell.appendChild(br);
      row.appendChild(cell);
    }
  }

  // and finally get rid of the extra rows if any
  for (var i = aOldRows - 1 ; i >= aNewRows; i--) {
    if (i < rows.length)
      editor.deleteNode(rows[i]);
  }
}

function onTabSelect()
{
  if (!("tabbox" in gDialog))
    return;
  var tab = gDialog.tabbox.selectedTab.value;
  switch (tab) {
    case "cell":
      if (gDataChanged) {
        if (PromptUtils.confirm(gDialog.bundleString.getString("TableTabModified"),
                                gDialog.bundleString.getString("ApplyAndCloseWindow"),
                                window)) {
          ValidateData("table");
          gDataChanged = false;
          document.documentElement.getButton("extra1").disabled = false;
        }
      }
      break;
    case "table":
      if (gDataChanged) {
        if (PromptUtils.confirm(gDialog.bundleString.getString("CellTabModified"),
                                gDialog.bundleString.getString("ApplyAndCloseWindow"),
                                window)) {
          ValidateData("cell");
          gDataChanged = false;
          document.documentElement.getButton("extra1").disabled = false;
        }
      }
      break;
    default: break; // should never happen
  }
}

function InitCellsData(aNode)
{
  var nodeName = aNode.nodeName.toLowerCase();
  var editing = "cells";
  if (nodeName == "tr")
    editing = "row";

  var ruleset = CssInspector.getCSSStyleRules(aNode, false);

  var w = CssInspector.getCascadedValue(ruleset, "width");
  if (!w && aNode.hasAttribute("width")) {
    w = aNode.getAttribute("width");
    if (w.indexOf("%") == -1)
      w += "px";
  }
  gDialog.cellsWidthMenulist.value = w;

  var h = CssInspector.getCascadedValue(ruleset, "height");
  if (!h && aNode.hasAttribute("height")) {
    h = aNode.getAttribute("height");
    if (h.indexOf("%") == -1)
      h += "px";
  }
  gDialog.cellsHeightMenulist.value = h;

  var hAlign = CssInspector.getCascadedValue(ruleset, "text-align");
  if (!hAlign && aNode.hasAttribute("align")) {
    hAlign = aNode.getAttribute("align"); 
  }
  gDialog.cellsHAlignMenulist.value = hAlign;

  var vAlign = CssInspector.getCascadedValue(ruleset, "vertical-align");
  if (!vAlign && aNode.hasAttribute("valign")) {
    vAlign = aNode.getAttribute("valign"); 
  }
  gDialog.cellsVAlignMenulist.value = vAlign;

  var bg = CssInspector.getCascadedValue(ruleset, "background-color");
  gDialog.bgColorColorpicker.color = bg;

  gDialog.cellsHeadersCheckbox.checked = (aNode.nodeName.toLowerCase() == "th");

  var bg = CssInspector.getCascadedValue(ruleset, "white-space");
  if (!bg && aNode.hasAttribute("nowrap"))
    bg = "no-wrap";
  gDialog.cellsNoWrapCheckbox.checked = (bg == "no-wrap");
}

function GetSelectedCells(selection)
{
  var rangeCount = selection.rangeCount;
  var cells = [];
  for (var i = 0; i < rangeCount; i++) {
    var range = selection.getRangeAt(i);
    var startContainer = range.startContainer;
    var startOffset    = range.startOffset;
    var endContainer   = range.endContainer;
    var endOffset      = range.endOffset;
    if (startContainer.nodeType == Node.ELEMENT_NODE)
      startContainer = startContainer.childNodes.item(startOffset);
    if (endContainer.nodeType == Node.ELEMENT_NODE)
      endContainer = endContainer.childNodes.item(endOffset -
                       (selection.isCollapsed ? 0 : 1));
  
    var node = startContainer;
    var direction = "down";
    var nextNode = node;
    do {
      node = nextNode;
      var tmp = node;
      // find a potential th/td ancestor
      while (tmp) {
        if (tmp instanceof Components.interfaces.nsIDOMHTMLTableCellElement) {
          if (cells.indexOf(tmp) == -1)
            cells.push(tmp);
          break;
        }
        tmp = tmp.parentNode;
      }
  
      // let's traverse the tree
      if (direction == "down") {
        if (node.firstChild)
          nextNode = node.firstChild
        else if (node.nextSibling)
          nextNode = node.nextSibling;
        else {
          direction = "up";
          nextNode = node.parentNode;
        }
      }
      else {
        if (node.nextSibling) {
          nextNode = node.nextSibling;
          direction = "down";
        }
        else
          nextNode = node.parentNode;
      }
    } while (node != endContainer);
  }
  return cells;
}

function UpdateCells(editor)
{
  var selection = editor.selection;
  var cells = GetSelectedCells(selection);
  // at this points cells array contains all the cells to impact
  var newSelectedCells = [];
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];

    var txn = new diStyleAttrChangeTxn(c, "width", gDialog.cellsWidthMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "height", gDialog.cellsHeightMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "text-align", gDialog.cellsHAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "vertical-align", gDialog.cellsVAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "white-space", gDialog.cellsNoWrapCheckbox.checked ? "now-wrap" : "", "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "background-color", gDialog.bgColorColorpicker.color, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    if (c.nodeName.toLowerCase() != (gDialog.cellsHeadersCheckbox.checked ? "th" : "td")) {
      newSelectedCells.push(editor.switchTableCellHeaderType(c));
    }
  }
  UpdateSelectedCells(editor, selection, newSelectedCells);
}

function UpdateSelectedCells(editor, aSelection, aArray)
{
  if (aArray.length) {
    aSelection.removeAllRanges();
    for (var i = 0; i < aArray.length; i++) {
      var range = editor.document.createRange();
      range.selectNode(aArray[i]);
      aSelection.addRange(range);
    }
    gNode = aArray[0];
    editor.checkSelectionStateForAnonymousButtons(editor.selection);
  }
}

function UpdateColumns(editor)
{
  var selection = editor.selection;
  var cells = GetSelectedCells(selection);
  var columnsCells = [];
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    if (columnsCells.indexOf(c) == -1) { // only if not already here
      // let's find the column index of the cell
      var child = c.parentNode.firstElementChild;
      var index = 0;
      while (child && child != c)
      {
        if (child.hasAttribute("colspan")) {
          index += parseInt(child.getAttribute("colspan"))
        }
        else
          index++;
        child = child.nextElementSibling;
      }

      // now find the enclosing thead/tbody/tfoot
      var enclosing = c;
      while (enclosing && !(enclosing instanceof Components.interfaces.nsIDOMHTMLTableSectionElement))
        enclosing = enclosing.parentNode;
      if (!enclosing) // sanity check
        return; // uuuh well should never happen

      // find all the rows in the enclosing element
      //var rows = enclosing.querySelectorAll("tr");
      var rows = collectDescendants(enclosing, "tr");
      for (var j = 0; j < rows.length; j++) {
        // we have to count to find the nth cell
        child = rows[j].firstElementChild;
        var cellIndex = 0;
        while (child && cellIndex < index) {
          if (child.hasAttribute("colspan")) {
            cellIndex += parseInt(child.getAttribute("colspan"))
          }
          else
            cellIndex++;
          child = child.nextElementSibling;
        }
        // cell is ok only if cellIndex == index strictly
        if (child && cellIndex == index) {
          if (columnsCells.indexOf(child) == -1)
            columnsCells.push(child);
          if (child.hasAttribute("rowspan"))
            j += parseInt(child.getsAttribute("rowspan")) - 1;
        }
      }
    }
  }

  var newSelectedCells = [];
  for (var i = 0; i < columnsCells.length; i++) {
    var c = columnsCells[i];

    var txn = new diStyleAttrChangeTxn(c, "width", gDialog.cellsWidthMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "height", gDialog.cellsHeightMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "text-align", gDialog.cellsHAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "vertical-align", gDialog.cellsVAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "white-space", gDialog.cellsNoWrapCheckbox.checked ? "now-wrap" : "", "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(c, "background-color", gDialog.bgColorColorpicker.color, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    if (c.nodeName.toLowerCase() != (gDialog.cellsHeadersCheckbox.checked ? "th" : "td"))
      newSelectedCells.push(editor.switchTableCellHeaderType(c));
  }
  UpdateSelectedCells(editor, selection, newSelectedCells);
}

function UpdateRows(editor)
{
  var selection = editor.selection;
  var cells = GetSelectedCells(selection);
  var rows = [];
  for (var i = 0; i < cells.length; i++) {
    var row = cells[i].parentNode;
    if (rows.indexOf(row) == -1)
      rows.push(row);
  }

  // at this point the rows array has all the rows we need to impact
  var newSelectedCells = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];

    txn = new diStyleAttrChangeTxn(r, "height", gDialog.cellsHeightMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(r, "text-align", gDialog.cellsHAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(r, "vertical-align", gDialog.cellsVAlignMenulist.value, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(r, "white-space", gDialog.cellsNoWrapCheckbox.checked ? "now-wrap" : "", "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    txn = new diStyleAttrChangeTxn(r, "background-color", gDialog.bgColorColorpicker.color, "");
    editor.doTransaction(txn);
    editor.incrementModificationCount(1);  

    var c = r.firstElementChild;
    while (c) {
      var txn = new diStyleAttrChangeTxn(c, "width", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
  
      txn = new diStyleAttrChangeTxn(c, "height", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
  
      txn = new diStyleAttrChangeTxn(c, "text-align", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
  
      txn = new diStyleAttrChangeTxn(c, "vertical-align", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
  
      txn = new diStyleAttrChangeTxn(c, "white-space", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  
  
      txn = new diStyleAttrChangeTxn(c, "background-color", "", "");
      editor.doTransaction(txn);
      editor.incrementModificationCount(1);  

      if (c.nodeName.toLowerCase() != (gDialog.cellsHeadersCheckbox.checked ? "th" : "td"))
        newSelectedCells.push(editor.switchTableCellHeaderType(c));

      c = c.nextElementSibling;
    }
  }
  UpdateSelectedCells(editor, selection, newSelectedCells);
}

function Next()
{
  if (gDataChanged) {
    ValidateData("cell");
    gDataChanged = false;
  }

  switch (gDialog.selectionType.value) {
    case "cells":
      NextCell();
      break;

    case "rows":
      NextRow();
      break;

    case "columns":
      NextColumn();
      break;

    default: break; //should never happen
  }
  InitCellsData(gNode);
}

function GetCurrentCellFromSelection()
{
  var cell = null;
  switch (gNode.nodeName.toLowerCase()) {
    case "td":
    case "th": cell = gNode; break;
    case "tr": cell = gNode.lastElementChild; break;
    case "tbody":
    case "thead":
    case "tfoot": cell = gNode.lastElementChild.lastElementChild; break;
    case "table": cell = gNode.lastElementChild.lastElementChild.lastElementChild; break;
    default: break; // should never happen
  }

  return cell;  
}

function GetNumberOfColumnsInSection(section)
{
  //var rows = section.querySelectorAll("tr");
  var rows = collectDescendants(section, "tr");
  var n = 0;
  for (var i = 0; i < rows.length; i++) {
    var m = 0;
    var child = rows[i].firstElementChild;
    while (child) {
      if (child.hasAttribute("colspan")) {
        m += parseInt(child.getAttribute("colspan"))
      }
      else
        m++;
      child = child.nextElementSibling;
    }
    n = Math.max(n, m);
  }
  return n;
}

function NextColumn()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;

  var child = cell.parentNode.firstElementChild;
  var index = 0;
  while (child && child != cell)
  {
    if (child.hasAttribute("colspan")) {
      index += parseInt(child.getAttribute("colspan"))
    }
    else
      index++;
    child = child.nextElementSibling;
  }

  index++;
  var section = cell.parentNode.parentNode;
  if (index >= GetNumberOfColumnsInSection(section)) {
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "tbody")
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tfoot") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "tbody"); // always exists
        break;
    }
    if (newSection) { // sanity check
      section = newSection;
      index = 0;
    }
    else return;
  }
  //var rows = section.querySelectorAll("tr");
  var rows = collectDescendants(section, "tr");
  var columnsCells = [];
  for (var j = 0; j < rows.length; j++) {
    // we have to count to find the nth cell
    child = rows[j].firstElementChild;
    var cellIndex = 0;
    while (child && cellIndex < index) {
      if (child.hasAttribute("colspan")) {
        cellIndex += parseInt(child.getAttribute("colspan"))
      }
      else
        cellIndex++;
      child = child.nextElementSibling;
    }
    // cell is ok only if cellIndex == index strictly
    if (child && cellIndex == index) {
      if (columnsCells.indexOf(child) == -1)
        columnsCells.push(child);
      if (child.hasAttribute("rowspan"))
        j += parseInt(child.getsAttribute("rowspan")) - 1;
    }
  }
  var editor = EditorUtils.getCurrentEditor();
  var selection = editor.selection;
  selection.removeAllRanges();
  for (var i = 0; i < columnsCells.length; i++) {
    var range = editor.document.createRange();
    range.selectNode(columnsCells[i]);
    selection.addRange(range);
  }
  gNode = columnsCells[0];
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

function NextRow()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;
  var row = cell.parentNode;

  if (row.nextElementSibling)
    row = row.nextElementSibling;
  else {
    // thead -> tbody, tbody -> tfoot, tfoot -> thead
    var section = row.parentNode;
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tbody"); // must exist...
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "thead") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tbody");
        break;
    }
    if (newSection) { // sanity check
      row = newSection.firstElementChild;
    }
  }
  var editor = EditorUtils.getCurrentEditor();
  //var cells = row.querySelectorAll("td,th");
  var cells = collectDescendants(row, "td").join(collectDescendants(row, "th"));
  var selection = editor.selection;
  selection.removeAllRanges();
  for (var i = 0; i < cells.length; i++) {
    var range = editor.document.createRange();
    range.selectNode(cells[i]);
    selection.addRange(range);
  }
  gNode = cells[0];
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

function NextCell()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;

  if (cell.nextElementSibling)
    cell = cell.nextElementSibling;
  else if (cell.parentNode.nextElementSibling)
    cell = cell.parentNode.nextElementSibling.firstElementChild;
  else {
    // thead -> tbody, tbody -> tfoot, tfoot -> thead
    var section = cell.parentNode.parentNode;
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tbody"); // must exist...
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "thead") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tbody");
        break;
    }
    if (newSection) { // sanity check
      cell = newSection.firstElementChild.firstElementChild;
    }
  }
  gNode = cell;
  var editor = EditorUtils.getCurrentEditor();
  editor.selectElement(cell);
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

function Previous()
{
  if (gDataChanged) {
    ValidateData("cell");
    gDataChanged = false;
  }

  switch (gDialog.selectionType.value) {
    case "cells":
      PreviousCell();
      break;

    case "rows":
      PreviousRow();
      break;

    case "columns":
      PreviousColumn();
      break;

    default: break; //should never happen
  }
  InitCellsData(gNode);
}

function PreviousCell()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;

  if (cell.previousElementSibling)
    cell = cell.previousElementSibling;
  else if (cell.parentNode.previousElementSibling)
    cell = cell.parentNode.previousElementSibling.lastElementChild;
  else {
    // thead <- tbody, tbody <- tfoot, tfoot <- thead
    var section = cell.parentNode.parentNode;
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "tbody")
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tfoot") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "tbody"); // always exists
        break;
    }
    if (newSection) { // sanity check
      cell = newSection.lastElementChild.lastElementChild;
    }
  }
  gNode = cell;
  var editor = EditorUtils.getCurrentEditor();
  editor.selectElement(cell);
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

function PreviousRow()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;
  var row = cell.parentNode;

  if (row.previousElementSibling)
    row = row.previousElementSibling;
  else {
    // thead <- tbody, tbody <- tfoot, tfoot <- thead
    var section = row.parentNode;
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "tbody")
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tfoot") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "tbody"); // always exists
        break;
    }
    if (newSection) { // sanity check
      row = newSection.lastElementChild;
    }
  }
  var editor = EditorUtils.getCurrentEditor();
  //var cells = row.querySelectorAll("td,th");
  var cells = collectDescendants(row, "td").join(collectDescendants(row, "th"));
  var selection = editor.selection;
  selection.removeAllRanges();
  for (var i = 0; i < cells.length; i++) {
    var range = editor.document.createRange();
    range.selectNode(cells[i]);
    selection.addRange(range);
  }
  gNode = cells[0];
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

function PreviousColumn()
{
  var cell = GetCurrentCellFromSelection();

  if (!cell) // sanity check
    return;

  var child = cell.parentNode.firstElementChild;
  var index = 0;
  while (child && child != cell)
  {
    if (child.hasAttribute("colspan")) {
      index += parseInt(child.getAttribute("colspan"))
    }
    else
      index++;
    child = child.nextElementSibling;
  }

  index--;
  var section = cell.parentNode.parentNode;
  if (index < 0) {
    var sectionName = section.nodeName.toLowerCase();
    var tableElement = section.parentNode;
    var newSection;
    switch (sectionName) {
      case "thead":
        newSection = collectFirstDescendant(tableElement, "tfoot") ||
                     collectFirstDescendant(tableElement, "tbody")
        break;
      case "tbody":
        newSection = collectFirstDescendant(tableElement, "thead") ||
                     collectFirstDescendant(tableElement, "tfoot") ||
                     section;
        break;
      case "tfoot":
        newSection = collectFirstDescendant(tableElement, "tbody"); // always exists
        break;
    }
    if (newSection) { // sanity check
      section = newSection;
      index = GetNumberOfColumnsInSection(section) - 1;
    }
    else return;
  }
  //var rows = section.querySelectorAll("tr");
  var rows = collectDescendants(section, "tr");
  var columnsCells = [];
  for (var j = 0; j < rows.length; j++) {
    // we have to count to find the nth cell
    child = rows[j].firstElementChild;
    var cellIndex = 0;
    while (child && cellIndex < index) {
      if (child.hasAttribute("colspan")) {
        cellIndex += parseInt(child.getAttribute("colspan"))
      }
      else
        cellIndex++;
      child = child.nextElementSibling;
    }
    // cell is ok only if cellIndex == index strictly
    if (child && cellIndex == index) {
      if (columnsCells.indexOf(child) == -1)
        columnsCells.push(child);
      if (child.hasAttribute("rowspan"))
        j += parseInt(child.getsAttribute("rowspan")) - 1;
    }
  }
  var editor = EditorUtils.getCurrentEditor();
  var selection = editor.selection;
  selection.removeAllRanges();
  for (var i = 0; i < columnsCells.length; i++) {
    var range = editor.document.createRange();
    range.selectNode(columnsCells[i]);
    selection.addRange(range);
  }
  gNode = columnsCells[0];
  editor.checkSelectionStateForAnonymousButtons(editor.selection);
}

/********************** diInsertNodeBeforeTxn **********************/

function diInsertNodeBeforeTxn(aNode, aParent, aRef)
{
  this.mNode = aNode;
  this.mParent = aParent;
  this.mRef = aRef;
}

diInsertNodeBeforeTxn.prototype = {

  getNode:    function() { return this.mNode; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diINodeInsertionTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mParent.insertBefore(this.mNode, this.mRef);
  },

  undoTransaction: function()
  {
    this.mNode.parentNode.removeChild(this.mNode);
  },

  redoTransaction: function()
  {
    this.doTransaction();
  },

  isTransient: false,

  merge: function(aTransaction)
  {
    return true;
  }
};

function collectDescendants(aNode)
{
  var rv = [];
  _collectDescendants(rv, aNode, 1, arguments);
  return rv;
}

function collectFirstDescendant(aNode)
{
  var rv = [];
  _collectDescendants(rv, aNode, 1, arguments);
  if (rv.length)
    return rv[0];
  return null;
}

function _collectDescendants(aRv, aNode, aIndex, aArgs)
{
  if (aNode) {
    for (var i = 0; i < aNode.childNodes.length; i++) {
      var c = aNode.childNodes[i];
      if (c.nodeName.toLowerCase() == aArgs[aIndex]) {
        if (aIndex == aArgs.length - 1)
          aRv.push(c);
        else
          _collectDescendants(aRv, c, aIndex + 1, aArgs);
      }
    }
    return null;
  }
}
