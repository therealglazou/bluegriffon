RegisterIniter(ListsSectionIniter);

function ListsSectionIniter(aElt, aRuleset)
{
  var lst = CssInspector.getCascadedValue(aRuleset, "list-style-type");
  gDialog.listStyleTypeMenulist.value = lst;

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
