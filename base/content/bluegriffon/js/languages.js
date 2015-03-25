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
 * The Original Code is the Firefox Preferences System.
 *
 * The Initial Developer of the Original Code is
 * Ben Goodger.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Ben Goodger <ben@mozilla.org>
 *  Adrian Havill <havill@redhat.com>
 *  Steffen Wilberg <steffen.wilberg@web.de>
 *  Daniel Glazman <daniel.glazman@disruptive-innovations.com>
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
 
/* code chunk needed in dialog or window is
    <stringbundleset id="languageSet">
      <stringbundle id="bundleRegions"      src="chrome://global/locale/regionNames.properties"/>
      <stringbundle id="bundleLanguages"    src="chrome://global/locale/languageNames.properties"/>
      <stringbundle id="bundlePreferences"  src="chrome://bluegriffon/locale/language.properties"/>
      <stringbundle id="bundleAccepted"     src="resource://gre/res/language.properties"/>
    </stringbundleset>
 */


var BGLanguagesHelper = {

  _availableLanguagesList : [],
  _acceptLanguages        : { },
  
  _selectedItemID         : null,
  
  init: function ()
  {
    var languageListBox = document.getElementById("languageListBox");
    if (languageListBox)
    {
      this._loadAvailableLanguages();
    }
  },
  
  _loadAvailableLanguages: function ()
  {
    // This is a parser for: resource://gre/res/language.properties
    // The file is formatted like so:
    // ab[-cd].accept=true|false
    //  ab = language
    //  cd = region
    var bundleAccepted    = document.getElementById("bundleAccepted");
    var bundleRegions     = document.getElementById("bundleRegions");
    var bundleLanguages   = document.getElementById("bundleLanguages");
    var bundlePreferences = document.getElementById("bundlePreferences");

    function LanguageInfo(aName, aABCD, aIsVisible)
    {
      this.name = aName;
      this.abcd = aABCD;
      this.isVisible = aIsVisible;
    }

    // 1) Read the available languages out of language.properties
    var strings = bundleAccepted.strings;
    while (strings.hasMoreElements()) {
      var currString = strings.getNext();
      if (!(currString instanceof Components.interfaces.nsIPropertyElement))
        break;
      
      var property = currString.key.split("."); // ab[-cd].accept
      if (property[1] == "accept") {
        var abCD = property[0];
        var abCDPairs = abCD.split("-");      // ab[-cd]
        var useABCDFormat = abCDPairs.length > 1;
        var ab = useABCDFormat ? abCDPairs[0] : abCD;
        var cd = useABCDFormat ? abCDPairs[1] : "";
        if (ab) {
          var language = "";
          try {
            language = bundleLanguages.getString(ab);
          } 
          catch (e) { continue; };
          
          var region = "";
          if (useABCDFormat) {
            try {
              region = bundleRegions.getString(cd);
            }
            catch (e) { continue; }
          }
          
          var name = "";
          if (useABCDFormat)
            name = bundlePreferences.getFormattedString("languageRegionCodeFormat", 
                                                        [language, region, abCD]);
          else
            name = bundlePreferences.getFormattedString("languageCodeFormat", 
                                                        [language, abCD]);
          
          if (name && abCD) {
            var isVisible = currString.value == "true" && 
                            (!(abCD in this._acceptLanguages) || !this._acceptLanguages[abCD]);
            var li = new LanguageInfo(name, abCD, isVisible);
            this._availableLanguagesList.push(li);
          }
        }
      }
    }
    this._buildAvailableLanguageList();
  },
  
  _buildAvailableLanguageList: function ()
  {
    var languageListBox = document.getElementById("languageListBox");
    if (!languageListBox)
      return;
    while (languageListBox.hasChildNodes())
      languageListBox.removeChild(languageListBox.firstChild);
      
    // Sort the list of languages by name
    this._availableLanguagesList.sort(function (a, b) {
                                        return a.name.localeCompare(b.name);
                                      });
                                  
    // Load the UI with the data
    for (var i = 0; i < this._availableLanguagesList.length; ++i) {
      var abCD = this._availableLanguagesList[i].abcd;
      if (this._availableLanguagesList[i].isVisible && 
          (!(abCD in this._acceptLanguages) || !this._acceptLanguages[abCD])) {
        var menuitem = document.createElement("listitem");
        menuitem.id = this._availableLanguagesList[i].abcd;
        languageListBox.appendChild(menuitem);
        menuitem.setAttribute("label", this._availableLanguagesList[i].name);
        menuitem.setAttribute("value", this._availableLanguagesList[i].abcd);
      }
    }
  },

  showChoice: function(aElt)
  {
    var a = 1;
    alert(aElt.value);
  },

  get _activeLanguages()
  {
    return document.getElementById("activeLanguages");
  },
  
  get _availableLanguages()
  {
    return document.getElementById("availableLanguages");
  }
  
};

