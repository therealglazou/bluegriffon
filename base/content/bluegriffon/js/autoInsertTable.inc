
var AutoInsertTable = {

  kDEFAULT_ROW_COUNT: 6,
  kDEFAULT_COLUMN_COUNT: 6,

  mRow: null,
  mColumn: null,

  mRows: this.kDEFAULT_ROW_COUNT,
  mColumns: this.kDEFAULT_COLUMN_COUNT,

  reset: function()
  {
    var extraCells = gDialog.AutoInsertTableSizeSelectorRows.querySelectorAll("*[extra]");
    for (var i = 0; i < extraCells.length; i++) {
      var c = extraCells[i];
      c.parentNode.removeChild(c);
    }
    this.mRows = this.kDEFAULT_ROW_COUNT;
    this.mColumns = this.kDEFAULT_COLUMN_COUNT;

    var cells = gDialog.AutoInsertTableSizeSelector.querySelectorAll("label");
    for (var i = 0; i < cells.length; i++)
      cells[i].className = "";

    gDialog.AutoInsertTable_r1c1.className = "selected";
    gDialog.AutoInsertTable_r1c2.className = "selected";
    gDialog.AutoInsertTable_r2c1.className = "selected";
    gDialog.AutoInsertTable_r2c2.className = "selected";
    gDialog.AutoInsertTableSizeLabel.setAttribute("value", "2 x 2");
    gDialog.AutoInsertTableSheetPopup.removeAttribute("width");
    gDialog.AutoInsertTableSheetPopup.removeAttribute("height");
  },

  selectArea: function(cell)
  {
    var cellID    = cell.id;
    var r = cellID.match ( /AutoInsertTable_r([0-9]*)c([0-9]*)/ );

    var row = r[1];
    var column = r[2];
  
    // early way out if we can...
    if (this.mRow == row && this.mColumn == column)
      return;
  
    this.mRow = row;
    this.mColumn = column;
  
    var cells = gDialog.AutoInsertTableSizeSelector.querySelectorAll("label");
    for (var i = 0; i < cells.length; i++)
      cells[i].className = "";
  
    for (var i = row; i > 0; i--)
    {
      var anyCell = document.getElementById("AutoInsertTable_r"+i+"c"+this.mColumn);
      while (anyCell)
      {
        anyCell.setAttribute("class", "selected");
        anyCell = anyCell.previousSibling;
      }
    }
    gDialog.AutoInsertTableSizeLabel.value = this.mRow + " x " + this.mColumn;
  },

  selectSize: function(cell)
  {
    gDialog.AutoInsertTableSheetPopup.hidePopup();
  
    var editor = EditorUtils.getCurrentEditor();
    var doc = EditorUtils.getCurrentDocument();
    var tableElement = doc.createElement("table");
    var tableBody = doc.createElement("tbody");
    tableElement.appendChild(tableBody);
    tableElement.setAttribute("border", "1");
    if (doc.doctype && doc.doctype.publicId == "") // html5
      tableElement.setAttribute("style", "width: 100%");
    else
      tableElement.setAttribute("width", "100%");
    var firstCell = null;
    for (var i = 0; i < this.mRow; i++)
    {
      var newRow = doc.createElement("tr");
      tableBody.appendChild(newRow);
      for (var j = 0; j < this.mColumn; j++)
      {
        var newCell = doc.createElement("td");
        if (!firstCell)
          firstCell = newCell;
        newRow.appendChild(newCell);
      }
    }
    if (EditorUtils.isWysiwygMode()) {
      editor.insertElementAtSelection(tableElement, true);
      editor.selection.collapse(firstCell, 0);
      GetWindowContent().focus();
    }
    else {
      var src = style_html(tableElement.outerHTML);
      var srcEditor = EditorUtils.getCurrentSourceEditor();
      srcEditor.replaceSelection(src);
      EditorUtils.getCurrentSourceWindow().focus();
    }
  },

  increaseSize: function(aX, aY)
  {
    if (aX) {
      this.mColumns++;
      var hboxes = gDialog.AutoInsertTableSizeSelector.querySelectorAll("hbox");
      for (var i = 0; i < hboxes.length; i++) {
        var h = hboxes[i];
        var label = document.createElement("label");
        label.setAttribute("onmouseover", "AutoInsertTable.selectArea(this)");
        label.setAttribute("onclick",     "AutoInsertTable.selectSize(this)");
        label.setAttribute("value", "");
        label.setAttribute("extra", "true");
        label.id = "AutoInsertTable_r" + (i+1) + "c" + this.mColumns;
        h.appendChild(label);
      }
    }
    else if (aY) {
      this.mRows++;
      var row = document.createElement("row");
      row.setAttribute("extra", "true");
      var spacer1 = document.createElement("spacer");
      var spacer2 = document.createElement("spacer");
      var hbox = document.createElement("hbox");
      for (var i = 0; i < this.mColumns; i++) {
        var label = document.createElement("label");
        label.setAttribute("onmouseover", "AutoInsertTable.selectArea(this)");
        label.setAttribute("onclick",     "AutoInsertTable.selectSize(this)");
        label.setAttribute("value", "");
        label.id = "AutoInsertTable_r" + this.mRows + "c" + (i+1);
        hbox.appendChild(label);
      }
      row.appendChild(spacer1);
      row.appendChild(hbox);
      row.appendChild(spacer2);
      gDialog.AutoInsertTableSizeSelectorRows.appendChild(row);
    }
  }
};
