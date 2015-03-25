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
 * The Original Code is DWT Groker.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), Original author
 *   Fabien Cazenave <kaze@kompozer.net>
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

const BLUEGRIFFON_NS = "http://disruptive-innovations.com/zoo/bluegriffon";

function MakePhpAndCommentsVisible(doc)
{
  function acceptNode(node)
  {
    if ((node.nodeType == Node.COMMENT_NODE
         || node.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
        && node.parentNode.getAttribute("xmlns") != BLUEGRIFFON_NS) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  }

  var element = doc.documentElement;
  var editor = EditorUtils.getCurrentEditor();
  var treeWalker = doc.createTreeWalker(element,
                                        NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
                                        acceptNode,
                                        true);

  function _tweakNode(aNode) {
    if (aNode.nodeType == Node.COMMENT_NODE)
    {
      // do we have a comment created from a PI?
      var data = aNode.data;
      var target = "";
      var d      = "";
      if (data.substr(0, 4) == "?php" && data[data.length - 1] == "?") {
        target = "php"
        d      = data.substr(5, data.length - 6);
      }
      else if (data[0] == "?" && data[data.length - 1] == "?") {
        target = data.substr(1, data.indexOf(" ") - 1);
        d      = data.substr(data.indexOf(" ") + 1);
        d      = d.substring(0, d.length - 1);
       }

       if (target) {
        var pi = doc.createProcessingInstruction(target, d);

        var txn = new diNodeInsertionTxn(pi, aNode.parentNode, aNode);
        editor.transactionManager.doTransaction(txn);
        //editor.deleteNode(aNode);
        txn = new diNodeDeletionTxn(aNode);
        editor.transactionManager.doTransaction(txn);
        aNode = pi;
       }
    }

    var p = aNode;
    var ok = false;
    while (p && !ok) {
      var n = p.nodeName.toLowerCase();
      ok = (n == "body" || n == "head");
      p = p.parentNode;
    }
    if (ok) {
      var span, text;
      if (aNode.nodeType == Node.COMMENT_NODE)
      {
          span = doc.createElementNS(BLUEGRIFFON_NS, "comment");
          text = aNode.data;
      }
      else if (aNode.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
      {
        if (aNode.target == "php")
        {
          span = doc.createElementNS(BLUEGRIFFON_NS, "php");
          text = aNode.data;
        }
        else
        {
          span = doc.createElementNS(BLUEGRIFFON_NS, "pi");
          text = aNode.target + " " + aNode.data;
        }
      }

      span.setAttribute("xmlns", BLUEGRIFFON_NS);
      if (text.length > 22)
        text = text.substr(0, 22) + "...";
      span.setAttribute("title", text);
      txn = new diNodeInsertionTxn(span, aNode.parentNode, aNode);
      editor.transactionManager.doTransaction(txn);

      var clone = aNode.cloneNode(true);
      txn = new diNodeInsertionTxn(clone, span, null);
      editor.transactionManager.doTransaction(txn);
      editor.deleteNode(aNode);
    }
  }

  if (treeWalker) {
    var anchorNode = treeWalker.nextNode();
    while (anchorNode) {
      var tmp = treeWalker.nextNode();
      _tweakNode(anchorNode)
      anchorNode = tmp;
    }
  }
  var anchorNode = doc.firstChild;
  while (anchorNode) {
    var tmp = anchorNode.nextSibling;
    _tweakNode(anchorNode)
    anchorNode = tmp;
  }
}

