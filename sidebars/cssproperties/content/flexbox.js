RegisterIniter(FlexBoxSectionIniter);

function FlexBoxSectionIniter(aElt, aRuleset)
{
  var d = CssInspector.getCascadedValue(aRuleset, "display");
  gDialog.flexBoxEnabledCheckbox.checked = (d == "flex" || d == "inline-flex");
  gDialog.inlineBoxCheckbox.disabled = !gDialog.flexBoxEnabledCheckbox.checked;
  gDialog.inlineBoxCheckbox.checked = (d == "inline-flex");

  var ai = CssInspector.getCascadedValue(aRuleset, "align-items");
  CheckToggle(gDialog.startBoxAlignButton,    ai == "flex-start");
  CheckToggle(gDialog.centerBoxAlignButton,   ai == "center");
  CheckToggle(gDialog.endBoxAlignButton,      ai == "flex-end");
  CheckToggle(gDialog.baselineBoxAlignButton, ai == "baseline");
  CheckToggle(gDialog.stretchBoxAlignButton,  ai == "stretch");

  var as = CssInspector.getCascadedValue(aRuleset, "align-self");
  CheckToggle(gDialog.startSelfAlignButton,    as == "flex-start");
  CheckToggle(gDialog.centerSelfAlignButton,   as == "center");
  CheckToggle(gDialog.endSelfAlignButton,      as == "flex-end");
  CheckToggle(gDialog.baselineSelfAlignButton, as == "baseline");
  CheckToggle(gDialog.stretchSelfAlignButton,  as == "stretch");
  CheckToggle(gDialog.autoSelfAlignButton,     as == "auto");

  /* NOT YET IMPLEMENTED BY GECKO
  var ac = CssInspector.getCascadedValue(aRuleset, "align-content");
  CheckToggle(gDialog.startAlignContentButton,    ac == "flex-start");
  CheckToggle(gDialog.centerAlignContentButton,   ac == "center");
  CheckToggle(gDialog.endAlignContentButton,      ac == "flex-end");
  CheckToggle(gDialog.stretchAlignContentButton,  ac == "stretch");
  CheckToggle(gDialog.spaceAroundAlignContentButton,     ac == "space-around");
  CheckToggle(gDialog.spaceAroundAlignContentButton,     ac == "space-between");
  */

  var jc = CssInspector.getCascadedValue(aRuleset, "justify-content");
  CheckToggle(gDialog.startJustifyContentButton,    jc == "flex-start");
  CheckToggle(gDialog.centerJustifyContentButton,   jc == "center");
  CheckToggle(gDialog.endJustifyContentButton,      jc == "flex-end");
  CheckToggle(gDialog.stretchJustifyContentButton,  jc == "stretch");
  CheckToggle(gDialog.spaceAroundJustifyContentButton,     jc == "space-around");
  CheckToggle(gDialog.spaceAroundJustifyContentButton,     jc == "space-between");

  var fd = CssInspector.getCascadedValue(aRuleset, "flex-direction");
  CheckToggle(gDialog.rowBoxDirectionButton,            (fd == "row"));
  CheckToggle(gDialog.reversedRowBoxDirectionButton,    (fd == "row-reverse"));
  CheckToggle(gDialog.columnBoxDirectionButton,         (fd == "column"));
  CheckToggle(gDialog.reversedColumnBoxDirectionButton, (fd == "column-reverse"));

  var fg = CssInspector.getCascadedValue(aRuleset, "flex-grow");
  gDialog.flexGrowTextbox.value = fg;

  var fs = CssInspector.getCascadedValue(aRuleset, "flex-shrink");
  gDialog.flexShrinkTextbox.value = fs;

  var fb = CssInspector.getCascadedValue(aRuleset, "flex-basis");
  gDialog.flexBasisMenulist.value = fb;

  var bog = CssInspector.getCascadedValue(aRuleset, "order");
  gDialog.boxOrdinalGroupTextbox.value = bog;

}

function ToggleFlexBox()
{
  gDialog.inlineBoxCheckbox.disabled = !gDialog.flexBoxEnabledCheckbox.checked;
  ApplyStyles( [
                 {
                   property: "display",
                   value: gDialog.flexBoxEnabledCheckbox.checked ?
                          (gDialog.inlineBoxCheckbox.checked ? "inline-flex" : "flex") :
                          ""
                 }
               ]);
}

