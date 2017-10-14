Components.utils.import("resource://gre/modules/Services.jsm");

RegisterIniter(GridItemssSectionIniter);

function GridItemssSectionIniter(aElt, aRuleset)
{
  var bog = CssInspector.getCascadedValue(aRuleset, "order");
  gDialog.orderTextbox.value = bog;

  var grs = CssInspector.getCascadedValue(aRuleset, "grid-row-start");
  gDialog.gridRowStartBinding.value = grs;

  var gre = CssInspector.getCascadedValue(aRuleset, "grid-row-end");
  gDialog.gridRowEndBinding.value = gre;

  var gcs = CssInspector.getCascadedValue(aRuleset, "grid-column-start");
  gDialog.gridColumnStartBinding.value = gcs;

  var gce = CssInspector.getCascadedValue(aRuleset, "grid-column-end");
  gDialog.gridColumnEndBinding.value = gce;
}
