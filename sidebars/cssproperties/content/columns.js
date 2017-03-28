RegisterIniter(ColumnsSectionIniter);

function ColumnsSectionIniter(aElt, aRuleset)
{
  var cc = CssInspector.getCascadedValue(aRuleset, "-moz-column-count");
  if (cc == "auto")
    cc = "1";
  gDialog.columnCount.value = cc;

  var crs = CssInspector.getCascadedValue(aRuleset, "-moz-column-rule-style");
  gDialog.columnRuleStyleMenulist.value = crs;
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

