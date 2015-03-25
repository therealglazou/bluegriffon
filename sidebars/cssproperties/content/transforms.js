RegisterIniter(TransformsSectionIniter);

function TransformsSectionIniter(aElt, aRuleset)
{
  var mto = CssInspector.getCascadedValue(aRuleset, "-moz-transform-origin");
  var mtoArray = mto.split(" ");
  switch (mtoArray.length) {
    case 1:
      gDialog.transformOriginXMenulist.value = mtoArray[0];
      gDialog.transformOriginYMenulist.value = "";
      break;
    case 2:
      gDialog.transformOriginXMenulist.value = mtoArray[0];
      gDialog.transformOriginYMenulist.value = mtoArray[1];
      break;
    case 3:
      gDialog.transformOriginXMenulist.value = mtoArray[0];
      gDialog.transformOriginYMenulist.value = mtoArray[1];
      gDialog.transformOriginZMenulist.value = mtoArray[2];
      break;
    default:
      gDialog.transformOriginXMenulist.value = "";
      gDialog.transformOriginYMenulist.value = "";
      gDialog.transformOriginZMenulist.value = "";
      break;
  }

  var mpo = CssInspector.getCascadedValue(aRuleset, "-moz-perspective-origin");
  var mpoArray = mto.split(" ");
  switch (mpoArray.length) {
    case 1:
      gDialog.perspectiveOriginXMenulist.value = mpoArray[0];
      gDialog.perspectiveOriginYMenulist.value = "";
      break;
    case 2:
      gDialog.perspectiveOriginXMenulist.value = mpoArray[0];
      gDialog.perspectiveOriginYMenulist.value = mpoArray[1];
      break;
    default:
      gDialog.perspectiveOriginXMenulist.value = "";
      gDialog.perspectiveOriginYMenulist.value = "";
      break;
  }

  var mts = CssInspector.getCascadedValue(aRuleset, "-moz-transform-style");
  CheckToggle(gDialog.transformStyleFlatButton, mts == "flat");
  CheckToggle(gDialog.transformStyle3DButton,   mts == "preserve-3d");

  var mbv = CssInspector.getCascadedValue(aRuleset, "-moz-backface-visibility");
  CheckToggle(gDialog.backfaceVisibilityVisibleButton, mbv == "visible");
  CheckToggle(gDialog.backfaceVisibilityHiddenButton,  mbv == "hidden");

  deleteAllChildren(gDialog.transformsRichlistbox);
  var mt = CssInspector.getCascadedValue(aRuleset, "-moz-transform");
  var transformsArray = [];
  if (mt) {
   var mtArray = mt.split(")");
   for (var i = 0; i < mtArray.length; i++) {
    var transformation = mtArray[i].trim();
    var parsed = transformation.match(/([a-z0-9]*)\((.*)/i);
    if (parsed) {
      var t = parsed[1];
      var values = parsed[2];
      var valuesArray = values.split(",");
      valuesArray = valuesArray.map(function(s){return s.trim();})
      transformsArray.push( {
                              transformation: t,
                              values: valuesArray
                            });
    }
   }
  }

  for (var i = 0; i < transformsArray.length; i++) {
    var t = transformsArray[i];
    var item = document.createElement("richlistitem");
    switch (t.transformation.toLowerCase()) {
      case "perspective":
        item.className = "perspectiveTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.depth = t.values[0];
        break;
      case "rotate":
        item.className = "rotateTransform";
        if (i >= gDialog.transformsRichlistbox.itemCount)
          gDialog.transformsRichlistbox.appendChild(item);
        else if (gDialog.transformsRichlistbox.getItemAtIndex(i).className != "rotateTransform")
          gDialog.transformsRichlistbox.replaceChild(gDialog.transformsRichlistbox.getItemAtIndex(i), item);
        else
          item = gDialog.transformsRichlistbox.getItemAtIndex(i);
        item.value = parseFloat(t.values[0]);
        break;
      case "translate":
        item.className = "translate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = t.values[0];
        if (t.values.length > 1)
          item.vertically = t.values[1];
        else
          item.vertically = "";
        item.zindexally = "";
        break;
      case "translate3d":
        item.className = "translate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = t.values[0];
        item.vertically = t.values[1];
        item.zindexally = t.values[2];
        break;
      case "translatex":
        item.className = "translate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = t.values[0];
        item.vertically = "";
        item.zindexally = "";
        break;
      case "translatey":
        item.className = "translate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = "";
        item.vertically = t.values[0];
        item.zindexally = "";
        break;
      case "translatez":
        item.className = "translate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = "";
        item.vertically = "";
        item.zindexally = t.values[0];
        break;
      case "skew":
        item.className = "skewTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.valueX = parseFloat(t.values[0]);
        item.valueY = parseFloat(t.values[1]);
        break;
      case "skewx":
        item.className = "skewTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.valueX = parseFloat(t.values[0]);
        item.valueY = "";
        break;
      case "skewy":
        item.className = "skewTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.valueX = "";
        item.valueY = parseFloat(t.values[0]);
        break;
      case "scale":
        item.className = "scale3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = parseFloat(t.values[0]);
        if (t.values.length > 1)
          item.vertically = parseFloat(t.values[1]);
        else
          item.vertically = item.horizontally;
        item.zindexally = "";
        break;
      case "scalex":
        item.className = "scale3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = parseFloat(t.values[0]);
        item.vertically = "";
        item.zindexally = "";
        break;
      case "scaley":
        item.className = "scale3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = "";
        item.vertically = parseFloat(t.values[0]);
        item.zindexally = "";
        break;
      case "scalez":
        item.className = "scale3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = "";
        item.vertically = "";
        item.zindexally = parseFloat(t.values[0]);
        break;
      case "scale3d":
        item.className = "scale3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.horizontally = parseFloat(t.values[0]);
        item.vertically   = parseFloat(t.values[1]);
        item.zindexally   = parseFloat(t.values[2]);
        break;
      case "rotatex":
        item.className = "rotate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.setValues(1, 0, 0);
        item.angle = parseFloat(t.values[0]);
        break;
      case "rotatey":
        item.className = "rotate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.setValues(0, 1, 0);
        item.angle = parseFloat(t.values[0]);
        break;
      case "rotatez":
        item.className = "rotate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.setValues(0, 0, 1);
        item.angle = parseFloat(t.values[0]);
        break;
      case "rotate3d":
        item.className = "rotate3dTransform";
        gDialog.transformsRichlistbox.appendChild(item);
        item.setValues(parseFloat(t.values[0]), parseFloat(t.values[1]), parseFloat(t.values[2]));
        item.angle = parseFloat(t.values[3]);
        break;
      default: break;
    }
  }
}

function OnTransformSelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeTransformButton, (item != null));    
}

function AddTransform(aEvent)
{
  var type = aEvent.originalTarget.value;
  var item = document.createElement("richlistitem");
  item.className = type + "Transform";
  gDialog.transformsRichlistbox.appendChild(item);
}

function DeleteTransform()
{
  var item = gDialog.transformsRichlistbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  SetEnabledElement(gDialog.removeTransformButton, (gDialog.transformsRichlistbox.itemCount != 0));
  ReapplyTransforms();
}

function ReapplyTransforms()
{
  var items = gDialog.transformsRichlistbox.querySelectorAll("richlistitem");
  var transforms = [];
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + '% px pt cm in mm pc em ex rem ch'.replace( / /g, "|") + ")*", "");
  var r2 = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + 'px pt cm in mm pc em ex rem ch'.replace( / /g, "|") + ")*", "");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    switch (item.className) {
      case "rotateTransform":
        transforms.push( "rotate(" + item.value + "deg)");
        break;
      case "translate3dTransform":
        {
          var h = (item.horizontally != "") ? item.horizontally : "0px";
          var v = (item.vertically != "") ? item.vertically : "0px";
          var z = (item.zindexally != "") ? item.zindexally : "0px";
          var mH, mV, mZ;
          if (h) {
            mH = h.match(r);
            if (!mH || !mH[2])
              return;
          }
          if (v) {
            mV = v.match(r);
            if (!mV || !mV[2])
              return;
          }
          if (z) {
            mZ = z.match(r2);
            if (!mZ || !mZ[2])
              return;
          }
          if (mV[1] == "0" && mZ[1] == "0")
            transforms.push("translateX(" + h + ")");
          else if (mH[1] == "0" && mZ[1] == "0")
            transforms.push("translateY(" + v + ")");
          else if (mH[1] == "0" && mV[1] == "0")
            transforms.push("translateZ(" + z + ")");
          else if (mZ[1] == "0")
            transforms.push("translate(" + h + ", " + v + ")");
          else
            transforms.push("translate3d(" + h + ", " + v + ", " + z + ")");
        }
        break;
      case "skewTransform":
        {
          var x = item.valueX;
          var y = item.valueY;
          if (!x && !y) {
            item.getChild('rotatorX').disabled = false;
            item.getChild('rotatorY').disabled = false;
            return;
          }
          // skew() removed from CSS Transformations !
          /*if (x && y && parseFloat(x) && parseFloat(y))
            transforms.push("skew(" + x + "deg, " + y + "deg)");*/
          if (x && parseFloat(x)) {
            transforms.push("skewX(" + x + "deg)");
            item.getChild('rotatorY').disabled = true;
          }
          else if (y && parseFloat(y)) {
            transforms.push("skewY(" + y + "deg)");
            item.getChild('rotatorX').disabled = true;
          }
          else {
            item.getChild('rotatorX').disabled = false;
            item.getChild('rotatorY').disabled = false;
          }
        }
        break;
      case "scale3dTransform":
        {
          var h = item.horizontally;
          var v = item.vertically;
          var z = item.zindexally;
          if (!h && !v && !z)
            return;
          if (h && v && z && parseFloat(h) && parseFloat(v) && parseFloat(z)) {
            transforms.push("scale3d(" + h + ", " + v + ", " + z + ")");
            h = ""; v = ""; z = "";
          }
          if (h && v && (h == v) && parseFloat(h)) {
            transforms.push("scale(" + h +  ")");
            h = ""; v = "";
          }
          if (h && v && parseFloat(h) && parseFloat(v)) {
            transforms.push("scale(" + h + ", " + v + ")");
            h = ""; v = "";
          }
          if (h && parseFloat(h)) {
            transforms.push("scaleX(" + h + ")");
          }
          if (v && parseFloat(v)) {
            transforms.push("scaleY(" + v + ")");
          }
          if (z && parseFloat(z)) {
            transforms.push("scaleZ(" + z + ")");
          }
        }
        break;
      case "perspectiveTransform":
        {
          var depth = item.depth;
          if (depth) {
            mDepth = depth.match(r2);
            if (!mDepth || !mDepth[2] ||!parseFloat(mDepth[1]))
              return;
            transforms.push("perspective(" + depth + ")");
          }
        }
        break;
      case "rotate3dTransform":
        {
          var x = item.getChild("Xvalue").value;
          var y = item.getChild("Yvalue").value;
          var z = item.getChild("Zvalue").value;
          if (x != ""
              && y != "" 
              && z != "") {
            var x = parseFloat(x);
            var y = parseFloat(y);
            var z = parseFloat(z);
            if (x || y || z) {
              // normalize
              x = x / Math.sqrt(x*x + y*y +z*z);
              y = y / Math.sqrt(x*x + y*y +z*z);
              z = z / Math.sqrt(x*x + y*y +z*z);
              var angle = parseFloat(item.angle);
              if (!x && !y)
                transforms.push( "rotateZ(" + (( z > 0 ) ? angle : -angle) + "deg)");
              else if (!x && !z)
                transforms.push( "rotateY(" + (( y > 0 ) ? angle : -angle) + "deg)");
              else if (!z && !y)
                transforms.push( "rotateX(" + (( x > 0 ) ? angle : -angle) + "deg)");
              else
                transforms.push( "rotate3d("
                                 + x + ", "
                                 + y + ", "
                                 + z + ", "
                                 + angle + "deg)");
            }
          }
        }
        break;
      default: break;
    }
  }
  ApplyStyles([
                {
                  property: "-moz-transform",
                  value: transforms.join(" ")
                },
                {
                  property: "-moz-perspective",
                  value: gDialog.perspectiveMenulist.value
                },
                {
                  property: "-moz-transform-origin",
                  value: (gDialog.transformOriginXMenulist.value
                          + " "
                          + gDialog.transformOriginYMenulist.value
                          + " "
                          + gDialog.transformOriginZMenulist.value).trim()
                },
                {
                  property: "-moz-perspective-origin",
                  value: (gDialog.perspectiveOriginXMenulist.value
                          + " "
                          + gDialog.perspectiveOriginYMenulist.value).trim()
                }
              ]);
}




