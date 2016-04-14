RegisterIniter(TablesSectionIniter);

function TablesSectionIniter(aElt, aRuleset)
{
  var bs = CssInspector.getCascadedValue(aRuleset, "border-spacing");
  if (bs) {
    var bsArray = bs.split(" ");
    gDialog.borderSpacingHMenulist.value = bsArray[0];
    if (bsArray.length == 2)
      gDialog.borderSpacingVMenulist.value = bsArray[1];
    else
      gDialog.borderSpacingVMenulist.value = "";
  }
  else {
    gDialog.borderSpacingHMenulist.value = "";
    gDialog.borderSpacingVMenulist.value = "";
  }
}

function ApplyBorderSpacing()
{
  var h = gDialog.borderSpacingHMenulist.value;
  var v = gDialog.borderSpacingVMenulist.value;
  if (CSS.supports("border-spacing", h + " " + v))
    ApplyStyles( [ {
                     property: "border-spacing",
                     value: h + " " + v
                   }])
}
