function ToggleProperty(aElt)
{
  var checked   = aElt.hasAttribute("checked");
  var value = (aElt.hasAttribute("value") ? aElt.getAttribute("value") : aElt.value);
  if (!checked &&
      (aElt.nodeName.toLowerCase() == "checkbox" || aElt.getAttribute("type") == "checkbox"))
    value = "";
  var property  = aElt.getAttribute("property");
  var resetter  = aElt.getAttribute("resetter");
  var group     = aElt.getAttribute("group");
  var agregator = aElt.getAttribute("agregator");

  var others = [];
  if (agregator)
    others = document.querySelectorAll("[agregator='" + agregator + "']");
  else if (group)
    others = document.querySelectorAll("[group='" + group + "']");

  for (var i = 0; i < others.length; i++) {
    var e = others[i];
    if (e != aElt) {
      if (resetter == aElt.id
          || resetter == e.id
          || group) {
        e.removeAttribute("checked");
      }
      else {
        if (agregator && e.hasAttribute("checked"))
          value += " " + e.getAttribute("value");
      }
    }
  }
  ApplyStyles([ { property: property, value: value} ]);
}

function CheckToggle(aToggle, aChecked)
{
  if (aChecked)
    aToggle.setAttribute("checked", "true");
  else
    aToggle.removeAttribute("checked");
}

function PopulateLengths(aElt, aUnitsString)
{
  var menuseparator = aElt.querySelector("menuseparator");
  if (menuseparator) {
    var child = aElt.firstChild;
    while (child && child != menuseparator) {
      var tmp = child.nextSibling;
      aElt.removeChild(child);
      child = tmp;
    }
  }
  else
    deleteAllChildren(aElt);

  var v = parseFloat(aElt.parentNode.value);
  if (isNaN(v))
    v = 0;
  var unitsArray;
  if (aUnitsString == " ")
    unitsArray = [""];
  else
    unitsArray = aUnitsString.split(" ");
  unitsArray.forEach(function(aArrayElt, aIndex, aArray) {
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", v + aArrayElt);
    menuitem.setAttribute("value", v + aArrayElt);
    aElt.insertBefore(menuitem, menuseparator);
  });
}

function ApplyPropertyFromMenulist(aElt)
{
  var value;
  if (aElt.selectedItem)
    value = aElt.selectedItem.value;
  else
    value = aElt.value;

  var toApply = [
                  {
                    property: aElt.getAttribute("property"),
                    value: value
                  }
                ];
  if (aElt.hasAttribute("fouredges") && aElt.hasAttribute("fouredgescontrol")) {
    if (document.getElementById(aElt.getAttribute("fouredgescontrol")).checked) {
      var edgesArray = aElt.getAttribute("fouredges").split(",");
      for (var i = 0; i < edgesArray.length; i++)
        toApply.push({
                       property: edgesArray[i],
                       value: value
                     } );
    }
  }
  ApplyStyles(toApply);
}

function IncreaseLength(aElt, aUnitsString, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v += 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "rem":
      case "ch":
      case "ex":
        v += 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v += 1;
        break;
    }
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', false, aCallback);
  }
}

function DecreaseLength(aElt, aUnitsString, aAllowNegative, aCallback)
{
  var value;
  var menulist = aElt.previousSibling;
  if (menulist.selectedItem)
    value = menulist.selectedItem.value;
  else
    value = menulist.value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (match) {
    var unit = match[2];
    var v    = parseFloat(match[1]);
    switch (unit) {
      case "in":
      case "cm":
        v -= 0.1;
        v = Math.round( v * 10) / 10;
        break;
      case "em":
      case "ex":
        v -= 0.5;
        v = Math.round( v * 10) / 10;
        break;
      default:
        v -= 1;
        break;
    }
    if (!aAllowNegative && v < 0)
      v = 0;
    menulist.value = v + (unit ? unit : "");
    onLengthMenulistCommand(menulist, aUnitsString, '', aAllowNegative, aCallback);
  }
}

function InitLocalFontFaceMenu(menuPopup)
{
  // fill in the menu only once...
  var callingId = menuPopup.parentNode.id;

  if(!BlueGriffonVars.fontMenuOk)
    BlueGriffonVars.fontMenuOk = {};
  if (BlueGriffonVars.fontMenuOk[callingId])
    return;
  BlueGriffonVars.fontMenuOk[callingId ] = callingId ;

  if (!BlueGriffonVars.localFonts)
  {
    // Build list of all local fonts once per editor
    try 
    {
      var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                                 .getService(Components.interfaces.nsIFontEnumerator);
      var localFontCount = { value: 0 }
      BlueGriffonVars.localFonts = enumerator.EnumerateAllFonts(localFontCount);
    }
    catch(e) { }
  }
  
  for (var i = 0; i < BlueGriffonVars.localFonts.length; ++i)
  {
    if (BlueGriffonVars.localFonts[i] != "")
    {
      var itemNode = document.createElementNS(BlueGriffonVars.kXUL_NS, "menuitem");
      itemNode.setAttribute("label", BlueGriffonVars.localFonts[i]);
      itemNode.setAttribute("value", BlueGriffonVars.localFonts[i]);
      itemNode.setAttribute("style", "font-family: " + BlueGriffonVars.localFonts[i]);
      menuPopup.appendChild(itemNode);
    }
  }
}

function SetColor(aElt)
{
  var color = aElt.color;
  var toApply = [
                  {
                    property: aElt.getAttribute("property"),
                    value: color
                  }
                ];
  if (aElt.hasAttribute("fouredges") && aElt.hasAttribute("fouredgescontrol")) {
    if (document.getElementById(aElt.getAttribute("fouredgescontrol")).checked) {
      var edgesArray = aElt.getAttribute("fouredges").split(",");
      for (var i = 0; i < edgesArray.length; i++)
        toApply.push({
                       property: edgesArray[i],
                       value: color
                     } );
    }
  }
  ApplyStyles(toApply);
}

function CloseAllSection(aAlsoCloseOriginalTarget)
{
  var h = document.popupNode;
  while (h && !h.classList.contains("csspropertiesHeader"))
    h = h.parentNode;
  if (!h) return; // sanity check...

  var headers = document.querySelectorAll(".csspropertiesHeader");
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if ((aAlsoCloseOriginalTarget || header != h) &&
        header.hasAttribute("open"))
      ToggleSection(null, header);
  }
}

