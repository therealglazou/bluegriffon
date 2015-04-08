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

var EXPORTED_SYMBOLS = ["EditorUtils"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");
//Components.utils.import("resource://app/modules/cssHelper.jsm");

var EditorUtils = {

  nsIDOMNode: Components.interfaces.nsIDOMNode,

  mActiveViewActive: false,
  mAtomService: null,

  /********** PUBLIC **********/

  getCurrentEditorWindow: function getCurrentEditorWindow()
  {
    try {
      var windowManager = Services.wm;
      return windowManager.getMostRecentWindow("bluegriffon") ||
             windowManager.getMostRecentWindow("BlueGriffon:MacCmdLineFwd");
    }
    catch(e){}
    return null;
  },

  getCurrentTabEditor: function getCurrentTabEditor()
  {
    try {
      var tmpWindow = this.getCurrentEditorWindow();
      if (tmpWindow) {
        var tabeditor = tmpWindow.document.getElementById("tabeditor");
        if (tabeditor)
          return tabeditor;
      }
    }
    catch(e)
    {
    }
  
    return null;
  },
  
  getCurrentEditorElement: function getCurrentEditorElement()
  {
    var tabeditor = this.getCurrentTabEditor();
    if (tabeditor)
      return tabeditor.getCurrentEditorElement() ;
    return null;
  },  

  getCurrentViewMode: function getCurrentViewMode()
  {
    return this.getCurrentEditorElement().parentNode.getAttribute("currentmode") ||
           "wysiwyg";
  },

  getCurrentSourceEditorElement: function()
  {
    var editorElement = this.getCurrentEditorElement();
    if (editorElement) {
      return editorElement.previousSibling;
    }
    return null;
  },

  getCurrentSourceWindow: function()
  {
    var editorElement = this.getCurrentEditorElement();
    if (editorElement) {
      var bespinIframe = editorElement.previousSibling;
      var bespinWindow = bespinIframe.contentWindow.wrappedJSObject;
      return bespinWindow;
    }
    return null;
  },

  getCurrentSourceEditor: function()
  {
    var editorElement = this.getCurrentEditorElement();
    if (editorElement) {
      var bespinIframe = editorElement.previousSibling;
      var bespinEditor = bespinIframe.contentWindow.wrappedJSObject.gEditor;
      return bespinEditor;
    }
    return null;
  },

  getCurrentEditor: function getCurrentEditor()
  {
    // Get the active editor from the <editor> tag
    var editor = null;
    try {
      var editorElement = this.getCurrentEditorElement();
      if (editorElement)
      {
        editor = editorElement.getEditor(editorElement.contentWindow);
    
        // Do QIs now so editor users won't have to figure out which interface to use
        // Using "instanceof" does the QI for us.
        editor instanceof Components.interfaces.nsIEditor;
        editor instanceof Components.interfaces.nsIPlaintextEditor;
        editor instanceof Components.interfaces.nsIHTMLEditor;
      }
    } catch (e) { }
  
    return editor;
  },

  getCurrentDocument: function getCurrentDocument()
  {
    // Get the active editor from the <editor> tag
    var editor = this.getCurrentEditor();
    if (editor)
      return editor.document;
    return null;
  },
  
  getCurrentCommandManager: function getCurrentCommandManager()
  {
    try {
      return this.getCurrentEditorElement().commandManager;
    } catch (e) { }

    return null;
  },
  
  newCommandParams: function newCommandParams()
  {
    try {
      const contractId = "@mozilla.org/embedcomp/command-params;1";
      const nsICommandParams = Components.interfaces.nsICommandParams;

      return Components.classes[contractId].createInstance(Components.interfaces.nsICommandParams);
    }
    catch(e) { }
    return null;
  },

  getCurrentEditingSession: function getCurrentEditingSession()
  {
    try {
      return this.getCurrentEditorElement().editingSession;
    } catch (e) { }

    return null;
  },

  getCurrentEditorType: function getCurrentEditorType()
  {
    try {
      return this.getCurrentEditorElement().editortype;
    } catch (e) { }

    return "";
  },

  isAlreadyEdited: function isAlreadyEdited(aURL)
  {
    Components.utils.import("resource://app/modules/urlHelper.jsm");
    // blank documents are never "already edited"...
    if (UrlUtils.isUrlOfBlankDocument(aURL))
      return null;
  
    var url = UrlUtils.newURI(aURL).spec;
  
    var enumerator = Services.wm.getEnumerator( "bluegriffon" );
    while ( enumerator.hasMoreElements() )
    {
      var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
      try {
        var mixed = win.gDialog.tabeditor.isAlreadyEdited(url);
        if (mixed)
          return {window: win, editor: mixed.editor, index: mixed.index};
      }
      catch(e) {}
    }
    return null;
  },

  isDocumentEditable: function isDocumentEditable()
  {
    try {
      return this.getCurrentEditor().isDocumentEditable;
    } catch (e) { }
    return false;
  },

  isDocumentModified: function isDocumentModified()
  {
    try {
      if (this.getCurrentEditor().documentModified)
        return true;
      if (this.getCurrentSourceWindow().GetModificationCount())
        return true;
    } catch (e) { }
    return false;
  },

  isDocumentEmpty: function isDocumentEmpty()
  {
    try {
      return this.getCurrentEditor().documentIsEmpty;
    } catch (e) { }
    return false;
  },

  getDocumentTitle: function getDocumentTitle()
  {
    try {
      return this.getCurrentDocument().title;
    } catch (e) { }

    return "";
  },

  isHTMLEditor: function isHTMLEditor()
  {
    // We don't have an editorElement, just return false
    if (!this.getCurrentEditorElement())
      return false;

    var editortype = this.getCurrentEditorType();
    switch (editortype)
    {
        case "html":
        case "htmlmail":
          return true;

        case "text":
        case "textmail":
          return false

        default:
          break;
    }
    return false;
  },

  isEditingRenderedHTML: function isEditingRenderedHTML()
  {
    return this.isHTMLEditor(); // && !this.isInHTMLSourceMode();
  },

  setDocumentTitle: function setDocumentTitle(title)
  {
    try {
      this.getCurrentEditor().setDocumentTitle(title);

      // Update window title (doesn't work if called from a dialog)
      if ("UpdateWindowTitle" in window)
        window.UpdateWindowTitle();
      else if ("UpdateWindowTitle" in window.opener)
        window.opener.UpdateWindowTitle();
    } catch (e) { }
  },

  getSelectionContainer: function getSelectionContainer()
  {
    var editor = this.getCurrentEditor();
    if (!editor) return null;

    try {
      var selection = editor.selection;
      if (!selection) return null;
    }
    catch (e) { return null; }

    var result = { oneElementSelected:false };

    if (selection.isCollapsed) {
      result.node = selection.focusNode;
    }
    else {
      var rangeCount = selection.rangeCount;
      if (rangeCount == 1) {
        result.node = editor.getSelectedElement("");
        var range = selection.getRangeAt(0);

        // check for a weird case : when we select a piece of text inside
        // a text node and apply an inline style to it, the selection starts
        // at the end of the text node preceding the style and ends after the
        // last char of the style. Assume the style element is selected for
        // user's pleasure
        if (!result.node &&
            range.startContainer.nodeType == this.nsIDOMNode.TEXT_NODE &&
            range.startOffset == range.startContainer.length &&
            range.endContainer.nodeType == this.nsIDOMNode.TEXT_NODE &&
            range.endOffset == range.endContainer.length &&
            range.endContainer.nextSibling == null &&
            range.startContainer.nextSibling == range.endContainer.parentNode)
          result.node = range.endContainer.parentNode;

        if (!result.node) {
          // let's rely on the common ancestor of the selection
          result.node = range.commonAncestorContainer;
        }
        else {
          result.oneElementSelected = true;
        }
      }
      else {
        // assume table cells !
        var i, container = null;
        for (i = 0; i < rangeCount; i++) {
          range = selection.getRangeAt(i);
          if (!container) {
            container = range.startContainer;
          }
          else if (container != range.startContainer) {
            // all table cells don't belong to same row so let's
            // select the parent of all rows
            result.node = container.parentNode;
            break;
          }
          result.node = container;
        }
      }
    }

    // make sure we have an element here
    while (result.node.nodeType != this.nsIDOMNode.ELEMENT_NODE)
      result.node = result.node.parentNode;

    // and make sure the element is not a special editor node like
    // the <br> we insert in blank lines
    // and don't select anonymous content !!! (fix for bug 190279)
    editor instanceof Components.interfaces.nsIHTMLEditor;
    while (result.node.hasAttribute("_moz_editor_bogus_node") ||
           editor.isAnonymousElement(result.node))
      result.node = result.node.parentNode;

    return result;
  },

  getMetaElement: function getMetaElement(aName)
  {
    if (aName)
    {
      var name = aName.toLowerCase();
      try {
        var metanodes = this.getCurrentDocument()
                          .getElementsByTagName("meta");
        for (var i = 0; i < metanodes.length; i++)
        {
          var metanode = metanodes.item(i);
          if (metanode && metanode.getAttribute("name") == name)
            return metanode;
        }
      }
      catch(e) {}
    }
    return null;
  },

  createMetaElement: function createMetaElement(aName)
  {
    var editor = this.getCurrentEditor();
    try {
      var metanode = editor.createElementWithDefaults("meta");
      metanode.setAttribute("name", aName);
      return metanode;
    }
    catch(e) {}
    return null;
  },

  insertMetaElement: function insertMetaElement(aElt, aContent, aInsertNew, aPrepend)
  {
   if (aElt)
   {
     var editor = this.getCurrentEditor();
     try {
       if (!aContent)
       {
         if (!insertNew)
           editor.deleteNode(aElt);
       }
       else
       {
         if (aInsertNew)
         {
           aElt.setAttribute("content", aContent);
           if (aPrepend)
             this.prependHeadElement(aElt);
           else
             this.appendHeadElement(aElt);
         }
         else
         {
           editor.setAttribute(aElt, "content", aContent);
         }
       }
     }
     catch(e) {}
   } 
  },

  getHeadElement: function getHeadElement()
  {
    try {
      var doc = EditorUtils.getCurrentDocument();
      var heads = doc.getElementsByTagName("head");
      return heads.item(0);
    }
    catch(e) {}

    return null;
  },

  prependHeadElement: function prependHeadElement(aElt)
  {
    var head = this.getHeadElement();
    if (head)
      try {
        var editor = EditorUtils.getCurrentEditor();
        editor.insertNode(aElt, head, 0, true);
      }
      catch(e) {}
  },

  appendHeadElement: function appendHeadElement(aElt)
  {
    var head = this.getHeadElement();
    if (head)
    {
      var pos = 0;
      if (head.hasChildNodes())
        pos = head.childNodes.length;
      try {
        var editor = EditorUtils.getCurrentEditor();
        editor.insertNode(aElt, head, pos, true);
      }
      catch(e) {}
    }
  },

  getAtomService: function()
  {
    if (!this.mAtomService)
      this.mAtomService = Components.classes["@mozilla.org/atom-service;1"]
                                    .getService(Components.interfaces.nsIAtomService);
    return this.mAtomService;
  },

  setTextProperty: function(property, attribute, value)
  {
    try {
      var propAtom = this.getAtomService().getAtom(property);
  
      this.getCurrentEditor().setInlineProperty(propAtom, attribute, value);
    }
    catch(e) {}
  },

  getTextProperty: function(property, attribute, value, firstHas, anyHas, allHas)
  {
    try {
      var propAtom = this.getAtomService().getAtom(property);
  
      this.getCurrentEditor().getInlineProperty(propAtom, attribute, value,
                                                firstHas, anyHas, allHas);
    }
    catch(e) {}
  },

  getBlockContainer: function(aElt)
  {
    var e = aElt;
    var display = e.ownerDocument.defaultView.getComputedStyle(e, "").getPropertyValue("display");
    while (e && display == "inline" && e.className == "")
    {
      e = e.parentNode;
      display = e.ownerDocument.defaultView.getComputedStyle(e, "").getPropertyValue("display");
    }
    return e;
  },

  getCurrentTableEditor: function()
  {
    var editor = this.getCurrentEditor();
    return (editor &&
            (editor instanceof Components.interfaces.nsITableEditor)) ? editor : null;
  },

  isStrictDTD: function()
  {
    var doctype = this.getCurrentEditor().document.doctype;
    return (doctype && doctype.publicId.lastIndexOf("Strict") != -1);
  },
  
  isCSSDisabledAndStrictDTD: function()
  {
    var prefs = GetPrefs();
    var IsCSSPrefChecked = prefs.getBoolPref("editor.use_css");
    return !IsCSSPrefChecked && this.isStrictDTD();
  },

  getDocumentUrl: function()
  {
    try {
      var aDOMHTMLDoc = this.getCurrentEditor().document.QueryInterface(Components.interfaces.nsIDOMHTMLDocument);
      return aDOMHTMLDoc.URL;
    }
    catch (e) {}
    return "";
  },

  isXHTMLDocument: function()
  {
    var mimetype = this.getCurrentDocumentMimeType();
    return (mimetype == "application/xhtml+xml");
  },

  isPolyglotHtml5: function()
  {
    var doc = this.getCurrentDocument();
    var doctype = doc.doctype;
    var systemId = doctype ? doc.doctype.systemId : null;
    var isXML = (doc.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
    return (systemId == ""
            && isXML
            && !this.getCurrentDocument().hasXMLDeclaration);
    
  },

  getCurrentDocumentMimeType: function()
  {
    var doc = this.getCurrentDocument();
    var doctype = doc.doctype;
    var systemId = doctype ? doc.doctype.systemId : null;
    var isXML = false;
    switch (systemId) {
      case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
      case "http://www.w3.org/TR/html4/loose.dtd":
      case "http://www.w3.org/TR/REC-html40/strict.dtd":
      case "http://www.w3.org/TR/REC-html40/loose.dtd":
        isXML = false;
        break;
      case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
      case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
      case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
        isXML = true;
        break;
      case "":
        isXML = (doc.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
        break;
      case null:
        isXML = (doc.compatMode == "CSS1Compat");
        break;
      default: break; // should never happen...
    }
    return (isXML ? "application/xhtml+xml" : "text/html");
  },

  getWrapColumn: function()
  {
    try {
      return this.getCurrentEditor().wrapWidth;
    } catch (e) {}
    return 0;
  },

  setDocumentURI: function(uri)
  {
    try {
      // XXX WE'LL NEED TO GET "CURRENT" CONTENT FRAME ONCE MULTIPLE EDITORS ARE ALLOWED
      this.getCurrentEditorElement().docShell.setCurrentURI(uri);
    } catch (e) { }
  },

  documentReloadListener:
  {
    NotifyDocumentCreated: function() {},
    NotifyDocumentWillBeDestroyed: function() {},
  
    NotifyDocumentStateChanged:function( isNowDirty )
    {
      var editor = EditorUtils.getCurrentEditor();
      try {
        // unregister the listener to prevent multiple callbacks
        editor.removeDocumentStateListener( EditorUtils.documentReloadListener );
  
        var charset = editor.documentCharacterSet;
  
        // update the META charset with the current presentation charset
        editor.documentCharacterSet = charset;
  
      } catch (e) {}
    }
  },

  setDocumentCharacterSet: function(aCharset)
  {
    try {
      var editor = this.getCurrentEditor();
      var editorElement = this.getCurrentEditorElement();
      editor.documentCharacterSet = aCharset;
      var docUrl = this.getDocumentUrl();
      if( !UrlUtils.isUrlOfBlankDocument(docUrl))
      {
        // reloading the document will reverse any changes to the META charset, 
        // we need to put them back in, which is achieved by a dedicated listener
        editor.addDocumentStateListener( this.documentReloadListener );
        EditorLoadUrl(editorElement, docUrl);
      }
    } catch (e) {}
  },

  createAnonymousElement: function(tag, parentNode, anonClass, isCreatedHidden)
  {
    var a = EditorUtils.getCurrentEditor().createAnonymousElement(tag,
                     parentNode ? parentNode : EditorUtils.getCurrentDocument().body,
                     anonClass, isCreatedHidden);
    return a;
  },

  deleteAnonymousElement: function(node, parent)
  {
    //var ps = EditorUtils.
  },

  getObjectForProperties: function(aNodeNames, aRequiredAttribute)
  {
    var editor = this.getCurrentEditor();
    if (!editor)
      return null;
  
    // Find nearest parent of selection anchor node
    //   that is a link, list, table cell, or table
  
    var anchorNode
    var node;
    try {
      anchorNode = editor.selection.anchorNode;
      if (anchorNode.firstChild)
      {
        // Start at actual selected node
        var offset = editor.selection.anchorOffset;
        // Note: If collapsed, offset points to element AFTER caret,
        //  thus node may be null
        node = anchorNode.childNodes.item(offset);
      }
      if (!node)
        node = anchorNode;
    } catch (e) {}
  
    while (node)
    {
      if (node.nodeName)
      {
        var nodeName = node.nodeName.toLowerCase();
  
        // Done when we hit the body
        if (nodeName == "body") break;
  
        if (aNodeNames.indexOf(nodeName) != -1 &&
            (!aRequiredAttribute || node.getAttribute(aRequiredAttribute)))
          return node;
      }
      node = node.parentNode;
    }
    return null;
  },

  insertElementAroundSelection: function(element)
  {
    function nodeIsBreak(editor, node)
    {
      //return !node || node.localName == 'BR' || editor.nodeIsBlock(node);
      return true;
    }

    var editor = this.getCurrentEditor();
  
    try {
      // First get the selection as a single range
      var range, start, end, offset;
      var count = editor.selection.rangeCount;
      if (count == 1)
        range = editor.selection.getRangeAt(0).cloneRange();
      else
      {
        range = editor.document.createRange();
        start = editor.selection.getRangeAt(0)
        range.setStart(start.startContainer, start.startOffset);
        end = editor.selection.getRangeAt(--count);
        range.setEnd(end.endContainer, end.endOffset);
      }
  
      // Flatten the selection to child nodes of the common ancestor
      while (range.startContainer != range.commonAncestorContainer)
        range.setStartBefore(range.startContainer);
      while (range.endContainer != range.commonAncestorContainer)
        range.setEndAfter(range.endContainer);
  
      if (editor.nodeIsBlock(element))
        // Block element parent must be a valid block
        while (!(range.commonAncestorContainer.localName in IsBlockParent))
          range.selectNode(range.commonAncestorContainer);
      else
      {
        // Fail if we're not inserting a block (use setInlineProperty instead)
        if (!nodeIsBreak(editor, range.commonAncestorContainer))
          return false;
        else if (range.commonAncestorContainer.localName in NotAnInlineParent)
          // Inline element parent must not be an invalid block
          do range.selectNode(range.commonAncestorContainer);
          while (range.commonAncestorContainer.localName in NotAnInlineParent);
        else
          // Further insert block check
          for (var i = range.startOffset; ; i++)
            if (i == range.endOffset)
              return false;
            else if (nodeIsBreak(editor, range.commonAncestorContainer.childNodes[i]))
              break;
      }
  
      // The range may be contained by body text, which should all be selected.
      offset = range.startOffset;
      start = range.startContainer.childNodes[offset];
      if (!nodeIsBreak(editor, start))
      {
        while (!nodeIsBreak(editor, start.previousSibling))
        {
          start = start.previousSibling;
          offset--;
        }
      }
      end = range.endContainer.childNodes[range.endOffset];
      if (end && !nodeIsBreak(editor, end.previousSibling))
      {
        while (!nodeIsBreak(editor, end))
          end = end.nextSibling;
      }
  
      // Now insert the node
      editor.insertNode(element, range.commonAncestorContainer, offset, true);
      offset = element.childNodes.length;
      if (!editor.nodeIsBlock(element))
        editor.setShouldTxnSetSelection(false);
  
      // Move all the old child nodes to the element
      var empty = true;
      while (start != end)
      {
        var next = start.nextSibling;
        editor.deleteNode(start);
        editor.insertNode(start, element, element.childNodes.length);
        empty = false;
        start = next;
      }
      if (!editor.nodeIsBlock(element))
        editor.setShouldTxnSetSelection(true);
      else
      {
        // Also move a trailing <br>
        if (start && start.localName == 'BR')
        {
          editor.deleteNode(start);
          editor.insertNode(start, element, element.childNodes.length);
          empty = false;
        }
        // Still nothing? Insert a <br> so the node is not empty
        if (empty)
          editor.insertNode(editor.createElementWithDefaults("br"), element, element.childNodes.length);
  
        // Hack to set the selection just inside the element
        editor.insertNode(editor.document.createTextNode(""), element, offset);
      }
    }
    finally {
    }
  
    return true;
  },

	getSerializationFlags: function(aDoc)
	{
	  const nsIDE = Components.interfaces.nsIDocumentEncoder;
	  var flags = nsIDE.OutputRaw;
	  var autoIndentPref = Services.prefs.getBoolPref("bluegriffon.source.auto-indent");
	  if (autoIndentPref) {
	    flags = nsIDE.OutputFormatted;
	  }
	
	  var forceNoWrap = false;
	  if (Services.prefs.getBoolPref("bluegriffon.source.wrap.exclude-languages")) {
	    var lang = "";
	    var root = aDoc.documentElement;
	    // HTML 5 section 3.2.3.3
	    if (root.hasAttributeNS("http://www.w3.org/XML/1998/namespace", "lang")) {
	      lang = root.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang");
	    }
	    else if (root.hasAttributeNS(null, "lang")) {
	      lang = root.getAttributeNS(null, "lang");
	    }
	    // force wrapping off for the current document's language?
	    var exclusionsPref = Services.prefs.getCharPref("bluegriffon.source.wrap.language-exclusions").trim();
	    if (exclusionsPref) {
	      var langArray = lang.toLowerCase().split("-");
	      var exclusionsArray = exclusionsPref.split(",");
	      for (var i = 0; i < exclusionsArray.length; i++)
	        exclusionsArray[i] = exclusionsArray[i].toLowerCase().trim();
	      var l = "";
	      for (var i = 0; i < langArray.length && !forceNoWrap; i++) {
	        l += langArray[i];
	        forceNoWrap = (exclusionsArray.indexOf(l) != -1);
	        l += "-";
	      }
	    }
	  }
	
	  var wrapPref = Services.prefs.getBoolPref("bluegriffon.source.wrap");
	  var maxColumnPref = 0;
	  if (!forceNoWrap && wrapPref) {
	    flags |= nsIDE.OutputWrap;
	    maxColumnPref = Services.prefs.getIntPref("bluegriffon.source.wrap.maxColumn");
	  }

    var forceLF = false;
    try {
      forceLF = Services.prefs.getBoolPref("bluegriffon.defaults.forceLF");
    }
    catch(e) {}

    if (forceLF)
      flags |= nsIDE.OutputLFLineBreak;
    else {
  	  var osString = Components.classes["@mozilla.org/xre/app-info;1"]
  	                   .getService(Components.interfaces.nsIXULRuntime).OS;
  	  switch (osString) {
  	    case "WINNT":
  	      flags |= nsIDE.OutputLFLineBreak;
  	      flags |= nsIDE.OutputCRLineBreak;
  	      break;
  	    case "Darwin":
  	      flags |= nsIDE.OutputCRLineBreak;
  	      break;
  	    case "Linux":
  	    default:
  	      flags |= nsIDE.OutputLFLineBreak;
  	      break;
  	  }
    }
	
	  var encodeEntity = Services.prefs.getCharPref("bluegriffon.source.entities");
	  switch (encodeEntity) {
	    case "basic"  : flags |= nsIDE.OutputEncodeBasicEntities;     break;
	    case "latin1" : flags |= nsIDE.OutputEncodeLatin1Entities;    break;
	    case "html"   : flags |= nsIDE.OutputEncodeHTMLEntities;      break;
	    case "unicode": flags |= nsIDE.OutputEncodeCharacterEntities; break;
	    default: break;
	  }
	
    flags |= nsIDE.OutputDontRewriteEncodingDeclaration;

    return {value: flags, maxColumnPref: maxColumnPref};
	},

  cleanupBRs: function() {
    const kNF = Components.interfaces.nsIDOMNodeFilter;
    const kN  = Components.interfaces.nsIDOMNode;

    function acceptNodeBR(node)
    {
      if (node.nodeType == kN.ELEMENT_NODE)
      {
        var tagName = node.nodeName.toLowerCase();
        if (tagName == "br") {
          var parent = node.parentNode;
          while (parent 
                 && parent.ownerDocument.defaultView.getComputedStyle(parent, "").getPropertyValue("display") == "inline") {
            parent = parent.parentNode;
          }
          if (parent
              && parent.lastChild == node
              && parent.textContent)
            return kNF.FILTER_ACCEPT;
        }
      }
      return kNF.FILTER_SKIP;
    }

    var editor = this.getCurrentEditor();
    editor.beginTransaction();
    var theDocument = editor.document;
    var treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
                                                  kNF.SHOW_ELEMENT,
                                                  acceptNodeBR,
                                                  true);
    if (treeWalker) {
      var theNode = treeWalker.nextNode(), tmpNode;
      while (theNode) {
        var tagName = theNode.nodeName.toLowerCase();
        if (tagName == "br") // sanity check
        {
          tmpNode = treeWalker.nextNode();
          editor.deleteNode(theNode);

          theNode = tmpNode;
        }
      }
    }
    editor.endTransaction();
  },

  cleanup: function() {
    this.cleanupBRs();
  },

  get activeViewActive()    { return this.mActiveViewActive; },
  set activeViewActive(val) { this.mActiveViewActive = val; }


};
