RegisterIniter(MiscSectionIniter);

function MiscSectionIniter(aElt, aRuleset)
{
  var c = CssInspector.getCascadedValue(aRuleset, "cursor");
  gDialog.cursorMenulist.value = c;

  var ub = CssInspector.getCascadedValue(aRuleset, "unicode-bidi");
  CheckToggle(gDialog.normalUnicodeBidiButton,       ub == "normal");
  CheckToggle(gDialog.embedUnicodeBidiButton,        ub == "embed");
  CheckToggle(gDialog.bidiOverrideUnicodeBidiButton, ub == "bidi-override");

  var w = CssInspector.getCascadedValue(aRuleset, "widows");
  gDialog.widowsTextbox.value = w;

  var o = CssInspector.getCascadedValue(aRuleset, "orphans");
  gDialog.orphansTextbox.value = o;

  var pbb = CssInspector.getCascadedValue(aRuleset, "page-break-before");
  gDialog.pageBreakBeforeMenulist.value = pbb;

  var pbi = CssInspector.getCascadedValue(aRuleset, "page-break-inside");
  gDialog.pageBreakInsideMenulist.value = pbi;

  var pba = CssInspector.getCascadedValue(aRuleset, "page-break-after");
  gDialog.pageBreakAfterMenulist.value = pba;
}
