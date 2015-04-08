Components.utils.import("resource://app/modules/urlHelper.jsm");

RegisterIniter(BordersSectionIniter);

function BordersSectionIniter(aElt, aRuleset)
{
  var bbw = CssInspector.getCascadedValue(aRuleset, "border-bottom-width");
  var btw = CssInspector.getCascadedValue(aRuleset, "border-top-width");
  var blw = CssInspector.getCascadedValue(aRuleset, "border-left-width");
  var brw = CssInspector.getCascadedValue(aRuleset, "border-right-width");

  var bbs = CssInspector.getCascadedValue(aRuleset, "border-bottom-style");
  var bts = CssInspector.getCascadedValue(aRuleset, "border-top-style");
  var bls = CssInspector.getCascadedValue(aRuleset, "border-left-style");
  var brs = CssInspector.getCascadedValue(aRuleset, "border-right-style");

  var bbc = CssInspector.getCascadedValue(aRuleset, "border-bottom-color");
  var btc = CssInspector.getCascadedValue(aRuleset, "border-top-color");
  var blc = CssInspector.getCascadedValue(aRuleset, "border-left-color");
  var brc = CssInspector.getCascadedValue(aRuleset, "border-right-color");

  gDialog.borderTopColorpicker.color    = btc;
  gDialog.borderLeftColorpicker.color   = blc;
  gDialog.borderRightColorpicker.color  = brc;
  gDialog.borderBottomColorpicker.color = bbc;

  gDialog.borderTopWidthMenulist.value    = btw;
  gDialog.borderLeftWidthMenulist.value   = blw;
  gDialog.borderRightWidthMenulist.value  = brw;
  gDialog.borderBottomWidthMenulist.value = bbw;

  gDialog.borderTopStyleMenulist.value    = bts;
  gDialog.borderLeftStyleMenulist.value   = bls;
  gDialog.borderRightStyleMenulist.value  = brs;
  gDialog.borderBottomStyleMenulist.value = bbs;

  var sameOnFourEdges =  (bbw == btw && bbw == blw && bbw == brw &&
                          bbs == bts && bbs == bls && bbs == brs &&
                          bbc == btc && bbc == blc && bbc == brc);
  gDialog.sameBorderOnFourEdgesCheckbox.checked = sameOnFourEdges;

  gDialog.borderTopColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderLeftColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderRightColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderBottomLabel.style.visibility = (sameOnFourEdges ? "hidden" : "visible");

  var tlCorner = CssInspector.getCascadedValue(aRuleset, "border-top-left-radius");
  var trCorner = CssInspector.getCascadedValue(aRuleset, "border-top-right-radius");
  var blCorner = CssInspector.getCascadedValue(aRuleset, "border-bottom-left-radius");
  var brCorner = CssInspector.getCascadedValue(aRuleset, "border-bottom-right-radius");
  var sameFourCorners = (tlCorner == trCorner && tlCorner == blCorner && tlCorner == brCorner);
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(%|px|pt|cm|in|mm|pc|em|ex|ch|rem)*", "g");
  tlCorner = tlCorner.match(r);
  trCorner = trCorner.match(r);
  blCorner = blCorner.match(r);
  brCorner = brCorner.match(r);
  gDialog.topLeftBorderRadiusXMenulist.value = (tlCorner && tlCorner.length) ? tlCorner[0] : "0px";
  gDialog.topLeftBorderRadiusYMenulist.value = (tlCorner && tlCorner.length == 2) ? tlCorner[1] : gDialog.topLeftBorderRadiusXMenulist.value;
  gDialog.topRightBorderRadiusXMenulist.value = (trCorner && trCorner.length) ? trCorner[0] : "0px";
  gDialog.topRightBorderRadiusYMenulist.value = (trCorner && trCorner.length == 2) ? trCorner[1] : gDialog.topRightBorderRadiusXMenulist.value;
  gDialog.bottomLeftBorderRadiusXMenulist.value = (blCorner && blCorner.length) ? blCorner[0] : "0px";
  gDialog.bottomLeftBorderRadiusYMenulist.value = (blCorner && blCorner.length == 2) ? blCorner[1] : gDialog.bottomLeftBorderRadiusXMenulist.value;
  gDialog.bottomRightBorderRadiusXMenulist.value = (brCorner && brCorner.length) ? brCorner[0] : "0px";
  gDialog.bottomRightBorderRadiusYMenulist.value = (brCorner && brCorner.length == 2) ? brCorner[1] : gDialog.bottomRightBorderRadiusXMenulist.value;

  gDialog.topLeftBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.topRightBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.bottomLeftBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.bottomRightCornerLabel.style.visibility = sameFourCorners ? "hidden" : "visible";
  gDialog.sameFourCornersCheckbox.checked = sameFourCorners;

  var bi = CssInspector.getCascadedValue(aRuleset, "-moz-border-image");
  var hasBorderImage = (bi && bi != "none");
  gDialog.useImageAsBorderCheckbox.checked = hasBorderImage
  gDialog.useImageAsBorderVbox.hidden = !hasBorderImage;
  var parsedBi = CssInspector.parseBorderImage(bi);
  gDialog.borderImageURLTextbox.value = parsedBi ? MakeAbsoluteUrl(parsedBi.url) : "";
  gDialog.topEdgeSlicingTextbox.value    = 0;
  gDialog.leftEdgeSlicingTextbox.value   = 0;
  gDialog.rightEdgeSlicingTextbox.value  = 0;
  gDialog.bottomEdgeSlicingTextbox.value = 0;
  gDialog.borderSliceLeftWidthMenulist.value = "";
  gDialog.borderSliceRightWidthMenulist.value = "";
  gDialog.borderSliceTopWidthMenulist.value = "";
  gDialog.borderSliceBottomWidthMenulist.value = "";
  if (parsedBi) {
    LoadBorderImage();
    switch (parsedBi.offsets.length) {
      case 1:
        gDialog.topEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.leftEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.rightEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.bottomEdgeSlicingTextbox.value = parsedBi.offsets[0];
        break;
      case 2:
        gDialog.topEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.leftEdgeSlicingTextbox.value = parsedBi.offsets[1];
        gDialog.rightEdgeSlicingTextbox.value = parsedBi.offsets[1];
        gDialog.bottomEdgeSlicingTextbox.value = parsedBi.offsets[0];
        break;
      case 3:
        gDialog.topEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.leftEdgeSlicingTextbox.value = parsedBi.offsets[1];
        gDialog.rightEdgeSlicingTextbox.value = parsedBi.offsets[1];
        gDialog.bottomEdgeSlicingTextbox.value = parsedBi.offsets[2];
        break;
      case 4:
        gDialog.topEdgeSlicingTextbox.value = parsedBi.offsets[0];
        gDialog.leftEdgeSlicingTextbox.value = parsedBi.offsets[3];
        gDialog.rightEdgeSlicingTextbox.value = parsedBi.offsets[1];
        gDialog.bottomEdgeSlicingTextbox.value = parsedBi.offsets[2];
        break;
      default: break; // should never happen
    }
    switch (parsedBi.widths.length) {
      case 1:
        gDialog.borderSliceTopWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceLeftWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceRightWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceBottomWidthMenulist.value = parsedBi.widths[0];
        break;
      case 2:
        gDialog.borderSliceTopWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceLeftWidthMenulist.value = parsedBi.widths[1];
        gDialog.borderSliceRightWidthMenulist.value = parsedBi.widths[1];
        gDialog.borderSliceBottomWidthMenulist.value = parsedBi.widths[0];
        break;
      case 3:
        gDialog.borderSliceTopWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceLeftWidthMenulist.value = parsedBi.widths[1];
        gDialog.borderSliceRightWidthMenulist.value = parsedBi.widths[1];
        gDialog.borderSliceBottomWidthMenulist.value = parsedBi.widths[2];
        break;
      case 4:
        gDialog.borderSliceTopWidthMenulist.value = parsedBi.widths[0];
        gDialog.borderSliceLeftWidthMenulist.value = parsedBi.widths[3];
        gDialog.borderSliceRightWidthMenulist.value = parsedBi.widths[1];
        gDialog.borderSliceBottomWidthMenulist.value = parsedBi.widths[2];
        break;
      default: break; // should never happen
    }
    MakeRelativeUrl();
    gDialog.borderImageFromTop.setAttribute("top", 15 + parseFloat(gDialog.topEdgeSlicingTextbox.value));
    gDialog.borderImageFromLeft.setAttribute("left", 15 + parseFloat(gDialog.leftEdgeSlicingTextbox.value));
    gDialog.borderImageFromRight.setAttribute("right", 15 + parseFloat(gDialog.rightEdgeSlicingTextbox.value));
    gDialog.borderImageFromBottom.setAttribute("bottom", 15 + parseFloat(gDialog.bottomEdgeSlicingTextbox.value));
  }
}

function ToggleSameBorderOnFourEdges(aElt)
{
  var sameOnFourEdges = aElt.checked;
  if (sameOnFourEdges) {
    var bbc = gDialog.borderBottomColorpicker.color;
    var bbs = gDialog.borderBottomStyleMenulist.value;
    var bbw = gDialog.borderBottomWidthMenulist.value;

    gDialog.borderTopColorpicker.color = bbc;
    gDialog.borderLeftColorpicker.color = bbc;
    gDialog.borderRightColorpicker.color = bbc;

    gDialog.borderTopStyleMenulist.value = bbs;
    gDialog.borderLeftStyleMenulist.value = bbs;
    gDialog.borderRightStyleMenulist.value = bbs;

    gDialog.borderTopWidthMenulist.value = bbw;
    gDialog.borderLeftWidthMenulist.value = bbw;
    gDialog.borderRightWidthMenulist.value = bbw;
    var toApply = [
                    {
                      property: "border-top-color",
                      value: bbc
                    },
                    {
                      property: "border-left-color",
                      value: bbc
                    },
                    {
                      property: "border-right-color",
                      value: bbc
                    },
                    {
                      property: "border-top-style",
                      value: bbs
                    },
                    {
                      property: "border-left-style",
                      value: bbs
                    },
                    {
                      property: "border-right-style",
                      value: bbs
                    },
                    {
                      property: "border-top-width",
                      value: bbw
                    },
                    {
                      property: "border-left-width",
                      value: bbw
                    },
                    {
                      property: "border-right-width",
                      value: bbw
                    }
                  ];
    ApplyStyles(toApply);
  }
  gDialog.borderTopColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderLeftColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderRightColorpicker.parentNode.hidden = sameOnFourEdges;
  gDialog.borderBottomLabel.style.visibility = (sameOnFourEdges ? "hidden" : "visible");
}

function ApplyBorderRadius(aElt)
{
  var id = aElt.id;
  var elts = [];
  var property = "";
  switch (id) {
    case "topLeftBorderRadiusXMenulist":
    case "topLeftBorderRadiusYMenulist":
      elts.push("topLeftBorderRadiusXMenulist");
      elts.push("topLeftBorderRadiusYMenulist");
      property = "border-top-left-radius";
      break;
    case "topRightBorderRadiusXMenulist":
    case "topRightBorderRadiusYMenulist":
      elts.push("topRightBorderRadiusXMenulist");
      elts.push("topRightBorderRadiusYMenulist");
      property = "border-top-right-radius";
      break;
    case "bottomLeftBorderRadiusXMenulist":
    case "bottomLeftBorderRadiusYMenulist":
      elts.push("bottomLeftBorderRadiusXMenulist");
      elts.push("bottomLeftBorderRadiusYMenulist");
      property = "border-bottom-left-radius";
      break;
    case "bottomRightBorderRadiusXMenulist":
    case "bottomRightBorderRadiusYMenulist":
      elts.push("bottomRightBorderRadiusXMenulist");
      elts.push("bottomRightBorderRadiusYMenulist");
      property = "border-bottom-right-radius";
      break;
  }
  var val1    = gDialog[elts[0]].value;
  var val2    = (gDialog[elts[1]].value ? "/ " + gDialog[elts[1]].value : "");
  var val2bis = (gDialog[elts[1]].value ? gDialog[elts[1]].value : "");
  if (gDialog.sameFourCornersCheckbox.checked)
    ApplyStyles([
                  {
                    property: "border-radius",
                    value: val1 + val2
                  }
                ]);
  else
    ApplyStyles([
                  {
                    property: property,
                    value: val1 + val2bis
                  }
                ]);
}

function ToggleSameFourCorners(aElt)
{
  var sameFourCorners = aElt.checked;
  if (sameFourCorners) {
    var brCX = gDialog.bottomRightBorderRadiusXMenulist.value;
    var brCY = gDialog.bottomRightBorderRadiusYMenulist.value;
    gDialog.topLeftBorderRadiusXMenulist.value = brCX;
    gDialog.topRightBorderRadiusXMenulist.value = brCX;
    gDialog.bottomLeftBorderRadiusXMenulist.value = brCX;
    gDialog.topLeftBorderRadiusYMenulist.value = brCY;
    gDialog.topRightBorderRadiusYMenulist.value = brCY;
    gDialog.bottomLeftBorderRadiusYMenulist.value = brCY;
    var str = brCX;
    str += ((str || brCY) ? " " + brCY : "");
    ApplyStyles([
                  {
                    property: "border-radius",
                    value: str.trim()
                  }
                ]);
  }
  gDialog.topLeftBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.topRightBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.bottomLeftBorderRadiusXMenulist.parentNode.parentNode.hidden = sameFourCorners;
  gDialog.bottomRightCornerLabel.style.visibility = sameFourCorners ? "hidden" : "visible";
}

function ToggleImageAsBorder(aElt)
{
  var ok = aElt.checked;
  gDialog.useImageAsBorderVbox.hidden = !ok;
  if (!ok) {
    ApplyStyles([
                  {
                    property: "-moz-border-image",
                    value: ""
                  }
                ]);
  }
}

function MakeRelativeUrl()
{
  var spec = gDialog.borderImageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.borderImageURLTextbox.value = spec;
  }
}

function MakeAbsoluteUrl(spec)
{
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
  }
  return spec;
}

function LoadBorderImage()
{
  gDialog.borderImagePreviewBox.hidden = false;
  // reset all
  gDialog.topEdgeSlicingTextbox.value    = 0;
  gDialog.leftEdgeSlicingTextbox.value   = 0;
  gDialog.rightEdgeSlicingTextbox.value  = 0;
  gDialog.bottomEdgeSlicingTextbox.value = 0;

  gDialog.borderImageFromTop.setAttribute("top", 15);
  gDialog.borderImageFromLeft.setAttribute("left", 15);
  gDialog.borderImageFromRight.setAttribute("right", 15);
  gDialog.borderImageFromBottom.setAttribute("bottom", 15);
  gDialog.borderImagePreview.setAttribute("src", gDialog.borderImageURLTextbox.value);
}

function ErrorLoadingBorderImage()
{
  gDialog.borderImagePreview.setAttribute("src", "");
  gDialog.borderImagePreviewBox.hidden = true;
}

function SizeBorderImageRulers(aElt)
{
  var w = aElt.boxObject.width;
  var h = aElt.boxObject.height;
  gDialog.borderImageFromTop.style.width = (w + 30) + "px";
  gDialog.borderImageFromBottom.style.width = (w + 30) + "px";
  gDialog.borderImageFromLeft.style.height = (h + 30) + "px";
  gDialog.borderImageFromRight.style.height = (h + 30) + "px";
}

var gMoving = false;
var gX, gY;
var gOriginal;
function StartMovingBorderImageSliceEdge(aEvent, aElt, aEdge)
{
  gMoving = true;
  gX = aEvent.clientX;
  gY = aEvent.clientY;
  gOriginal = aElt.getAttribute(aEdge);
  aElt.setCapture(false);
  aElt.className = "moving";
}

function MoveBorderImageSliceEdge(aEvent, aElt, aEdge)
{
  if (!gMoving)
    return;
  var x = aEvent.clientX
  var y = aEvent.clientY;
  var diff;
  switch (aEdge)
  {
    case "top":    diff = y - gY; break;
    case "left":   diff = x - gX; break;
    case "right":  diff = gX - x; break;
    case "bottom": diff = gY - y; break;
    default: break; //should never happen
  }
  value = parseFloat(gOriginal) + diff;
  if (value < 15)
    value = 15;
  switch (aEdge)
  {
    case "top":    
    case "bottom": value = Math.min(value, gDialog.borderImagePreview.boxObject.height + 15); break;

    case "left":
    case "right":  value = Math.min(value, gDialog.borderImagePreview.boxObject.width + 15); break;
    default: break; //should never happen
  }
  aElt.setAttribute(aEdge, value);
  gDialog[aEdge + "EdgeSlicingTextbox"].value = value - 15;
  switch (aEdge) {
    case "top":
      gDialog.borderSliceTopWidthMenulist.value = (value -15) + "px";
      break;
    case "right":
      gDialog.borderSliceRightWidthMenulist.value = (value -15) + "px";
      break;
    case "bottom":
      gDialog.borderSliceBottomWidthMenulist.value = (value -15) + "px";
      break;
    case "left":
      gDialog.borderSliceLeftWidthMenulist.value = (value -15) + "px";
      break;
  }
}

function StopMovingBorderImageSliceEdge(aEvent, aElt, aEdge)
{
  aElt.releaseCapture();
  aElt.className = "";
  gMoving = false;
  ApplyBorderImage(false);
}

function ApplyBorderImageSliceChangeFromTextbox(aElt)
{
  var id = aElt.id;
  var value = aElt.value;
  switch (id) {
    case "leftEdgeSlicingTextbox":
      gDialog.borderImageFromLeft.setAttribute("left", 15 + Number(value));
      gDialog.borderSliceLeftWidthMenulist.value = value + "px";
      break;
    case "rightEdgeSlicingTextbox":
      gDialog.borderImageFromRight.setAttribute("right", 15 + Number(value));
      gDialog.borderSliceRightWidthMenulist.value = value + "px";
      break;
    case "topEdgeSlicingTextbox":
      gDialog.borderImageFromTop.setAttribute("top", 15 + Number(value));
      gDialog.borderSliceRightWidthMenulist.value = value + "px";
      break;
    case "bottomEdgeSlicingTextbox":
      gDialog.borderImageFromBottom.setAttribute("bottom", 15 + Number(value));
      gDialog.borderSliceRightWidthMenulist.value = value + "px";
      break;
    default: break; // should never happen
  }
  ApplyBorderImage(false);
}

function ApplyBorderImage(aZeroWidths)
{
  var url = gDialog.borderImageURLTextbox.value;

  var leftOffset    = gDialog.leftEdgeSlicingTextbox.value;
  var rightOffset   = gDialog.rightEdgeSlicingTextbox.value;
  var topOffset     = gDialog.topEdgeSlicingTextbox.value;
  var bottomOffset = gDialog.bottomEdgeSlicingTextbox.value;

  function ZeroTextboxIfNeededed(id)
  {
    if (gDialog[id].value == "")
      gDialog[id].value = "0px";
  }
  if (aZeroWidths) {
    ZeroTextboxIfNeededed("borderSliceLeftWidthMenulist");
    ZeroTextboxIfNeededed("borderSliceRightWidthMenulist");
    ZeroTextboxIfNeededed("borderSliceTopWidthMenulist");
    ZeroTextboxIfNeededed("borderSliceBottomWidthMenulist");
  }
  var leftWidth   = gDialog.borderSliceLeftWidthMenulist.value;
  var rightWidth  = gDialog.borderSliceRightWidthMenulist.value;
  var topWidth    = gDialog.borderSliceTopWidthMenulist.value;
  var bottomWidth = gDialog.borderSliceBottomWidthMenulist.value;

  var repeatHoriz = gDialog.horizontalBorderImageRepeatMenulist.value;
  var repeatVert  = gDialog.VerticalBorderImageRepeatMenulist.value;

  str = "url('" + url + "') " +
        topOffset + " " + rightOffset + " " + bottomOffset + " " + leftOffset +
        (topWidth ? " / " + topWidth + " " + rightWidth + " " + bottomWidth + " " + leftWidth : "") +
        " " + gDialog.horizontalBorderImageRepeatMenulist.value + " " +
        gDialog.VerticalBorderImageRepeatMenulist.value;
  ApplyStyles( [
                 {
                  property: "-moz-border-image",
                  value: str
                 }
               ]);
}

