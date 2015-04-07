RegisterIniter(GeneralSectionIniter);

function GeneralSectionIniter(aElt, aRuleset)
{
  deleteAllChildren(gDialog.fontFamilyListbox);

  var fontFamily = CssInspector.getCascadedValue(aRuleset, "font-family");
  if (fontFamily) {
    var fonts = fontFamily.split(",");
    fonts.forEach(function(aElt, aIndex, aArray) {
        gDialog.fontFamilyListbox.appendItem(aElt, aElt);
      });
    //SetEnabledElement(gDialog.removeFontButton, gDialog.fontFamilyListbox.itemCount);
  }

  var webFonts = CssInspector.getWebFonts(EditorUtils.getCurrentDocument());
  var child = gDialog.beforeWebfontsMenuseparator.nextSibling;
  while (child && child.id != "afterWebfontsMenuseparator") {
    var tmp = child.nextSibling;
    gDialog.addFontMenupopup.removeChild(child);
    child = tmp;
  }
  var found = false;
  for (var i in webFonts) {
    found = true;
    var item = document.createElement("menuitem");
    item.setAttribute("label", i);
    item.setAttribute("value", i);
    gDialog.addFontMenupopup.insertBefore(item, gDialog.afterWebfontsMenuseparator)
  }
  gDialog.afterWebfontsMenuseparator.hidden = !found;

  var ta = CssInspector.getCascadedValue(aRuleset, "text-align");
  CheckToggle(gDialog.textAlignLeftButton,    ta == "left");
  CheckToggle(gDialog.textAlignCenterButton,  ta == "center");
  CheckToggle(gDialog.textAlignRightButton,   ta == "right");
  CheckToggle(gDialog.textAlignJustifyButton, ta == "justify");

  CheckToggle(gDialog.textAlignStartButton,   ta == "start");
  CheckToggle(gDialog.textAlignEndButton,     ta == "end");

  var fv = CssInspector.getCascadedValue(aRuleset, "font-variant");
  CheckToggle(gDialog.fontVariantNormalButton,    fv == "normal");
  CheckToggle(gDialog.fontVariantSmallCapsButton, fv == "small-caps");

  var ls = CssInspector.getCascadedValue(aRuleset, "letter-spacing");
  gDialog.letterSpacingMenulist.value = ls;

  var ws = CssInspector.getCascadedValue(aRuleset, "word-spacing");
  gDialog.wordSpacingMenulist.value = ws;

  var ww = CssInspector.getCascadedValue(aRuleset, "word-wrap");
  CheckToggle(gDialog.normalWordWrapButton,    ww == "normal");
  CheckToggle(gDialog.breakWrapWordWrapButton, ww == "break-word");

  var d = CssInspector.getCascadedValue(aRuleset, "direction");
  CheckToggle(gDialog.ltrDirectionButton,    d == "ltr");
  CheckToggle(gDialog.rtlDirectionButton,    d == "rtl");

  var ti = CssInspector.getCascadedValue(aRuleset, "text-indent");
  gDialog.textIndentMenulist.value = ti;

  var va = CssInspector.getCascadedValue(aRuleset, "vertical-align");
  gDialog.verticalAlignMenulist.value = va;
}

function AddFont(aEvent)
{
  var elt = aEvent.originalTarget;
  if (elt.nodeName.toLowerCase() != "menuitem")
    return;
  var value = elt.getAttribute("label");
  if (elt.hasAttribute("global")) {
    deleteAllChildren(gDialog.fontFamilyListbox);
    var fontsArray = value.split(",");
    for (var i = 0; i < fontsArray.length; i++) {
      var v = fontsArray[i].trim();
      gDialog.fontFamilyListbox.appendItem(v, v);
    }
  }
  else {
    gDialog.fontFamilyListbox.appendItem(value, value);
  }
  ApplyFontFamily();
}

function OnFontFamilySelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeFontButton, (item != null));    
}

function DeleteFont()
{
  var item = gDialog.fontFamilyListbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  ApplyFontFamily();
}

function ApplyFontFamily()
{
  var child = gDialog.fontFamilyListbox.firstChild;
  var ff = "";
  while (child) {
    ff += (ff ? ", " : "");
    if (child.value.indexOf(" ") != -1)
      ff += '"' + child.value + '"';
    else
      ff += child.value;
    child = child.nextSibling;
  }
  ApplyStyles([
                {
                  property: "font-family",
                  value: ff
                }
              ]);
}

