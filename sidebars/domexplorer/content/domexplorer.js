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
Components.utils.import("resource://app/modules/cssHelper.jsm");
Components.utils.import("resource://app/modules/cssInspector.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

var gMain = null;
var gCurrentElement = null;
var gIsPanelActive = true;
var gPrefs = null;
var gPath = null;
var gNewAttribute = -1;

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
  gMain.NotifierUtils.addNotifierCallback("redrawPanel",
                                          RedrawAll,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("panelClosed",
                                          PanelClosed,
                                          window);
  Inspect();
  if (gMain && gMain.EditorUtils && gIsPanelActive &&
      gMain.EditorUtils.getCurrentEditor()) {
    var c = gMain.EditorUtils.getSelectionContainer();
    if (c)
      SelectionChanged(null, c.node, c.oneElementSelected);
  }

  gDialog.elementsTree.addEventListener("DOMAttrModified", onElementsTreeModified, true);
  gDialog.attributesTree.addEventListener("DOMAttrModified", onAttributesTreeModified, true);
  gDialog.cssTree.addEventListener("DOMAttrModified", onCssTreeModified, true);
}

function Shutdown()
{
  if (gMain)
  {
    gMain.NotifierUtils.removeNotifierCallback("selection",
                                               SelectionChanged,
                                               window);
    gMain.NotifierUtils.removeNotifierCallback("tabClosed",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("tabCreated",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("tabSelected",
                                               Inspect);
    gMain.NotifierUtils.removeNotifierCallback("redrawPanel",
                                                RedrawAll,
                                                window);
    gMain.NotifierUtils.removeNotifierCallback("panelClosed",
                                                PanelClosed,
                                                window);
    gDialog.elementsTree.removeEventListener("DOMAttrModified", onElementsTreeModified, true);
    gDialog.attributesTree.removeEventListener("DOMAttrModified", onAttributesTreeModified, true);
    gDialog.cssTree.removeEventListener("DOMAttrModified", onCssTreeModified, true);
  }
}

function Inspect()
{
  if (gMain && gMain.EditorUtils)
  {
    var editor = gMain.EditorUtils.getCurrentEditor();
    gDialog.mainBox.style.visibility = editor ? "" : "hidden";
    if (editor) {
      var node = gMain.EditorUtils.getSelectionContainer().node;
      if (node) {
        SelectionChanged(null, node, true);
      }
    }
    else {
      var treechildren = gDialog.elementsTree.querySelector("treechildren");
      if (treechildren)
        gDialog.elementsTree.removeChild(treechildren);
    }
  }
}

function RedrawAll(aNotification, aPanelId)
{
  if (aPanelId == "panel-domexplorer") {
    gIsPanelActive = true;
    if (gCurrentElement) {
      // force query of all properties on the current element
      var elt = gCurrentElement;
      SelectionChanged(null, elt, true);
    }
  }
}

function PanelClosed(aNotification, aPanelId)
{
  if (aPanelId == "panel-domexplorer")
    gIsPanelActive = false;
}

function SelectionChanged(aArgs, aElt, aOneElementSelected, aSelectedInDOMETree)
{
  if (!gIsPanelActive) {
    gCurrentElement = aElt;
    return;
  }

  gCurrentElement = aElt;

  var node = gCurrentElement;
  var elements = [];
  while (node && node.nodeType == Node.ELEMENT_NODE) {
    elements.push(node);
    node = node.parentNode;
  }

  var treechildren = gDialog.elementsTree.querySelector("treechildren");
  if (treechildren)
    gDialog.elementsTree.removeChild(treechildren);

  treechildren = document.createElement("treechildren");
  gDialog.elementsTree.appendChild(treechildren);

  var treeitem = document.createElement("treeitem");
  var treerow  = document.createElement("treerow");
  var treecell = document.createElement("treecell");
  treecell.setAttribute("label", elements[elements.length - 1].nodeName.toLowerCase());
  treeitem.setUserData("node", elements[elements.length - 1], null);
  treerow.appendChild(treecell);
  treeitem.appendChild(treerow);
  treechildren.appendChild(treeitem);

  var tmp = null;
  var selected = null;

  for (var i = elements.length - 1 ; i >= 0; i--) {
    var elt = elements[i];

    if (elt.firstElementChild) {
      treeitem.setAttribute("container", "true");
      treeitem.setAttribute("open", "true");
      var child = elt.firstElementChild;
      var parent = document.createElement("treechildren");
      treeitem.appendChild(parent);
      while (child) {
        treeitem = document.createElement("treeitem");
        treeitem.setUserData("node", child, null);
        treerow  = document.createElement("treerow");
        treecell = document.createElement("treecell");
        treecell.setAttribute("label", child.nodeName.toLowerCase());
        treerow.appendChild(treecell);
        treeitem.appendChild(treerow);
        parent.appendChild(treeitem);

        if (i > 0 && child == elements[i-1]) {
          tmp = treeitem;
        if (child == gCurrentElement)
          selected = treeitem;
        }
        child = child.nextElementSibling;
      }
      treeitem = tmp;
    }
  }
  if (selected) {
    var tmp = gDialog.elementsTree.getAttribute("onselect");
    gDialog.elementsTree.removeAttribute("onselect");
    var index = gDialog.elementsTree.contentView.getIndexOfItem(selected);
    if (!aSelectedInDOMETree)
      gDialog.elementsTree.treeBoxObject.scrollToRow(index);
    gDialog.elementsTree.view.selection.select(index);
    gDialog.elementsTree.setAttribute("onselect", tmp);

    if (aSelectedInDOMETree) {
      setTimeout(RepaintElement, 1200);
      gCurrentElement.setAttribute("_moz_flasher", "true");
    }
  }

  UpdateAttributes();
  UpdateStyles();
}

function RepaintElement()
{
  var elts = gMain.EditorUtils.getCurrentDocument().querySelectorAll("*[\_moz_flasher]");
  for (var i = 0; i < elts.length; i++) {
    elts[i].removeAttribute("_moz_flasher");
  }
}

function GetSelectedElementInTree()
{
  var tree = gDialog.elementsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) // No selection yet in the tree
  {
    return;
  }
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var node = treeitem.getUserData("node");
  return node;
}

function ElementSelectedInTree()
{
  var tree = gDialog.elementsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) // No selection yet in the tree
  {
    return;
  }
  var index = view.selection.currentIndex;
  var treeitem = contentView.getItemAtIndex(index);
  var node = treeitem.getUserData("node");

  gDialog.elementsTree.view.selection.select(index);
  gMain.ComposerCommands.mLastSelectedElement = null;
  gMain.ScrollToElement(node);
  try {
    SelectionChanged(null, node, true, true);
  }
  catch(e) {}
}

function UpdateAttributes()
{
  deleteAllChildren(gDialog.attributesTreechildren);
  var attributes = gCurrentElement.attributes;
  for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    if (attr.nodeName.substr(0, 4) == "_moz")
      continue;
    var treeitem = document.createElement("treeitem");
    treeitem.setUserData("attribute", attr, null);
    var treerow  = document.createElement("treerow");
    treecellName = document.createElement("treecell");
    treecellValue = document.createElement("treecell");
    treecellName.setAttribute("label",  attr.nodeName);
    treecellValue.setAttribute("label", attr.nodeValue);
    treecellName.setAttribute("editable", "false");
    treerow.appendChild(treecellName);
    treerow.appendChild(treecellValue);
    treeitem.appendChild(treerow);
    gDialog.attributesTreechildren.appendChild(treeitem);
  }
}

var gEditing = -1;
var gEditingColumn = null;

function onAttributesTreeModified(aEvent)
{
  var target = aEvent.target;
  if (target != gDialog.attributesTree)
    return;

  var attrChange = aEvent.attrChange;
  var attrName = aEvent.attrName;
  var newValue = aEvent.newValue;

  if (attrName == "editing") {
    if (attrChange == 2) { // start editing
      var tree = gDialog.attributesTree;
      var contentView = tree.contentView;
      var view = tree.view;
      gEditing = view.selection.currentIndex;
      gEditingColumn = tree._editingColumn;
    }
    else if (attrChange == 3 && gEditing >= 0) { // end editing
      var aName  = gDialog.attributesTree.view.getCellText(gEditing, gDialog.attributesTree.columns[0]);
      var aValue = gDialog.attributesTree.view.getCellText(gEditing, gDialog.attributesTree.columns[1]);
      if (gEditingColumn == gDialog.attributesTree.columns[1]) {
        gMain.EditorUtils.getCurrentEditor().setAttribute(gCurrentElement,
                                                    aName,
                                                    aValue);
        var notify = (aName.toLowerCase() == "id"
                      || aName.toLowerCase() == "class"
                      || aName.toLowerCase() == "role"
                      || aName.toLowerCase() == "lang");
        gMain.ComposerCommands.updateSelectionBased(!notify);
        UpdateStyles();
        gEditing = -1;
        gEditingColumn = null;
      }
      else {
        gEditingColumn = gDialog.attributesTree.columns[1];
        gDialog.attributesTree.contentView.getItemAtIndex(gEditing).querySelector("treecell").setAttribute("editable", "false");
        setTimeout(function(){gDialog.attributesTree.startEditing(gEditing, gDialog.attributesTree.columns[1])}, 100);
      }
    }
  }
}

function AddAttribute()
{
  var treeitem = document.createElement("treeitem");
  var treerow  = document.createElement("treerow");
  treecellName = document.createElement("treecell");
  treecellValue = document.createElement("treecell");
  treecellName.setAttribute("label",  "");
  treecellValue.setAttribute("label", "");
  treerow.appendChild(treecellName);
  treerow.appendChild(treecellValue);
  treeitem.appendChild(treerow);
  gDialog.attributesTreechildren.appendChild(treeitem);
  var index = gDialog.attributesTree.contentView.getIndexOfItem(treeitem);
  gDialog.attributesTree.view.selection.select(index);
  gDialog.attributesTree.startEditing(index, gDialog.attributesTree.columns[0]);
}

function UpdateAttributeButtons()
{
  var tree = gDialog.attributesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusButton.disabled = true;
    gDialog.ConfigButton.disabled = true;
    return;
  }

  var index = view.selection.currentIndex;
  gDialog.MinusButton.disabled = false;
  gDialog.ConfigButton.disabled = false;
}

function DeleteAttribute()
{
  var tree = gDialog.attributesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var item = gDialog.attributesTree.contentView.getItemAtIndex(index);
  var aName  = gDialog.attributesTree.view.getCellText(index, gDialog.attributesTree.columns[0]);
  item.parentNode.removeChild(item);
  gMain.EditorUtils.getCurrentEditor().removeAttribute(gCurrentElement,
                                                 aName);
  var notify = (aName.toLowerCase() == "id"
                || aName.toLowerCase() == "class"
                || aName.toLowerCase() == "role"
                || aName.toLowerCase() == "lang");
  gMain.ComposerCommands.updateSelectionBased(!notify);
}

function ModifyAttribute()
{
  var tree = gDialog.attributesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  gDialog.attributesTree.startEditing(index, gDialog.attributesTree.columns[1]);
}


function UpdateStyles()
{
  deleteAllChildren(gDialog.cssTreechildren);
  var styles = gCurrentElement.style;
  for (var i = 0; i < styles.length; i++) {
    var treeitem = document.createElement("treeitem");
    var treerow  = document.createElement("treerow");
    treecellName = document.createElement("treecell");
    treecellValue = document.createElement("treecell");
    treecellPriority = document.createElement("treecell");
    var property = styles.item(i);
    treecellName.setAttribute("label",  property);
    treecellValue.setAttribute("label", styles.getPropertyValue(property));
    treecellPriority.setAttribute("label", styles.getPropertyPriority(property));
    treecellName.setAttribute("editable", "false");
    treerow.appendChild(treecellName);
    treerow.appendChild(treecellValue);
    treerow.appendChild(treecellPriority);
    treeitem.appendChild(treerow);
    gDialog.cssTreechildren.appendChild(treeitem);
  }
}

function UpdateCSSButtons()
{
  var tree = gDialog.cssTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusCSSButton.disabled = true;
    gDialog.ConfigCSSButton.disabled = true;
    return;
  }

  var index = view.selection.currentIndex;
  gDialog.MinusCSSButton.disabled = false;
  gDialog.ConfigCSSButton.disabled = false;
}

function DeleteCSS()
{
  var tree = gDialog.cssTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  var item = gDialog.cssTree.contentView.getItemAtIndex(index);
  var property = gDialog.cssTree.view.getCellText(index, gDialog.cssTree.columns[0]);
  item.parentNode.removeChild(item);
  var txn = new diStyleAttrChangeTxn(gCurrentElement, property, "", "");
  gMain.EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
  gMain.EditorUtils.getCurrentEditor().incrementModificationCount(1);  
  gMain.ComposerCommands.updateSelectionBased(true);
  UpdateAttributes();
}

function AddCSS()
{
  var treeitem = document.createElement("treeitem");
  var treerow  = document.createElement("treerow");
  treecellName = document.createElement("treecell");
  treecellValue = document.createElement("treecell");
  treecellPriority = document.createElement("treecell");
  treecellName.setAttribute("label",  "");
  treecellValue.setAttribute("label", "");
  treecellPriority.setAttribute("label", "");
  treerow.appendChild(treecellName);
  treerow.appendChild(treecellValue);
  treerow.appendChild(treecellPriority);
  treeitem.appendChild(treerow);
  gDialog.cssTreechildren.appendChild(treeitem);
  var index = gDialog.cssTree.contentView.getIndexOfItem(treeitem);
  gDialog.cssTree.view.selection.select(index);
  gDialog.cssTree.startEditing(index, gDialog.cssTree.columns[0]);
}

function onCssTreeModified(aEvent)
{
  var target = aEvent.target;
  if (target != gDialog.cssTree)
    return;

  var attrChange = aEvent.attrChange;
  var attrName = aEvent.attrName;
  var newValue = aEvent.newValue;

  if (attrName == "editing") {
    if (attrChange == 2) { // start editing
      var tree = gDialog.cssTree;
      var contentView = tree.contentView;
      var view = tree.view;
      gEditing = view.selection.currentIndex;
      gEditingColumn = tree._editingColumn;
    }
    else if (attrChange == 3 && gEditing >= 0) { // end editing
      var aName     = gDialog.cssTree.view.getCellText(gEditing, gDialog.cssTree.columns[0]);
      var aValue    = gDialog.cssTree.view.getCellText(gEditing, gDialog.cssTree.columns[1]);
      var aPriority = gDialog.cssTree.view.getCellText(gEditing, gDialog.cssTree.columns[2]);
      if (gEditingColumn == gDialog.cssTree.columns[2]) {
        var txn = new diStyleAttrChangeTxn(gCurrentElement, aName, aValue, aPriority);
        gMain.EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
        gMain.EditorUtils.getCurrentEditor().incrementModificationCount(1);  
        gMain.ComposerCommands.updateSelectionBased(true);
        UpdateAttributes();
        gEditing = -1;
        gEditingColumn = null;
      }
      else if (gEditingColumn == gDialog.cssTree.columns[1]) {
        gEditingColumn = gDialog.cssTree.columns[2];
        setTimeout(function(){gDialog.cssTree.startEditing(gEditing, gDialog.cssTree.columns[2])}, 100);
      }
      else if (gEditingColumn == gDialog.cssTree.columns[0]) {
        gEditingColumn = gDialog.cssTree.columns[1];
        gDialog.cssTree.contentView.getItemAtIndex(gEditing).querySelector("treecell").setAttribute("editable", "false");
        setTimeout(function(){gDialog.cssTree.startEditing(gEditing, gDialog.cssTree.columns[1])}, 100);
      }
    }
  }
}

function ModifyCSS()
{
  var tree = gDialog.cssTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  gDialog.cssTree.startEditing(index, gDialog.cssTree.columns[1]);
}
