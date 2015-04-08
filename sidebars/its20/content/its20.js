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
 * The Original Code is ITS 2.0 Panel for BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SAS.
 * Portions created by the Initial Developer are Copyright (C) 2013
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *     on behalf of DFKI
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

Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

const kIOServiceCID       = "@mozilla.org/network/io-service;1";
const kFileInputStreamCID = "@mozilla.org/network/file-input-stream;1";
const kScriptableInputCID = "@mozilla.org/scriptableinputstream;1";

const nsIIOService             = Components.interfaces.nsIIOService;
const nsIFileInputStream       = Components.interfaces.nsIFileInputStream;
const nsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream;

const kITS_NAMESPACE = "http://www.w3.org/2005/11/its";
const kITS_OWNER_ELEMENTS_SELECTOR = "link[rel='its-rules' i], script[type='application/its+xml' i]";

var gMain = null;
var gCurrentElement = null, gLastElement = null;
var gLinks = [];
var gLinksDocuments = [];

var gIsPanelActive = true;

var gPrefs = null;

function Startup()
{
  GetUIElements();

  gPrefs = GetPrefs();

  if (window.top &&
      "NotifierUtils" in window.top)
    gMain = window.top;
  else if (window.top && window.top.opener &&
           "NotifierUtils" in window.top.opener)
    gMain = window.top.opener;

  if (!gMain)
    return;
  
  gMain.NotifierUtils.addNotifierCallback("selection",
                                          SelectionChanged,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("tabClosed",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("tabCreated",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("tabSelected",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("afterEnteringSourceMode",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("afterLeavingSourceMode",
                                          Inspect,
                                          window);

  gMain.NotifierUtils.addNotifierCallback("redrawPanel",
                                          RedrawAll,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("panelClosed",
                                          PanelClosed,
                                          window);
  window.addEventListener("resize", OnResizeEvent, false);
  Inspect();
  if (gMain && gMain.EditorUtils && gIsPanelActive &&
      gMain.EditorUtils.getCurrentEditor()) {
    var c = gMain.EditorUtils.getSelectionContainer();
    if (c)
      SelectionChanged(null, c.node, c.oneElementSelected);
  }
}

function Shutdown()
{
  if (gMain)
  {
    window.removeEventListener("resize", OnResizeEvent, false);

    gMain.NotifierUtils.removeNotifierCallback("selection",
                                               SelectionChanged,
                                               window);
    gMain.NotifierUtils.removeNotifierCallback("tabClosed",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("tabCreated",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("tabSelected",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("afterEnteringSourceMode",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("afterLeavingSourceMode",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("redrawPanel",
                                                RedrawAll,
                                                window);
    gMain.NotifierUtils.removeNotifierCallback("panelClosed",
                                                PanelClosed,
                                                window);
  }
}

function Inspect()
{
  if (gMain && gMain.EditorUtils)
  {
    var editor = gMain.EditorUtils.getCurrentEditor();
    var visible = editor && (gMain.GetCurrentViewMode() == "wysiwyg");
    gDialog.mainBox.style.visibility = visible ? "" : "hidden";
    if (visible) {
      var node = EditorUtils.getSelectionContainer().node;
      if (node) {
        SelectionChanged(null, node, true);
      }
    }
  }
}

function RedrawAll(aNotification, aPanelId)
{
  if (aPanelId == "panel-cssproperties") {
    gIsPanelActive = true;
    if (gCurrentElement) {
      // force query of all properties on the current element
      SelectionChanged(null, gCurrentElement, true);
    }
  }
}

function PanelClosed(aNotification, aPanelId)
{
  if (aPanelId == "panel-cssproperties")
    gIsPanelActive = false;
}

function SelectionChanged(aArgs, aElt, aOneElementSelected)
{
  if (!gIsPanelActive) {
    gCurrentElement = aElt;
    return;
  }

  gCurrentElement = aElt;

  // let's find all the global ITS rules linked from the document
  var doc = gCurrentElement.ownerDocument;
  var links = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var linksArray = [];
  // gather all the hrefs
  for (let source of links) {
    linksArray.push(("link" == source.localName) 
                    ? source.getAttribute("href")
                    : source.textContent); // TODO issue with xhtml5 documents...
  }

  // let's skip the dowload and parsing process if we can 
  if (gLastElement != gCurrentElement || (gLinks < linksArray) || (gLinks > linksArray)) { // tables are not equal
    gLinks = [];
    gLinks = gLinks.concat(linksArray);
    ParseITSRulesDocuments(links, gCurrentElement, doc);
    ReflowGlobalRulesInUI(gCurrentElement, true, null);
  }
  // else // we still need to reflow

  // show the selection's container in the info box
  gDialog.currentElementBox.setAttribute("value",
       "<" + gCurrentElement.localName +
       (gCurrentElement.id ? " id='" + gCurrentElement.id + "'" : "") +
       (gCurrentElement.className ? " class='" + gCurrentElement.className + "'" : "") +
       ">" +
       gCurrentElement.innerHTML.substr(0, 100));
  gLastElement = gCurrentElement;
}


function ParseITSRulesDocuments(aLinksArray, aElt)
{
  // reset
  gLinksDocuments = [];

  // browser the array of rel='its-rules' links
  for (var source of aLinksArray) {
    // de we already have an ITS doc attached?
    var itsDoc = source.getUserData("itsRules");
    if (!itsDoc) { // nope...
      if ("link" == source.localName) {
        var href = source.href;
        var url = UrlUtils.newURI(href).QueryInterface(Components.interfaces.nsIURL);
        if (url.scheme == "http") 
          LoadRemoteResource(source, url, aElt);
        else  if (url.scheme == "file") 
          LoadLocalResource(source, url, aElt);
        else {
          var cannotLoad = source.getUserData("cannotLoad");
          if (!cannotLoad) {
            source.getUserData("cannotLoad", true, null);
            DisposableAlert(window,
                            gDialog.its20Bundle.getString("LoadError"),
                            gDialog.its20Bundle.getString("CannotFetch") + "\n" + href,
                            href);
          }
        }
      }
      else { // inline ITS rules inside a <script> element... Urgh...
        try {
          // painful case of an XHTML document; the elements are parsed by the xml parser
          var str = "";
          var ele = source.firstElementChild;
          if (ele
              && ele == source.lastElementChild) {
            if (ele.localName == "rules"
                && ele.namespaceURI == kITS_NAMESPACE
                && ele.getAttribute("version") == "2.0") {
              var oSerializer = new XMLSerializer();
              str = oSerializer.serializeToString(ele);
              var inputEncoding = source.ownerDocument.inputEncoding;
              if ("windows-1252" == inputEncoding)
                inputEncoding = "iso-8859-1"; // https://bugzilla.mozilla.org/show_bug.cgi?id=890478
              str = '<?xml version="1.0" encoding="' + inputEncoding + '"?>\n' + str;
            }
            else
              throw gDialog.its20Bundle.getString("NotITS");
          }
          else // the global rules are inline as text in the script element
            str = convertToUnicode("UTF-8", source.textContent);
          // assume XML and parse the string
          var parser = new DOMParser();
          var doc = parser.parseFromString(str, "text/xml");
          ele = doc.documentElement;
          // is it an ITS 2.0 document?
          if (ele.localName != "rules"
              || ele.namespaceURI != kITS_NAMESPACE
              || ele.getAttribute("version") != "2.0")
            throw gDialog.its20Bundle.getString("NotITS");
          // store the ITS document into the link element's user data
          source.setUserData("itsRules", doc, null);
          // show global rules' effect in local tab
          //ShowGlobalRulesInUI(doc, aElt);
        }
        catch (e) {
          DisposableAlert(window,
                          gDialog.its20Bundle.getString("InlineParseError"),
                          e,
                          "");
        }
      }
    }
  }
}

function Loading(aStartLoading)
{
  // we show the throbber only when needed
  var loads = parseInt(gDialog.loadingBox.getAttribute("loads"));
  loads += (aStartLoading ? +1 : -1);
  // i.e. when loads is "0"
  gDialog.loadingBox.setAttribute("loads", loads);
}

function LoadLocalResource(aLink, aURL, aElt)
{
  // show the throbber
  Loading(true);

  try
  {
    var ioService = Components.classes[kIOServiceCID].getService(nsIIOService);
    var chann = ioService.newChannelFromURI(aURL);
    var inputStream = Components.classes[kFileInputStreamCID].createInstance(nsIFileInputStream);
    var sis = Components.classes[kScriptableInputCID].createInstance(nsIScriptableInputStream);

    // load the file's contents into str
    // TODO: verify is file exists and is readable
    sis.init(chann.open());
    var str = sis.read(sis.available());
    sis.close();
    str = convertToUnicode("UTF-8",str);
    // assume XML and parse the string
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, "text/xml");
    var ele = doc.documentElement;
    // is it an ITS 2.0 document?
    if (ele.localName != "rules"
        || ele.namespaceURI != kITS_NAMESPACE
        || ele.getAttribute("version") != "2.0")
      throw gDialog.its20Bundle.getString("NotITS");
    // yes it is, strop the throbber
    Loading(false);
    // store the ITS document into the link element's user data
    aLink.setUserData("itsRules", doc, null);
    // show global rules' effect in local tab
    //ShowGlobalRulesInUI(doc, aElt);
  }
  catch(e) {
    // ooops...
    Loading(false);
    DisposableAlert(window,
                    gDialog.its20Bundle.getString("LoadError"),
                    e,
                    aURL.spec);
  }
}

function convertToUnicode(aCharset, aSrc)
{
  // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
  var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                                   .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  unicodeConverter.charset = aCharset;
  return unicodeConverter.ConvertToUnicode( aSrc );
}

function ExpandParameters(aSelector, aITSDoc)
{
  var rv = aSelector;
  var params = aITSDoc.querySelectorAll("param");
  for (var param of params) {
    var name = param.getAttribute("name");
    if (rv.indexOf("$" + name)) {
      var r = new RegExp("\\$" + name, "g");
      rv = rv.replace(r, param.textContent);
    }
  }
  return rv;
}

function ShowGlobalRulesInUI(aDoc, aElt, aFilters)
{
  // we accept both XPath and CSS
  var queryLanguage =  (aDoc.documentElement.getAttribute("queryLanguage") == "css")
                        ? "css"
                        : "xpath";

  // init the attribute values
  var translate = "";
  var locNote = "", locNoteRef = "", locNoteType = "";
  var term = "", termInfoRef = "";
  switch (queryLanguage) {
    case "css":
      {
        // find all translate rules
        if (aFilters.indexOf("translateRule") != -1) {
          var translateRules = null;
          try {
            translateRules = aDoc.querySelectorAll("translateRule");
          }
          catch(e) {
            if (aElt == gCurrentElement)
              DisposableAlert(window,
                              gDialog.its20Bundle.getString("CSSParsingError"),
                              gDialog.its20Bundle.getString("CannotResolveCSS") + " " + selector,
                              selector,
                              true);
          }
          if (translateRules)
            for (var translateRule of translateRules) {
              // get the selector
              var selector = ExpandParameters(translateRule.getAttribute("selector"), aDoc);
              // does the current element match?
              if (aElt.mozMatchesSelector(selector)) // yep...
                translate = translateRule.getAttribute("translate").toLowerCase();
            }
        }

        // find all locNote rules
        if (aFilters.indexOf("locNoteRule") != -1) {
          var locNoteRules = null;
          try {
            locNoteRules = aDoc.querySelectorAll("locNoteRule");
          }
          catch(e) {
            if (aElt == gCurrentElement)
              DisposableAlert(window,
                              gDialog.its20Bundle.getString("CSSParsingError"),
                              gDialog.its20Bundle.getString("CannotResolveCSS") + " " + selector,
                              selector,
                              true);
          }
          if (locNoteRules)
            for (var locNoteRule of locNoteRules) {
              // get the selector and the rest
              var selector = ExpandParameters(locNoteRule.getAttribute("selector"), aDoc);
              // does the current element match?
              if (aElt.mozMatchesSelector(selector)) { // yep...
                locNoteType = locNoteRule.getAttribute("locNoteType").toLowerCase();
                if (locNoteRule.firstElementChild
                    && locNoteRule.firstElementChild.localName == "locNote"
                    && locNoteRule.firstElementChild.namespaceURI == kITS_NAMESPACE) {
                  locNote = locNoteRule.firstElementChild.innerHTML;
                  locNoteRef = "";
                }
                else if (locNoteRule.hasAttribute("locNoteRef")) {
                  locNote = "";
                  locNoteRef = locNoteRule.getAttribute("locNoteRef")
                }
              }
            }
        }

        // find all termRule rules
        if (aFilters.indexOf("termRule") != -1) {
          var termRules = null;
          try {
            termRules = aDoc.querySelectorAll("termRule");
          }
          catch(e) {
            if (aElt == gCurrentElement)
              DisposableAlert(window,
                              gDialog.its20Bundle.getString("CSSParsingError"),
                              gDialog.its20Bundle.getString("CannotResolveCSS") + " " + selector,
                              selector,
                              true);
          }
          if (termRules)
            for (var termRule of termRules) {
              // get the selectortermRule
              var selector = ExpandParameters(termRule.getAttribute("selector"), aDoc);
              // does the current element match?
              if (aElt.mozMatchesSelector(selector)) { // yep...
                term = termRule.getAttribute("term").toLowerCase();
                termInfoRef = termRule.getAttribute("termInfoRef");
              }
            }
        }
      }
      break;

    case "xpath":
      {
        // find all translate rules
        if (aFilters.indexOf("translateRule") != -1) {
          var translateRules = aDoc.querySelectorAll("translateRule");
          for (var translateRule of translateRules) {
            // get the selector
            var selector = ExpandParameters(translateRule.getAttribute("selector"), aDoc);
            // we need a namespace resolver for the prefixes in XPath
            var nsResolver = aElt.ownerDocument.createNSResolver(translateRule);
  
            // get a snapshot of matching elements
            var matches = null;
            try {
	            matches = aElt.ownerDocument.evaluate(selector,
	                                                      aElt.ownerDocument,
	                                                      nsResolver,
	                                                      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
	                                                      null);
	            }
            catch(e) {
              if (aElt == gCurrentElement)
                DisposableAlert(window,
                                gDialog.its20Bundle.getString("XPathParsingError"),
                                gDialog.its20Bundle.getString("CannotResolveXPath") + " " + selector,
                                selector,
                                true);
            }
            // is our current element in the results?
            if (matches && matches.snapshotLength) {
              for (var i = 0; i < matches.snapshotLength; i++) {
                if (matches.snapshotItem(i) == aElt) { // yes it is!
                  translate = translateRule.getAttribute("translate").toLowerCase();
                  break;
                }
              }
            }
          }
        }

        // find all locNote rules
        if (aFilters.indexOf("locNoteRule") != -1) {
          var locNoteRules = aDoc.querySelectorAll("locNoteRule");
          for (var locNoteRule of locNoteRules) {
            // get the selector and the rest
            var selector = ExpandParameters(locNoteRule.getAttribute("selector"), aDoc);
            // we need a namespace resolver for the prefixes in XPath
            var nsResolver = aElt.ownerDocument.createNSResolver(locNoteRule);
  
            // get a snapshot of matching elements
            var matches = null;
            try {
              matches = aElt.ownerDocument.evaluate(selector,
                                                        aElt.ownerDocument,
                                                        nsResolver,
                                                        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                                        null);
              }
            catch(e) {
              if (aElt == gCurrentElement)
                DisposableAlert(window,
                                gDialog.its20Bundle.getString("XPathParsingError"),
                                gDialog.its20Bundle.getString("CannotResolveXPath") + " " + selector,
                                selector,
                                true);
            }
            // is our current element in the results?
            if (matches && matches.snapshotLength) {
              for (var i = 0; i < matches.snapshotLength; i++) {
                if (matches.snapshotItem(i) == aElt) { // yes it is!
                  locNoteType = locNoteRule.getAttribute("locNoteType").toLowerCase();
                  if (locNoteRule.firstElementChild
                      && locNoteRule.firstElementChild.localName == "locNote"
                      && locNoteRule.firstElementChild.namespaceURI == kITS_NAMESPACE) {
                    locNote = locNoteRule.firstElementChild.innerHTML;
                    locNoteRef = "";
                  }
                  else if (locNoteRule.hasAttribute("locNoteRef")) {
                    locNote = "";
                    locNoteRef = locNoteRule.getAttribute("locNoteRef")
                  }
                  break;
                }
              }
            }
          }
        }

        // find all termRule rules
        if (aFilters.indexOf("termRule") != -1) {
          var termRules = aDoc.querySelectorAll("termRule");
          for (var termRule of termRules) {
            // get the selector
            var selector = ExpandParameters(termRule.getAttribute("selector"), aDoc);
            // we need a namespace resolver for the prefixes in XPath
            var nsResolver = aElt.ownerDocument.createNSResolver(termRule);
  
            // get a snapshot of matching elements
            var matches = null;
            try {
              matches = aElt.ownerDocument.evaluate(selector,
                                                        aElt.ownerDocument,
                                                        nsResolver,
                                                        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                                        null);
              }
            catch(e) {
              if (aElt == gCurrentElement)
                DisposableAlert(window,
                                gDialog.its20Bundle.getString("XPathParsingError"),
                                gDialog.its20Bundle.getString("CannotResolveXPath") + " " + selector,
                                selector,
                                true);
            }
            // is our current element in the results?
            if (matches && matches.snapshotLength) {
              for (var i = 0; i < matches.snapshotLength; i++) {
                if (matches.snapshotItem(i) == aElt) { // yes it is!
                  term = termRule.getAttribute("term").toLowerCase();
                  termInfoRef = termRule.getAttribute("termInfoRef");
                  break;
                }
              }
            }
          }
        }

      }
      break;

    default: break;      
  }

  // show the global rules' impact in local for Translate
  if (aFilters.indexOf("translateRule") != -1) {
    Toggle(gDialog.translateYesButton,     "yes" == translate);
    Toggle(gDialog.translateNoButton,  "no"  == translate);
  }

  // show the global rules' impact in local for Localization Note
  if (aFilters.indexOf("locNoteRule") != -1) {
    Toggle(gDialog.descriptionLocNoteTypeButton, "description" == locNoteType);
    Toggle(gDialog.alertLocNoteTypeButton,       "alert"  == locNoteType);
    if (locNote) {
      gDialog.locNoteRadio.parentNode.selectedItem = gDialog.locNoteRadio;
      gDialog.locNoteTextbox.value = locNote;
      gDialog.locNoteRefMenulist.value = "";
    }
    else if (locNoteRef) {
      gDialog.locNoteRadio.parentNode.selectedItem = gDialog.locNoteRefRadio;
      gDialog.locNoteTextbox.value = "";
      gDialog.locNoteRefMenulist.value = locNoteRef;
    }
  }

  // show the global rules' impact in local for Terminology Note
  if (aFilters.indexOf("termRule") != -1) {
    if (term) {
      Toggle(gDialog.yesTermTerminologyButton, "yes" == term);
      Toggle(gDialog.noTermTerminologyButton,  "no"  == term);
      gDialog.termInfoRefMenulist.value = termInfoRef;
      gDialog.termConfidenceCheckbox.checked = false;
      gDialog.termConfidenceScale.disabled = true;
      gDialog.termConfidenceTextbox.disabled = true;
    }
  }
}

function ReflowGlobalRulesInUI(aElt, aForCurrentElementOnly, aFilter)
{
  // sanity case, did the currently selected element change while we
  // were waiting for the XHR to end?
  if (aForCurrentElementOnly && gCurrentElement != aElt)
    return;

  var filters = aFilter ? aFilter : kIMPLEMENTED_RULES;
 //reset
  // show the local values
  if (aForCurrentElementOnly) {
     for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      switch (filter) {
        case "annotatorsRef": AnnotatorsRefSectionResetter(); break;
        case "translateRule": TranslateSectionResetter(); break;
        case "locNoteRule":   LocNoteSectionResetter(); break;
        case "termRule":      TermSectionResetter(); break;
        case "global":        GlobalResetter(); break;

        default: break; // should never happen
      }
    }
  }

  // reflow all ITS global rules in document traversal order
  var links = aElt.ownerDocument.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  for (var link of links) {
    var itsDoc = link.getUserData("itsRules");
    // do nothing if the ITS doc is not loaded yet or not found
    if (itsDoc)
      ShowGlobalRulesInUI(itsDoc,
                          aElt,
                          aFilter
                            ? aFilter
                            : kIMPLEMENTED_RULES);
  }
  // show the local values
   for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    switch (filter) {
      case "annotatorsRef": AnnotatorsRefSectionIniter(aElt); break;
      case "translateRule": TranslateSectionIniter(aElt); break;
      case "locNoteRule":   LocNoteSectionIniter(aElt); break;
      case "termRule":      TermSectionIniter(aElt); break;
      case "global":
        if (aForCurrentElementOnly)
          GlobalIniter(aElt);
        break;

      default: break; // should never happen
    }
  }
}

function LoadRemoteResource(aLink, aURL, aElt)
{
  // start the throbber
  Loading(true);

  // we're going to fetch the resource through an XHR
  var req = new XMLHttpRequest();
  // we use a trailing unique param to be sure we bypass the cache 
  req.open('GET', aURL.spec + "?time=" + Date.parse(new Date()), true);
  // the following does not hurt either 
  req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

  // load listener
  req.onload = function() {

    // stop the throbber
    Loading(false);

    // do we have an ITS 2.0 document?
    if (req.responseXML
        && req.responseXML.documentElement.nodeName.toLowerCase() == "rules"
        && req.responseXML.documentElement.getAttribute("version") == "2.0"
        && req.responseXML.documentElement.namespaceURI == kITS_NAMESPACE) { // yep!
      // store the ITS doc as a use data of the link element
      aLink.setUserData("itsRules", req.responseXML, null);
      // and reflow the local panel
      ReflowGlobalRulesInUI(aElt, true, null);
      return;
    }
    // maybe the server responded the wrong MIME type?
    if (req.responseText) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(req.responseText, "text/xml");
      var ele = doc.documentElement;
      if (ele.localName == "rules"
          && ele.namespaceURI == kITS_NAMESPACE
          && ele.getAttribute("version") == "2.0") { // yes that's ITS 2.0
        aLink.setUserData("itsRules", doc, null);
        ReflowGlobalRulesInUI(aElt, true, null);
        return;
      }
    }

    // oops....
    DisposableAlert(window,
                    gDialog.its20Bundle.getString("LoadError"),
                    gDialog.its20Bundle.getString("NotITS") + "\n" + aURL.spec,
                    aURL.spec);
  };

  // error listener
  req.onerror = function(){
     Loading(false);
     DisposableAlert(window,
                     gDialog.its20Bundle.getString("LoadError"),
                     gDialog.its20Bundle.getString("CannotFetch") + "\n" + aURL.spec,
                     aURL.spec);
 }
  req.send(null);
}

/* the following is a workaround for a painful related to listbox elements
 * inside a floating panel, flexing columns not being resized correctly when
 * the window shrinks
 */
var gResizeTimeOut = 0;
function OnResizeEvent(aEvent)
{
  if (aEvent.target.document.location.href == "chrome://its20/content/its20.xul"
      && "rulesetsBox" in gDialog) {
    if (gResizeTimeOut)
      clearTimeout(gResizeTimeOut);
    gResizeTimeOut = setTimeout(_onResizeEvent, 100);
  }
}

function _onResizeEvent()
{
  gResizeTimeOut = 0;
  gDialog.rulesetsBox.setAttribute("style", "overflow: hidden");
  gDialog.rulesBox.setAttribute("style", "overflow: hidden");
  gDialog.paramsBox.setAttribute("style", "overflow: hidden");
  setTimeout(function() {
    gDialog.rulesetsBox.removeAttribute("style");
    gDialog.rulesBox.removeAttribute("style");
    gDialog.paramsBox.removeAttribute("style");}, 100);
}

/*
 * we maintain a non persistent list of URLs that should not trigger a warning
 * when the application has a problem loading or parsing them
 */
var NoWarnList = [];

function DisposableAlert(aParent, aDialogTitle, aText, aHref, aIsSelector)
{
  // early way out if we're already in the no-warning list
  if (NoWarnList.indexOf(aHref) != -1)
    return;

  // show a dialog with a checkbox
  var rv = {value: false};
  PromptUtils.alertCheck(aParent, aDialogTitle, aText,
                           aIsSelector
                           ? gDialog.its20Bundle.getString("DontWarnAgainForSelector")
                           : (aHref
                              ? gDialog.its20Bundle.getString("DontWarnAgainForUrl")
                              : gDialog.its20Bundle.getString("DontWarnAgainForInline")),
                            rv);
  // yes, user wants to add that URL to the no-warning list...
  if (rv.value)
    NoWarnList.push(aHref);
}

/* for a given ITS rule type, get the main value we show in the bottommost list
 * of the global.xul overlay
 */
function GetMainValueFromITSRule(aRule)
{
  var rv = "";
  switch (aRule.localName) {
    case "translateRule":           rv = aRule.getAttribute("translate"); break;
    case "locNoteRule":             rv = aRule.getAttribute("locNoteType"); break;
    case "termRule":                rv = aRule.getAttribute("term"); break;
    case "dirRule":                 rv = aRule.getAttribute("dir"); break;
    case "langRule":                rv = aRule.getAttribute("langPointer"); break;
    case "withinTextRule":          rv = aRule.getAttribute("withinText"); break;
    case "domainRule":              rv = aRule.getAttribute("domainPointer"); break;
    case "textAnalysisRule":        rv = ""; break;
    case "localeFilterRule":        rv = aRule.getAttribute("localeFilterList"); break;
    case "provRule":                rv = aRule.getAttribute("provenanceRecordsRefPointer"); break;
    case "externalResourceRefRule": rv = aRule.getAttribute("externalResourceRefPointer"); break;
    case "targetPointerRule":       rv = aRule.getAttribute("targetPointer"); break;
    case "idValueRule":             rv = aRule.getAttribute("idValue"); break;
    case "preserveSpaceRule":       rv = aRule.getAttribute("space"); break;
    case "locQualityIssueRule":     rv = ""; break;
    case "mtConfidenceRule":        rv = aRule.getAttribute("mtConfidence"); break;
    case "allowedCharactersRule":   rv = aRule.hasAttribute("allowedCharacters")
                                         ? aRule.getAttribute("allowedCharacters")
                                         : aRule.getAttribute("allowedCharactersPointer"); break;
    case "storageSizeRule":         rv = aRule.hasAttribute("storageSize")
                                         ? aRule.getAttribute("storageSize")
                                         : aRule.getAttribute("storageSizePointer"); break;

    default: break;
  }
  return rv;
}