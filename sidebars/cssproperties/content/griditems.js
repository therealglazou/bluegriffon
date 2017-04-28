Components.utils.import("resource://gre/modules/Services.jsm");

RegisterIniter(GridItemssSectionIniter);

function GridItemssSectionIniter(aElt, aRuleset)
{
  var bog = CssInspector.getCascadedValue(aRuleset, "order");
  gDialog.orderTextbox.value = bog;
}
