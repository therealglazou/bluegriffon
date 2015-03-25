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
 * Contributor(s):
 *   Vivien Nicolas <21@vingtetun.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

Components.utils.import("resource://app/modules/XPCOMUtils.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;

const nsBinaryInputStream = Components.Constructor(
                              "@mozilla.org/binaryinputstream;1",
                              "nsIBinaryInputStream", "setInputStream");

const nsConverter = Components.Constructor(
                              "@mozilla.org/intl/scriptableunicodeconverter",
                              "nsIScriptableUnicodeConverter");

/*
 * This component is required on GNU/Linux to open local PHP files in Composer.
 *
 * By default, Composer will refuse to open PHP files because they don't have a text/html MIME type;
 * so let's use a stream I/O to 'convert' an application/x-php MIME type to a text/html one.
 *
 * This component could also be used for text/html files to get rid of the awful
 * hack that is applied to mozilla/content in order to display PHP and comment
 * nodes in the main edition window.
 *
 * Besides, we could use this to edit text/plain files with pseudo syntax highlighting
 * directly in an HTML editor tab.
 * Adding ["text/plain", "*"] to the MIME table works on some Linux distros:
 * e.g. it works on Ubuntu Jaunty but not on Ubuntu Hardy.
 * Last but not least, I'm not sure it would work on Windows and MacOS X.
 * To be tested.
 */

function phpStreamConverter() {
  this._listener = null;
  this._data = "";
  this._path = null;
}

phpStreamConverter.prototype = {

  asyncConvertData: function(aFromType, aToType, aListener, aCtx) {
    this._listener = aListener;
  },
  
  convert: function (aFromStream, aFromType, aToType, aCtx) {
    return aFromStream;
  },

  onStartRequest: function (aRequest, aCtx) {
    var channel = aRequest.QueryInterface(Ci.nsIChannel);

    // Hack the content type under which the document is seen by Composer
    // XXX is there a way to know its charset right now?
    channel.contentType = "text/html";
    this._path = channel.URI.path;

    this._listener.onStartRequest(channel, aCtx);
  },

  onDataAvailable: function (aRequest, aCtx, aInputStream, aOffset, aCount) {
    var binaryInputStream = new nsBinaryInputStream(aInputStream);
    this._data += binaryInputStream.readBytes(binaryInputStream.available());
  },
  
  onStopRequest: function (aRequest, aCtx, aStatusCode) {
    var hasBodyNode = this._data.match(/<html/i)
                      && this._data.match(/<head/i)
                      && this._data.match(/<body/i);

    var charset = "UTF-8";
    var tmp = this._data.match(/charset=([^"\s]+)/i);
    if (tmp && tmp.length > 1)
      charset = tmp[1];
    else try { // no charset found, get the default one (user pref)
      const nsPrefService = Components.interfaces.nsIPrefService;
      const nsStringPref = Components.interfaces.nsISupportsString;
      charset = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(nsPrefService)
                          .getBranch(null)
                          .getComplexValue("editor.custom_charset", nsStringPref)
                          .data;
    } catch(e) {}

    // apply the proper character set
    var converter = new nsConverter();
    converter.charset = charset;
    this._data = converter.ConvertToUnicode(this._data);

    // Do whatever you want with _data!
    // this is also where we could get rid of the awful hack in mozilla/content
    // to display comment/php nodes in the main window

    if (true /*hasBodyNode*/) { // this document should be editable in Composer
      // quick hack to support short tags in PHP files
      this._data = this._data.replace(/<%/g, "<?php").replace(/%>/g, "?>");
      // TODO: check PHP prologs
    }
    else {             // this document is not editable in Composer
      // experimental, ugly hack: embed '_data' in an HTML document
      var fileName = this._path.substring(this._path.lastIndexOf("/") + 1, this._path.length);
      this._data = this._data.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // TODO: syntax highlighting
      this._data = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'
            + '<html xmlns="http://www.w3.org/1999/xhtml">\n'
            + '<head>\n'
            + '  <meta http-equiv="content-type" content="text/html; charset="' + charset + '" />\n'
            + '  <meta id="_moz_text_document" />\n'
            + '  <title>' + fileName + '</title>\n'
            + '</head>\n'
            + '<body>\n'
            + '  <pre>' + this._data + '</pre>\n'
            + '</body>\n'
            + '</html>';
    }

    // Serialise the result back into Composer
    var channel = aRequest.QueryInterface(Ci.nsIChannel);
    var stream = converter.convertToInputStream(this._data);
    this._listener.onDataAvailable(channel, aCtx, stream, 0, stream.available());
    this._listener.onStopRequest(channel, aCtx, aStatusCode);
  },

  //////////////////////////////////////////////////////////////////////////////
  //// nsISupports

  classID: Components.ID("3045D171-BF71-41AD-BD8D-19BFEABFE83B"),

  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIStreamConverter,
    Ci.nsIStreamListener,
    Ci.nsIRequestObserver,
    Ci.nsISupports
  ])
};

let components = [phpStreamConverter];
const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
