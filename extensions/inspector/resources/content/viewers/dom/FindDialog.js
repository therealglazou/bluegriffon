/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* FindDialog ---------------------------------------------------
*  Controls the dialog box used for searching the DOM.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/rdf/RDFU.js
****************************************************************/

//////////// global variables /////////////////////

var dialog;

//////////// global constants ////////////////////

//////////////////////////////////////////////////

window.addEventListener("load", FindDialog_initialize, false);

function FindDialog_initialize()
{
  dialog = new FindDialog();
}

////////////////////////////////////////////////////////////////////////////
//// class FindDialog

function FindDialog()
{
  this.setDirection(window.arguments[1] ? window.arguments[1] : "down");
  if (window.arguments[2]) {
    this.setValue(window.arguments[2][0], window.arguments[2][1])
  }
  this.toggleType(window.arguments[0] ? window.arguments[0] : "id");
  this.mOpener = window.opener.viewer;
  
  var txf = document.getElementById("tfText1");
  txf.select();
  txf.focus();
}

FindDialog.prototype = 
{
  mType: null,

  ////////// Properties


  ////////// Methods

  doFind: function()
  {
    var el = document.getElementById("tfText1");
    var dir = document.getElementById("rgDirection").value;
    if (this.mType == "id") {
      this.mOpener.startFind("id", dir, el.value);
    } else if (this.mType == "tag") {
      this.mOpener.startFind("tag", dir, el.value);
    } else if (this.mType == "attr") {
      var el2 = document.getElementById("tfText2");
      this.mOpener.startFind("attr", dir, el.value, el2.value);
    }
  },

  toggleType: function(aType)
  {
    this.mType = aType;

    if (aType == "id") {
      this.showDirection(false);
      this.setLabel1(0);
      this.showRow2(false);
    } else if (aType == "tag") {
      this.showDirection(true);
      this.setLabel1(1);
      this.showRow2(false);
    } else if (aType == "attr") {
      this.showDirection(true);
      this.setLabel1(2);
      this.showRow2(true);
    }

    var rd = document.getElementById("rdType_"+aType.toLowerCase());
    if (rd) {
      var rg = document.getElementById("rgType");
      rg.selectedItem = rd;
    }

  },

  setLabel1: function(aIndex)
  {
    var deck = document.getElementById("rwRow1Text");
    
    // We want to add a control attribute to the selected label so that 
    // accessibility aids can get the textbox's label.
    // Remove the control attribute from the old panel.
    deck.selectedPanel.removeAttribute("control");

    deck.selectedIndex = aIndex;
    // Add the control attribute to the new panel.
    deck.selectedPanel.control = "tfText1";
  },

  showRow2: function(aTruth)
  {
    var row = document.getElementById("rwRow2");
    row.setAttribute("hide", !aTruth);
  },
  
  setDirection: function(aMode)
  {
    var rd = document.getElementById("rdDir_"+aMode.toLowerCase());
    if (rd) {
      var rg = document.getElementById("rgDirection");
      rg.selectedItem = rd;
    }
  },
  
  setValue: function(aValue1, aValue2)
  {
    var txf;
    if (aValue1) {
      txf = document.getElementById("tfText1");
      txf.value = aValue1;
    }
    if (aValue2) {
      txf = document.getElementById("tfText2");
      txf.value = aValue2;
    }
  },
  
  showDirection: function(aTruth)
  {
    document.getElementById("rdDir_up").disabled = !aTruth;
    document.getElementById("rdDir_down").disabled = !aTruth;
  }

};

