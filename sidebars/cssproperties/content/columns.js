RegisterIniter(ColumnsSectionIniter);

function ColumnsSectionIniter(aElt, aRuleset)
{
  var cc = CssInspector.getCascadedValue(aRuleset, "-moz-column-count");
  if (cc == "auto")
    cc = "1";
  gDialog.columnCount.value = cc;

  var cw = CssInspector.getCascadedValue(aRuleset, "-moz-column-width");
  gDialog.columnWidthMenulist.value = cw;

  var cg = CssInspector.getCascadedValue(aRuleset, "-moz-column-gap");
  gDialog.columnGapMenulist.value = cg;

  var crc = CssInspector.getCascadedValue(aRuleset, "-moz-column-rule-color");
  gDialog.columnRuleColorpicker.color = crc;
  var crs = CssInspector.getCascadedValue(aRuleset, "-moz-column-rule-style");
  gDialog.columnRuleStyleMenulist.value = crs;
  var crw = CssInspector.getCascadedValue(aRuleset, "-moz-column-rule-width");
  gDialog.columnRuleWidthMenulist.value = crw;
}

function SetColumnCount(aN)
{
  gDialog.columnCount.value = aN;
  ColumnCountChanged();
}

function ColumnCountChanged()
{
  var count = gDialog.columnCount.value;
  if (count == "1")
    count = "";

  ApplyStyles([
                {
                  property: "-moz-column-count",
                  value: count
                }
              ]);
}

