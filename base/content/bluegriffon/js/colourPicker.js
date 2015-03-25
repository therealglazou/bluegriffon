/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/Services.jsm");

var gColorObj = {};
var gWindowTitle = "";
var gShowTransparency = false;
var gLastColor = "";

var colours;
var satSlider = new objColour();
var hexChars = "0123456789ABCDEF";
var selectedColour = 0;
var mouseDown = false;
var eventInitiator = null;
var mouseX, mouseY, offsetLeft, offsetTop;

var gColor = "";
var LastPickedColor = "";
var ColorType = "Text";
var TextType = false;
var HighlightType = false;
var TableOrCell = false;
var LastPickedIsDefault = false;
var NoDefault = false;

var gMode = 0; // 0=colorpicker, 1=blender

var namedColorsArray = [
  { name:"aqua",     value:"#00ffff" },
  { name:"black",    value:"#000000" },
  { name:"blue",     value:"#0000ff" },
  { name:"fuchsia",  value:"#ff00ff" },
  { name:"gray",     value:"#808080" },
  { name:"green",    value:"#008000" },
  { name:"lime",     value:"#00ff00" },
  { name:"maroon",   value:"#800000" },
  { name:"navy",     value:"#000080" },
  { name:"olive",    value:"#808000" },
  { name:"orange",   value:"#FFA500" },    
  { name:"purple",   value:"#800080" },
  { name:"red",      value:"#ff0000" },
  { name:"silver",   value:"#c0c0c0" },
  { name:"teal",     value:"#008080" },
  { name:"white",    value:"#ffffff" },
  { name:"yellow",   value:"#ffff00" }
  ];

const kHEX_COLOR_MATCH_REGEXP = /#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/i;

function StartUp()
{
  GetUIElements();


  if (!window.arguments[0])
  {
    return;
  }

  document.documentElement.getButton("accept").setAttribute("disabled", "true");

  // window.arguments[0] is object to get initial values and return color data
  gColorObj = window.arguments[0];
  gWindowTitle  = window.arguments[1];
  gShowTransparency = window.arguments[2];

  gColorObj.cancelled = false;

  colours = new objColour();

  makeDraggable(gDialog.hueAndSaturationImg);
  makeDraggable(gDialog.hueAndSaturationCrosshair);
  makeDraggable(gDialog.brightnessImg);

  gDialog.hexColour.value = "";
  var tmpColor;
  var haveTableRadio = false;
  var showTransparencyCheckbox = false;

  if (!gShowTransparency)
    gDialog.transparencyCheckbox.setAttribute("hidden", true);

  gLastColor = gColorObj.currentColor;
  gColorObj.currentColor = ConvertRGBColorIntoHEXColor(gColorObj.currentColor);
  gColorObj.lastPickedColor = ConvertRGBColorIntoHEXColor(gColorObj.lastPickedColor);

  gDialog.LastPickedColor.setAttribute("style", "background-color: " +
                                       gColorObj.lastPickedColor.color);

  // Set initial color in input field and in the colorpicker
  SetCurrentColor(gColorObj.currentColor.color);
  gDialog.opacityScale.value = Math.floor(gColorObj.currentColor.opacity * 100);
  if (!showTransparencyCheckbox)
    gDialog.colorpicker.initColor(gColorObj.currentColor.color);

  // Caller can prevent user from submitting an empty, i.e., default color
  NoDefault = gColorObj.NoDefault;
  if (NoDefault)
  {
    // Hide the "Default button -- user must pick a color
    var defaultColorButton = document.getElementById("DefaultColorButton");
    if (defaultColorButton)
      defaultColorButton.collapsed = true;
  }

  // Set focus to colorpicker if not set to table radio buttons above
  if (!haveTableRadio)
    gDialog.colorpicker.focus();

  // SetWindowLocation();
  var colorBoxes = gDialog.colorBoxes;
  var colors = new Array('00','33','66','99','CC','FF');
  for (i = 5; i >= 0; i--) {
  	var hbox;
    for (j = 5; j >= 0; j--) {
      hbox = document.createElement("hbox");
      colorBoxes.appendChild(hbox);
    	for (k= 5; k >= 0; k--) {
        var box = document.createElement("box");
        box.className = "colorBox";
        box.style.backgroundColor = "#" + colors[i]+colors[j]+colors[k];
        box.setAttribute("color", "#" + colors[i]+colors[j]+colors[k]);
        box.setAttribute("tooltiptext", "#" + colors[i]+colors[j]+colors[k]);
        hbox.appendChild(box);
        box.addEventListener("click", onColorBoxClickedForBlending, false);
    	}
    }
    hbox.className = "lastColorBoxRow";
  }

  var color1 = "#FFFFFF";
  var color2 = "#000000";
  var stops = 1;
  try {
    color1 = Services.prefs.getCharPref("bluegriffon.blender.color1");
  }
  catch(e) {}
  try {
    color2 = Services.prefs.getCharPref("bluegriffon.blender.color2");
  }
  catch(e) {}
  try {
    stops = Services.prefs.getIntPref("bluegriffon.blender.stops");
  }
  catch(e) {}
  gDialog.colorBlenderTextbox1.value = color1;
  gDialog.colorBlenderTextbox1.setAttribute("color", color1);
  gDialog.colorBlenderPreviewBox1.style.backgroundColor = color1;
  gDialog.colorBlenderTextbox2.value = color2;
  gDialog.colorBlenderTextbox2.setAttribute("color", color2);
  gDialog.colorBlenderPreviewBox2.style.backgroundColor = color2;
  gDialog.colorBlenderStopsTextbox.value = stops;
  Blend();
}

// * utility function to convert predefined HTML4 color names
//   into their #rrggbb equivalent and back
function getHexColorFromColorName(color)
{
  color = color.toLowerCase();
  for (var i=0; i< namedColorsArray.length; i++) {
    if (color == namedColorsArray[i].name) {
      return namedColorsArray[i].value;
    }
  }
  return null;
}

function getColorNameFromHexColor(color)
{
  color = color.toLowerCase();
  for (var i=0; i< namedColorsArray.length; i++) {
    if (color == namedColorsArray[i].value) {
      return namedColorsArray[i].name;
    }
  }
  return null;
}

function makeDraggable(obj)
{
   obj.onmousedown = startDrag;
   obj.onmousemove = moveDrag;
   obj.onmouseup = endDrag;
}

function computeOffsets(t)
{
  offsetLeft = 0;
  offsetTop = 0;
  while (t && !(t instanceof XULElement))
  {
    offsetLeft += t.offsetLeft;
    offsetTop  += t.offsetTop;
    t = t.parentNode;
  }
}

function startDrag(e)
{
   mouseDown = true;

   var target = e.target;
   if (target.id == "hueAndSaturationCrosshair")
     target = target.parentNode;

   eventInitiator = target;
   computeOffsets(target);
   mouseX = e.clientX - offsetLeft + 1;
   mouseY = e.clientY - offsetTop + 1;

   handleValueChange(target);
   e.preventDefault();

}

function moveDrag(e)
{
   var target = e.target;
   if (target.id == "hueAndSaturationCrosshair")
     target = target.parentNode;

   if (mouseDown && target == eventInitiator)
   {
      computeOffsets(target);
      mouseX = e.clientX - offsetLeft  + 1;
      mouseY = e.clientY - offsetTop  + 1;

      mouseX = Math.max(0, Math.min(mouseX, 199));
      mouseY = Math.max(0, Math.min(mouseY, 199));

      handleValueChange(target);
   }
}

function endDrag(e)
{

   mouseDown = false;
   eventInitiator = null;
   handleValueChange(e.target);
   e.preventDefault();
}

function handleValueChange(obj)
{
   var sWidth = 200;

   if (obj.id == "brightnessImg")
   { 
         var bVal = mouseX * 255 / sWidth;
         var h = colours.getHue();
         var s = colours.getSaturation();
         colours.setHSB(h, s, bVal);
         redrawEverything();
   }
   else if (obj.id == "hueAndSaturationImg")
   {
         var hVal = mouseX * 360 / sWidth;
         var sVal = (200 - mouseY) * 100 / sWidth;
         var b = colours.getBrightness();
         if (!b)
           b = 1;
         colours.setHSB(hVal, sVal/100, b);
         redrawEverything();
   }
}

function checkRange(value, min, max)
{
  return Math.max(min, Math.min(value, max));
}

// the user has changed the RGB textboxes
function changeRGB()
{

   var red   = gDialog.red;
   var green = gDialog.green;
   var blue  = gDialog.blue;

   // XXX Check for numbers
   red.value   = checkRange(red.value, 0, 255);
   green.value = checkRange(green.value, 0, 255);
   blue.value  = checkRange(blue.value, 0, 255);

   colours.setRGB(red.value, green.value, blue.value);
   redrawEverything();
}

function changeHSB()
{
   var hue        = gDialog.hue;
   var saturation = gDialog.saturation;
   var brightness = gDialog.brightness;

   // XXX Check for letters
   brightness.value = checkRange(brightness.value, 0, 255);
   saturation.value = checkRange(saturation.value, 0, 100);

   var sat = saturation.value / 100;

   // Hue is a degree from 0-360
   // XXX Maybe rotate it back until it's 0-360
   hue.value = checkRange(hue.value, 0, 359);

   colours.setHSB(hue.value, sat, brightness.value);
   redrawEverything();
}

function SetCurrentColor(color)
{
  if (!color)
    color = "transparent";

  if (color == "transparent") {
    gDialog.opacityScale.value = "0";
  }
  else
  {
    var hexCol = getHexColorFromColorName(color);
    if (hexCol)
      color = hexCol;
    gDialog.hexColour.value = color;
    changeHex();
  }
  ToggleTransparency(gDialog.opacityScale);
}

function changeHex()
{
   var hex = gDialog.hexColour.value;

   // XXX Check to see if they are hex digits
   if (hex.length < 6)
   {
     alert("Color is not made of a hash ('#') followed by six hex digits");
     return;
   }

   colours.setHex(hex.toUpperCase().substr(1, hex.length-1));
   redrawEverything();
}


function redrawEverything()
{
  //gDialog.opacityScale.value = "100";
  ToggleTransparency(gDialog.opacityScale);
  
  LastPickedIsDefault = false;  
  
  redisplaySwatches();
  redisplayHexValue();
  redisplayRGBValues();
  redisplayHSBValues();
  
  redisplayColorName();
  redisplayBrightness();

  document.documentElement.getButton("accept").removeAttribute("disabled");
}

function redisplayBrightness()
{
   var sat = gDialog.brightnessImg;
   var h = colours.getHue();
   var s = colours.getSaturation();
   satSlider.setHSB(h, s, 255);
   sat.setAttribute("style",
     sat.getAttribute("style") + ";background-color: #" + satSlider.getHex());
}

function redisplaySaturation()
{
   var sat = gDialog.saturationImg;
   var h = colours.getHue();
   var b = colours.getBrightness();
   satSlider.setHSB(h, 1, b);
   sat.setAttribute("style",
     sat.getAttribute("style") + ";background-color: #" + satSlider.getHex());
}

function redisplaySwatches()
{
  gDialog.swatch.style.backgroundColor = "#" + colours.getHex();
}

function redisplayHexValue()
{
   gDialog.hexColour.value = "#" + colours.getHex();
}

function redisplayColorName()
{
   var color = getColorNameFromHexColor("#" + colours.getHex());
   if (color)
     gDialog.nameColour.value = color;
   else
     gDialog.nameColour.value = "";
}

function redisplayRGBValues()
{
   gDialog.red.value   = Math.round(colours.getRed());
   gDialog.green.value = Math.round(colours.getGreen());
   gDialog.blue.value  = Math.round(colours.getBlue());
}

function redisplayHSBValues()
{
  var h = Math.round(colours.getHue());
  var s = Math.round(colours.getSaturation() * 100);
  var b = Math.round(colours.getBrightness());

  gDialog.hue.value        = h;
  gDialog.saturation.value = s;
  gDialog.brightness.value = b;

  computeOffsets(gDialog.hueAndSaturationCrosshair.parentNode);

  var arrow = gDialog.brightnessArrow;
  arrow.setAttribute("style",
    arrow.getAttribute("style") + ";left: " + (b/255*200 + 2) + "px");

  var crosshair = gDialog.hueAndSaturationCrosshair;
  crosshair.setAttribute("style",
    crosshair.getAttribute("style") + ";left: " + (h/360*200 + 4) + "px"
                                    + ";top:  " + ((100-s)/100*200 +4) + "px");

}


// The object that stores the colours in ram
function objColour()
{

 this.r = 128;
 this.g = (128 + (Math.random() * 100));
 this.b = 128;

 // Returns the hex value
 this.getHex = function()
 {
   var v = Math.floor(this.r) * 256 * 256 +
           Math.floor(this.g) *256 +
           Math.floor(this.b);
   var c = Number(v).toString(16);
   while (c.length < 6)
     c = "0" + c;
   return c;
 }
 this.getRed = function()
 {
   return this.r;
 }
 this.getGreen = function()
 {
   return this.g;
 }
 this.getBlue = function()
 {
   return this.b;
 }
 this.getBrightness = function()
 {
   // find the min and max rgb values
   var max1 = Math.max(this.r, this.g);
   var max2 = Math.max(max1, this.b);
   return max2;
 }
 this.getSaturation = function()
 {
   // find the min and max rgb values
   var min1 = Math.min(this.r, this.g);
   var min2 = Math.min(min1, this.b);
   var max1 = Math.max(this.r, this.g);
   var max2 = Math.max(max1, this.b); // v

   var delta = max2 - min2;
   var sat = 0;
   if (max2 != 0)
   {
      sat = delta / max2;
   }
   return sat;
 }

 this.getHue = function()
 {
   var hue = 0;
   // If all the values are the same, there is no hue, just brightness
   if (this.r == this.g && this.g == this.b)
   {
      hue = 0;
      return hue;
   }

   // find the min and max rgb values
   var min1 = Math.min(this.r, this.g);
   var min2 = Math.min(min1, this.b);
   var max1 = Math.max(this.r, this.g);
   var max2 = Math.max(max1, this.b); // v

   var delta = max2 - min2;

   if (max2 == 0)
   {
      hue = 0;
      return hue; // Saturation is undefined, so there is no hue
   }

   if (this.r == max2)
   {
      hue = (this.g - this.b) / delta; // It's between yellow and magenta
   }
   else if (this.g == max2)
   {
      hue = 2 + (this.b - this.r) / delta; // It's between cyan and yellow
   }
   else
   {
      hue = 4 + (this.r - this.g) / delta; // It's between magenta and cyan
   }

   hue *= 60; // Get it in degrees
   if (hue < 0)
   {
      hue += 360;
   }
   if (!hue)
   {
      hue = 0;
   }
   return hue;
 }

 this.setRGB = function(r, g, b)
 {
    this.r = r;
    this.g = g;
    this.b = b;
 }

 this.setHSB = function(h, s, b)
 {

    if (s == 0)
    {
       // Set it to a grey based on the brightness
       this.r = b;
       this.g = b;
       this.b = b;
       return;
    }

    h /= 60; // Get it out of degrees

    var i = Math.floor(h);
    var f = h - i; // Grab the decimal part
    var p = b * (1 - s);
    var q = b * (1 - s * f);
    var t = b * (1 - s * (1 - f));

    switch (i)
    {
       case 0:
          this.r = b;
          this.g = t;
          this.b = p;
          break;
       case 1:
          this.r = q;
          this.g = b;
          this.b = p;
          break;
       case 2:
          this.r = p;
          this.g = b;
          this.b = t;
          break;
       case 3:
          this.r = p;
          this.g = q;
          this.b = b;
          break;
       case 4:
          this.r = t;
          this.g = p;
          this.b = b;
          break;
       default:
          this.r = b;
          this.g = p;
          this.b = q;
          break;
    }
 }

 this.setHex = function(hex)
 {
    var c = hex.split("");
    var red = hex2dec(c[0]) * 16 + hex2dec(c[1]);
    var green = hex2dec(c[2]) * 16 + hex2dec(c[3]);
    var blue = hex2dec(c[4]) * 16 + hex2dec(c[5]);
    this.r = red;
    this.g = green;
    this.b = blue;
 }
}


// Returns the decimal value of a hex character
function hex2dec(hex)
{
   return hexChars.indexOf(hex);
}

// return the hexidecimal value of a decimal digit from 1-16
function dec2hex(dec)
{
   return hexChars.charAt(dec);
}

function SelectColor()
{
  var color = gDialog.colorpicker.color;
  if (color)
  {
    colours.setHex(color.toUpperCase().substr(1, color.length-1));
    redrawEverything();
  }
}

function onAccept()
{
	switch (gMode) {
		case 0:
      if (gDialog.opacityScale.value == "0") {
        if (gShowTransparency)
          gColorObj.currentColor = "transparent";
        else
          gColorObj.currentColor = "rgba(0,0,0,0)"
      }
      else {
        if (gDialog.opacityScale.value == "100")
          gColorObj.currentColor = gDialog.hexColour.value;
        else {
          gColorObj.currentColor = "rgba(" + gDialog.red.value + "," +
                                             gDialog.green.value + "," +
                                             gDialog.blue.value + "," +
                                             parseInt(gDialog.opacityTextbox.value) / 100 + ")";
        }
      }
      gColorObj.lastPickedColor = gColorObj.currentColor;
      return true;

    case 1:
      {
      	var e = document.querySelector(".blendedColorPreviewBox[selected]");
        gColorObj.currentColor = e.style.backgroundColor;
        gColorObj.lastPickedColor = gColorObj.currentColor;
      }
	}
}

function ValidateData()
{
}

function onCancelColor()
{
  // Tells caller that user canceled
  gColorObj.currentColor = gLastColor;
  gColorObj.lastPickedColor = gLastColor;
  gColorObj.cancelled = true;
  //SaveWindowLocation();
  return true;
}

function IncreaseTextboxValue(id, maxValue)
{
  var e = document.getElementById(id);
  if (e)
  {
    var v = e.value;
    var newValue = Math.min(maxValue, Number(v) + 1);
    e.value = newValue;
    if (newValue != v)
      redrawEverythingAfterTexboxValueChanged(id);
  }
}

function DecreaseTextboxValue(id, minValue)
{
  var e = document.getElementById(id);
  if (e)
  {
    var v = e.value;
    var newValue = Math.max(minValue, Number(v) - 1);
    e.value = newValue;
    if (newValue != v)
      redrawEverythingAfterTexboxValueChanged(id);
  }
}

function redrawEverythingAfterTexboxValueChanged(id)
{
  if (id == "hue" ||
      id == "saturation" ||
      id == "brightness")
  {
    var h = gDialog.hue.value;
    var s = gDialog.saturation.value;
    var b = gDialog.brightness.value;
    colours.setHSB(h, s/100, b);
  }
  else
  {
    var r = gDialog.red.value;
    var g = gDialog.green.value;
    var b = gDialog.blue.value;
    colours.setRGB(r, g, b);
  }
  redrawEverything();
}

function onTextboxValueChanged(e, id)
{
  forceInteger(id);
  var v = e.value;
  switch (id)
  {
    case "hue":
      v = checkRange(v, 0, 359);
      break;
    case "brightness":
    case "red":
    case "green":
    case "blue":
      v = checkRange(v, 0, 255);
      break;
    case "saturation":
      v = checkRange(v, 0, 100);
      break;
  }
  e.value = v;
  redrawEverythingAfterTexboxValueChanged(id);
}

function ToggleTransparency(elt)
{
  if (elt.value == "0")
  {
    gDialog.red.setAttribute("disabled", true);
    gDialog.blue.setAttribute("disabled", true);
    gDialog.green.setAttribute("disabled", true);
    gDialog.hue.setAttribute("disabled", true);
    gDialog.saturation.setAttribute("disabled", true);
    gDialog.brightness.setAttribute("disabled", true);
    gDialog.hexColour.setAttribute("disabled", true);
    gDialog.nameColour.setAttribute("disabled", true);
    gDialog.redLabel.setAttribute("disabled", true);
    gDialog.blueLabel.setAttribute("disabled", true);
    gDialog.greenLabel.setAttribute("disabled", true);
    gDialog.hueLabel.setAttribute("disabled", true);
    gDialog.saturationLabel.setAttribute("disabled", true);
    gDialog.brightnessLabel.setAttribute("disabled", true);
    gDialog.hexColourLabel.setAttribute("disabled", true);
    gDialog.nameColourLabel.setAttribute("disabled", true);

    gDialog.swatch.style.opacity = "0";
  }
  else
  {
    gDialog.red.removeAttribute("disabled");
    gDialog.blue.removeAttribute("disabled");
    gDialog.green.removeAttribute("disabled");
    gDialog.hue.removeAttribute("disabled");
    gDialog.saturation.removeAttribute("disabled");
    gDialog.brightness.removeAttribute("disabled");
    gDialog.hexColour.removeAttribute("disabled");
    gDialog.nameColour.removeAttribute("disabled");
    gDialog.redLabel.removeAttribute("disabled");
    gDialog.blueLabel.removeAttribute("disabled");
    gDialog.greenLabel.removeAttribute("disabled");
    gDialog.hueLabel.removeAttribute("disabled");
    gDialog.saturationLabel.removeAttribute("disabled");
    gDialog.brightnessLabel.removeAttribute("disabled");
    gDialog.hexColourLabel.removeAttribute("disabled");
    gDialog.nameColourLabel.removeAttribute("disabled");

    gDialog.swatch.style.backgroundColor = "#" + colours.getHex();
    gDialog.swatch.style.opacity = parseInt(gDialog.opacityTextbox.value) / 100;
  }
}

function onNamedColourChanged(elt)
{
  var namedColour = elt.value;
  var i, l = namedColorsArray.length;
  for (i=0; i<l; i++)
  {
    if (namedColorsArray[i].name == namedColour)
    {
      gDialog.hexColour.value = namedColorsArray[i].value;
      changeHex();
      return;
    }
  }
}

function SelectLastPickedColor()
{
  SetCurrentColor(gColorObj.currentColorcolor);
  gDialog.opacityScale.value = Math.floor(gColorObj.currentColor.opacity * 100);
  LastPickedIsDefault = true;  
  if ( onAccept() )
  {
    window.close();
    return true;
  }
  return false;
}

function forceInteger(elementID)
{
  var editField = document.getElementById( elementID );
  if ( !editField )
    return;

  var stringIn = editField.value;
  if (stringIn && stringIn.length > 0)
  {
    // Strip out all nonnumeric characters
    stringIn = stringIn.replace(/\D+/g,"");
    if (!stringIn) stringIn = "";

    // Write back only if changed
    if (stringIn != editField.value)
      editField.value = stringIn;
  }
}


function ConvertRGBColorIntoHEXColor(color)
{
  if ( /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.test(color) ) {
    var r = Number(RegExp.$1).toString(16);
    if (r.length == 1) r = "0"+r;
    var g = Number(RegExp.$2).toString(16);
    if (g.length == 1) g = "0"+g;
    var b = Number(RegExp.$3).toString(16);
    if (b.length == 1) b = "0"+b;
    return { color: "#"+r+g+b, opacity: 1};
  }
  else if ( /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+(\.?\d+)))?\)/.test(color)) {
    var r = Number(RegExp.$1).toString(16);
    if (r.length == 1) r = "0"+r;
    var g = Number(RegExp.$2).toString(16);
    if (g.length == 1) g = "0"+g;
    var b = Number(RegExp.$3).toString(16);
    if (b.length == 1) b = "0"+b;
    return { color: "#"+r+g+b, opacity: parseFloat(RegExp.$5) };
  }
  else {
    return {color: color, opacity: 1};
  }
}

function onColorBoxClickedForBlending(aEvent)
{
  gDialog["colorBlenderTextbox" + gDialog.colorBlenderRadiogroup.value].value = aEvent.target.style.backgroundColor; 
  gDialog["colorBlenderTextbox" + gDialog.colorBlenderRadiogroup.value].setAttribute("color", aEvent.target.getAttribute("color")); 
  gDialog["colorBlenderPreviewBox" + gDialog.colorBlenderRadiogroup.value].style.backgroundColor = aEvent.target.style.backgroundColor;

  Services.prefs.setCharPref("bluegriffon.blender.color" + gDialog.colorBlenderRadiogroup.value, aEvent.target.getAttribute("color"));
  Blend();
}

function onColorBlenderStopsTextboxChanged(aElement)
{
  Services.prefs.setIntPref("bluegriffon.blender.stops", aElement.value);
  Blend();
}

function Blend()
{
	document.documentElement.getButton("accept").setAttribute("disabled", "true");

	var child = gDialog.colorStopsRow.nextSibling;
	while (child) {
		var tmp = child.nextSibling;
		child.parentNode.removeChild(child);
		child = tmp;
	}

	var stops = parseInt(gDialog.colorBlenderStopsTextbox.value);
  var color1 = gDialog.colorBlenderTextbox1.getAttribute("color");
  var color2 = gDialog.colorBlenderTextbox2.getAttribute("color");

  var match1 = color1.match(kHEX_COLOR_MATCH_REGEXP);
  var match2 = color2.match(kHEX_COLOR_MATCH_REGEXP);

  if (match1 && match2) {
    var startR = parseInt(match1[1], 16);
    var startG = parseInt(match1[2], 16);
    var startB = parseInt(match1[3], 16);

    var endR = parseInt(match2[1], 16);
    var endG = parseInt(match2[2], 16);
    var endB = parseInt(match2[3], 16);

    for (var i = 1; i < stops + 1; i++) {
      var r = Math.floor(startR + (i * (endR - startR) / (stops + 1)));
      var g = Math.floor(startG + (i * (endG - startG) / (stops + 1)));
      var b = Math.floor(startB + (i * (endB - startB) / (stops + 1)));

      var row = document.createElement("row");
      row.setAttribute("align", "center");

      var label = document.createElement("label");
      label.setAttribute("value", i + ":");
      row.appendChild(label);

      var textbox = document.createElement("textbox");
      textbox.setAttribute("readonly", "true");
      row.appendChild(textbox);

      var box = document.createElement("box");
      box.className = "blendedColorPreviewBox";
      var color = b.toString(16);
      if (color.length == 1) color = "0" + color;
      color = g.toString(16) + color;
      if (color.length == 3) color = "0" + color;
      color = r.toString(16) + color;
      if (color.length == 5) color = "0" + color;
      var l = document.createElement("label");
      l.setAttribute("value", "");
      box.setAttribute("onclick", "BlendedColorSelected(this)");
      box.appendChild(l);
      row.appendChild(box);

      gDialog.colorBlenderRows.appendChild(row);
      textbox.setAttribute("value", "#" + color);
      textbox.setAttribute("value", "#" + color);
      box.style.backgroundColor = "#" + color;

    }
  }
}

function colorBlenderTextboxChanged(aElt)
{
	var color = aElt.value;

	var i, l = namedColorsArray.length;
  for (i=0; i<l; i++)
  {
    if (namedColorsArray[i].name == color)
    {
      color = namedColorsArray[i].value;
      break;
    }
  }
	var match = color.match(kHEX_COLOR_MATCH_REGEXP);
	if (!match) {
		color = "transparent";
	}
  aElt.setAttribute("color", color);
  aElt.nextSibling.style.backgroundColor = color;
  Blend();
}

function BlendedColorSelected(aElt)
{
	var e = document.querySelector(".blendedColorPreviewBox[selected]");
	if (e)
	  e.removeAttribute("selected");
	aElt.setAttribute("selected", "true");
	document.documentElement.getButton("accept").removeAttribute("disabled");
}

function BlenderValidate()
{
	gMode = 1;
	var e = document.querySelector(".blendedColorPreviewBox[selected]");
	if (e)
    document.documentElement.getButton("accept").removeAttribute("disabled");
  else
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
}

function ColorPickerSelected()
{
	gMode = 0;
  var match = gDialog.hexColour.value.match(kHEX_COLOR_MATCH_REGEXP);
  if (match) {
    document.documentElement.getButton("accept").removeAttribute("disabled");
  }
  else
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
}

function ValidateHex(aElt)
{
  var match = aElt.value.match(kHEX_COLOR_MATCH_REGEXP);
  if (match) {
    document.documentElement.getButton("accept").removeAttribute("disabled");
    colours.setHex(aElt.value.substr(1));
    redrawEverything();
  }
  else
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
}