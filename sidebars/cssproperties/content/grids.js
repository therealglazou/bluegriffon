Components.utils.import("resource://gre/modules/Services.jsm");

RegisterIniter(GridsSectionIniter);

var gUndoStack = {
  gridTemplateColumnsTree: {},
  gridTemplateRowsTree   : {}
};

function GridsSectionIniter(aElt, aRuleset)
{
  gUndoStack = {
    gridTemplateColumnsTree: {},
    gridTemplateRowsTree   : {}
  };

  var v = CssInspector.getCascadedValue(aRuleset, "display");
  var isGrid = (v == "grid" || v == "inline-grid" || v == "subgrid");
  CheckToggle(gDialog.gridDisplayCheckbox,             isGrid);
  SetEnabledElement(gDialog.inlineGridDisplayCheckbox, isGrid);
  SetEnabledElement(gDialog.subgridDisplayCheckbox,    isGrid);

  CheckToggle(gDialog.gridDisplayCheckbox,         isGrid);
  CheckToggle(gDialog.inlineGridDisplayCheckbox,   v == "inline-grid");
  CheckToggle(gDialog.subgridDisplayCheckbox,      v == "subgrid");

  var gtc = CssInspector.getCascadedValue(aRuleset, "grid-template-columns");
  deleteAllChildren(gDialog.gridTemplateColumnsTreechildren);
  try {
    var parsedGtc = CssInspector.parseGridTemplateRowsOrColumns(gtc);
    if (parsedGtc) {
      parsedGtc.display(gDialog.gridTemplateColumnsTreechildren);
    }
  }
  catch(e) {}
  RefreshGridTemplateListbox(gDialog.addGridTemplateColumnButton, gDialog.gridTemplateColumnsTree);

  var gtr = CssInspector.getCascadedValue(aRuleset, "grid-template-rows");
  deleteAllChildren(gDialog.gridTemplateRowsTreechildren);
  try {
    var parsedGtr = CssInspector.parseGridTemplateRowsOrColumns(gtr);
    if (parsedGtr) {
      parsedGtr.display(gDialog.gridTemplateRowsTreechildren);
    }
  }
  catch(e) {}
  RefreshGridTemplateListbox(gDialog.addGridTemplateRowButton, gDialog.gridTemplateRowsTree);

  gDialog.errorGridTemplateColumnsImage.setAttribute("hidden", "true");
  gDialog.errorGridTemplateRowsImage.setAttribute("hidden", "true");

  var gta = CssInspector.getCascadedValue(aRuleset, "grid-template-areas");
  var parsedGta = null;
  try {
    parsedGta = CssInspector.parseGridTemplateAreas(gta);
  }
  catch(e) {}
  var v = parsedGta ? parsedGta.join("\n") : "";
  gDialog.gridTemplateAreaTextbox.value = v;
  gDialog.gridTemplateAreaTextbox.setAttribute("current", v);

  /*
  var gac = CssInspector.getCascadedValue(aRuleset, "grid-auto-columns");
  deleteAllChildren(gDialog.gridAutoColumnsTreechildren);
  if (gac)
    Services.prompt.alert(null, "gac", gac);
  try {
    var parsedGac = CssInspector.parseGridAutoRowsOrColumns(gac);
    if (parsedGac) {
      for (var i = 0; i < parsedGac.length; i++) {
        parsedGac[i].display(gDialog.gridAutoColumnsTreechildren);
      }
    }
  }
  catch(e) { Services.prompt.alert(null, "erreur parsing gac", e);}
  RefreshGridTemplateListbox(gDialog.addGridAutoColumnButton, gDialog.gridAutoColumnsTree);
  */
}

function ToggleDisplayGrid(aElt)
{
 var value = "";
  if (gDialog.gridDisplayCheckbox.checked) {
    if (gDialog.inlineGridDisplayCheckbox.checked)
      value = "inline-grid";
    else if (gDialog.subgridDisplayCheckbox.checked)
      value = "subgrid";
    else
      value = "grid";
  }

  ApplyStyles( [ {
            property: "display",
            value: value
          } ]);
}

function RefreshGridTemplateListbox(aButton, aTree)
{
  var count = aTree.view.rowCount;
  var selectedCount = aTree.view.selection.count;

  aButton.nextElementSibling.disabled = (0 == selectedCount);

  if (count == 1) {
    var item = aTree.contentView.getItemAtIndex(0);
    if (item.getAttribute("value") == "none") {
      aButton.disabled = true;
      return;
    }
  }

  aButton.disabled = false;
}

function DeleteGridTemplateEntry(aButton, aTree, aErrorElt, aAuto)
{
  var index = aTree.view.selection.currentIndex;
  var item  = aTree.contentView.getItemAtIndex(index);
  var parent = item.parentNode;

  var id = aTree.getAttribute("id");
  gUndoStack[id].type = "removed";
  gUndoStack[id].before = item.nextElementSibling;
  gUndoStack[id].item = parent.removeChild(item);

  RefreshGridTemplateListbox(aButton, aTree);

  var v = SerializeGridTemplateRowsOrColumns(aTree.lastElementChild).trim();
  var parsed = null;
  try {
    if (v) {
      if (aAuto)
        parsed = CssInspector.parseGridAutoRowsOrColumns(v);
      else
        parsed = CssInspector.parseGridTemplateRowsOrColumns(v);
    }
  }
  catch(e) {}

  if (parsed || !v) {
    aErrorElt.setAttribute("hidden", "true");
    ApplyStyles( [ {
              property: aTree.getAttribute("property"),
              value: v
            } ]);
  }
  else {
    aErrorElt.removeAttribute("hidden");
  }
  var treeSelection = aTree.view.selection;
  treeSelection.clearSelection();
  if (index < aTree.view.rowCount)
    treeSelection.select(index);
}

function SerializeGridTemplateRowsOrColumns(aTreechildren)
{
  var rv = "";
  var child = aTreechildren.firstElementChild;
  while (child) {
    if (child.getAttribute("container") == "true") {
      rv += " " + "repeat(" + chid.getAttribute("value") + ",";
      rv += SerializeGridTemplateRowsOrColumns(child.lastElementChild);
      rv += ")";
    }
    else {
      rv += " " + child.getAttribute("value");
    }

    child = child.nextElementSibling;
  }

  return rv;
}

function UndoDeleteGridTemplateEntry(aButton, aTree, aErrorElt)
{
  var id = aTree.getAttribute("id");
  if (!gUndoStack[id].item) // sanity case
    return;

  if (gUndoStack[id] == "removed") {
    var parent = gUndoStack[id].before.parentNode;
    parent.insertBefore(gUndoStack[id].item, gUndoStack[id].before);
  }
  else {
    var parent = gUndoStack[id].item.parentNode;
    parent.removeChild(gUndoStack[id].item);
  }

  gUndoStack[id].before = null;
  gUndoStack[id].item   = null;

  aErrorElt.setAttribute("hidden", "true");
}

function AddGridTemplate(aButton, aTree, aErrorElt, aAuto)
{
  var reference = null;
  var referenceParent = aTree.lastElementChild;

  var count = aTree.view.rowCount;
  var treeSelection = aTree.view.selection;
  var selectedCount = treeSelection.count;
  if (count > 0 && selectedCount > 0) {
    var item = aTree.contentView.getItemAtIndex(treeSelection.currentIndex);
    referenceParent = item.parentNode;
    reference = item.nextElementSibling;
  }

  var rv = {cancelled: true};
  window.openDialog("chrome://cssproperties/content/editGridTemplateEntry.xul",
                    "_blank",
                    "chrome,modal,titlebar,resizable=yes,dialog=no",
                    aTree, referenceParent, reference, rv);
 
  if (rv.cancelled)
    return;

  var treeitem = document.createElement("treeitem");
  var treerow  = document.createElement("treerow");
  var treecell = document.createElement("treecell");
  treecell.setAttribute("label", rv.value);
  treeitem.setAttribute("value", rv.value);

  treerow.appendChild(treecell);
  treeitem.appendChild(treerow);
  referenceParent.insertBefore(treeitem, reference);
  
  RefreshGridTemplateListbox(aButton, aTree);

  var v = SerializeGridTemplateRowsOrColumns(aTree.lastElementChild);
  var parsed = null;
  try {
    if (aAuto)
      parsed = CssInspector.parseGridAutoRowsOrColumns(v);
    else
      parsed = CssInspector.parseGridTemplateRowsOrColumns(v);
  }
  catch(e) {}

  index = aTree.contentView.getIndexOfItem(item);
  if (parsed) {
    aErrorElt.setAttribute("hidden", "true");
    ApplyStyles( [ {
              property: aTree.getAttribute("property"),
              value: v.trim()
            } ]);
  }
  else {
    aErrorElt.removeAttribute("hidden");
    var id = aTree.getAttribute("id");
    gUndoStack[id].type = "added";
    gUndoStack[id].before = null;
    gUndoStack[id].item = treeitem;

    treeSelection.clearSelection();
    treeSelection.select(index);
  }
}

var gGridTemplateAreaTimer = null;

function ApplyGridTemplateAreas(aElt)
{
  if (gGridTemplateAreaTimer) {
    clearTimeout(gGridTemplateAreaTimer);
  }

  gGridTemplateAreaTimer = setTimeout(_ApplyGridTemplateAreas, 500, aElt);
}

function _ApplyGridTemplateAreas(aElt)
{
  gGridTemplateAreaTimer = null;

  var v = aElt.value;
  var parsedGta = null;
  try {
    parsedGta = CssInspector.parseGridTemplateAreas(v);
  }
  catch(e) {}

  if (!v || parsedGta) {
    v = parsedGta ? parsedGta.join("\n") : "";
    if ((!v || parsedGta) && aElt.getAttribute("current") != v)
      ApplyStyles( [ {
                property: "grid-template-areas",
                value: v
              } ]);
  }
}
