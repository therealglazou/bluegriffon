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
 * The Original Code is Mozilla Widgets.
 *
 * The Initial Developer of the Original Code is
 * Philippe Goetz.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Philippe Goetz, Original author
 *   Daniel Glazman <daniel@glazman.org>
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

const kIOServiceCID       = "@mozilla.org/network/io-service;1";
const kFileInputStreamCID = "@mozilla.org/network/file-input-stream;1";
const kScriptableInputCID = "@mozilla.org/scriptableinputstream;1";

const nsIIOService             = Components.interfaces.nsIIOService;
const nsIFileInputStream       = Components.interfaces.nsIFileInputStream;
const nsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream;

var tipOfTheDayElement;
var gPrefs;
var gPrefsService;
var gPrefsBranch;

var gDialog = {};

var gRssItems = null;

function Init()
{
  tipOfTheDayElement = window.arguments[0];

  gDialog.tipofthedaybottomcheckbox   = document.getElementById("tipoftheday-bottom-checkbox");
  gDialog.tipofthedayleftlabel        = document.getElementById("tipoftheday-left-label");
  gDialog.tipofthedayrightdescription = document.getElementById("tipoftheday-right-description");

  var ioService = Components.classes[kIOServiceCID].getService(nsIIOService);

  // Get the baseURI
  var base = ioService.newURI(tipOfTheDayElement.ownerDocument.location.href, null, null);

  // Update the openAtStartup checkbox
  gPrefs = window.GetPrefs();
  if(gPrefs.getBoolPref("tipoftheday.openAtStartup"))
    gDialog.tipofthedaybottomcheckbox.checked = true;

  // Process the "stringbundle" attribute
  var url = tipOfTheDayElement.getAttribute("stringbundle");
  if (url)
  {
    try {
      var chann = ioService.newChannelFromURI(ioService.newURI(url, null, base));
      var inputStream = Components.classes[kFileInputStreamCID].createInstance(nsIFileInputStream);
      var sis = Components.classes[kScriptableInputCID].createInstance(Components.interfaces.nsIScriptableInputStream);

      sis.init(chann.open());
      var str = sis.read(sis.available());
      sis.close();
      str = convertToUnicode("UTF-8",str);
      while (str.indexOf("\r") >= 0)
        str = str.replace("\r","\n");
      var arr = str.split("\n");
      for(var i = 0; i < arr.length; i++)
      {
        arr[i] = arr[i].split("=");
        arr[i][0] = arr[i][0].split(".");
        var ele = document.getElementById(arr[i][0][0]);
        if (ele == null)
          continue;
        if(arr[i][1])
          ele.removeAttribute(arr[i][0][1]);
        else
          ele.setAttribute(arr[i][0][1],arr[i][1]);
      }
    } catch(e) { alert("stringbundle error="+e); };
  }

  // Process the "src" attribute
  var url = tipOfTheDayElement.getAttribute("src");
  if(!url)
    window.close();

  try
  {
    var chann = ioService.newChannelFromURI(ioService.newURI(url, null, base));
    var inputStream = Components.classes[kFileInputStreamCID].createInstance(nsIFileInputStream);
    var sis = Components.classes[kScriptableInputCID].createInstance(nsIScriptableInputStream);

    sis.init(chann.open());
    var str = sis.read(sis.available());
    sis.close();
    str = convertToUnicode("UTF-8",str);
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, "text/xml");
    var ele = doc.documentElement;
    if(ele.tagName != "rss")
      throw "no rss";
    var ele = doc.getElementsByTagName("channel")[0];
    if(!ele)
      throw "no channel";
    var ele = ele.getElementsByTagName("title")[0];
    if(ele) {
      ele = ele.firstChild;
      if (ele && ele.nodeValue)
        document.documentElement.setAttribute("title",ele.nodeValue);
    }
    gRssItems = doc.getElementsByTagName("item");
    if (gRssItems.length == 0)
      throw "no item";
  } catch(e) { alert("src error="+e);window.close() };

}

function CloseTip()
{
  var tipoftheday = window.opener.document.getElementById("tipoftheday");
  if (tipoftheday)
  {
    var item = tipoftheday.getAttribute("item");
    if (item.indexOf("random") != -1)
    {
      tipoftheday.removeAttribute("item");
    }
  }
  window.close();
}

function doFocus() {
  if (!window.firstFocus) {
    window.firstFocus = true;
    doNextTip(1);
  }
}

function doCheckbox(ele) {
  tipOfTheDayElement.setAttribute("disabled",!ele.checked);
  gPrefs.setBoolPref("tipoftheday.openAtStartup", ele.checked)
}

function doNextTip(increment) {
  var item = tipOfTheDayElement.getAttribute("item");
  if (!item.indexOf("random"))
  {
    var items = item.split(",");
    for(var i = 1; i < items.length; i++)
    {
      items[i] = parseInt(items[i]);
      if ((items[i].toString() == "NaN") || (items[i] >= gRssItems.length))
        items.splice(i,1);
    }
    if (items.length == 1) {
      for(var i = 0; i < gRssItems.length; i++)
        items.push(i);
    }
    var i = 1 + (((new Date()).valueOf()) % (items.length - 1));
    i = items.splice(i,1)[0];
    tipOfTheDayElement.setAttribute("item",i);
  }
  else
  {
    var i = parseInt(item);
    if (i.toString() == "NaN")
      i = -1;
    i = (i + increment + gRssItems.length) % gRssItems.length;
    tipOfTheDayElement.setAttribute("item",i);
  }
  gDialog.tipofthedayleftlabel.value = (i + 1) + "/" + gRssItems.length;
  var ele = gRssItems[i].getElementsByTagName("description")[0];
  var str = "<p>" + ele.firstChild.nodeValue + "</p>";
  ele = gRssItems[i].getElementsByTagName("title")[0];
  if (ele && ele.firstChild  && ele.firstChild.nodeValue) {
    str = "<label id='tipoftheday-right-title'>" + ele.firstChild.nodeValue + "</label>"+str;
  }

  // the following temporarily commented out
  /*
  if(((ele=gRssItems[i].getElementsByTagName("link")[0])!=undefined)&&(ele.firstChild!=null)&&(ele.firstChild.nodeValue!=undefined)) {
    str=str+"<a href=\""+ele.firstChild.nodeValue+"\" target=\"_blank\">"+ele.firstChild.nodeValue+"</a>";
  }
  */

  str = "<?xml version=\"1.0\"?><div xmlns=\"http://www.w3.org/1999/xhtml\">"+str+"</div>";
  var doc = (new DOMParser()).parseFromString(str,"text/xml");
  var description = gDialog.tipofthedayrightdescription;
  while (description.hasChildNodes())
    description.removeChild(description.lastChild);
  var body = doc.getElementsByTagName("div")[0];
  for (var i = 0; i < body.childNodes.length; i++) {
    description.appendChild(document.importNode(body.childNodes[i], true));
  }
}

function convertToUnicode(aCharset, aSrc )
{
  // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
  var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  unicodeConverter.charset = aCharset;
  return unicodeConverter.ConvertToUnicode( aSrc );
}

function GetPrefsService()
{
  if (gPrefsService)
    return gPrefsService;

  try {
    gPrefsService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  }
  catch(ex) {
    dump("failed to get prefs service!\n");
  }

  return gPrefsService;
}

function GetPrefs()
{
  if (gPrefsBranch)
    return gPrefsBranch;

  try {
    var prefService = GetPrefsService();
    if (prefService)
      gPrefsBranch = prefService.getBranch(null);

    if (gPrefsBranch)
      return gPrefsBranch;
    else
      dump("failed to get root prefs!\n");
  }
  catch(ex) {
    dump("failed to get root prefs!\n");
  }
  return null;
}
