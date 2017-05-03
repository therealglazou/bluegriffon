Components.utils.import("resource://gre/modules/Services.jsm");

RegisterIniter(GridsSectionIniter);

function GridsSectionIniter(aElt, aRuleset)
{
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
  gDialog.errorGridTemplateColumnsImage.setAttribute("hidden", "true");
  gDialog.errorGridTemplateRowsImage.setAttribute("hidden", "true");

  if (count == 1) {
    var item = aTree.contentView.getItemAtIndex(0);
    if (item.getAttribute("value") == "none") {
      aButton.disabled = true;
      return;
    }
  }

  aButton.disabled = false;
}

function DeleteGridTemplateEntry(aButton, aTree, aErrorElt)
{
  var index = aTree.view.selection.currentIndex;
  var item  = aTree.contentView.getItemAtIndex(index);
  var parent = item.parentNode;
  parent.removeChild(item);

  RefreshGridTemplateListbox(aButton, aTree);

  var v = SerializeGridTemplateRowsOrColumns(aTree.lastElementChild);
  var parsed = null;
  try {
    parsed = CssInspector.parseGridTemplateRowsOrColumns(v);
  }
  catch(e) {}

  if (parsed) {
    aErrorElt.setAttribute("hidden", "true");
    ApplyStyles( [ {
              property: aTree.getAttribute("property"),
              value: v.trim()
            } ]);
  }
  else {
    aErrorElt.removeAttribute("hidden");
  }
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
