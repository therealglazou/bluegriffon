RegisterIniter(ListsSectionIniter);

function ListsSectionIniter(aElt, aRuleset)
{
  var lst = CssInspector.getCascadedValue(aRuleset, "list-style-type");
  gDialog.listStyleTypeMenulist.value = lst;

  var lsp = CssInspector.getCascadedValue(aRuleset, "list-style-position");
  CheckToggle(gDialog.insideListStylePositionButton,    lsp == "inside");
  CheckToggle(gDialog.outsideListStylePositionButton,   lsp == "outside");

  var lsi = CssInspector.getCascadedValue(aRuleset, "list-style-image");
  gDialog.listStyleImageURLTextbox.value = lsi;
}

function LoadListStyleImage()
{
  ApplyStyles( [
                 {
                   property: "list-style-image",
                   value: 'url("' + gDialog.listStyleImageURLTextbox.value + '")'
                 }
               ]);
}
