RegisterIniter(GeneralSectionIniter);

function GeneralSectionIniter(aElt, aRuleset)
{
  deleteAllChildren(gDialog.fontFamilyListbox);

  var fontFamily = CssInspector.getCascadedValue(aRuleset, "font-family");
  if (fontFamily) {
    var fonts = fontFamily.split(",");
    fonts.forEach(function(aElt, aIndex, aArray) {
        if (aElt[0] == "'" || aElt[0] == '"')
          aElt = aElt.substr(1, aElt.length - 2);
        gDialog.fontFamilyListbox.appendItem(aElt, aElt);
      });
    //SetEnabledElement(gDialog.removeFontButton, gDialog.fontFamilyListbox.itemCount);
  }
  if (gDialog.fontFamilyListbox.itemCount)
    gDialog.fontFamilyListbox.selectedIndex = 0;

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
    ff += '"' + child.value + '"';
    child = child.nextSibling;
  }
  ApplyStyles([
                {
                  property: "font-family",
                  value: ff
                }
              ]);
}

