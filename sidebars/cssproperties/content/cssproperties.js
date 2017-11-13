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

Components.utils.import("resource://gre/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/urlHelper.jsm");
Components.utils.import("resource://gre/modules/cssHelper.jsm");
Components.utils.import("resource://gre/modules/cssInspector.jsm");
Components.utils.import("resource://gre/modules/prompterHelper.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var gMain = null;
var gCurrentElement = null;
var gInUtils;

var gIsPanelActive = true;

var gPrefs = null;
var gXmlNAMERegExp = null;

function Startup()
{
  var nameStartChar = "A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameChar = nameStartChar + "\-\.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  gXmlNAMERegExp = new RegExp("^[" + nameStartChar + "][" + nameChar + "]*$");

  GetUIElements();

  Bezier.init();

  InitLocalFontFaceMenu(gDialog.addFontMenupopup);

  gPrefs = GetPrefs();

  gInUtils = Components.classes["@mozilla.org/inspector/dom-utils;1"]
              .getService(Components.interfaces.inIDOMUtils);

  if (window.top &&
      "NotifierUtils" in window.top)
    gMain = window.top;
  else if (window.top && window.top.opener &&
           "NotifierUtils" in window.top.opener)
    gMain = window.top.opener;

  if (!gMain)
    return;

  gDialog.allTree.addEventListener("DOMAttrModified", onAllTreeModified, true);
  gDialog.variablesTree.addEventListener("DOMAttrModified", onVariablesTreeModified, true);

  gMain.NotifierUtils.addNotifierCallback("selection_strict",
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
  gMain.NotifierUtils.addNotifierCallback("resizeEvent",
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
}

function Shutdown()
{
  if (gMain)
  {

    gDialog.allTree.removeEventListener("DOMAttrModified", onAllTreeModified, true);
    gDialog.variablesTree.removeEventListener("DOMAttrModified", onVariablesTreeModified, true);

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
    gMain.NotifierUtils.removeNotifierCallback("resizeEvent",
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
    var visible = editor && (gMain.EditorUtils.isWysiwygMode());
    gDialog.mainBox.style.visibility = visible ? "" : "hidden";
    gMain.document.querySelector("[panelid='panel-cssproperties']").className = visible ? "" : "inactive";
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

  gDialog.idAlert.removeAttribute("open");

  gCurrentElement = aElt;
  deleteAllChildren(gDialog.classPickerPopup);
  gDialog.classPicker.value =  "";

  var item;
  for (var i = aElt.classList.length -1; i >= 0; i--) {
    var c = aElt.classList.item(i);
    item = gDialog.classPicker.appendItem(c, c);
  }
  if (item)
    gDialog.classPicker.selectedItem = item;

  if (gDialog.cssPolicyMenulist.value == "class")
    CheckClass(gDialog.classPicker);

  gDialog.typePicker.setAttribute("value", gCurrentElement.localName);

  var inspector = Components.classes["@mozilla.org/inspector/dom-utils;1"]
                    .getService(Components.interfaces.inIDOMUtils);
  var dynamicPseudo = "";
  if (gDialog.hoverStateCheckbox.checked) {
    inspector.addPseudoClassLock(gCurrentElement, ":hover");
    dynamicPseudo = "hover";
  }
  var ruleset = CssInspector.getCSSStyleRules(aElt, false, dynamicPseudo);
  if (gDialog.hoverStateCheckbox.checked) {
    inspector.clearPseudoClassLocks(gCurrentElement);
  }
  for (var i = 0; i < gIniters.length; i++)
    gIniters[i](aElt, ruleset);

}

function CheckClass(aElt)
{
  var value = (aElt.editor ? aElt.editor.outputToString("text/plain", 0) : aElt.value)
  var valid;
  if (value && value.match( gXmlNAMERegExp ))
    valid = "true";
  else if (!value)
    valid = "empty";
  else
    valid = "false";
  aElt.setAttribute("valid", valid);
}

function onCssPolicyChange(aElt)
{
  var cssPolicy = aElt.value;
  switch (cssPolicy) {
    case "class":
      gDialog.classPicker.hidden = false;
      gDialog.typePicker.hidden  = true;
      CheckClass(gDialog.classPicker);
      gDialog.classPicker.focus();
      break;
    case "id":
      gDialog.classPicker.hidden = true;
      gDialog.typePicker.hidden  = true;
      break;
    case "type":
      gDialog.classPicker.hidden = true;
      gDialog.typePicker.hidden  = false;
      break;
  }
}

function ToggleSection(aEvent, header)
{
  if (aEvent && aEvent.button) // only first button...
    return;

  var section = header.nextElementSibling;
  if (header.hasAttribute("open")) {
    section.style.height = "0px";
    header.removeAttribute("open");
  }
  else {
    section.style.height = "";
    header.setAttribute("open", "true");
    section.style.height = document.defaultView.getComputedStyle(section, "").getPropertyValue("height");
  }
  document.persist(header.id, "open");
  document.persist(section.id, "style");
}

var gIniters = [];

function RegisterIniter(aFn)
{
  gIniters.push(aFn);
}

function GetComputedValue(aElt, aProperty)
{
  return aElt.ownerDocument.defaultView.getComputedStyle(aElt, "").getPropertyValue(aProperty);
}

var gSavedSelection;
function SaveSelection()
{
  var editor = EditorUtils.getCurrentEditor();
  var selection = editor.selection;
  gSavedSelection = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    var r = selection.getRangeAt(i);
    gSavedSelection.push( {
                            startContainer: r.startContainer,
                            startOffset   : r.startOffset,
                            endContainer  : r.endContainer,
                            endOffset     : r.endOffset
                         });
  }
}

function RestoreSelection()
{
  if (!gSavedSelection)
    return;
  var editor = EditorUtils.getCurrentEditor();
  var selection = editor.selection;
  selection.removeAllRanges();
  for (var i = 0 ; i < gSavedSelection.length; i++) {
    var s = gSavedSelection[i];
    var range = document.createRange();
    range.setStart(s.startContainer, s.startOffset);
    range.setEnd(s.endContainer, s.endOffset);
    selection.addRange(range);
  }
  // don't preserve a reference to nodes !
  gSavedSelection = null;
}

var gIdAlertStyles = null;
var gIdNoSelectionUpdate = false;
var gIdCurrentElement = null;

function ShowIdAlert(aStyles, aNoSelectionUpdate)
{
  gIdAlertStyles = aStyles;
  gIdNoSelectionUpdate = aNoSelectionUpdate;
  gIdCurrentElement = gCurrentElement;

  gDialog.idAlertTextbox.value = "";
  gDialog.idAlertButton.setAttribute("disabled", "true");

  gDialog.idAlert.setAttribute("open", "true");
  gDialog.idAlertTextbox.focus();
}

function CheckIdFromIdAlert(aElt)
{
  var value = aElt.value;
  if (!value || null == value.match( gXmlNAMERegExp )) {
    gDialog.idAlertButton.setAttribute("disabled", "true");
    return;
  }

  gDialog.idAlertButton.removeAttribute("disabled");
}

function CheckReturnInIdAlert(aElt, aEvent)
{
  if (aEvent.which == 13 &&
      !gDialog.idAlertButton.hasAttribute("disabled")) {
    ApplyIdFromIdAlert();
  }
}

function ApplyIdFromIdAlert()
{
  var value = gDialog.idAlertTextbox.value;
  var editor = EditorUtils.getCurrentEditor();

  editor.beginTransaction();
  var elt = value ? editor.document.getElementById(value) : null;
  if (elt && elt != gIdCurrentElement) {
    editor.removeAttribute(elt, "id");
  }
  editor.setAttribute(gIdCurrentElement, "id", value);
  gCurrentElement = gIdCurrentElement;
  gDialog.idAlert.setAttribute("hidden", "true");
  gDialog.idAlert.removeAttribute("open");
  ApplyStyles(gIdAlertStyles, gIdNoSelectionUpdate, true);
  setTimeout(function() {gDialog.idAlert.removeAttribute("hidden");}, 1000);
  EditorUtils.getCurrentEditorWindow().content.focus();
}

function ApplyStyles(aStyles, aNoSelectionUpdate, aDoNotBeginTransaction, aCallback)
{
  gDialog.idAlert.removeAttribute("open");

  var className;
  var editor = EditorUtils.getCurrentEditor();
  if (gDialog.hoverStateCheckbox.checked && gDialog.cssPolicyMenulist.value == "inline")
    gDialog.cssPolicyMenulist.value = "id";
  var cssPolicy = gPrefs.getCharPref("bluegriffon.css.policy");
  switch (gDialog.cssPolicyMenulist.value) {
    case "id":
      // if the element has no ID, ask for one...
      if (gCurrentElement.id) {
        if (!aDoNotBeginTransaction)
          editor.beginTransaction();
      }
      else if (cssPolicy == "automatic") {
        var prefix = gPrefs.getCharPref("bluegriffon.css.prefix");
        var id = prefix + new Date().valueOf() +
                          "_" + Math.round(Math.random() * 100000);
        editor.beginTransaction();
        editor.setAttribute(gCurrentElement, "id", id);
      }
      else {
        ShowIdAlert(aStyles, aNoSelectionUpdate);
        return;
      }
      break;

    case "class":
      if (!(gDialog.classPicker.editor ? gDialog.classPicker.editor.outputToString("text/plain", 0) : gDialog.classPicker.value)) {
        if (cssPolicy == "automatic") {
          var prefix = gPrefs.getCharPref("bluegriffon.css.prefix");
          className = prefix + new Date().valueOf() +
                            "_" + Math.round(Math.random() * 100000);
          editor.beginTransaction();
          editor.setAttribute(gCurrentElement, "class", className);
          gDialog.classPicker.value = className;
        }
        else {
          PromptUtils.alertWithTitle(gDialog.csspropertiesBundle.getString("NoClasSelected"),
                                     gDialog.csspropertiesBundle.getString("PleaseSelectAClass"),
                                     window);
          Inspect();
          return;
        }
      }
      else {
        CheckClass(gDialog.classPicker);
        if (gDialog.classPicker.getAttribute("valid") == "false"){
          PromptUtils.alertWithTitle(gDialog.csspropertiesBundle.getString("NoClasSelected"),
                                     gDialog.csspropertiesBundle.getString("PleaseSelectAClass"),
                                     window);
          Inspect();
          return;
        }
        editor.beginTransaction();
        // make sure the element carries the user-selected class
        className = (gDialog.classPicker.editor ? gDialog.classPicker.editor.outputToString("text/plain", 0) : gDialog.classPicker.value);
        if (!gCurrentElement.classList.contains(className)) {
          var c = (gCurrentElement.classList ? gCurrentElement.classList + " " : "") + className;
          editor.setAttribute(gCurrentElement, "class", className);
        }
      }
      break;

    default:
      editor.beginTransaction();
      break;
  }
  SaveSelection();
  var elt = gCurrentElement;
  for (var i = 0; i < aStyles.length; i++) {
    var s = aStyles[i];
    var property = s.property;
    var value = s.value;

    if (value && !gInUtils.cssPropertyIsValid(property, value))
      continue;

    switch (gDialog.cssPolicyMenulist.value) {

      case "id":
          ApplyStyleChangesToStylesheets(editor, elt, property, value,
                                         "#", "#", elt.id);
        break;

      case "inline":
        try {
          var txn = new diStyleAttrChangeTxn(elt, property, value, "");
          EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);  
          EditorUtils.getCurrentEditor().incrementModificationCount(1);  
        }
        catch(e) {}
        break;

      case "class":
          ApplyStyleChangesToStylesheets(editor, elt, property, value,
                                         ".", "\\.", className);
        break;

      case "type":
          ApplyStyleChangesToStylesheets(editor, elt, property, value,
                                         "", "", elt.localName);
        break;
      default:
        break;
    }
  }
  editor.endTransaction();
  if (!aNoSelectionUpdate)
    SelectionChanged(null, elt, true);
  RestoreSelection();

  if (aCallback)
    aCallback();
}

function FindLastEditableStyleSheet(aQuery)
{
  var doc = EditorUtils.getCurrentDocument();
  var headElt = doc.querySelector("head");
  var child = headElt.lastElementChild;
  var found = false;
  var sheet = null;
  while (!found && child) {
    var name = child.localName;
    if (name == "style" ||
        (name == "link" &&
         child.getAttribute("rel").toLowerCase() == "stylesheet" &&
         !child.hasAttribute("title"))) {
      var media = child.getAttribute("media") || "";
      var mediaArray = media.split(",");
      mediaArray.forEach(function(element,index,array) {array[index] = array[index].toLowerCase().trim()});
      var isForRightMedium = aQuery
                             ? (mediaArray.indexOf(aQuery) != -1)
                             : (!media || media == "all" || mediaArray.indexOf("screen") != -1);
      if (name == "link") {
        var uri = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService(Components.interfaces.nsIIOService)
                                .newURI(child.sheet.href, null, null);
        if (uri.scheme == "file" && isForRightMedium) {
          // is the file writable ?
          var file = UrlUtils.newLocalFile(UrlUtils.makeAbsoluteUrl(child.sheet.href));
          if (file.isWritable())
            found = true;
          else
            child = child.previousElementSibling;
        }
        else
          child = child.previousElementSibling;
      }
      else if (isForRightMedium)
        found = true;
      else
        child = child.previousElementSibling;
    }
    else
      child = child.previousElementSibling;
  }
  if (found)
    sheet = child.sheet;
  else { // no editable stylesheet in the document, create one
    var styleElt = doc.createElement("style");
    styleElt.setAttribute("type", "text/css");
    EditorUtils.getCurrentEditor().insertNode(styleElt, headElt, headElt.childNodes.length);
    sheet = styleElt.sheet;
  }
  return sheet;
}

function onLengthMenulistCommand(aElt, aUnitsString, aIdentsString, aAllowNegative, aCallback)
{
  var idents = aIdentsString.split(" ");
  var value;
  if (aElt.selectedItem)
    value = aElt.selectedItem.value;
  else
    value = aElt.value;
  aElt.value = value;
  var units = aUnitsString.replace( / /g, "|");
  var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
  var match = value.match( r );
  if (aElt.getAttribute("property")) {
    if (!value ||
        (match && !(!aAllowNegative && parseFloat(match[1]) < 0) &&
         (match[2] || units[0] == "|")) ||
        idents.indexOf(value) != -1) {
      var toApply = [ {
                        property: aElt.getAttribute("property"),
                        value: value
                      } ];
      if (aElt.hasAttribute("fouredges") && aElt.hasAttribute("fouredgescontrol")) {
        if (document.getElementById(aElt.getAttribute("fouredgescontrol")).checked) {
          var edgesArray = aElt.getAttribute("fouredges").split(",");
          for (var i = 0; i < edgesArray.length; i++)
            toApply.push({
                           property: edgesArray[i],
                           value: value
                         } );
        }
      }
      if (aElt.hasAttribute("checkimageratio") &&
          gCurrentElement.localName == "img" &&
          gDialog.preserveImageRatioCheckbox.checked) {
        var id = aElt.id;
        var otherId = (id == "widthMenulist") ? "heightMenulist" : "widthMenulist";
        var otherValue = null;
        if (value == "auto" ||
            (value && value.indexOf("%") != -1))
          otherValue = value;
        else if (match) {
          var ratio = (id == "widthMenulist") ? gCurrentElement.naturalHeight / gCurrentElement.naturalWidth :
                                                gCurrentElement.naturalWidth / gCurrentElement.naturalHeight;
          otherValue = (parseFloat(match[1]) * ratio) + match[2]; 
        }
  
        if (value) {
          gDialog[otherId].value = otherValue;
          toApply.push({
                         property: gDialog[otherId].getAttribute("property"),
                         value: otherValue
                       } );
        }
      }
      ApplyStyles(toApply);
    }
  }
  if (aCallback)
    aCallback(aElt);
}

function ApplyStyleChangesToStylesheets(editor,           // the current editor
                                        aElement,         // the selection container element
                                        property,         // the property we try to set/reset
                                        value,            // the value or "" for that property
                                        aDelimitor,       // a character
                                        aRegExpDelimitor, // the same in regexp form
                                        aIdent)           // the ident needed to create a rule
{
  // first, clean the style attribute for the style to apply
  var txn = new diStyleAttrChangeTxn(aElement, property, "", "");
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
  EditorUtils.getCurrentEditor().incrementModificationCount(1);  

  // find the media query if any
  var query = "";
  if (EditorUtils.getCurrentEditor().getMedium() == "print")
    query = "print";
  //= EditorUtils.getCurrentTabEditor().mResponsiveRuler.currentQuery;
  var inspector = Components.classes["@mozilla.org/inspector/dom-utils;1"]
                    .getService(Components.interfaces.inIDOMUtils);
  var dynamicPseudo = "";
  if (gDialog.hoverStateCheckbox.checked) {
    inspector.addPseudoClassLock(gCurrentElement, ":hover");
    aIdent += ":hover";
    dynamicPseudo = "hover";
  }
  var ruleset = CssInspector.getCSSStyleRules(aElement, true, dynamicPseudo);
  if (gDialog.hoverStateCheckbox.checked) {
    inspector.clearPseudoClassLocks(gCurrentElement);
  }

  var whereToInsert;
  switch (query) {
    case "":
      if (("ResponsiveRulerHelper" in gMain) && gMain.ResponsiveRulerHelper.hasSelectedMediaQuery()) {
          whereToInsert = gMain.ResponsiveInsertionHelper.findWhereToInsertRuleForSelectedMQ(ruleset, property, value, aDelimitor, aRegExpDelimitor, aIdent);
      }
      else
        whereToInsert = FindWhereToInsertRuleForScreen(ruleset, property, value, aDelimitor, aRegExpDelimitor, aIdent);
      if (whereToInsert.sheet) {
        if (whereToInsert.rule) {
          if (value) {
            whereToInsert.rule.style.setProperty(property, value, whereToInsert.priority);
          }
          else
            whereToInsert.rule.style.removeProperty(property);
          if (!whereToInsert.rule.style.length) {
            for (var i = 0 ; i < whereToInsert.sheet.cssRules.length; i++) {
              var rule = whereToInsert.sheet.cssRules.item(i);
              if (rule == whereToInsert.rule) {
                whereToInsert.sheet.deleteRule(i);
                break;
              }
            }
          }
        }
        else { // we don't have a rule host so we need to append a new rule
          whereToInsert.sheet.insertRule(aDelimitor + aIdent + "{" +
                                           property + ": " + value + " " +
                                           (whereToInsert. priority ? "!important" : "") + "}",
                                         whereToInsert.sheet.cssRules.length);
        }
    
        if (whereToInsert.sheet.ownerNode.href)
          CssInspector.serializeFileStyleSheet(whereToInsert.sheet, whereToInsert.sheet.href);
        else
          CssUtils.reserializeEmbeddedStylesheet(whereToInsert.sheet, editor);
    
      }
      else if (!whereToInsert.impossible) {
        // the style attribute case, unfortunately...
        var txn = new diStyleAttrChangeTxn(aElement, property, value, "important");
        EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
        EditorUtils.getCurrentEditor().incrementModificationCount(1);  
      }
      else {
        // unfortunately impossible, warn the user...
        // TBD XXX
      }
      break;
      
    case "print":
      whereToInsert = FindWhereToInsertRuleForPrint(ruleset, property, value, aDelimitor, aRegExpDelimitor, aIdent, aElement);
      if (whereToInsert.sheet) {
        if (whereToInsert.rule) {
          if (whereToInsert.rule.type == CSSRule.MEDIA_RULE) {
            whereToInsert.rule.insertRule(aDelimitor + aIdent + "{" +
                                             property + ": " + value + " " +
                                             (whereToInsert. priority ? "!important" : "") + "}",
                                           whereToInsert.rule.cssRules.length);
          }
          else { // STYLE_RULE
            if (value) {
              whereToInsert.rule.style.setProperty(property, value, whereToInsert.priority);
            }
            else 
              whereToInsert.rule.style.removeProperty(property);
            if (!whereToInsert.rule.style.length) { 
              for (var i = 0 ; i < whereToInsert.sheet.cssRules.length; i++) {
                var rule = whereToInsert.sheet.cssRules.item(i);
                if (rule == whereToInsert.rule) {
                  whereToInsert.sheet.deleteRule(i);
                  break;
                }
              }
            }
          }
        }
        else { // we don't have a rule host so we need to append a new rule
          // two cases depending on the sheet's media
          if (IsSheetOnlyForPrint(whereToInsert.sheet))
            whereToInsert.sheet.insertRule(aDelimitor + aIdent + "{" +
                                             property + ": " + value + " " +
                                             (whereToInsert. priority ? "!important" : "") + "}",
                                           whereToInsert.sheet.cssRules.length);
          else
            whereToInsert.sheet.insertRule("@media print { " + aDelimitor + aIdent + "{" +
                                             property + ": " + value + " " +
                                             (whereToInsert. priority ? "!important" : "") + "}}",
                                           whereToInsert.sheet.cssRules.length);
        }
    
        if (whereToInsert.sheet.ownerNode.href)
          CssInspector.serializeFileStyleSheet(whereToInsert.sheet, whereToInsert.sheet.href);
        else
          CssUtils.reserializeEmbeddedStylesheet(whereToInsert.sheet, editor);
    
      }
      else {
        // unfortunately impossible, warn the user...
        // TBD XXX
      }
      break;

    default: break;
  }

}

function FindWhereToInsertRuleForScreen(ruleset, property, value, aDelimitor, aRegExpDelimitor, aIdent)
{
  var rv = { sheet: null,
             rule: null,
             priority: "",
             impossible: false };

  var inspectedRule = CssInspector.findRuleForProperty(ruleset, property, gMain.ResponsiveRulerHelper);
  if (inspectedRule && inspectedRule.rule &&
      (gMain.ResponsiveRulerHelper || !inspectedRule.rule.parentRule)) {
    // ok, that property is already applied through a CSS rule

    // is that rule dependent on the ID selector for that ID?
    // if yes, let's try to tweak it
    var priority = inspectedRule.rule.style.getPropertyPriority(property);
    var selector = inspectedRule.rule.selectorText;
    var r = new RegExp( aRegExpDelimitor + aIdent + "$|" + aRegExpDelimitor + aIdent + "[\.:,\\[]", "g");
    if (selector.match(r)) {
      // yes! can we edit the corresponding stylesheet or not?
      var sheet = inspectedRule.rule.parentStyleSheet;
      var topSheet = sheet;
      while (topSheet.parentStyleSheet)
        topSheet = topSheet.parentStyleSheet;
      if (topSheet.ownerNode &&
          (!sheet.href || sheet.href.substr(0, 4) != "http")) {
        // yes we can edit it...
        rv.sheet = sheet;
        rv.rule = inspectedRule.rule;
        rv.priority = priority;
        return rv;
      }
    }
    // we need to check if the rule
    // has a specificity no greater than an ID's one

    // we need to find the last locally editable stylesheet
    // attached to the document
    var sheet = FindLastEditableStyleSheet();
    var spec = inspectedRule.specificity;
    var refSpecificity;
    switch (aDelimitor) {
      case "#": refSpecificity = {a:0, b:1, c:0, d:0}; break;
      case ".": refSpecificity = {a:0, b:0, c:1, d:0}; break;
      case "":  refSpecificity = {a:0, b:0, c:0, d:1}; break;
      default: break; // should never happen
    }
    if (compareSpecificities(refSpecificity, spec) >= 0) { 
      var existingRule = CssInspector.findLastRuleInRulesetForSelector(ruleset, aDelimitor + aIdent);
      if (existingRule &&
          (!existingRule.parentStyleSheet.href || existingRule.parentStyleSheet.href.substr(0, 4) != "http")) {
        rv.sheet = existingRule.parentStyleSheet;
        rv.rule = inspectedRule.rule;
        rv.priority = priority;
        return rv;
      }
      // cool, we can just create a new rule with an ID selector
      // but don't forget to set the priority...
      rv.sheet = sheet;
      rv.priority = priority;
      return rv;
    }
    // at this point, we have a greater specificity; hum, then what's
    // the priority of the declaration?
    if (!priority) {
      var existingRule = CssInspector.findLastRuleInRulesetForSelector(ruleset, aDelimitor + aIdent);
      if (existingRule &&
          (!existingRule.parentStyleSheet.href || existingRule.parentStyleSheet.href.substr(0, 4) != "http")) {
        rv.sheet = existingRule.parentStyleSheet;
        rv.rule = inspectedRule.rule;
        rv.priority = "important";
        return rv;
      }
      // no priority, so cool we can create a !important declaration
      // for the ID
      rv.sheet = sheet;
      rv.priority = "important";
      return rv;
    }
    // argl, it's already a !important declaration :-( our only
    // choice is a !important style attribute... We can't just clean the
    // style on inspectedRule because some other rules could also apply
    // is that one goes away.

    // nothing to set
    return rv;
  }

  // oh, the property is not applied yet, let's just create a rule
  // with the ID selector for that property
  var sheet;
  var existingRule = CssInspector.findLastRuleInRulesetForSelector(ruleset, aDelimitor + aIdent, gMain.ResponsiveRulerHelper, property);
  if (existingRule && existingRule.parentStyleSheet &&
        (!existingRule.parentStyleSheet.href || existingRule.parentStyleSheet.href.substr(0, 4) != "http")) {
    rv.sheet = existingRule.parentStyleSheet;
    rv.rule = existingRule;
  }
  else {
    if (existingRule) {
      rv.priority = (existingRule.priority ? "important" : "");
    }
    rv.sheet = FindLastEditableStyleSheet();
  }
  return rv;
}


function ToggleHover(aElt)
{
  if (aElt.checked && gDialog.cssPolicyMenulist.value == "inline")
    gDialog.cssPolicyMenulist.value = "id";
  var node = gCurrentElement;
  SelectionChanged(null, node, null);
}

function RulesMatchesQuery(rule, query)
{
  if (!query) // no media query specified, we always match
    return true;

  //query = "screen and (max-width: " + query + "px)";

  if ((rule.parentRule &&
       rule.parentRule.type == CSSRule.MEDIA_RULE &&
       rule.parentRule.media.mediaText == query) ||
      (rule.parentStyleSheet &&
       rule.parentStyleSheet.media &&
       rule.parentStyleSheet.media.mediaText == query))
    return true;
  
  return false;
}

function compareSpecificities(s1, s2)
{
  if (s1.a > s2.a ||
      (s1.a == s2.a && s1.b > s2.b) ||
      (s1.a == s2.a && s1.b == s2.b && s1.c > s2.c) ||
      (s1.a == s2.a && s1.b == s2.b && s1.c == s2.c && s1.d > s2.d))
    return +1;
  if (s2.a > s1.a ||
      (s2.a == s1.a && s2.b > s1.b) ||
      (s2.a == s1.a && s2.b == s1.b && s2.c > s1.c) ||
      (s2.a == s1.a && s2.b == s1.b && s2.c == s1.c && s2.d > s1.d))
    return -1;
  return 0;
}

function FindWhereToInsertRuleForPrint(ruleset, property, value, aDelimitor, aRegExpDelimitor, aIdent, aElement)
{
  var rv = { sheet: null,
             rule: null,
             priority: "",
             impossible: false };

  var inspectedRule = CssInspector.findRuleForProperty(ruleset, property);
  if (inspectedRule && inspectedRule.rule && RulesMatchesQuery(inspectedRule.rule, "print")) {
    // ok, that property is already applied through a CSS rule

    // is that rule dependent on the ID selector for that ID?
    // if yes, let's try to tweak it
    var priority = inspectedRule.rule.style.getPropertyPriority(property);
    var selector = inspectedRule.rule.selectorText;
    var r = new RegExp( aRegExpDelimitor + aIdent + "$|" + aRegExpDelimitor + aIdent + "[\.:,\\[]", "g");
    if (selector.match(r)) {
      // yes! can we edit the corresponding stylesheet or not?
      var sheet = inspectedRule.rule.parentStyleSheet;
      var topSheet = sheet;
      while (topSheet.parentStyleSheet)
        topSheet = topSheet.parentStyleSheet;
      if (topSheet.ownerNode &&
          (!sheet.href || sheet.href.substr(0, 4) != "http")) {
        // yes we can edit it...
        rv.sheet = sheet;
        rv.rule = inspectedRule.rule;
        rv.priority = priority;
        return rv;
      }
    }
  }

  var sheet = FindLastEditableStylesheetForPrint();
  rv.sheet = sheet;
  function findMediaPrintRuleOrMatch(aRules, aElement, aDelimitor, aSelectorText, aTop) {
    var refSpecificity = {a:0, b:0, c:0, d:0};
    switch (aDelimitor) {
      case "#": refSpecificity = {a:0, b:1, c:0, d:0}; break;
      case ".": refSpecificity = {a:0, b:0, c:1, d:0}; break;
      case "":  refSpecificity = {a:0, b:0, c:0, d:1}; break;
      default: break; // should never happen
    }
    if (aRules.length) {
      var index = aRules.length - 1;
      while (index >= 0) {
        var rule = aRules.item(index);
        if (rule.type == CSSRule.STYLE_RULE) {
          if (!aTop && rule.selectorText == aSelectorText)
            return rule;
          if (aElement.mozMatchesSelector(rule.selectorText)) {
            var parser = new CSSParser();
            parser._init();
            parser.mPreserveWS       = false;
            parser.mPreserveComments = false;
            parser.mPreservedTokens = [];
            parser.mScanner.init(rule.selectorText);
            var token = parser.getToken(false, false);
            if (token.isNotNull()) {
              var selector = parser.parseSelector(token, true);
              if (compareSpecificities(selector.specificity, refSpecificity) >= 0)
                return aTop ? null : rule.parentRule; // gah we need to create a new rule
            }
          }
        }
        else if (rule.type == CSSRule.MEDIA_RULE && rule.media.mediaText == "print") {
          var r = findMediaPrintRuleOrMatch(rule.cssRules, aElement, aDelimitor, aSelectorText, false);
          return r ? r : rule;
        }
        index--;
      }
    }
    return null;
  }
  rv.rule = findMediaPrintRuleOrMatch(sheet.cssRules, aElement, aDelimitor, aDelimitor + aIdent, true);
  rv.priority = priority;
  return rv;
}

function FindLastEditableStylesheetForPrint()
{
  var doc = EditorUtils.getCurrentDocument();
  var headElt = doc.querySelector("head");
  var styleElts = doc.querySelectorAll("head > style, head > link[rel='stylesheet' i]");
  var found = false;

  if (styleElts.length) {
    var elt = styleElts[styleElts.length -1];

    if (IsSheetForPrint(elt.sheet) || IsSheetForAllMedia(elt.sheet)) {
      var name = elt.localName;
      if (name == "link") {
        var uri = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService(Components.interfaces.nsIIOService)
                                .newURI(child.sheet.href, null, null);
        if (uri.scheme == "file") {
          // is the file writable ?
          var file = UrlUtils.newLocalFile(UrlUtils.makeAbsoluteUrl(elt.sheet.href));
          if (file.isWritable())
            found = true;
        }
      }
      else
        found = true;
    }

    if (found) {
      return elt.sheet;
    }
  }

  var styleElt = doc.createElement("style");
  styleElt.setAttribute("type", "text/css");
  EditorUtils.getCurrentEditor().insertNode(styleElt, headElt, headElt.childNodes.length);
  return styleElt.sheet;
}

function IsSheetForAllMedia(aSheet)
{
  if (!aSheet)
    return false;

  var media = aSheet.media.mediaText || "";
  return (!media || media == "all");
}

function IsSheetForPrint(aSheet)
{
  if (!aSheet)
    return false;

  var media = aSheet.media.mediaText || "";
  var mediaArray = media.split(",");
  mediaArray.forEach(function(element,index,array) {array[index] = array[index].toLowerCase().trim()});
  return (mediaArray.indexOf("print") != -1)
}

function IsSheetOnlyForPrint(aSheet)
{
  if (!aSheet)
    return false;

  var media = aSheet.media.mediaText || "";
  return (media == "print");
}

RegisterIniter(CssPropertyBindingsIniter);

function CssPropertyBindingsIniter(aElt, aRuleset)
{
	var boundElts = document.querySelectorAll("cssproperty");
	for (var i = 0; i < boundElts.length; i++)
	  boundElts[i].update(aElt, aRuleset);
}
