Components.utils.import("resource://app/modules/editorHelper.jsm");

var SVGWindow;

function start_svg_edit(aString) {
  function svgEditorReady(event)
  {
    var svgWindow = SVGWindow.document.getElementById("mainIframe")
                      .contentWindow;
    var svgEditor = svgWindow.svgEditor;
    svgEditor.externalSaveHandler = InsertSVGAtSelection;
    if (aString)
      svgEditor.loadFromString(aString)
    else
      svgEditor.resetTransactionManager();
    svgWindow.document.documentElement
      .removeEventListener("svgEditorReady", svgEditorReady, false);
  }

  window.document.documentElement
    .addEventListener("svgEditorReady", svgEditorReady, false);
  var url = "chrome://svg-edit/content/svg-edit.xul";
  SVGWindow = window.openDialog(url, "_blank",
          "menubar=yes,toolbar=no,resizable=yes,sizemode=normal,dialog=no");
}

function InsertSVGAtSelection(aString)
{
  var editor = EditorUtils.getCurrentEditor();
  var isHTML = !EditorUtils.isXHTMLDocument();
  if (isHTML)
    editor.beginTransaction();

  var svgDocument = (new DOMParser()).parseFromString(aString, "application/xml")
  var doc = EditorUtils.getCurrentDocument();
  var node = doc.importNode(svgDocument.documentElement, true);
  editor.insertElementAtSelection(node, true);

  if (isHTML) {
    var l = doc.querySelector("link[rel='force-svg']");
    if (!l) {
      var head = doc.querySelector("head");
      l = doc.createElement("link");
      l.setAttribute("rel", "force-svg");
      l.setAttribute("href", "http://berjon.com/blog/2009/07/force-svg.html");
      editor.insertNode(l, head, head.childNodes.length);

      var s = doc.createElement("script");
      s.setAttribute("type", "application/javascript");
      var text = doc.createTextNode("(" + _ForceSVGInHTML.toString() + ")();");
      s.appendChild(text);
      editor.insertNode(s, head, head.childNodes.length);
    }
  }
  if (isHTML)
    editor.endTransaction();
}

var _ForceSVGInHTML= function()
{
  function ForceSVGInHTML()
  {
    window.removeEventListener("load", ForceSVGInHTML, true);
    var svgs = document.getElementsByTagName("svg");
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      var div = document.createElement("div");
      div.appendChild(svg.cloneNode(true));
      var dom = (new DOMParser()).parseFromString(div.innerHTML, "application/xml");
      svg.parentNode.replaceChild(document.importNode(dom.documentElement, true), svg);
    }
  }
  window.addEventListener("load", ForceSVGInHTML, true);
}

var Base64 = {
 
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
  // public method for encoding
  encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = Base64._utf8_encode(input);
 
    while (i < input.length) {
 
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
 
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
 
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
 
      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
    }
 
    return output;
  },
 
  // public method for decoding
  decode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
    while (i < input.length) {
 
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
 
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
 
      output = output + String.fromCharCode(chr1);
 
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
 
    }
 
    output = Base64._utf8_decode(output);
 
    return output;
 
  },
 
  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
 
    for (var n = 0; n < string.length; n++) {
 
      var c = string.charCodeAt(n);
 
      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
 
    }
 
    return utftext;
  },
 
  // private method for UTF-8 decoding
  _utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;
 
    while ( i < utftext.length ) {
 
      c = utftext.charCodeAt(i);
 
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
 
    }
 
    return string;
  }
 
}
