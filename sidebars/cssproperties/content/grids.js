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

  var bog = CssInspector.getCascadedValue(aRuleset, "order");
  gDialog.orderTextbox.value = bog;
  
  var ggg = CssInspector.getCascadedValue(aRuleset, "grid-template-columns");
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
