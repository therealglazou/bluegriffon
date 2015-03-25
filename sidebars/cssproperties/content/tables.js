RegisterIniter(TablesSectionIniter);

function TablesSectionIniter(aElt, aRuleset)
{
  var c = CssInspector.getCascadedValue(aRuleset, "table-layout");
  CheckToggle(gDialog.autoTableLayoutButton, c == "auto");
  CheckToggle(gDialog.fixedTableLayoutButton, c == "fixed");

  var bc = CssInspector.getCascadedValue(aRuleset, "border-collapse");
  CheckToggle(gDialog.collapseBorderCollapseButton, bc == "collapse");
  CheckToggle(gDialog.separateBorderCollapseButton, bc == "separate");

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

  var ec = CssInspector.getCascadedValue(aRuleset, "empty-cells");
  CheckToggle(gDialog.showEmptyCellsButton, ec == "show");
  CheckToggle(gDialog.hideEmptyCellsButton, ec == "hide");
}

function ApplyBorderSpacing()
{
  var h = gDialog.borderSpacingHMenulist.value;
  var v = gDialog.borderSpacingVMenulist.value;
  ApplyStyles( [ {
                   property: "border-spacing",
                   value: h + " " + v
                 }])
}
