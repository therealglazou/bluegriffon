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
 * Portions created by the Initial Developer are Copyright (C) 2008
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

Components.utils.import("resource://app/modules/l10nHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

var LoginUtils = {

  mLoginManager: null,

  _getLoginManager: function()
  {
    if (!this.mLoginManager)
      try {
        this.mLoginManager = Components.classes["@mozilla.org/login-manager;1"]
                               .getService(Components.interfaces.nsILoginManager);
      }
      catch(e) { }

    return this.mLoginManager;
  },

  newLoginInfo: function(aURL, aUser, aPassword)
  {
    var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                 Components.interfaces.nsILoginInfo,
                                                 "init");
        
    var loginInfo = new nsLoginInfo(aURL, null, "bluegriffon", aUser, aPassword,
                                    "", "");
    return loginInfo;
  },

  addLogin: function(aURL, aUser, aPassword)
  {
    var loginInfo = this.newLoginInfo(aURL, aUser, aPassword);
    try {
      this._getLoginManager().addLogin(loginInfo);
    }
    catch(e) { }
  },

  modifyLogin: function(aOldLoginInfo, aURL, aUser, aPassword)
  {
    var loginInfo = this.newLoginInfo(aURL, aUser, aPassword);
    try {
      this._getLoginManager().modifyLogin(aOldLoginInfo, loginInfo);
    }
    catch(e) { }
  },

  removeLogin: function(aOldLoginInfo)
  {
    try {
      this._getLoginManager().removeLogin(aOldLoginInfo);
    }
    catch(e) { }
  },

  checkForMasterPasswordSetting: function()
  {
    if (!this.isMasterPasswordSet())
    {
      const bundleURL = "chrome://bluegriffon/locale/masterPasswordQuery.properties";
      var windowTitle = L10NUtils.getStringFromURL("windowTitle", bundleURL);
      var query = L10NUtils.getStringFromURL("query", bundleURL);
      var yesButton = L10NUtils.getStringFromURL("yesButton", bundleURL);
      var noButton = L10NUtils.getStringFromURL("noButton", bundleURL);
      if (PromptUtils.confirmWithTitle(windowTitle, query, yesButton, noButton))
        this.openSetMasterPasswordDialog();
    }
  },

  openSetMasterPasswordDialog: function()
  {
    window.openDialog("chrome://mozapps/content/preferences/changemp.xul", "",
                      "modal,centerscreen,resizable=no", null);
  },

  openRemoveMasterPasswordDialog: function()
  {
    window.openDialog("chrome://mozapps/content/preferences/removemp.xul", "",
                      "modal,centerscreen,resizable=no", null);
  },

  isMasterPasswordSet: function ()
  {
    const Cc = Components.classes, Ci = Components.interfaces;
    var secmodDB = Cc["@mozilla.org/security/pkcs11moduledb;1"].
                   getService(Ci.nsIPKCS11ModuleDB);
    var slot = secmodDB.findSlotByName("");
    if (slot)
    {
      var status = slot.status;
      var hasMP = status != Ci.nsIPKCS11Slot.SLOT_UNINITIALIZED &&
                  status != Ci.nsIPKCS11Slot.SLOT_READY;
      return hasMP;
    }
    else
    {
      // XXX I have no bloody idea what this means
      return false;
    }
  },

  findPassword: function(hostname, formSubmitURL, httprealm, username)
  {
    var password = null;
    
    try {
       // Get Login Manager 
       var myLoginManager = this._getLoginManager();
        
       // Find users for the given parameters
       var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);
          
       // Find user from returned array of nsILoginInfo objects
       for (var i = 0; i < logins.length; i++) {
          if (logins[i].username == username) {
             password = logins[i].password;
             break;
          }
       }
    }
    catch(ex) {
       // This will only happen if there is no nsILoginManager component class
    }

    return password;
  },

  findLoginInfo: function(hostname, username)
  {
    try {
       // Get Login Manager 
       var myLoginManager = this._getLoginManager();
        
       // Find users for the given parameters
       var logins = myLoginManager.findLogins({}, hostname, null, "bluegriffon");
          
       // Find user from returned array of nsILoginInfo objects
       for (var i = 0; i < logins.length; i++) {
          if (logins[i].username == username) {
             return logins[i];
          }
       }
    }
    catch(ex) {
       // This will only happen if there is no nsILoginManager component class
    }

    return null;
  }
};

