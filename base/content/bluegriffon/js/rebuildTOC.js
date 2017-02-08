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
 * The Original Code is TOCMaker.
 *
 * The Initial Developer of the Original Code is
 * Daniel Glazman.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel@glazman.org> (Original author)
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

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");

var TOCrebuilder = {

  mTocHeadersArray: [],
  mCurrentHeaderLevel: 0,
  mReadonly : false,
  mOrderedList: true,

  kMozToc:                 "mozToc",
  kMozTocLength:           6,
  kMozTocIdPrefix:         "mozTocId",
  kMozTocIdPrefixLength:   8,
  kMozTocClassPrefix:      "mozToc",
  kMozTocClassPrefixLength: 6,

  rebuild: function() {
    // early way out if if we have no editor; sanity case
    if (!EditorUtils.getCurrentEditor()) {
      return;
    }

    this.mTocHeadersArray = new Array(6);
    var i, j;
    // clean the table of tag/class pairs we look for
    for (i = 0; i < 6; ++i)
      this.mTocHeadersArray[i] = [ "", "" ];

    var theDocument = EditorUtils.getCurrentEditor().document;
    // do we already have a TOC in the document ? It should have "mozToc" ID
    var toc = theDocument.getElementById(this.kMozToc);
    // early way out if we don't
    if (!toc)
      return;

    // default TOC definition, use h1-h6 for TOC entry levels 1-6
    var headers = "h1 1 h2 2 h3 3 h4 4 h5 5 h6 6";

    this.mReadOnly = false;
    this.mOrderedList = true;
    if (toc.getAttribute("class") == "readonly") {
      this.mReadOnly = true;
    }

    // let's see if it's an OL or an UL
    this.mOrderedList = (toc.nodeName.toLowerCase() == "ol");

    var nodeList = toc.childNodes;
    // let's look at the children of the TOC ; if we find a comment beginning
    // with "mozToc", it contains the TOC definition
    for (i = 0; i< nodeList.length; ++i) {
      var n = nodeList.item(i);
      if (n.nodeType == Node.ELEMENT_NODE &&
          n.localName == "comment" &&
          n.namespaceURI == "http://disruptive-innovations.com/zoo/bluegriffon" &&
          n.getAttribute("title").substr(0, this.kMozTocLength) == this.kMozToc) {
        // yep, there is already a definition here; parse it !
        headers = n.lastChild.data.substr(this.kMozTocLength + 1,
                                          n.lastChild.data.length - this.kMozTocLength - 1);
        break;
      }
    }

    // let's get an array filled with the (tag.class, index level) pairs
    var headersArray = headers.split(" ");
  
    for (i = 0; i < headersArray.length; i += 2) {
      var tag = headersArray[i], className = "";
      var index = headersArray[i + 1];
      var sep = tag.indexOf(".");
      if (sep != -1) {
        // the tag variable contains in fact "tag.className", let's parse
        // the class and get the real tag name
        var tmp   = tag.substr(0, sep);
        className = tag.substr(sep + 1, tag.length - sep - 1);
        tag = tmp;
      }
      this.mTocHeadersArray[index - 1] = [ tag, className ];
    }

    // controlClass() is a node filter that accepts a node if
    // (a) we don't look for a class (b) we look for a class and
    // node has it
    var self = this;
    function controlClass(node, index)
    {
      currentHeaderLevel = index + 1;
      if (self.mTocHeadersArray[index][1] == "") {
        // we are not looking for a specific class, this node is ok
        return NodeFilter.FILTER_ACCEPT;
      }
      if (node.getAttribute("class")) {
        // yep, we look for a class, let's look at all the classes
        // the node has
        var classArray = node.getAttribute("class").split(" ");
        for (var j = 0; j < classArray.length; j++) {
          if (classArray[j] == this.mTocHeadersArray[index][1]) {
            // hehe, we found it...
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      }
      return NodeFilter.FILTER_SKIP;
    }

    // the main node filter for our node iterator
    // it selects the tag names as specified in the dialog
    // then calls the controlClass filter above
    function acceptNode(node)
    {
      switch (node.nodeName.toLowerCase())
      {
        case self.mTocHeadersArray[0][0]:
          return controlClass(node, 0);
          break;
        case self.mTocHeadersArray[1][0]:
          return controlClass(node, 1);
          break;
        case self.mTocHeadersArray[2][0]:
          return controlClass(node, 2);
          break;
        case self.mTocHeadersArray[3][0]:
          return controlClass(node, 3);
          break;
        case self.mTocHeadersArray[4][0]:
          return controlClass(node, 4);
          break;
        case self.mTocHeadersArray[5][0]:
          return controlClass(node, 5);
          break;
        default:
          return NodeFilter.FILTER_SKIP;
          break;
      }
      return NodeFilter.FILTER_SKIP;   // placate the js compiler
    }

    var editor = EditorUtils.getCurrentEditor();
    try {
      editor.beginTransaction();
      // let's create a TreeWalker to look for our nodes
      var treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
                                                    NodeFilter.SHOW_ELEMENT,
                                                    acceptNode,
                                                    true);
      // we need an array to store all TOC entries we find in the document
      var tocArray = new Array();
      if (treeWalker) {
        var tocSourceNode = treeWalker.nextNode();
        while (tocSourceNode) {
          var headerIndex = currentHeaderLevel;
    
          var headerText = tocSourceNode.textContent.trim();
    
          var anchor = tocSourceNode.firstChild, id;
          var mozTocClass = this.kMozTocClassPrefix + tocSourceNode.nodeName.toUpperCase();
          // do we have a named anchor as 1st child of our node ?
          if (anchor &&
              anchor.nodeName.toLowerCase() == "a" &&
              anchor.hasAttribute("id") &&
              anchor.getAttribute("id").substr(0, this.kMozTocIdPrefixLength) == this.kMozTocIdPrefix) {
            // yep, get its id
            id = anchor.getAttribute("id");
            if (!anchor.classList.contains(mozTocClass))
              editor.setAttribute(anchor, "class",
                                    anchor.getAttribute("class")
                                    ? anchor.getAttribute("class") + " " + mozTocClass
                                    : mozTocClass);
          }
          else if (anchor &&
              anchor.nodeName.toLowerCase() == "a" &&
              anchor.hasAttribute("name") &&
              anchor.getAttribute("name").substr(0, this.kMozTocIdPrefixLength) == this.kMozTocIdPrefix) {
            // yep, get its name
            id = anchor.getAttribute("name");
            if (!anchor.classList.contains(mozTocClass))
              editor.setAttribute(anchor, "class",
                                    anchor.getAttribute("class")
                                    ? anchor.getAttribute("class") + " " + mozTocClass
                                    : mozTocClass);
          }
          else {
            // no we don't and we need to create one
            anchor = theDocument.createElement("a");
            txn = new diNodeInsertionTxn(anchor,
                                         tocSourceNode,
                                         tocSourceNode.firstChild);
            editor.transactionManager.doTransaction(txn);
            // let's give it a random ID
            var c = 1000000 * Math.random();
            id = this.kMozTocIdPrefix + Math.round(c);
            editor.setAttribute(anchor, "id",  id);
            editor.setAttribute(anchor, "class", mozTocClass);
          }
          // and store that new entry in our array
          tocArray.push({index: headerIndex, text: headerText, id: id});
          tocSourceNode = treeWalker.nextNode();
        }
      }
  
      var oldToc = toc;
      var newToc = theDocument.createElement(this.mOrderedList ? "ol" : "ul");
      newToc.setAttribute("id", this.kMozToc);
    
      /* generate the TOC itself */
      headerIndex = 0;
      var item, toc;
      for (var i = 0; i < tocArray.length; i++) {
        if (!headerIndex) {
          // do we need to create an ol/ul container for the first entry ?
          ++headerIndex;
          toc = newToc;
          var commentText = "mozToc ";
          for (var j = 0; j < 6; j++) {
            if (this.mTocHeadersArray[j][0] != "") {
              commentText += this.mTocHeadersArray[j][0];
              if (this.mTocHeadersArray[j][1] != "") {
                commentText += "." + this.mTocHeadersArray[j][1];
              }
              commentText += " " + (j + 1) + " ";
            }
          }
          // important, we have to remove trailing spaces
          commentText = TrimStringRight(commentText);
    
          // forge a comment we'll insert in the TOC ; that comment will hold
          // the TOC definition for us
          var ct = theDocument.createElementNS("http://disruptive-innovations.com/zoo/bluegriffon", "comment");
          ct.setAttribute("title", commentText);
          var ctct = theDocument.createComment(commentText);
          ct.appendChild(ctct);
          toc.appendChild(ct);
    
          // assign a special class to the TOC top element if the TOC is readonly
          // the definition of this class is in EditorOverride.css
          if (this.mReadonly) {
            toc.setAttribute("class", "readonly");
          }
          else {
            toc.removeAttribute("class");
          }
    
          // We need a new variable to hold the local ul/ol container
          // The toplevel TOC element is not the parent element of a
          // TOC entry if its depth is > 1...
          var tocList = toc;
          // create a list item
          var tocItem = theDocument.createElement("li");
          // and an anchor in this list item
          var tocAnchor = theDocument.createElement("a");
          // make it target the source of the TOC entry
          tocAnchor.setAttribute("href", "#" + tocArray[i].id);
          // and put the textual contents of the TOC entry in that anchor
          var tocEntry = theDocument.createTextNode(tocArray[i].text);
          // now, insert everything where it has to be inserted
          tocAnchor.appendChild(tocEntry);
          tocItem.appendChild(tocAnchor);
          tocList.appendChild(tocItem);
          item = tocList;
        }
        else {
          if (tocArray[i].index < headerIndex) {
            // if the depth of the new TOC entry is less than the depth of the
            // last entry we created, find the good ul/ol ancestor
            for (j = headerIndex - tocArray[i].index; j > 0; --j) {
              if (item != toc) {
                item = item.parentNode.parentNode;
              }
            }
            tocItem = theDocument.createElement("li");
          }
          else if (tocArray[i].index > headerIndex) {
            // to the contrary, it's deeper than the last one
            // we need to create sub ul/ol's and li's
            for (j = tocArray[i].index - headerIndex; j > 0; --j) {
              tocList = theDocument.createElement(this.mOrderedList ? "ol" : "ul");
              item.lastChild.appendChild(tocList);
              tocItem = theDocument.createElement("li");
              tocList.appendChild(tocItem);
              item = tocList;
            }
          }
          else {
            tocItem = theDocument.createElement("li");
          }
          tocAnchor = theDocument.createElement("a");
          tocAnchor.setAttribute("href", "#" + tocArray[i].id);
          tocEntry = theDocument.createTextNode(tocArray[i].text);
          tocAnchor.appendChild(tocEntry);
          tocItem.appendChild(tocAnchor);
          item.appendChild(tocItem);
          headerIndex = tocArray[i].index;
        }
      }
    
      if (oldToc) {
        txn = new diNodeInsertionTxn(newToc,
                                     oldToc.parentNode,
                                     oldToc);
        editor.transactionManager.doTransaction(txn);
        editor.deleteNode(oldToc);
      }
      else
        editor.insertElementAtSelection(newToc, true);
    }
    catch(e) { Services.prompt.alert(null,"erreur",e);}
    editor.endTransaction();
  }
};
