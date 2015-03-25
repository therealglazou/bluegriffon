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

Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

// tocHeadersArray is the array containing the pairs tag/class
// defining TOC entries
var tocHeadersArray = new Array(6);

// a global used when building the TOC
var currentHeaderLevel = 0;

// a global set to true if the TOC is to be readonly
var readonly = false;

// a global set to true if user wants indexes in the TOC
var orderedList = true;

// constants
const kMozToc                  = "mozToc";
const kMozTocLength            = 6;
const kMozTocIdPrefix          = "mozTocId";
const kMozTocIdPrefixLength    = 8;
const kMozTocClassPrefix       = "mozToc";
const kMozTocClassPrefixLength = 6;

// Startup() is called when EdInsertTOC.xul is opened
function Startup()
{
  // early way out if if we have no editor
  if (!EditorUtils.getCurrentEditor()) {
    window.close();
    return;
  }

  var i, j;
  // clean the table of tag/class pairs we look for
  for (i = 0; i < 6; ++i)
    tocHeadersArray[i] = [ "", "" ];

  // reset all settings
  for (i = 1; i < 7; ++i) {
    var menulist = document.getElementById("header" + i + "Menulist");
    var menuitem = document.getElementById("header" + i + "none");
    var textbox  = document.getElementById("header" + i + "Class");
    menulist.selectedItem = menuitem;
    textbox.setAttribute("disabled", "true");
  }

  var theDocument = EditorUtils.getCurrentEditor().document;

  // do we already have a TOC in the document ? It should have "mozToc" ID
  var toc = theDocument.getElementById(kMozToc);

  // default TOC definition, use h1-h6 for TOC entry levels 1-6
  var headers = "h1 1 h2 2 h3 3 h4 4 h5 5 h6 6";

  var orderedListCheckbox = document.getElementById("orderedListCheckbox");
  orderedListCheckbox.checked = true;

  if (toc) {
    // man, there is already a TOC here

    if (toc.getAttribute("class") == "readonly") {
      // and it's readonly
      var checkbox = document.getElementById("readOnlyCheckbox");
      checkbox.checked = true;
      readonly = true;
    }

    // let's see if it's an OL or an UL
    orderedList = (toc.nodeName.toLowerCase() == "ol");
    orderedListCheckbox.checked = orderedList;

    var nodeList = toc.childNodes;
    // let's look at the children of the TOC ; if we find a comment beginning
    // with "mozToc", it contains the TOC definition
    for (i = 0; i< nodeList.length; ++i) {
      var n = nodeList.item(i);
      if (n.nodeType == Node.ELEMENT_NODE &&
          n.localName == "comment" &&
          n.namespaceURI == "http://disruptive-innovations.com/zoo/bluegriffon" &&
          n.getAttribute("title").substr(0, kMozTocLength) == kMozToc) {
        // yep, there is already a definition here; parse it !
        headers = n.lastChild.data.substr(kMozTocLength + 1,
                                    n.lastChild.data.length - kMozTocLength - 1);
        break;
      }
    }
  }

  // let's get an array filled with the (tag.class, index level) pairs
  var headersArray = headers.split(" ");

  for (i = 0; i < headersArray.length; i += 2) {
    var tag = headersArray[i], className = "";
    var index = headersArray[i + 1];
    menulist = document.getElementById("header" + index + "Menulist");
    if (menulist) {
      var sep = tag.indexOf(".");
      if (sep != -1) {
        // the tag variable contains in fact "tag.className", let's parse
        // the class and get the real tag name
        var tmp   = tag.substr(0, sep);
        className = tag.substr(sep + 1, tag.length - sep - 1);
        tag = tmp;
      }

      // update the dialog
      menuitem = document.getElementById("header" + index +
                                         tag.toUpperCase());
      textbox  = document.getElementById("header" + index + "Class");
      menulist.selectedItem = menuitem;
      if (tag != "") {
        textbox.removeAttribute("disabled");
      }
      if (className != "") {
        textbox.value = className;
      }
      tocHeadersArray[index - 1] = [ tag, className ];
    }
  }
}


function BuildTOC(update)
{
  // controlClass() is a node filter that accepts a node if
  // (a) we don't look for a class (b) we look for a class and
  // node has it
  function controlClass(node, index)
  {
    currentHeaderLevel = index + 1;
    if (tocHeadersArray[index][1] == "") {
      // we are not looking for a specific class, this node is ok
      return NodeFilter.FILTER_ACCEPT;
    }
    if (node.getAttribute("class")) {
      // yep, we look for a class, let's look at all the classes
      // the node has
      var classArray = node.getAttribute("class").split(" ");
      for (var j = 0; j < classArray.length; j++) {
        if (classArray[j] == tocHeadersArray[index][1]) {
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
      case tocHeadersArray[0][0]:
        return controlClass(node, 0);
        break;
      case tocHeadersArray[1][0]:
        return controlClass(node, 1);
        break;
      case tocHeadersArray[2][0]:
        return controlClass(node, 2);
        break;
      case tocHeadersArray[3][0]:
        return controlClass(node, 3);
        break;
      case tocHeadersArray[4][0]:
        return controlClass(node, 4);
        break;
      case tocHeadersArray[5][0]:
        return controlClass(node, 5);
        break;
      default:
        return NodeFilter.FILTER_SKIP;
        break;
    }
    return NodeFilter.FILTER_SKIP;   // placate the js compiler
  }

  try {
    var editor = EditorUtils.getCurrentEditor();
    editor.beginTransaction();
    var theDocument = editor.document;
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
        var mozTocClass = kMozTocClassPrefix + tocSourceNode.nodeName.toUpperCase();
        // do we have a named anchor as 1st child of our node ?
        if (anchor &&
            anchor.nodeName.toLowerCase() == "a" &&
            anchor.hasAttribute("id") &&
            anchor.getAttribute("id").substr(0, kMozTocIdPrefixLength) == kMozTocIdPrefix) {
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
            anchor.getAttribute("name").substr(0, kMozTocIdPrefixLength) == kMozTocIdPrefix) {
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
          id = kMozTocIdPrefix + Math.round(c);
          editor.setAttribute(anchor, "id",  id);
          editor.setAttribute(anchor, "class", mozTocClass);
        }
        // and store that new entry in our array
        tocArray.push({index: headerIndex, text: headerText, id: id});
        tocSourceNode = treeWalker.nextNode();
      }
    }

    // do we already have a TOC?
    var toc = theDocument.getElementById(kMozToc);
    var oldToc = toc;
    var newToc = theDocument.createElement(orderedList ? "ol" : "ul");
    newToc.setAttribute("id", kMozToc);
  
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
          if (tocHeadersArray[j][0] != "") {
            commentText += tocHeadersArray[j][0];
            if (tocHeadersArray[j][1] != "") {
              commentText += "." + tocHeadersArray[j][1];
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
        if (readonly) {
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
            tocList = theDocument.createElement(orderedList ? "ol" : "ul");
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
  catch(e) {alert(e)}
  editor.endTransaction();
  return true;
}

function selectHeader(elt, index)
{
  var tag = elt.value;
  tocHeadersArray[index - 1][0] = tag;
  var textbox = document.getElementById("header" + index + "Class");
  if (tag == "") {
    textbox.setAttribute("disabled", "true");
  }
  else {
    textbox.removeAttribute("disabled");
  }
}

function changeClass(elt, index)
{
  tocHeadersArray[index - 1][1] = elt.value;
}

function ToggleReadOnlyToc(elt)
{
  readonly = elt.checked;
}

function ToggleOrderedList(elt)
{
  orderedList = elt.checked;
}
