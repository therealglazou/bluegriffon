RegisterIniter(GeometrySectionIniter);

function GeometrySectionIniter(aElt, aRuleset)
{
  var mt = CssInspector.getCascadedValue(aRuleset, "margin-top");
  var mb = CssInspector.getCascadedValue(aRuleset, "margin-bottom");
  var ml = CssInspector.getCascadedValue(aRuleset, "margin-left");
  var mr = CssInspector.getCascadedValue(aRuleset, "margin-right");
  var afm = (mt == mb && mt == ml && mt == mr);
  gDialog.useSameFourMarginsCheckbox.checked = afm;
  gDialog.marginRightMenulist.style.visibility = (afm ? "hidden": "");
  gDialog.marginLeftMenulist.style.visibility = (afm ? "hidden": "");
  gDialog.marginTopMenulist.style.visibility = (afm ? "hidden": "");
  gDialog.marginRightMenulist.nextElementSibling.style.visibility = afm ? "hidden": "";
  gDialog.marginLeftMenulist.nextElementSibling.style.visibility = afm ? "hidden": "";
  gDialog.marginTopMenulist.nextElementSibling.style.visibility = afm ? "hidden": "";
  gDialog.marginTopMenulist.value = mt;
  gDialog.marginBottomMenulist.value = mb;
  gDialog.marginLeftMenulist.value = ml;
  gDialog.marginRightMenulist.value = mr;

  var pt = CssInspector.getCascadedValue(aRuleset, "padding-top");
  var pb = CssInspector.getCascadedValue(aRuleset, "padding-bottom");
  var pl = CssInspector.getCascadedValue(aRuleset, "padding-left");
  var pr = CssInspector.getCascadedValue(aRuleset, "padding-right");
  var afp = (pt == pb && pt == pl && pt == pr);
  gDialog.useSameFourPaddingsCheckbox.checked = afp;
  gDialog.paddingRightMenulist.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingLeftMenulist.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingTopMenulist.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingRightMenulist.nextElementSibling.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingLeftMenulist.nextElementSibling.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingTopMenulist.nextElementSibling.style.visibility = (afp ? "hidden" : "");
  gDialog.paddingTopMenulist.value = pt;
  gDialog.paddingBottomMenulist.value = pb;
  gDialog.paddingLeftMenulist.value = pl;
  gDialog.paddingRightMenulist.value = pr;

  var w = CssInspector.getCascadedValue(aRuleset, "width");
  gDialog.widthMenulist.value = w;
  var mw = CssInspector.getCascadedValue(aRuleset, "min-width");
  gDialog.minWidthMenulist.value = mw;
  var Mw = CssInspector.getCascadedValue(aRuleset, "max-width");
  gDialog.maxWidthMenulist.value = Mw;
  var h = CssInspector.getCascadedValue(aRuleset, "height");
  gDialog.heightMenulist.value = h;
  var mh = CssInspector.getCascadedValue(aRuleset, "min-height");
  gDialog.minHeightMenulist.value = mh;
  var Mh = CssInspector.getCascadedValue(aRuleset, "max-height");
  gDialog.maxHeightMenulist.value = Mh;

  var isImg = ("nodeName" in aElt
               && aElt.nodeName.toLowerCase() == "img");
  gDialog.preserveImageRatioCheckbox.hidden = !isImg;
  if (isImg)
    gDialog.getNaturalSizeButton.removeAttribute("hidden");
  else
    gDialog.getNaturalSizeButton.setAttribute("hidden", "true");
}

function ToggleFourEdges(aCheckbox, aPrefix)
{
  var checked = aCheckbox.checked;
  gDialog[aPrefix + "RightMenulist"].style.visibility = (checked ? "hidden": "");
  gDialog[aPrefix + "LeftMenulist"].style.visibility = (checked ? "hidden": "");
  gDialog[aPrefix + "TopMenulist"].style.visibility = (checked ? "hidden": "");
  gDialog[aPrefix + "RightMenulist"].nextElementSibling.style.visibility = (checked ? "hidden": "");
  gDialog[aPrefix + "LeftMenulist"].nextElementSibling.style.visibility = (checked ? "hidden": "");
  gDialog[aPrefix + "TopMenulist"].nextElementSibling.style.visibility = (checked ? "hidden": "");
  if (checked) {
    var value = gDialog[aPrefix + "BottomMenulist"].value;
    gDialog[aPrefix + "RightMenulist"].value= value;
    gDialog[aPrefix + "LeftMenulist"].value= value;
    gDialog[aPrefix + "TopMenulist"].value= value;
    onLengthMenulistCommand(gDialog[aPrefix + "BottomMenulist"], '% px pt cm in mm pc em ex rem ch', '', false);
  }
}

function GetNaturalSize()
{
  gDialog.widthMenulist.value = gCurrentElement.naturalWidth + "px";
  gDialog.heightMenulist.value = gCurrentElement.naturalHeight + "px";
  gDialog.preserveImageRatioCheckbox.checked = true;
  ApplyStyles( [ {
                  property: "width",
                  value: gDialog.widthMenulist.value
                },
                {
                  property: "height",
                  value: gDialog.heightMenulist.value
                }
  ]);
}
