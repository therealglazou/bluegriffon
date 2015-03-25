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

Components.utils.import("resource://app/modules/editorHelper.jsm");

var MarkupCleaner = {
  onlyWhiteTextNodesStartingAtNode: function(node, acceptOneBR)
  {
    var result = true;
    var brOccurences = 0;
    while (node && result)
    {
      if (node.nodeType != Node.TEXT_NODE)
      {
        if (acceptOneBR &&
            node.nodeType == Node.ELEMENT_NODE &&
            node.nodeName.toLowerCase() == "br")
        {
          brOccurences++;
           if (brOccurences > 1)
             result = false;
        }
        else
          result = false;
      }
      else {
        // allow non breakable space in divs...
        result = !RegExp( /[^\t\n\v\f\r \u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]/g ).test(node.data);
      }
      node = node.nextSibling;
    }
    return result;
  },

  runCleanup: function(aClearReport, aIncreaseReport)
  {
    if (aClearReport)
    {
      aClearReport(gDialog.nestedListsReport, gDialog.nestedListsCheckbox);
      aClearReport(gDialog.trailinBRReport,   gDialog.trailinBRCheckbox);
      aClearReport(gDialog.emptyBlocksReport, gDialog.emptyBlocksCheckbox);
      aClearReport(gDialog.emptyCellsReport,  gDialog.emptyCellsCheckbox);
    }

    function acceptNodeBR(node, nestedLists, trailingBR, emptyBLocks, emptyCells)
    {
      if (node.nodeType == Node.ELEMENT_NODE)
      {
        var tagName = node.nodeName.toLowerCase();
        if (tagName== "br") {
          if ((!gDialog.trailinBRCheckbox || gDialog.trailinBRCheckbox.checked) &&
               MarkupCleaner.onlyWhiteTextNodesStartingAtNode(node.nextSibling, false))
            return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    }

    function acceptNodeBlocks(node, nestedLists, trailingBR, emptyBLocks, emptyCells)
    {
      // TBD : useless test below
      if (node.nodeType == Node.ELEMENT_NODE)
      {
        var tagName = node.nodeName.toLowerCase();
        switch (tagName)
        {
          case "ul":
          case "ol":
            if (!gDialog.nestedListsCheckbox || gDialog.nestedListsCheckbox.checked)
            {
              var parentTagName = node.parentNode.nodeName.toLowerCase();
              if (parentTagName == "ul" || parentTagName == "ol")
                return NodeFilter.FILTER_ACCEPT;
            }
            break;
  
          case "p":
          case "div":
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            if ((!gDialog.emptyBlocksCheckbox || gDialog.emptyBlocksCheckbox.checked) &&
                 MarkupCleaner.onlyWhiteTextNodesStartingAtNode(node.firstChild, true))
              return NodeFilter.FILTER_ACCEPT;
            break;
  
          case "td":
          case "th":
            if ((!gDialog.emptyCellsCheckbox || gDialog.emptyCellsCheckbox.checked) &&
                MarkupCleaner.onlyWhiteTextNodesStartingAtNode(node.firstChild, true))
              return NodeFilter.FILTER_ACCEPT;
            break;
            
        }
      }
      return NodeFilter.FILTER_SKIP;
    }
  
    var editor = EditorUtils.getCurrentEditor();
    editor.beginTransaction();
    var theDocument = editor.document;
    var treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
                                                  NodeFilter.SHOW_ELEMENT,
                                                  acceptNodeBR,
                                                  true);
    if (treeWalker) {
      var theNode = treeWalker.nextNode(), tmpNode;
      while (theNode) {
        var tagName = theNode.nodeName.toLowerCase();
        if (tagName == "br") // sanity check
        {
          tmpNode = treeWalker.nextNode();
          var parentTagName = theNode.parentNode.nodeName.toLowerCase();
          if (parentTagName != "td" && parentTagName != "th")
          {
            editor.deleteNode(theNode);
            if (aIncreaseReport)
              aIncreaseReport(gDialog.trailinBRReport);
          }
  
          theNode = tmpNode;
        }
      }
    }

    treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
                                              NodeFilter.SHOW_ELEMENT,
                                              acceptNodeBlocks,
                                              true);
    if (treeWalker) {
      var theNode = treeWalker.nextNode(), tmpNode;
  
      while (theNode) {
        var tagName = theNode.nodeName.toLowerCase();
        if (tagName == "ul" || tagName == "ol")
        {
          var liNode = theNode.previousSibling;
          while (liNode && liNode.nodeName.toLowerCase() != "li")
            liNode = liNode.previousSibling;
  
          tmpNode = treeWalker.nextNode();
          if (liNode)
          {
            editor.deleteNode(theNode);
            // editor.insertNodeAfter(theNode, liNode, null);
            editor.insertNode(theNode, liNode, liNode.childNodes.length);
            if (aIncreaseReport)
              aIncreaseReport(gDialog.nestedListsReport);
          }
          theNode = tmpNode;
        }
          
        else if (tagName == "td" || tagName == "th")
        {
          if (theNode.hasAttribute("align") ||
              theNode.hasAttribute("valign"))
          {
            editor.removeAttribute(theNode, "align");
            editor.removeAttribute(theNode, "valign");
            if (aIncreaseReport)
              aIncreaseReport(gDialog.emptyCellsReport);
  
          }
          theNode = treeWalker.nextNode();
        }
  
        else
        {
          tmpNode = treeWalker.nextNode();
          editor.deleteNode(theNode);
          if (aIncreaseReport)
            aIncreaseReport(gDialog.emptyBlocksReport);
  
          theNode = tmpNode;
        }
      }
  
      editor.endTransaction();
    
    }
    return false;
  }

};

