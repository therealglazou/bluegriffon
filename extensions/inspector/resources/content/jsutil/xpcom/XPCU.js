/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var XPCU = 
{ 
  getService: function(aURL, aInterface)
  {
    try {
      return Components.classes[aURL].getService(Components.interfaces[aInterface]);
    } catch (ex) {
      dump("Error getting service: " + aURL + ", " + aInterface + "\n" + ex);
      return null;
    }
  },

  createInstance: function (aURL, aInterface)
  {
    try {
      return Components.classes[aURL].createInstance(Components.interfaces[aInterface]);
    } catch (ex) {
      dump("Error creating instance: " + aURL + ", " + aInterface + "\n" + ex);
      return null;
    }
  },

  QI: function(aEl, aIName)
  {
    try {
      return aEl.QueryInterface(Components.interfaces[aIName]);
    } catch (ex) {
      throw("Unable to QI " + aEl + " to " + aIName);
    }
  }

};