var bgInsertTableCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // reset the table insertion panel
    AutoInsertTable.reset();
    gDialog.AutoInsertTableSheetPopup.openPopup(EditorUtils.getCurrentTabEditor(), "at_pointer", 0, 0, false);
  }
};

var bgEditTableCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    window.openDialog("chrome://bluegriffon/content/dialogs/insertTable.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=no", element);
  }
};

var bgSelectTableCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectTable();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgSelectTableCaptionCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    if (element &&
        EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode()) {
      // but do we already have a caption?
      return  (element.firstElementChild
               && element.firstElementChild.nodeName == "caption");
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    try {
      EditorUtils.getCurrentEditor().selectElement(element.firstElementChild);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgSelectTableRowCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectTableRow();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgsSelectTableColumnCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectTableColumn();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgSelectTableCellCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectTableCell();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgSelectAllTableCellsCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectAllTableCells();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableCaptionCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    if (element &&
        EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode()) {
      // but do we already have a caption?
      return  (!element.firstElementChild
               || element.firstElementChild.nodeName != "caption");
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    try {
      var caption = EditorUtils.getCurrentEditor().createElementWithDefaults("caption");
      var brNode = EditorUtils.getCurrentDocument().createElement("br");
      caption.appendChild(brNode);
      EditorUtils.getCurrentEditor().insertNode(caption, element, 0);
      EditorUtils.getCurrentEditor().selectElement(brNode);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableRowAboveCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableRow(1, false);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableRowBelowCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableRow(1, true);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableColumnBeforeCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableColumn(1, false);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableColumnAfterCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableColumn(1, true);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableCellBeforeCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableCell(1, false);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgInsertTableCellAfterCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().insertTableCell(1, true);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgDeleteTableCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().deleteTable();
    } catch(e) {}
    GetWindowContent().focus();
  }
};

var bgDeleteTableCaptionCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    if (element &&
        EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode()) {
      // but do we already have a caption?
      return  (element.firstElementChild
               && element.firstElementChild.nodeName == "caption");
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    try {
      EditorUtils.getCurrentEditor().deleteNode(element.firstElementChild);
    } catch(e) {}
    GetWindowContent().focus();
  }
};

function GetNumberOfContiguousSelectedRows()
{
  var rows = 0;
  try {
    var editor = EditorUtils.getCurrentTableEditor();
    var rowObj = { value: 0 };
    var colObj = { value: 0 };
    var cell = editor.getFirstSelectedCellInTable(rowObj, colObj);
    if (!cell)
      return 0;

    // We have at least one row
    rows++;

    var lastIndex = rowObj.value;
    do {
      cell = editor.getNextSelectedCell({value:0});
      if (cell)
      {
        editor.getCellIndexes(cell, rowObj, colObj);
        var index = rowObj.value;
        if (index == lastIndex + 1)
        {
          lastIndex = index;
          rows++;
        }
      }
    }
    while (cell);
  } catch (e) {}

  return rows;
}

function GetNumberOfContiguousSelectedColumns()
{
  var columns = 0;
  try {
    var editor = EditorUtils.getCurrentTableEditor();
    var colObj = { value: 0 };
    var rowObj = { value: 0 };
    var cell = editor.getFirstSelectedCellInTable(rowObj, colObj);
    if (!cell)
      return 0;

    // We have at least one column
    columns++;

    var lastIndex = colObj.value;
    do {
      cell = editor.getNextSelectedCell({value:0});
      if (cell)
      {
        editor.getCellIndexes(cell, rowObj, colObj);
        var index = colObj.value;
        if (index == lastIndex +1)
        {
          lastIndex = index;
          columns++;
        }
      }
    }
    while (cell);
  } catch (e) {}

  return columns;
}

var bgDeleteTableRowCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var rows = GetNumberOfContiguousSelectedRows();
    // Delete at least one row
    if (rows == 0)
      rows = 1;

    try {
      var editor = EditorUtils.getCurrentTableEditor();
      editor.beginTransaction();

      // Loop to delete all blocks of contiguous, selected rows
      while (rows)
      {
        editor.deleteTableRow(rows);
        rows = GetNumberOfContiguousSelectedRows();
      }
    } finally { editor.endTransaction(); }
    GetWindowContent().focus();
  }
};

var bgDeleteTableColumnCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var columns = GetNumberOfContiguousSelectedColumns();
    // Delete at least one column
    if (columns == 0)
      columns = 1;

    try {
      var editor = EditorUtils.getCurrentTableEditor();
      editor.beginTransaction();

      // Loop to delete all blocks of contiguous, selected columns
      while (columns)
      {
        editor.deleteTableColumn(columns);
        columns = GetNumberOfContiguousSelectedColumns();
      }
    } finally { editor.endTransaction(); }
    GetWindowContent().focus();
  }
};

var bgDeleteTableCellCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().deleteTableCell(1);   
    } catch (e) {}
    GetWindowContent().focus();
  }
};

var bgDeleteTableCellContentsCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().deleteTableCellContents();   
    } catch (e) {}
    GetWindowContent().focus();
  }
};

var bgNormalizeTableCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["table"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // Use nsnull to let editor find table enclosing current selection
    try {
      EditorUtils.getCurrentTableEditor().normalizeTable(null);   
    } catch (e) {}
    GetWindowContent().focus();
  }
};

var bgJoinTableCellsCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode())
    {
      try {
        var editor = EditorUtils.getCurrentTableEditor();
        var tagNameObj = { value: "" };
        var countObj = { value: 0 };
        var cell = editor.getSelectedOrParentTableElement(tagNameObj, countObj);

        // We need a cell and either > 1 selected cell or a cell to the right
        //  (this cell may originate in a row spanned from above current row)
        // Note that editor returns "td" for "th" also.
        // (this is a pain! Editor and gecko use lowercase tagNames, JS uses uppercase!)
        if( cell && (tagNameObj.value == "td"))
        {
          // Selected cells
          if (countObj.value > 1) return true;

          var colSpan = cell.getAttribute("colspan");

          // getAttribute returns string, we need number
          // no attribute means colspan = 1
          if (!colSpan)
            colSpan = Number(1);
          else
            colSpan = Number(colSpan);

          var rowObj = { value: 0 };
          var colObj = { value: 0 };
          editor.getCellIndexes(cell, rowObj, colObj);

          // Test if cell exists to the right of current cell
          // (cells with 0 span should never have cells to the right
          //  if there is, user can select the 2 cells to join them)
          return (colSpan && editor.getCellAt(null, rowObj.value,
                                              colObj.value + colSpan));
        }
      } catch (e) {}
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // Param: Don't merge non-contiguous cells
    try {
      EditorUtils.getCurrentTableEditor().joinTableCells(false);
    } catch (e) {alert(e)}
    GetWindowContent().focus();
  }
};

function IsSelectionInOneCell()
{
  try {
    var editor = EditorUtils.getCurrentEditor();
    var selection = editor.selection;

    if (selection.rangeCount == 1)
    {
      // We have a "normal" single-range selection
      if (!selection.isCollapsed &&
         selection.anchorNode != selection.focusNode)
      {
        // Check if both nodes are within the same cell
        var anchorCell = editor.getElementOrParentByTagName("td", selection.anchorNode);
        var focusCell = editor.getElementOrParentByTagName("td", selection.focusNode);
        return (focusCell != null && anchorCell != null && (focusCell == anchorCell));
      }
      // Collapsed selection or anchor == focus (thus must be in 1 cell)
      return true;
    }
  } catch (e) {}
  return false;
}

var bgSplitTableCellCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode())
    {
      var tagNameObj = { value: "" };
      var countObj = { value: 0 };
      var cell;
      try {
        cell = EditorUtils.getCurrentTableEditor().getSelectedOrParentTableElement(tagNameObj, countObj);
      } catch (e) {}

      // We need a cell parent and there's just 1 selected cell 
      // or selection is entirely inside 1 cell
      if ( cell && (tagNameObj.value == "td") && 
           countObj.value <= 1 &&
           IsSelectionInOneCell() )
      {
        var colSpan = cell.getAttribute("colspan");
        var rowSpan = cell.getAttribute("rowspan");
        if (!colSpan) colSpan = 1;
        if (!rowSpan) rowSpan = 1;
        return (colSpan > 1  || rowSpan > 1 ||
                colSpan == 0 || rowSpan == 0);
      }
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().splitTableCell();
    } catch (e) {}
    GetWindowContent().focus();
  }
};

function GetParentTableCell(element)
{
  var node = element;
  while (node)
  {
    if (node.nodeName.toLowerCase() == "td" || node.nodeName.toLowerCase() == "th")
      return node;

    node = node.parentNode;
  }
  return node;
}

var bgConvertToTable =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode())
    {
      var selection;
      var editor = EditorUtils.getCurrentEditor();
      try {
        selection = editor.selection;
      } catch (e) {}

      if (selection && !selection.isCollapsed)
      {
        // Don't allow if table or cell is the selection
        var element;
        try {
          element = editor.getSelectedElement("");
        } catch (e) {}
        if (element)
        {
          var name = element.nodeName.toLowerCase();
          if (name == "td" ||
              name == "th" ||
              name == "caption" ||
              name == "table")
            return false;
        }

        // Selection start and end must be in the same cell
        //   in same cell or both are NOT in a cell
        if ( GetParentTableCell(selection.focusNode) !=
             GetParentTableCell(selection.anchorNode) )
          return false
      
        return true;
      }
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/convertToTable.xul","_blank", "chrome,close,titlebar,modal")
    GetWindowContent().focus();
  }
};

var bgConvertClipboardToTable =
{
  isCommandEnabled: function(aCommand, dummy)
  {
      if (EditorUtils.getCurrentEditorElement()
          && EditorUtils.isDocumentEditable()
          && EditorUtils.isEditingRenderedHTML()) {
        var flavors = ["text/unicode"];
        var hasData =
          Services.clipboard.hasDataMatchingFlavors(flavors, flavors.length, Services.clipboard.kGlobalClipboard);
        if (hasData) {
          let trans = Components.classes["@mozilla.org/widget/transferable;1"].
                        createInstance(Components.interfaces.nsITransferable);
          trans.init(null);
          flavors.forEach(trans.addDataFlavor);

          Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
          var data = {};
          var dataLen = {};
          trans.getTransferData(flavors[0], data, dataLen);

          if (data) {
            data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
            str = data.data.substring(0, dataLen.value / 2);
            if (str && str.replace( /\s/g, ""))
              return true;
          }
        }
      }
      return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/convertClipboardToTable.xul","_blank", "chrome,close,titlebar,modal")
    GetWindowContent().focus();
  }
};

var bgSelectTableColumnCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    var element = EditorUtils.getObjectForProperties(["td", "th"]);
    return (element &&
            EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      EditorUtils.getCurrentTableEditor().selectTableColumn();
    } catch(e) {}
    GetWindowContent().focus();
  }
};


