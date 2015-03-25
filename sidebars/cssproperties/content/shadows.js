RegisterIniter(ShadowsSectionIniter);

function ShadowsSectionIniter(aElt, aRuleset)
{
  deleteAllChildren(gDialog.textShadowRichlistbox);
  var ts = CssInspector.getCascadedValue(aRuleset, "text-shadow");
  var shadows = CssInspector.parseTextShadows(ts);
  for (var i = 0; i < shadows.length; i++) {
    var s = shadows[i];
    var item = document.createElement("richlistitem");
    item.className = s.none ? "noneTextShadow" : "shadowTextShadow";
    gDialog.textShadowRichlistbox.appendChild(item);
    if (!s.none) {
      item.color = s.color;
      item.offsetX = s.offsetX;
      item.offsetY = s.offsetY;
      item.blurRadius = s.blurRadius;
    }
  }

  deleteAllChildren(gDialog.boxShadowRichlistbox);
  var bs = CssInspector.getCascadedValue(aRuleset, "box-shadow");
  var shadows = CssInspector.parseBoxShadows(bs);
  for (var i = 0; i < shadows.length; i++) {
    var s = shadows[i];
    var item = document.createElement("richlistitem");
    item.className = s.none ? "noneBoxShadow" : "shadowBoxShadow";
    gDialog.boxShadowRichlistbox.appendChild(item);
    if (!s.none) {
      item.inset = s.inset;
      item.color = s.color;
      item.offsetX = s.offsetX;
      item.offsetY = s.offsetY;
      item.blurRadius = s.blurRadius;
      item.spreadRadius = s.spreadRadius;
    }
  }
  UpdateBoxShadowUI();
  UpdateTextShadowUI();
}

function OnTextShadowSelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeTextShadowButton, (item != null));    
}

function AddTextShadow(aEvent)
{
  var type = aEvent.originalTarget.value;
  var item = document.createElement("richlistitem");
  item.className = type + "TextShadow";
  gDialog.textShadowRichlistbox.appendChild(item);
  UpdateTextShadowUI();
  if (type == "none")
    ReapplyTextShadows();
}

function DeleteTextShadow()
{
  var item = gDialog.textShadowRichlistbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  UpdateTextShadowUI();
  ReapplyTextShadows();
}

function ReapplyTextShadows()
{
  var items = gDialog.textShadowRichlistbox.querySelectorAll("richlistitem");
  var shadows = [];
  const r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + '% px pt cm in mm pc em ex rem ch'.replace( / /g, "|") + ")*", "");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var s;
    if (item.className == "shadowTextShadow") {
      if (item.offsetX != "" && item.offsetY != "") {
        var mX = item.offsetX.match(r);
        var mY = item.offsetY.match(r);
        if (!mX || !mY || !mX[2] || !mY[2])
          return;
      }
      else
        return;
      var mBlurRadius   = item.blurRadius.match(r);
      if (!mBlurRadius || !mBlurRadius[2])
        return;
      s = item.color + " " + item.offsetX + " " + item.offsetY + " " + item.blurRadius;
    }
    else
      s = "none";
    shadows.push(s);
  }
  ApplyStyles([{
                 property: "text-shadow",
                 value: shadows.join(",")
               }])
}

function UpdateTextShadowUI()
{
  var isEmpty = (gDialog.textShadowRichlistbox.itemCount == 0);
  var isNone = !isEmpty &&
                    (gDialog.textShadowRichlistbox.getItemAtIndex(0).className == "noneTextShadow");
  SetEnabledElement(gDialog.addTextShadowButton, !isNone);
  SetEnabledElement(gDialog.removeTextShadowButton, false);
  
  SetEnabledElement(gDialog.shadowTextShadowMenuitem, isEmpty || !isNone);
  SetEnabledElement(gDialog.noneTextShadowMenuitem, isEmpty);
}

function OnBoxShadowSelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeBoxShadowButton, (item != null));    
}

function AddBoxShadow(aEvent)
{
  var type = aEvent.originalTarget.value;
  var item = document.createElement("richlistitem");
  item.className = type + "BoxShadow";
  gDialog.boxShadowRichlistbox.appendChild(item);
  UpdateBoxShadowUI();
  if (type == "none")
    ReapplyBoxShadows();
}

function DeleteBoxShadow()
{
  var item = gDialog.boxShadowRichlistbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  UpdateBoxShadowUI();
  ReapplyBoxShadows();
}

function ReapplyBoxShadows()
{
  var items = gDialog.boxShadowRichlistbox.querySelectorAll("richlistitem");
  var shadows = [];
  const r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + '% px pt cm in mm pc em ex rem ch'.replace( / /g, "|") + ")*", "");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var s;
    if (item.className == "shadowBoxShadow") {
      if (item.offsetX != "" && item.offsetY != "") {
        var mX = item.offsetX.match(r);
        var mY = item.offsetY.match(r);
        if (!mX || !mY || !mX[2] || !mY[2])
          return;
      }
      else
        return;
      s = (item.inset ? "inset " : "");
      var mBlurRadius   = item.blurRadius.match(r);
      var mSpreadRadius = item.spreadRadius.match(r);
      if (!mBlurRadius || !mSpreadRadius || !mBlurRadius[2] || !mSpreadRadius[2])
        return;
      s += item.offsetX + " " + item.offsetY + " " + item.blurRadius + " " +
           item.spreadRadius + " " + item.color;
    }
    else
     s = "none";
    shadows.push(s);
  }
  ApplyStyles([{
                 property: "box-shadow",
                 value: shadows.join(",")
               }])
}

function UpdateBoxShadowUI()
{
  var isEmpty = (gDialog.boxShadowRichlistbox.itemCount == 0);
  var isNone = !isEmpty &&
                    (gDialog.boxShadowRichlistbox.getItemAtIndex(0).className == "noneBoxShadow");
  SetEnabledElement(gDialog.addBoxShadowButton, !isNone);
  SetEnabledElement(gDialog.removeBoxShadowButton, false);
  
  SetEnabledElement(gDialog.shadowBoxShadowMenuitem, isEmpty || !isNone);
  SetEnabledElement(gDialog.noneBoxShadowMenuitem, isEmpty);
}
