/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* PrefUtils -------------------------------------------------
*  Utility for easily using the Mozilla preferences system.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

//////////// global variables /////////////////////

//////////// global constants ////////////////////

const nsIPrefBranch = Components.interfaces.nsIPrefBranch;

////////////////////////////////////////////////////////////////////////////
//// class PrefUtils

var PrefUtils = 
{
  mPrefs: null,
  
  init: function()
  {
    var prefService = XPCU.getService("@mozilla.org/preferences-service;1", "nsIPrefService");
    this.mPrefs = prefService.getBranch(null);
  },

  addObserver: function addObserver(aDomain, aFunction)
  {
    if (!this.mPrefs) this.init();

    var pbi = XPCU.QI(this.mPrefs, "nsIPrefBranch2");
    if (pbi)
      pbi.addObserver(aDomain, aFunction, false);
  },

  removeObserver: function removeObserver(aDomain, aFunction)
  {
    if (!this.mPrefs) this.init();

    var pbi = XPCU.QI(this.mPrefs, "nsIPrefBranch2");
    if (pbi)
      pbi.removeObserver(aDomain, aFunction);
  },

  setPref: function(aName, aValue)
  {
    if (!this.mPrefs) this.init();
    
    var type = this.mPrefs.getPrefType(aName);
    try {
      if (type == nsIPrefBranch.PREF_STRING) {
        var str = Components.classes["@mozilla.org/supports-string;1"]
                            .createInstance(Components.interfaces.nsISupportsString);
        str.data = aValue;
        this.mPrefs.setComplexValue(aName, Components.interfaces.nsISupportsString, str);
      } else if (type == nsIPrefBranch.PREF_BOOL) {
        this.mPrefs.setBoolPref(aName, aValue);
      } else if (type == nsIPrefBranch.PREF_INT) {
        this.mPrefs.setIntPref(aName, aValue);
      }
    } catch(ex) {
      debug("ERROR: Unable to write pref \"" + aName + "\".\n");
    }
  },

  getPref: function(aName)
  {
    if (!this.mPrefs) this.init();

    var type = this.mPrefs.getPrefType(aName);
    try {
      if (type == nsIPrefBranch.PREF_STRING) {
        return this.mPrefs.getComplexValue(aName, Components.interfaces.nsISupportsString).data;
      } else if (type == nsIPrefBranch.PREF_BOOL) {
        return this.mPrefs.getBoolPref(aName);
      } else if (type == nsIPrefBranch.PREF_INT) {
        return this.mPrefs.getIntPref(aName);
      }
    } catch(ex) {
      debug("ERROR: Unable to read pref \"" + aName + "\".\n");
    }
    return null;
  }
  
};

