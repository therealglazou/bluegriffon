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
Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");

var RecentPagesHandler = {

  appendRecentMenuitem: function(menupopup, title, url, menuIndex)
  {
    if (menupopup)
    {
      var menuItem = document.createElement("menuitem");
      if (menuItem)
      {
        var itemString = "";
  
        // Show "title [url]" or just the URL
        if (title)
        {
         itemString += title;
         itemString += " [";
        }
        itemString += url;
        if (title)
          itemString += "]";
  
        menuItem.setAttribute("label", itemString);
        menuItem.setAttribute("crop", "center");
        menuItem.setAttribute("value", url);
        menupopup.appendChild(menuItem);
      }
    }
  },
  
  buildRecentPagesMenu: function()
  {
    var editor = EditorUtils.getCurrentEditor();

    var popup = gDialog["menupopup_RecentFiles"];
    if (!popup)
      return;
  
    // Delete existing menu
    while (popup.firstChild)
      popup.removeChild(popup.firstChild);
  
    // Current page is the "0" item in the list we save in prefs,
    //  but we don't include it in the menu.
    var curUrl = "";
    if (editor)
      curUrl = UrlUtils.stripPassword(EditorUtils.getDocumentUrl());
    var historyCount = 10;
    try {
      historyCount = Services.prefs.getIntPref("bluegriffon.history.url_maximum");
    } catch(e) {}
    var menuIndex = 1;
  
    for (var i = 0; i < historyCount; i++)
    {
      var url = GetUnicharPref("bluegriffon.history_url_"+i);
  
      // Skip over current url
      if (url && url != curUrl)
      {
        // Build the menu
        var title = GetUnicharPref("bluegriffon.history_title_"+i);
        this.appendRecentMenuitem(popup, title, url, menuIndex);
        menuIndex++;
      }
    }
  },
  
  saveRecentFilesPrefs: function()
  {
    var curUrl = UrlUtils.stripPassword(EditorUtils.getDocumentUrl());
    if (!curUrl)
      return;
    var historyCount = 10;
    try {
      historyCount = Services.prefs.getIntPref("bluegriffon.history.url_maximum"); 
    } catch(e) {}
  
    var titleArray = [];
    var urlArray = [];
  
    // XXX code below is suspect...
    if (historyCount &&
        !UrlUtils.isUrlOfBlankDocument(curUrl) &&
        UrlUtils.getScheme(curUrl) != "data")
    {
      titleArray.push(EditorUtils.getDocumentTitle());
      urlArray.push(curUrl);
    }
  
    for (var i = 0; i < historyCount && urlArray.length < historyCount; i++)
    {
      var url = GetUnicharPref("bluegriffon.history_url_"+i);
  
      // Continue if URL pref is missing because 
      //  a URL not found during loading may have been removed
  
      // Skip over current an "data" URLs
      if (url && url != curUrl && UrlUtils.getScheme(url) != "data")
      {
        var title = GetUnicharPref("bluegriffon.history_title_"+i);
        titleArray.push(title);
        urlArray.push(url);
      }
    }
  
    // Resave the list back to prefs in the new order
    for (i = 0; i < urlArray.length; i++)
    {
      SetUnicharPref("bluegriffon.history_title_"+i, titleArray[i]);
      SetUnicharPref("bluegriffon.history_url_"+i, urlArray[i]);
    }
  }
};
