/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* Flasher ---------------------------------------------------
*   Object for controlling a timed flashing animation which 
*   paints a border around an element.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

//////////// global variables /////////////////////

//////////// global constants ////////////////////

const HIGHLIGHTED_PSEUDO_CLASS = ":-moz-devtools-highlighted";
const INVERT = "filter: url(\"data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='invert'><feColorMatrix in='SourceGraphic' type='matrix' values='-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0'/></filter></svg>%23invert\") !important; "

////////////////////////////////////////////////////////////////////////////
//// class Flasher

function Flasher(aColor, aThickness, aDuration, aSpeed, aInvert)
{
  document.querySelector(HIGHLIGHTED_PSEUDO_CLASS);
  this.mIOService = XPCU.getService("@mozilla.org/network/io-service;1", "nsIIOService");
  this.mDOMUtils = XPCU.getService("@mozilla.org/inspector/dom-utils;1", "inIDOMUtils");
  this.mShell = XPCU.getService("@mozilla.org/inspector/flasher;1", "inIFlasher") || this.mDOMUtils;
  this.color = aColor;
  this.thickness = aThickness;
  this.invert = aInvert;
  this.duration = aDuration;
  this.mSpeed = aSpeed;
}

Flasher.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mFlashTimeout: null,
  mElement: null,
  mRegistryId: null,
  mFlashes: 0,
  mStartTime: 0,
  mDOMUtils: null,
  mWinUtils: null,
  mStyleURI: null,
  mColor: "#000000",
  mInvert: false,
  mThickness: 0,
  mDuration: 0,
  mSpeed: 0,

  ////////////////////////////////////////////////////////////////////////////
  //// Properties

  get flashing() { return this.mFlashTimeout != null; },

  get element() { return this.mElement; },
  set element(val)
  {
    if (val && val.nodeType == Node.ELEMENT_NODE) {
      this.mElement = val;
      this.mShell.scrollElementIntoView(val);
      this.mWinUtils = val.ownerDocument.defaultView
                          .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                          .getInterface(Components.interfaces.nsIDOMWindowUtils);
    } else {
      throw "Invalid node type.";
    }
  },

  get color() { return this.mColor; },
  set color(aVal)
  {
    var spacer = document.createElement("spacer");
    spacer.style.color = aVal;
    if (spacer.style.color) {
      this.mStyleURI = null;
      this.mColor = aVal;
    }
    return aVal;
  },

  get thickness() { return this.mThickness | 0; },
  set thickness(aVal) { this.mStyleURI = null; return this.mThickness = aVal; },

  get duration() { return this.mDuration; },
  set duration(aVal) { this.mDuration = aVal; },

  get speed() { return this.mSpeed; },
  set speed(aVal) { this.mSpeed = aVal; },

  get invert() { return !!this.mInvert; },
  set invert(aVal) { this.mStyleURI = null; return this.mInvert = aVal; },

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::: Methods ::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  start: function(aDuration, aSpeed, aHold)
  {
    if (!this.mStyleURI) {
      var styleURI = "data:text/css;charset=utf-8," + HIGHLIGHTED_PSEUDO_CLASS +
                     " { outline: " + this.thickness + "px solid " +
                     encodeURIComponent(this.color) +
                     " !important; outline-offset: " + -this.thickness +
                     "px !important; " + (this.invert ? INVERT : "") + "}";
      this.mStyleURI = this.mIOService.newURI(styleURI, null, null);
    }

    this.mWinUtils.loadSheet(this.mStyleURI, this.mWinUtils.AGENT_SHEET);
    this.mUDuration = aDuration ? aDuration * 1000 : this.mDuration;
    this.mUSpeed = aSpeed ? aSpeed : this.mSpeed;
    this.mHold = aHold;
    this.mFlashes = 0;
    this.mStartTime = Date.now();
    this.doFlash();
  },

  doFlash: function()
  {
    if (this.mHold || this.mFlashes & 1) {
      this.paintOn();
    } else {
      this.paintOff();
    }
    this.mFlashes++;

    if (this.mUDuration < 0 || Date.now() - this.mStartTime < this.mUDuration) {
      this.mFlashTimeout = window.setTimeout(this.timeout, this.mUSpeed, this);
    } else {
      this.stop();
    }
  },

  timeout: function(self)
  {
    self.doFlash();
  },

  stop: function()
  {
    if (this.flashing) {
      this.mWinUtils.removeSheet(this.mStyleURI, this.mWinUtils.AGENT_SHEET);
      window.clearTimeout(this.mFlashTimeout);
      this.mFlashTimeout = null;
      this.paintOff();
    }
  },

  paintOn: function()
  {
    this.mDOMUtils.addPseudoClassLock(this.mElement, HIGHLIGHTED_PSEUDO_CLASS);
  },

  paintOff: function()
  {
    this.mDOMUtils.removePseudoClassLock(this.mElement, HIGHLIGHTED_PSEUDO_CLASS);
  }

};

////////////////////////////////////////////////////////////////////////////
//// class LegacyFlasher

function LegacyFlasher(aColor, aThickness, aDuration, aSpeed, aInvert)
{
  this.mShell = XPCU.getService("@mozilla.org/inspector/flasher;1", "inIFlasher");
  this.color = aColor;
  this.mShell.thickness = aThickness;
  this.mShell.invert = aInvert;
  this.duration = aDuration;
  this.mSpeed = aSpeed;
}

LegacyFlasher.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mFlashTimeout: null,
  mElement:null,
  mRegistryId: null,
  mFlashes: 0,
  mStartTime: 0,
  mDuration: 0,
  mSpeed: 0,

  ////////////////////////////////////////////////////////////////////////////
  //// Properties

  get flashing() { return this.mFlashTimeout != null; },
  
  get element() { return this.mElement; },
  set element(val) 
  { 
    if (val && val.nodeType == Node.ELEMENT_NODE) {
      this.mElement = val; 
      this.mShell.scrollElementIntoView(val);
    } else 
      throw "Invalid node type.";
  },

  get color() { return this.mShell.color; },
  set color(aVal)
  {
    try {
      this.mShell.color = aVal;
    }
    catch (e) { // Catch exception in case aVal is an invalid or empty value.
      Components.utils.reportError(e);
    }
    return aVal;
  },

  get thickness() { return this.mShell.thickness; },
  set thickness(aVal) { this.mShell.thickness = aVal; },

  get duration() { return this.mDuration; },
  set duration(aVal) { this.mDuration = aVal; },

  get speed() { return this.mSpeed; },
  set speed(aVal) { this.mSpeed = aVal; },

  get invert() { return this.mShell.invert; },
  set invert(aVal) { this.mShell.invert = aVal; },

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::: Methods ::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  start: function(aDuration, aSpeed, aHold)
  {
    this.mUDuration = aDuration ? aDuration*1000 : this.mDuration;
    this.mUSpeed = aSpeed ? aSpeed : this.mSpeed
    this.mHold = aHold;
    this.mFlashes = 0;
    this.mStartTime = new Date();
    this.doFlash();
  },

  doFlash: function()
  {
    if (this.mHold || this.mFlashes%2) {
      this.paintOn();
    } else {
      this.paintOff();
    }
    this.mFlashes++;

    if (this.mUDuration < 0 || new Date() - this.mStartTime < this.mUDuration) {
      this.mFlashTimeout = window.setTimeout(this.timeout, this.mUSpeed, this);
    } else {
      this.stop();
    }
  },

  timeout: function(self)
  {
    self.doFlash();
  },

  stop: function()
  {
    if (this.flashing) {
      window.clearTimeout(this.mFlashTimeout);
      this.mFlashTimeout = null;
      this.paintOff();
    }
  },

  paintOn: function()
  {
    this.mShell.drawElementOutline(this.mElement);
  },

  paintOff: function()
  {
    this.mShell.repaintElement(this.mElement);
  }

};

////////////////////////////////////////////////////////////////////////////////
//// DOMIFlasher

/**
 * The special version of the flasher operating with DOM Inspector flasher
 * preferences.
 */
function DOMIFlasher()
{
  this.init();
}

DOMIFlasher.prototype =
{
  //////////////////////////////////////////////////////////////////////////////
  //// Public

  get flashOnSelect() { return PrefUtils.getPref("inspector.blink.on"); },
  set flashOnSelect(aVal) { PrefUtils.setPref("inspector.blink.on", aVal); },

  get color() { return PrefUtils.getPref("inspector.blink.border-color"); },
  set color(aVal) { PrefUtils.setPref("inspector.blink.border-color", aVal); },

  get thickness() { return PrefUtils.getPref("inspector.blink.border-width"); },
  set thickness(aVal) { PrefUtils.setPref("inspector.blink.border-width", aVal); },

  get duration() { return PrefUtils.getPref("inspector.blink.duration"); },
  set duration(aVal) { PrefUtils.setPref("inspector.blink.duration", aVal); },

  get speed() { return PrefUtils.getPref("inspector.blink.speed"); },
  set speed(aVal) { PrefUtils.setPref("inspector.blink.speed", aVal); },

  get invert() { return PrefUtils.getPref("inspector.blink.invert"); },
  set invert(aVal) { PrefUtils.setPref("inspector.blink.invert", aVal); },

  flashElement: function DOMIFlasher_flashElement(aElement)
  {
    if (this.mFlasher.flashing)
      this.mFlasher.stop();

    this.mFlasher.element = aElement;
    this.mFlasher.start();
  },

  flashElementOnSelect: function DOMIFlasher_flashElementOnSelect(aElement)
  {
    if (this.flashOnSelect) {
      this.flashElement(aElement);
    }
  },

  destroy: function DOMIFlasher_destroy()
  {
    PrefUtils.removeObserver("inspector.blink.", this);
  },

  //////////////////////////////////////////////////////////////////////////////
  //// Private

  init: function DOMIFlasher_init()
  {
    try {
      this.mFlasher = new Flasher(this.color, this.thickness, this.duration,
                                  this.speed, this.invert);
    } catch (e) {
      this.mFlasher = new LegacyFlasher(this.color, this.thickness,
                                        this.duration, this.speed, this.invert);
    }

    PrefUtils.addObserver("inspector.blink.", this);

    this.updateFlashOnSelectCommand();
  },

  updateFlashOnSelectCommand: function DOMIFlasher_updateFlashOnSelectCommand()
  {
    var cmdEl = document.getElementById("cmdFlashOnSelect");
    if (this.flashOnSelect) {
      cmdEl.setAttribute("checked", "true");
    } else {
      cmdEl.removeAttribute("checked");
    }
  },

  observe: function DOMIFlasher_observe(aSubject, aTopic, aData)
  {
    if (aData == "inspector.blink.on") {
      this.updateFlashOnSelectCommand();
      return;
    }

    var value = PrefUtils.getPref(aData);

    if (aData == "inspector.blink.border-color") {
      this.mFlasher.color = value;
    } else if (aData == "inspector.blink.border-width") {
      this.mFlasher.thickness = value;
    } else if (aData == "inspector.blink.duration") {
      this.mFlasher.duration = value;
    } else if (aData == "inspector.blink.speed") {
      this.mFlasher.speed = value;
    } else if (aData == "inspector.blink.invert") {
      this.mFlasher.invert = value;
    }
  }
}
