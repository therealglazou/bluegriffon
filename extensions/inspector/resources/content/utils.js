/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* Inspector Utils ------------------------------------------------------------
*  Common functions and constants used across the app.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
* chrome://inspector/content/jsutil/xpcom/XPCU.js
* chrome://inspector/content/jsutil/rdf/RDFU.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kInspectorNSURI = "http://www.mozilla.org/inspector#";
const kXULNSURI = "http://www.mozilla.org/keymaster/gatekeeper/" +
                  "there.is.only.xul";
const kHTMLNSURI = "http://www.w3.org/1999/xhtml";
const kCharTable = {
  '&': "&amp;",
  '<': "&lt;",
  '>': "&gt;",
  '"': "&quot;"
};

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var gEntityConverter;

var InsUtil = {
  /***************************************************************************
  * Convenience function for calling nsIChromeRegistry::convertChromeURL
  ***************************************************************************/
  convertChromeURL: function IU_ConvertChromeURL(aURL)
  {
    var uri =
      XPCU.getService("@mozilla.org/network/io-service;1", "nsIIOService")
        .newURI(aURL, null, null);
    var reg = XPCU.getService("@mozilla.org/chrome/chrome-registry;1",
                              "nsIChromeRegistry");

    return reg.convertChromeURL(uri);
  },

  /***************************************************************************
  * Convenience function for getting a literal value from
  * nsIRDFDataSource::GetTarget
  * @param aDS
  *        nsISupports
  * @param aId
  *        string
  * @param aPropName
  *        string
  ***************************************************************************/
  getDSProperty: function IU_GetDSProperty(aDS, aId, aPropName)
  {
    var ruleRes = gRDF.GetResource(aId);
    var ds = XPCU.QI(aDS, "nsIRDFDataSource"); // just to be sure
    var propRes = ds.GetTarget(ruleRes,
                               gRDF.GetResource(kInspectorNSURI + aPropName),
                               true);
    propRes = XPCU.QI(propRes, "nsIRDFLiteral");

    return propRes.Value;
  },

  /***************************************************************************
  * Convenience function for persisting an element's persisted attributes.
  ***************************************************************************/
  persistAll: function IU_PersistAll(aId)
  {
    var el = document.getElementById(aId);
    if (el) {
      var attrs = el.getAttribute("persist").split(" ");
      for (var i = 0; i < attrs.length; ++i) {
        document.persist(aId, attrs[i]);
      }
    }
  },

  /***************************************************************************
  * Convenience function for escaping HTML strings.
  ***************************************************************************/
  unicodeToEntity: function IU_UnicodeToEntity(text)
  {
    const entityVersion = Components.interfaces.nsIEntityConverter.entityW3C;

    function charTableLookup(letter)
    {
      return kCharTable[letter];
    }

    function convertEntity(letter)
    {
      try {
        return gEntityConverter.ConvertToEntity(letter, entityVersion);
      }
      catch (ex) {
        return letter;
      }
    }

    if (!gEntityConverter) {
      try {
        gEntityConverter =
          XPCU.createInstance("@mozilla.org/intl/entityconverter;1",
                              "nsIEntityConverter");
      }
      catch (ex) { }
    }

    // replace chars in our charTable
    text = text.replace(/[<>&"]/g, charTableLookup);

    // replace chars > 0x7f via nsIEntityConverter
    text = text.replace(/[^\0-\u007f]/g, convertEntity);

    return text;
  },

  /**
   * Determine which from a list of indexes is nearest to the given index.
   * @param aIndex
   *        The index to search for.
   * @param aIndexList
   *        A sorted list of indexes to be searched.
   * @return The index in the list closest to aIndex.  This will be aIndex
   *         itself if it appears in the list, or -1 if the list is empty.
   * @note
   */
  getNearestIndex: function IU_GetNearestIndex(aIndex, aIndexList)
  {
    // Four easy cases:
    //  - empty list
    //  - single element list
    //  - given index comes before the first element
    //  - given index comes after the last element
    if (aIndexList.length == 0) {
      return -1;
    }
    var first = aIndexList[0];
    if (aIndexList.length == 1 || aIndex <= first) {
      return first;
    }
    var high = aIndexList.length - 1;
    var last = aIndexList[high];
    if (aIndex >= last) {
      return last;
    }
  
    var mid, low = 0;
    while (low <= high) {
      mid = low + Math.floor((high - low) / 2);
      let current = aIndexList[mid];
      if (aIndex > current) {
        low = mid + 1;
      }
      else if (aIndex < current) {
        high = mid - 1;
      }
      else {
        return aIndex;
      }
    }
  
    // By handling the four easy cases above, we eliminated the possibility
    // that low or high will be out of bounds at this point.  If aIndex had
    // been present, it would have been sandwiched between these two values:
    var previous = aIndexList[high];
    var next = aIndexList[low];
  
    if ((aIndex - previous) < (next - aIndex)) {
      return previous;
    }
    // Even if previous and next are equidistant to aIndex's position, we'll
    // go with the one that's greater.
    return next;
  }
};

//////////////////////////////////////////////////////////////////////////////
//// Debugging Utilities

// dump text to the Error Console
function debug(aText)
{
  // XX comment out to reduce noise
  var cs =
    XPCU.getService("@mozilla.org/consoleservice;1", "nsIConsoleService");
  cs.logStringMessage(aText);
}
