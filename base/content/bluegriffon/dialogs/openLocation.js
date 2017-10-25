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

Components.utils.import("resource://gre/modules/urlHelper.jsm");

const nsIFilePicker = Components.interfaces.nsIFilePicker;

var gDialog = {};

function Startup()
{
  if (!window.arguments.length)
    return;

  var type = window.arguments[0];
  gDialog.bundle = document.getElementById("openLocationBundle");
  gDialog.input = document.getElementById("dialog.input");
  gDialog.tabOrWindow = document.getElementById("tabOrWindow");

  gDialog.tabOrWindow.value = type;
  gDialog.prefs = GetPrefs();
#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif

  var url = UrlUtils.getURLFromClipboard();
  if (url)
    gDialog.input.value = url;
}

function onChooseFile()
{
  try {
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, gDialog.bundle.getString("chooseFileDialogTitle"), nsIFilePicker.modeOpen);
    
    fp.appendFilters(nsIFilePicker.filterHTML);
    fp.appendFilter(gDialog.bundle.getString("PHPfiles"), "*.php");
    fp.appendFilters(nsIFilePicker.filterText);
    var ebmAvailable = ("EBookManager" in window.opener);
    if (ebmAvailable)
      fp.appendFilter(window.opener.document.getElementById("bundleEbookManager").getString("EPUBbooks"),
                      "*.epub");
    fp.appendFilters(nsIFilePicker.filterAll);

    if (fp.show() == nsIFilePicker.returnOK && fp.fileURL.spec && fp.fileURL.spec.length > 0)
    {
      gDialog.input.value = decodeURI(fp.fileURL.spec);
      // give focus to the OK buton
      document.documentElement.getButton("accept").focus();
    }
  }
  catch(ex) {
  }
}

function OpenFile()
{
  var filename = gDialog.input.value;
  var inTab = (gDialog.tabOrWindow.value == "tab");
  var ebmAvailable = ("EBookManager" in window.opener);
  if (ebmAvailable && filename.toLowerCase().endsWith(".epub")) {
    var ioService =
      Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
    var fileHandler =
      ioService.getProtocolHandler("file")
               .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var file = fileHandler.getFileFromURLSpec(filename);

    var windowEnumerator = Services.wm.getEnumerator("bluegriffon");
    var win = null;
    while (windowEnumerator.hasMoreElements()) {
      var w = windowEnumerator.getNext();
      var ebookElt = w.document.querySelector("epub2,epub3,epub31");
      if (ebookElt) {
        var ebook = ebookElt.getUserData("ebook");
        if (file.equals(ebook.packageFile)) {
          w.focus();
          window.close();
          return;
        }
      }
      else if (!win)
        win = w;
    }

    window.opener.StoreUrlInLocationDB(filename);
    if (win && !win.EditorUtils.getCurrentEditor()) {
      win.focus();
      win.EBookManager.showEbook(file, filename);
      win.updateCommands("style");
      window.close();
      return;
    }
    window.opener.OpenNewWindow(filename);
    window.close();
  }
  else {
    InsertLocationInDB(filename);
    window.opener.OpenFile(filename, inTab);

    if (gDialog.prefs)
    {
      var str = Components.classes["@mozilla.org/supports-string;1"]
                          .createInstance(Components.interfaces.nsISupportsString);
      str.data = filename;
      gDialog.prefs.setComplexValue("general.open_location.last_url",
                           Components.interfaces.nsISupportsString, str);
    }
    // Delay closing slightly to avoid timing bug on Linux.
    window.close();
  }
  return false;
}


function GetDBConn()
{
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  file.append("bgLocations.sqlite");
  
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                          .getService(Components.interfaces.mozIStorageService);
  return storageService.openDatabase(file);
}

function InsertLocationInDB(aLocation)
{
  var mDBConn = GetDBConn();

  try {
    var statement = mDBConn.createStatement(
      "INSERT INTO 'bgLocations' ('query','querydate') VALUES(?1,?2)");
  
    statement.bindUTF8StringParameter(0, aLocation);
    statement.bindInt64Parameter(1, Date.parse(new Date()));
  
    statement.execute();
    statement.finalize();

    mDBConn.close();
  }
  catch (e) {} // already exists in table
}
