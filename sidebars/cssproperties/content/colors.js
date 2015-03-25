RegisterIniter(ColorsSectionIniter);

function ColorsSectionIniter(aElt, aRuleset)
{
  deleteAllChildren(gDialog.backgroundsRichlistbox);
  var color = CssInspector.getCascadedValue(aRuleset, "color");
  gDialog.colorColorpicker.color = color;

  var bgColor = CssInspector.getCascadedValue(aRuleset, "background-color");
  gDialog.bgColorColorpicker.color = bgColor;

  var bgImages = CssInspector.getCascadedValue(aRuleset, "background-image");
  var parsedImages = CssInspector.parseBackgroundImages(bgImages);
  var bgAttachment = CssInspector.getCascadedValue(aRuleset, "background-attachment").split(",");
  var bgRepeat     = CssInspector.getCascadedValue(aRuleset, "background-repeat").split(",");
  var bgPosition   = CssInspector.getCascadedValue(aRuleset, "background-position").split(",");
  var bgSize       = CssInspector.getCascadedValue(aRuleset, "background-size").split(",");
  var bgClip       = CssInspector.getCascadedValue(aRuleset, "background-clip").split(",");
  var bgOrigin     = CssInspector.getCascadedValue(aRuleset, "background-origin").split(",");
  if (bgImages != "none") {
    for (var i = 0; i < parsedImages.length; i++) {
      var item = document.createElement("richlistitem");
      item.className = "backgrounditem";
      var type = parsedImages[i].type;
      item.setAttribute("type", type);
      gDialog.backgroundsRichlistbox.appendChild(item);
  
      item.reset();
      var button = item.getChild("backgrounditemButton");
      item.parsedValue = parsedImages[i].value;
      switch (type) {
        case "image":
          // pfff, find the real URL...
          var match = item.parsedValue.match ( /^url\(\s*"([^"]*)"\s*\)|^url\(\s*'([^']*)'\s*\)|^url\(\s*([^\)]*)\s*\)/ );
          if (match) {
            if (match[1]) item.setAttribute("image", match[1]);
            else if (match[2]) item.setAttribute("image", match[2]);
            else if (match[3]) item.setAttribute("image", match[3]);
          }
          button.style.backgroundImage = "url('" + UrlUtils.makeAbsoluteUrl(item.getAttribute("image")) + "')";
          break;
        default:
          button.style.backgroundImage =
            CssInspector.serializeGradient(item.parsedValue);
          break;
      }
      item.getChild("backgrounditem-attachment").value =
        (i < bgAttachment.length ? bgAttachment[i].trim() : "");
      item.getChild("backgrounditem-position").value =
        (i < bgPosition.length ? bgPosition[i].trim() : "");
      item.getChild("backgrounditem-size").value =
        (i < bgSize.length ? bgSize[i].trim() : "");
      item.getChild("backgrounditem-clip").value =
        (i < bgClip.length ? bgClip[i].trim() : "");
      item.getChild("backgrounditem-origin").value =
        (i < bgOrigin.length ? bgOrigin[i].trim() : "");

      var itemx = item.getChild("backgrounditem-repeatx");
      var itemy = item.getChild("backgrounditem-repeaty");
      itemx.value = "";
      itemy.value = "";
      if (i < bgRepeat.length) {
        var v = bgRepeat[i].trim().toLowerCase();
        switch (v) {
          case "repeat-x":
            itemx.value = "repeat";
            itemy.value = "no-repeat";
            break;
          case "repeat-y":
            itemx.value = "no-repeat";
            itemy.value = "repeat";
            break;
          case "repeat":
          case "space":
          case "round":
          case "no-repeat":
            itemx.value = v;
            itemy.value = v;
            break;
          default:
            {
              var vArray = v.split(" ");
              if (vArray.length == 2) {
                itemx.value = vArray[0];
                itemy.value = vArray[1];
              }
            }
            break;
        }
      }
    }
  }
}

function AddBackground(aEvent)
{
  var type = aEvent.originalTarget.value;
  var item = document.createElement("richlistitem");
  item.className = "backgrounditem";
  item.setAttribute("type", type);
  gDialog.backgroundsRichlistbox.appendChild(item);
  item.reset();
  item.openEditor();
}

function OnBackgroundSelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeBackgroundButton, (item != null));    
}

function DeleteBackground()
{
  var item = gDialog.backgroundsRichlistbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  SetEnabledElement(gDialog.removeBackgroundButton, (gDialog.backgroundsRichlistbox.itemCount != 0));
  ReapplyBackgrounds();
}

function LoadImage()
{
  gDialog.previewBackgroundImage.style.backgroundImage =
    'url("' + UrlUtils.makeAbsoluteUrl(gDialog.imageURLTextbox.inputField.value) + '")';
}

function BackgroundImageSelected()
{
  gDialog.backgroundImagePanel.hidePopup();
  var item = gDialog.backgroundsRichlistbox.selectedItem;
  item.applyBackgroundImage(gDialog.imageURLTextbox.value);
}

function ReapplyBackgrounds()
{
  var items = gDialog.backgroundsRichlistbox.querySelectorAll("richlistitem");
  var bgColor = "", bgImages = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    bgImages.push(item.serializedValue);
  }
  ApplyStyles([
                {
                  property: "background-image",
                  value: bgImages.join(", ")
                }
              ]);
  SelectionChanged(null, gCurrentElement, true);
}

function RepaintGradient()
{

  var type = gDialog.shapeAndSizeTab.hidden
             ? (gDialog.repeatingGradientCheckbox.checked ? "repeating-linear-gradient(" : "linear-gradient(")
             : (gDialog.repeatingGradientCheckbox.checked ? "repeating-radial-gradient(" : "radial-gradient(");
  var str = "";
  if (type == "linear-gradient(" || type == "repeating-linear-gradient(") {
    var angle =    gDialog.linearGradientAngleCheckbox.checked
                     ? gDialog.linearGradientAngleRotator.value + "deg"
                     : "";
    var position = gDialog.linearGradientDirectionCheckbox.checked
                     ? gDialog.linearGradientDirectionMenulist.value
                     : "";
    str = type
          + (angle ? angle + "," : "")
          + (position ? "to " + position + "," : "")
  }
  else {
    var shape = gDialog.radialShapeCheckbox.checked
                  ? gDialog.radialGradientShape.value
                  : "";
    var extent = gDialog.radialSizeCheckbox.checked
                   ? gDialog.radialGradientSize.value
                   : "";
    var lengths = gDialog.radialEllipseRayCheckbox.checked
                    ? ((shape == "circle")
                         ? gDialog.radialEllipseXRayMenulist.value
                         : gDialog.radialEllipseXRayMenulist.value + " " + gDialog.radialEllipseYRayMenulist.value)
                    : "";
    var position = gDialog.radialPositionCheckbox.checked
                     ? gDialog.radialPositionMenulist.value
                     : "";
    str = type +
         (shape ? shape + " " : "") +
         (extent ? extent + " " : "") +
         (lengths ? lengths + " " : "") +
         (position ? "at " + position : "") +
         (shape || extent || lengths || position ? ", " : "");
  }

  var stops = gDialog.colorStopsRichlistbox.querySelectorAll("richlistitem.colorstopitem");
  for (var i = 0; i < stops.length; i++) {
    if (i)
      str += ", ";
    var s = stops[i];
    str += s.color + (s.offset ? " " + s.offset : "");
  }
  str += ")";
  gDialog.linearGradientPreview.style.backgroundImage = str;
}

function SetLinearGradient()
{
  var gradient = gDialog.linearGradientPreview.style.backgroundImage;
  var item = gDialog.backgroundsRichlistbox.selectedItem;
  item.getChild("backgrounditemButton").style.backgroundImage = gradient;
  item.parsedValue = CssInspector.parseBackgroundImages(gradient)[0].value;
  gDialog.linearGradientPanel.hidePopup();
  ReapplyBackgrounds();
}

function UpdateColorStopsRichlistbox()
{
  var item = gDialog.colorStopsRichlistbox.selectedItem;
  if (gDialog.colorStopsRichlistbox.itemCount && item &&
      item.parentNode) {
    gDialog.removeColorStopButton.disabled = false;
    gDialog.upColorStopButton.disabled = !item.previousElementSibling;
    gDialog.downColorStopButton.disabled = !item.nextElementSibling;
  }
  else {
    gDialog.removeColorStopButton.disabled = true;
    gDialog.upColorStopButton.disabled = true;
    gDialog.downColorStopButton.disabled = true;
  }
  gDialog.linearGradientOkButton.disabled = (gDialog.colorStopsRichlistbox.itemCount < 2);
}

function AddColorStopToLinearGradient()
{
  var e = document.createElement("richlistitem");
  e.className = "colorstopitem";
  gDialog.colorStopsRichlistbox.appendChild(e);
  UpdateColorStopsRichlistbox();
  e.openEditor();
}

function DeleteColorStopFromLinearGradient()
{
  gDialog.colorStopsRichlistbox.removeChild(gDialog.colorStopsRichlistbox.selectedItem);
  UpdateColorStopsRichlistbox();
}

function FlushBackgroundProperties(aEvent)
{
  var target = aEvent.originalTarget;
  while (target && !target.hasAttribute("property"))
    target = target.parentNode; 
  var property = target.getAttribute("property");
  var valueArray = [];
  if (property == "background-repeat") {
    var anonid = target.getAttribute("anonid");
  
    var items = document.querySelectorAll("richlistitem.backgrounditem");
    for (var i = 0; i < items.length; i++) {
      var vx = items[i].getChild("backgrounditem-repeatx").value.trim().toLowerCase();
      var vy = items[i].getChild("backgrounditem-repeaty").value.trim().toLowerCase();
      var v = "";
      if ((!vx || vx == "repeat") && vy == "no-repeat")
        v = "repeat-x";
      else if ((!vy || vy == "repeat") && vx == "no-repeat")
        v = "repeat-y";
      else if (vx == vy)
        v = vx;
      else {
        vx = vx ? vx : "repeat";
        vy = vy ? vy : "repeat";
        v = vx + " " + vy;
        v = v.trim();
      }
      valueArray.push( v );
    }
  }
  else {
    var items = document.querySelectorAll("richlistitem.backgrounditem");
    for (var i = 0; i < items.length; i++) {
      var xulElt = items[i].getChild(anonid);
      valueArray.push( xulElt.value );
    }
  }
  
  // cleanup
  for (var i = valueArray.length - 1 ; i >=0; i++)
    if (valueArray[i] == "")
      valueArray.pop();
    else
      break;
  ApplyStyles([
                {
                  property: property,
                  value: valueArray.join(", ")
                }
              ]);
}

function ToggleRelativeOrAbsoluteBackgroundImage()
{
  if (gDialog.relativeBackgroundImageCheckbox.checked) {
    MakeRelativeUrlBackgroundImage();
  }
  else {
    MakeAbsoluteUrlBackgroundImage();
  }
}

function MakeRelativeUrlBackgroundImage()
{
  var spec = gDialog.imageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.imageURLTextbox.value = spec;
    gDialog.relativeBackgroundImageCheckbox.checked = true;
  }
}

function MakeAbsoluteUrlBackgroundImage()
{
  var spec = gDialog.imageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog.imageURLTextbox.value = spec;
    gDialog.relativeBackgroundImageCheckbox.checked = false;
  }
}

function LinearAngleSelected(aElt)
{
  if (aElt.checked) {
    gDialog.linearGradientDirectionCheckbox.checked = false;
  }
  RepaintGradient();
}

function LinearDirectionSelected(aElt)
{
  if (aElt.checked) {
    gDialog.linearGradientAngleCheckbox.checked = false;
  }
  RepaintGradient();
}

function RadialShapeSelected()
{
  if (gDialog.radialShapeCheckbox.checked) {
    switch (gDialog.radialGradientShape.value) {
    case "circle":
      gDialog.radialSecondRayHbox.setAttribute("style", "visibility: hidden");
      break;
    case "ellipse":
      gDialog.radialSecondRayHbox.removeAttribute("style");
      break;
    }
  }
  else {
    if (!gDialog.radialSizeCheckbox.checked && !gDialog.radialEllipseRayCheckbox.checked) {
      gDialog.radialSecondRayHbox.removeAttribute("hidden");
    }
  }
  RepaintGradient();
}

function RadialSizeSelected()
{
  if (gDialog.radialSizeCheckbox.checked)
    gDialog.radialEllipseRayCheckbox.checked = false;
  RepaintGradient();
}

function RadialEllipseRaySelected()
{
  if (gDialog.radialEllipseRayCheckbox.checked)
    gDialog.radialSizeCheckbox.checked = false;
  RepaintGradient();
}

function RadialPositionSelected()
{
  RepaintGradient();
}
