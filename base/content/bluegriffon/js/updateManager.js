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

var BGUpdateManager = {

  kPREF_APPID:            "bluegriffon.updates.id",
  kPREF_LAST_UPDATE:      "bluegriffon.updates.last",
  kPREF_UPDATES_ENABLED:  "bluegriffon.updates.check.enabled",
  kPREF_UPDATE_FREQUENCY: "bluegriffon.updates.frequency",
  kPREF_UPDATE_MESSAGE:   "bluegriffon.updates.message",
  kURL_UPDATE:            "http://bluegriffon.org/pings/bluegriffon_ping.php?",

  //Interfaces this component implements.
  interfaces: [Components.interfaces.nsIProgressEventSink,
               Components.interfaces.nsIInterfaceRequestor,
               Components.interfaces.nsISupports],

  // nsISupports

  QueryInterface: function(iid) {
    if (!this.interfaces.some( function(v) { return iid.equals(v) } ))
      throw Components.results.NS_ERROR_NO_INTERFACE;

    return this;
  },

  getInterface: function(iid) {
    return this.QueryInterface(iid);
  },

  check: function()
  {
    if (gDialog.updateThrobber)
      gDialog.updateThrobber.hidden = false;

    var prefs = Services.prefs;
    var currentDate = Date.parse(new Date());

    // we need an appId for the xmlhttprequest
    var appId = null;
    try {
      appId = prefs.getCharPref(this.kPREF_APPID);
    }
    catch(e) {}
    if (!appId) {
      var uuidService = Components.classes["@mozilla.org/uuid-generator;1"]
                          .getService(Components.interfaces.nsIUUIDGenerator);
      var uuid = uuidService.generateUUID().toString();
      appId = uuid + ":" + currentDate;
      try {
        prefs.setCharPref(this.kPREF_APPID, appId);
      }
      catch(e) {}
    }

    var lastCheck = 0;
    try {
      lastCheck = parseInt(prefs.getCharPref(this.kPREF_LAST_UPDATE));
    }
    catch(e) {}

    var updatesEnabled = true;
    try {
      updatesEnabled = prefs.getBoolPref(this.kPREF_UPDATES_ENABLED);
    }
    catch(e) {}

    var updateFrequency = "launch";
    try {
      updateFrequency = prefs.getCharPref(this.kPREF_UPDATE_FREQUENCY);
    }
    catch(e) {}

    if (updatesEnabled &&
        (updateFrequency == "launch" ||
         (updateFrequency == "onceperday" && currentDate - lastCheck > 24*60*60*1000))) {

      // ok we have to look for an app update...
      var rq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                 .createInstance();

      var loadHandler = {
        _self: this,
  
        handleEvent: function(aEvent)
        {
          if (this._self._loadTimer)
            this._self._loadTimer.cancel();
  
          this._self.status = aEvent.target.status;
  
          if (this._self._authFailer || this._self.status >= 400)
          {
            this._self = null;
            if (gDialog.updateThrobber)
              gDialog.updateThrobber.hidden = true;
            if ("ErrorOnUpdate" in window)
              ErrorOnUpdate();
          }
          else
          {
            try     { this._self._handleLoad(aEvent) }
            finally { this._self = null }
          }
        }
      };
  
      var errorHandler = {
        _self: this,
  
        handleEvent: function(event) {
          if (this._self._loadTimer)
            this._self._loadTimer.cancel();
  
          this._self = null;
          if (gDialog.updateThrobber)
            gDialog.updateThrobber.hidden = true;
          if ("ErrorOnUpdate" in window)
            ErrorOnUpdate();
        }
      };
      // cancel loads that take too long
      var timeout = 120 * 1000;
      var timerObserver = {
        _self: this,
        observe: function() {
          rq.abort();
          try     { this._self.destroy() }
          finally { this._self = null }
          if (gDialog.updateThrobber)
            gDialog.updateThrobber.hidden = true;
          if ("ErrorOnUpdate" in window)
            ErrorOnUpdate();
        }
      };
      this._loadTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      this._loadTimer.init(timerObserver, timeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
  
      rq = rq.QueryInterface(Components.interfaces.nsIDOMEventTarget);
      rq.addEventListener("load", loadHandler, false);
      rq.addEventListener("error", errorHandler, false);
  
      rq = rq.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
      rq.open("GET", this.kURL_UPDATE + "v=" + Services.appinfo.version
                                      + "&id=" + appId, true);
      rq.setRequestHeader("Pragma", "no-cache");
      rq.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
      // Register ourselves as a listener for notification callbacks so we
      // can handle authorization requests and SSL issues like cert mismatches.
      // XMLHttpRequest will handle the notifications we don't handle.
      rq.channel.notificationCallbacks = this;
  
      rq.send(null);
    }
  },

  _handleLoad: function(aEvent)
  {
    if (gDialog.updateThrobber)
      gDialog.updateThrobber.hidden = true;
    // update the last update's time
    Services.prefs.setCharPref(this.kPREF_LAST_UPDATE, Date.parse(new Date()));

    var rq = aEvent.target;
    var doc = rq.responseXML; 
    if (doc &&
        doc.documentElement.nodeName == "update") {
      var child = doc.documentElement.firstElementChild;
      var message = "", messageURL = "";
      var currentVersion, homeURL;
      while (child) {
        switch (child.nodeName)
        {
          case "currentVersion": currentVersion = child.textContent; break;
          case "homeURL":        homeURL = child.textContent; break;
          case "message":        message = child.textContent; break;
          case "messageURL":     messageURL = child.textContent; break;
          default:               break;
        }
        child = child.nextElementSibling;
      }
      var lastMessage = "";
      try {
        lastMessage = Services.prefs.getCharPref(this.kPREF_UPDATE_MESSAGE);
      }
      catch(e){}
      var gApp = Services.appinfo;
      if (currentVersion && homeURL) {
        var skipped = "";
        try {
          skipped = Services.prefs.getCharPref("bluegriffon.updates.skipped");
        }
        catch(e){}
        if (Services.vc.compare(gApp.version, currentVersion) < 0
            && (currentVersion != skipped || ("BlueGriffonIsUpToDate" in window))) {
          var features = "chrome,titlebar,toolbar,modal,centerscreen,dialog=no";
          window.openDialog("chrome://bluegriffon/content/dialogs/updateAvailable.xul", "", features,
                            null, null, currentVersion);
        }
        else {
          if ("BlueGriffonIsUpToDate" in window)
            BlueGriffonIsUpToDate();
          if (message && lastMessage != message) {
            Services.prefs.setCharPref(this.kPREF_UPDATE_MESSAGE, message);
            var features = "chrome,titlebar,toolbar,modal,centerscreen,dialog=no";
            window.openDialog("chrome://bluegriffon/content/dialogs/updateAvailable.xul", "", features,
                              message, messageURL, 0);
          }
        }
      }
    }
  }
};
  