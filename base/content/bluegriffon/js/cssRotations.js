Components.utils.import("resource://app/modules/handlersManager.jsm");

var CSSRotationsHandler = {

  mRotated: null,
  mCurrentMatrix: null,

  mRotatedTop: 0,
  mRotatedLeft: 0,

  mRotating: false,
  mCenterX: 0,
  mCenterY: 0,

  mLayer: null,
  mRotatingHandle: null,
  mCenterHandle: null,

  mStartRotationX: 0,
  mStartRotationY: 0,

  kCENTER_SIZE: 5,

  addToHandlersManager: function()
  {
    window.removeEventListener("load", CSSRotationsHandler.addToHandlersManager, false);

    HandlersManager.addHandler("cssRotations",
                               CSSRotationsHandler,
                               "rotateButton",
                               document);
  },

  toggle: function(aElt)
  {
    var e = EditorUtils.getCurrentEditor();
    if (!e)
      return;
    e instanceof Components.interfaces.nsIHTMLObjectResizer;
    if (aElt.checked) {
      e.hideResizers();
      e.objectResizingEnabled = false;
      NotifierUtils.addNotifierCallback("selection", CSSRotationsHandler.install);
    }
    else {
      NotifierUtils.removeNotifierCallback("selection", CSSRotationsHandler.install);
      CSSRotationsHandler.hide();
      e.objectResizingEnabled = true;
    }
  },

  getElementPosition: function(aElt)
  {
    var x = 0, y = 0;
    while (aElt) {
      x += aElt.offsetLeft;
      y += aElt.offsetTop;
      aElt = aElt.offsetParent;
    }
    return {x: x, y: y};
  },

  hide: function()
  {
    var csr = CSSRotationsHandler;
    var layer = csr.mLayer;
    if (!layer) // sanity check
      return;

    csr.mRotatingHandle.removeEventListener("mousedown", csr.startRotating, false);
    csr.mRotatingHandle.removeEventListener("mousemove", csr.doRotating, false);
    csr.mRotatingHandle.removeEventListener("mouseup",   csr.endRotating, false);

    layer.parentNode.removeChild(layer);

    csr.mLayer = null;
    csr.mRotatingHandle = null;
    csr.mCenterHandle = null;
  },

  install: function(aArgs, aElt, aOneElementSelected)
  {
    var csr = CSSRotationsHandler;
    csr.hide();
  
    csr.mRotated = aElt;
    var doc = EditorUtils.getCurrentDocument();
    if (aElt == doc.body)
      return;

    var pos = csr.getElementPosition(aElt);
    var cs = aElt.ownerDocument.defaultView.getComputedStyle(aElt, "");

    var x = pos.x;
    var y = pos.y;
    csr.mRotatedTop = y;
    csr.mRotatedLeft = x;
    var w = cs.getPropertyValue("width");
    var h = cs.getPropertyValue("height");

    var px = cs.getPropertyValue("padding-left");
    var py = cs.getPropertyValue("padding-top");

    csr.mCurrentMatrix = cs.getPropertyValue("-moz-transform").replace( /none/g ,  "");
    var center = cs.getPropertyValue("-moz-transform-origin");

    var rv = csr.resolveTransformOrigin(center, parseFloat(w), parseFloat(h));
    csr.mCenterX = rv.x;
    csr.mCenterY = rv.y;

    csr.mLayer = doc.createElement("div");
    csr.mLayer.className = "_BlueGriffonHandle";
    csr.mLayer.style.position = "absolute";
    csr.mLayer.style.left = (x + parseFloat(px)) + "px";
    csr.mLayer.style.top = (y + parseFloat(py)) + "px";
    csr.mLayer.style.width = w;
    csr.mLayer.style.height = h;
    csr.mLayer.style.MozTransformOrigin = center;
    csr.mLayer.style.MozTransform = csr.mCurrentMatrix;
    csr.mLayer.style.MozUserSelect = "none";
    //csr.mLayer.style.backgroundImage = 'url("resource://gre/res/rotatorCenterBG.png")';
    csr.mLayer.style.backgroundPosition = "center center";
    csr.mLayer.style.backgroundRepeat = "repeat-x";
  
    doc.body.appendChild(csr.mLayer);
  
    var img = csr.mRotatingHandle = doc.createElement("img");
    img.className = "_BlueGriffonHandle";
    img.setAttribute("src", "resource://app/res/rotate_icon.png");
    img.style.position = "absolute";
    img.style.top = ( parseInt(h)/2 - 7) + "px";
    img.style.left = "100%";
    img.style.setProperty("cursor", "-moz-grab", "important");
    csr.mLayer.appendChild(img);

    csr.mLayer.style.zIndex = "2147483647";

    var centerElt = doc.createElement("span");
    centerElt.className = "_BlueGriffonHandle";
    centerElt.style.position = "absolute";
    centerElt.style.width = csr.kCENTER_SIZE + "px";
    centerElt.style.height = csr.kCENTER_SIZE + "px";
    centerElt.style.border = "thin solid black";
    centerElt.style.backgroundColor = "white";
    centerElt.style.top = (parseFloat(csr.mCenterY) - (csr.kCENTER_SIZE/2 +1)) + "px";
    centerElt.style.left = (parseFloat(csr.mCenterX) - (csr.kCENTER_SIZE/2 +1)) + "px";
    centerElt.style.setProperty("cursor", "-moz-grab", "important");
    csr.mCenterHandle = centerElt;
    csr.mLayer.appendChild(centerElt);

    img.addEventListener("mousedown", csr.startRotating, false);
    img.addEventListener("mousemove", csr.doRotating, false);
    img.addEventListener("mouseup", csr.endRotating, false);
  },

  resolveTransformOrigin: function(aOriginString, aW, aH)
  {
    var originArray = aOriginString.split(" ");
    var rv = {y: (aW/2) + "px", x: "0px" };
    for (var i = 0; i < originArray.length; i++) {
      var o = originArray[i].toLowerCase();
      if (o == "left") rv.x = 0;
      else if (o == "right") rv.x = aW + "px";
      else if (o == "center" && !i) rv.x = (aW/2) + "px";
      else if (o == "top") rv.y = 0;
      else if (o == "bottom") rv.y = aH + "px";
      else if (o == "center") rv.y = (aH/2) + "px";
      else if (o.indexOf("%") != -1) {
        var v = parseFloat(o) * (i ? aH : aW) / 100;
        if (i)
          rv.y = v + "px";
        else
          rv.x = v + "px";
      }
      else {
        if (i)
          rv.y = o;
        else
          rv.x = o;
      }
    }
    return rv;
  },

  startRotating: function(event)
  {
    var csr = CSSRotationsHandler;
    csr.mStartRotationX = event.clientX;
    csr.mStartRotationY = event.clientY;
    event.target.setCapture(true);
    csr.mRotating = true;
  },

  doRotating: function(event)
  {
    var csr = CSSRotationsHandler;
    if (!csr.mRotating)
      return
    var centerX = csr.mRotatedLeft + parseFloat(csr.mCenterX);
    var centerY = csr.mRotatedTop + parseFloat(csr.mCenterY);
    var x = event.clientX;
    var y = event.clientY;
    var angle;
    with (Math) {
      var t1 = {x: x - centerX, y: y - centerY };
      var t2 = {x: csr.mStartRotationX - centerX, y: csr.mStartRotationY - centerY };
      angle = (atan2(t1.y, t1.x) - atan2(t2.y, t2.x)) * 180 / PI;
      csr.mLayer.style.MozTransform = csr.mCurrentMatrix + " rotate(" + angle + "deg)"; 
      csr.mRotated.style.MozTransform = csr.mLayer
              .ownerDocument
              .defaultView
              .getComputedStyle(csr.mLayer, "")
              .getPropertyValue("-moz-transform")
              .replace( /none/g ,  "");
    }
   
  },

  endRotating: function(event)
  {
    var csr = CSSRotationsHandler;
    event.target.releaseCapture();
    csr.mRotating = false;
    csr.install(null, csr.mRotated, null);
  }
};

window.addEventListener("load", CSSRotationsHandler.addToHandlersManager, false);
