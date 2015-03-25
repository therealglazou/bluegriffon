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

Components.utils.import("resource://app/modules/cssHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/l10nHelper.jsm");

var gDocUrlScheme = null;

function GlobalResetter()
{
  RulesetsResetter();
  ParamsResetter();
  RulesResetter();
}

function RulesetsResetter()
{
  gDialog.rulesetsBox.suppressOnSelect = true;
  var child = gDialog.rulesetsBox.lastElementChild;
  while (child && child.localName == "listitem") {
    var tmp = child.previousElementSibling;
    child.parentNode.removeChild(child);
    child = tmp;
  }
  gDialog.rulesetsBox.suppressOnSelect = false;
}

function ParamsResetter()
{
  gDialog.paramsBox.suppressOnSelect = true;
  var child = gDialog.paramsBox.lastElementChild;
  while (child && child.localName == "listitem") {
    var tmp = child.previousElementSibling;
    child.parentNode.removeChild(child);
    child = tmp;
  }
  gDialog.paramsBox.suppressOnSelect = false;
}

function RulesResetter()
{
  gDialog.rulesBox.suppressOnSelect = true;
  var child = gDialog.rulesBox.lastElementChild;
  while (child && child.localName == "listitem") {
    var tmp = child.previousElementSibling;
    child.parentNode.removeChild(child);
    child = tmp;
  }
  gDialog.rulesBox.suppressOnSelect = false;
}

function GlobalIniter(aElt)
{
  if (gCurrentElement) {
    var doc = gCurrentElement.ownerDocument;
    var links = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
    const kINLINE = gDialog.its20Bundle.getString("InlineRules");
    for (var i = 0; i < links.length; i++) {
      var source = links[i];
      var str = kINLINE;
      var item = document.createElement('listitem');
      var cell1 = document.createElement('listcell');
      var cell2 = document.createElement('listcell');
      if (source.localName == "link") {
        str = source.href;
        if (!IsEditable(source))
          item.setAttribute("class", "remote");
      }
      cell1.setAttribute("label", str);
      cell1.setAttribute("crop", "start");
      item.appendChild(cell1);

      var itsDoc = source.getUserData("itsRules");
      var queryLanguage = itsDoc.documentElement.hasAttribute("queryLanguage")
                          ? itsDoc.documentElement.getAttribute("queryLanguage")
                          : "xpath";
      cell2.setAttribute("label", queryLanguage);
      item.appendChild(cell2);

      gDialog.rulesetsBox.appendChild(item);
    }
  }
}

function SerializeITSDocToScriptElement(aDoc, aScriptElement)
{
  var oSerializer = new XMLSerializer();
  str = oSerializer.serializeToString(aDoc.documentElement)
                   .replace(/&gt;/g, ">")
                   .replace(/&lt;/g, "<")
                   .replace(/&amp;/g, "&")
                   .replace(/>\s*<its/g, ">\n  <its")
                   .replace(/<its:locNote>/g, "  <its:locNote>")
                   .replace(/<\/its:rules/g, "\n</its:rules");

  var editor = EditorUtils.getCurrentEditor();
  editor.beginTransaction();

  var child = aScriptElement.firstChild;
  while (child) {
    var tmp = child.nextSibling;
    editor.deleteNode(child);
    child = tmp;
  }
  var textNode = EditorUtils.getCurrentDocument().createTextNode("\n" + str + "\n    ");
  var txn = new diNodeInsertionTxn(textNode,
                                   aScriptElement,
                                   null);
  editor.transactionManager.doTransaction(txn);
  editor.endTransaction();
}

function SerializeITSDocToFile(aDoc, aLinkElement)
{
  var oSerializer = new XMLSerializer();
  str = oSerializer.serializeToString(aDoc.documentElement)
                   .replace(/&gt;/, ">")
                   .replace(/&lt;/, "<")
                   .replace(/&amp;/, "&");

  const classes             = Components.classes;
  const interfaces          = Components.interfaces;
  const nsILocalFile        = interfaces.nsILocalFile;
  const nsIFileOutputStream = interfaces.nsIFileOutputStream;
  const FILEOUT_CTRID       = '@mozilla.org/network/file-output-stream;1';

  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService)
  var handler = ios.getProtocolHandler("file");
  var fileHandler = handler.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
  var localFile = fileHandler.getFileFromURLSpec(aLinkElement.href).QueryInterface(nsILocalFile);  

  var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                 createInstance(Components.interfaces.nsIFileOutputStream);
  
  // use 0x02 | 0x10 to open file for appending.
  foStream.init(localFile, 0x02 | 0x08 | 0x20, 0666, 0); 
  // write, create, truncate
  // In a c file operation, we have no need to set file mode with or operation,
  // directly using "r" or "w" usually.
  
  // if you are sure there will never ever be any non-ascii text in data you can 
  // also call foStream.writeData directly
  var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                  createInstance(Components.interfaces.nsIConverterOutputStream);
  var charset = "UTF-8";
  try {
    converter.init(foStream, charset, 0, 0);
    converter.writeString(str);
    converter.close(); // this closes foStream
  }
  catch (ex) {}
}

/************* RULESETS HANDLING ******************/

function ShowRules(aList)
{
  var index = aList.selectedIndex;
  if (index < 0) {
    const allButtonsArray = [
      "RulesetsMinusButton",
      "RulesetsDownButton",
      "RulesetsUpButton",
      "ParamsPlusButton",
      "ParamsMinusButton",
      "ParamsDownButton",
      "ParamsUpButton",
      "RulePlusButton",
      "RuleMinusButton",
      "RuleDownButton",
      "RuleUpButton"
      ];
    for (var i = 0; i < allButtonsArray.length; i++)
     gDialog[allButtonsArray[i]].disabled = true;

    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");

  ParamsResetter();
  RulesResetter();

  var child = itsDoc.documentElement.firstElementChild;
  while (child) {
    var name = child.localName;
    switch (name) {
      case "param":
      {
        var paramName = child.getAttribute("name")
        var paramValue = child.textContent;
    
        var item = document.createElement('listitem');
        var cell1 = document.createElement('listcell');
        var cell2 = document.createElement('listcell');
        cell1.setAttribute("label", paramName);
        item.appendChild(cell1);
    
        cell2.setAttribute("label", paramValue);
        item.appendChild(cell2);
    
        gDialog.paramsBox.appendChild(item);
      }
        break;
      default:
      {
        var l10name = gDialog.its20Bundle.getString(name);
        var selector = child.getAttribute("selector");
    
        var item = document.createElement('listitem');
        var cell1 = document.createElement('listcell');
        var cell2 = document.createElement('listcell');
        var cell3 = document.createElement('listcell');
        cell1.setAttribute("label", l10name);
        item.appendChild(cell1);
    
        cell2.setAttribute("label", selector);
        item.appendChild(cell2);

        cell3.setAttribute("label", GetMainValueFromITSRule(child));
        item.appendChild(cell3);

        item.setUserData("rule", child, null);
        item.setAttribute("tooltiptext", child.outerHTML
                                           .replace(/&gt;/, ">")
                                           .replace(/&lt;/, "<")
                                           .replace(/&amp;/, "&"));

        gDialog.rulesBox.appendChild(item);
      }
      break;
    }

    child = child.nextElementSibling;
  }

  var isEditable = IsEditable(source);
  gDialog.RulesetsUpButton.disabled = !index;
  gDialog.RulesetsDownButton.disabled = (index == aList.getRowCount() - 1);
  gDialog.RulesetsMinusButton.disabled = false;
  gDialog.ParamsPlusButton.disabled = !isEditable;
  gDialog.RulePlusButton.disabled = !isEditable;
}

function DeleteRuleset()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];

  EditorUtils.getCurrentEditor().deleteNode(source);
  SelectionChanged(null, gCurrentElement, true);
  if (index <= gDialog.rulesetsBox.getRowCount() - 1) {
    gDialog.rulesetsBox.selectedIndex = index;
  }
}

function RulesetDown()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var target = sources[index + 1];

  var txn = new diNodeInsertionTxn(source,
                                   source.parentNode,
                                   target.nextElementSibling);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index + 1;
}

function RulesetUp()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var target = sources[index - 1];

  var txn = new diNodeInsertionTxn(source,
                                   source.parentNode,
                                   target);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index - 1;
}

function AddRuleset()
{
  gDialog.newRulesetTypeRadiogroup.value = "external";
  gDialog.itsFileRadiogroup.value = "existing";
  ToggleNewRulesetType();
  gDialog.newRulesetQueryLanguageRadiogroup.value = "xpath";

  var docUrl = EditorUtils.getDocumentUrl();
  gDocUrlScheme = UrlUtils.getScheme(docUrl);
  gDialog.relativeURLCheckbox.disabled = !(gDocUrlScheme && gDocUrlScheme != "resource");

  gDialog.newRulesetUrlTextbox.focus();

  gDialog.addRulesetPanel.openPopup(gDialog.RulesetsPlusButton, "above", 0, 23);
}

function ToggleNewRulesetType()
{
  if (gDialog.newRulesetTypeRadiogroup.value == "external") {
    if (gDocUrlScheme && gDocUrlScheme != "resource")
      gDialog.relativeURLCheckbox.removeAttribute("disabled");
    gDialog.existingITSRadio.removeAttribute("disabled");
    gDialog.newRulesetFileRadio.removeAttribute("disabled");
    ToggleITSFileType();
  }
  else {
    gDialog.relativeURLCheckbox.setAttribute("disabled", "true");
    gDialog.existingITSRadio.setAttribute("disabled", "true");
    gDialog.newRulesetFileRadio.setAttribute("disabled", "true");
    gDialog.newRulesetUrlTextbox.setAttribute("disabled", "true");
    gDialog.newRulesetUrlFilepickerbutton.setAttribute("disabled", "true");
  }
}

function ToggleITSFileType()
{
  if (gDialog.itsFileRadiogroup.value == "existing") {
    gDialog.newRulesetUrlTextbox.removeAttribute("disabled");
    gDialog.newRulesetUrlFilepickerbutton.removeAttribute("disabled");
  }
  else {
    gDialog.newRulesetUrlTextbox.setAttribute("disabled", "true");
    gDialog.newRulesetUrlFilepickerbutton.setAttribute("disabled", "true");
  }
}

function CloseAddRulesetPanel()
{
  gDialog.addRulesetPanel.hidePopup();
}

function CreateNewRuleset()
{
  var type = gDialog.newRulesetTypeRadiogroup.value;
  var queryLanguage = gDialog.newRulesetQueryLanguageRadiogroup.value;
  var url = gDialog.newRulesetUrlTextbox.value;

  var elt = null;
  switch (type) {
    case "external":
      elt = EditorUtils.getCurrentDocument().createElement("link");
      elt.setAttribute("rel", "its-rules");
      switch (gDialog.itsFileRadiogroup.value) {
        case "existing":
          elt.setAttribute("href", url);
          break;
        case "new":
        {
          var spec = NewITS20File("<?xml version='1.0' encoding='UTF-8'?>\n"
                       + "<its:rules xmlns:its='" + kITS_NAMESPACE + "' version='2.0' queryLanguage='" + queryLanguage + "'>\n"
                       + "</its:rules>");
          if (!spec) {
            CloseAddRulesetPanel();
            return;
          }
          elt.setAttribute("href", spec);
        }
        break;
      }
      break;

    case "inline":
      elt = EditorUtils.getCurrentDocument().createElement("script");
      elt.setAttribute("type", "application/its+xml");
      elt.textContent = "\n      <its:rules xmlns:its='"
                        + kITS_NAMESPACE
                        + "' version='2.0' queryLanguage='"
                        + queryLanguage
                        + "'>\n      </its:rules>\n    ";
      break;

    default: break; // should never happen
  }

  CloseAddRulesetPanel();

  if (elt) { // sanity case
    var headElt = EditorUtils.getCurrentDocument().querySelector("head");
    var txn = new diNodeInsertionTxn(elt,
                                     headElt,
                                     null);
    EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
    EditorUtils.getCurrentEditor().incrementModificationCount(1);  
    SelectionChanged(null, gCurrentElement, true);
    gDialog.rulesetsBox.selectedIndex = gDialog.rulesetsBox.getRowCount() - 1;
 }
}

function NewITS20File(aContents)
{
  const nsIFP = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"]
              .createInstance(nsIFP);
  fp.init(window, gDialog.its20Bundle.getString("NewITSFile"), nsIFP.modeSave);
  fp.appendFilter("*.xml", "xml");
  var fpr = fp.show();
  if ((fpr == nsIFP.returnOK || fpr == nsIFP.returnReplace) &&
      fp.fileURL.spec && fp.fileURL.spec.length > 0)
  {
    var spec = fp.fileURL.spec;
    var file = fp.file;
    if (spec.length < 5 ||
        spec.substring(spec.length - 4) != ".xml") {
      spec += ".xml";
      var ioService =
        Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
      var fileHandler =
        ioService.getProtocolHandler("file")
                 .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
      file = fileHandler.getFileFromURLSpec(spec);
    }

    // file is nsIFile, data is a string
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                             createInstance(Components.interfaces.nsIFileOutputStream);
    
    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.
    
    // if you are sure there will never ever be any non-ascii text in data you can 
    // also call foStream.writeData directly
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                              createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foStream, "UTF-8", 0, 0);
    converter.writeString(aContents);
    converter.close(); // this closes foStream

    return (gDialog.relativeURLCheckbox.checked && gDocUrlScheme && gDocUrlScheme != "resource")
             ? UrlUtils.makeRelativeUrl(spec)
             : spec;
  }
  return null;
}

function CheckURL(aTextboxId, aCheckboxId)
{
  var url = gDialog[aTextboxId].value;
  if (url) {
    gDialog[aCheckboxId].disabled = !(gDocUrlScheme && gDocUrlScheme != "resource");
    gDialog[aCheckboxId].checked = !gDialog[aCheckboxId].disabled && (url == UrlUtils.makeRelativeUrl(url));
  }
  else {
    gDialog[aCheckboxId].checked = false;
    gDialog[aCheckboxId].disabled = true;
  }
}

function MakeRelativeUrl(aTextboxId, aCheckboxId)
{
  var spec = gDialog[aTextboxId].value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog[aTextboxId].value = spec;
    gDialog[aCheckboxId].checked = true;
  }
}

function MakeAbsoluteUrl(aTextboxId, aCheckboxId)
{
  var spec = gDialog[aTextboxId].value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog[aTextboxId].value = spec;
    gDialog[aCheckboxId].checked = false;
  }
}

function ToggleRelativeOrAbsolute(aTextboxId, aCheckboxId)
{
  if (gDialog[aCheckboxId].checked) {
    MakeRelativeUrl(aTextboxId, aCheckboxId);
  }
  else {
    MakeAbsoluteUrl(aTextboxId, aCheckboxId);
  }
}

/************* PARAMS HANDLING ******************/

function OnParamSelected(aList)
{
  if (!gDialog.ParamsPlusButton.disabled) {
    var index = aList.selectedIndex;
    if (index < 0) {
      const allButtonsArray = [
        "ParamsMinusButton",
        "ParamsDownButton",
        "ParamsUpButton"
        ];
      for (var i = 0; i < allButtonsArray.length; i++)
       gDialog[allButtonsArray[i]].disabled = true;
  
      return;
    }
    gDialog.ParamsUpButton.disabled = !index;
    gDialog.ParamsDownButton.disabled = (index == aList.getRowCount() - 1);
    gDialog.ParamsMinusButton.disabled = false;
  }
}

function IsEditable(aSource)
{
  if (aSource.localName == "link") {
    var url = UrlUtils.newURI(aSource.href).QueryInterface(Components.interfaces.nsIURL);
    if (url.scheme != "file") {
      return false;
    }
  }
  return true;
}

function DeleteParam()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  try {
    var params = itsDoc.querySelectorAll("param");
    var paramIndex = gDialog.paramsBox.selectedIndex;
    var paramElt = params[paramIndex];
    paramElt.parentNode.removeChild(paramElt);

    if (source.localName == "script")
      SerializeITSDocToScriptElement(itsDoc, source);
    else {
      SerializeITSDocToFile(itsDoc, source);
    }

    gLastElement = null;
    SelectionChanged(null, gCurrentElement, true);
    if (index < gDialog.rulesetsBox.getRowCount()) {
      gDialog.rulesetsBox.selectedIndex = index;
      if (paramIndex < gDialog.paramsBox.getRowCount()) {
        gDialog.paramsBox.selectedIndex = paramIndex;
      }
      else if (paramIndex > 0) {
        gDialog.paramsBox.selectedIndex = paramIndex - 1;
      }
    }
  }
  catch(e) {alert(e)}
}


function AddParam(event)
{
  gDialog.paramNameTextbox.value = "";
  gDialog.paramValueTextbox.value = "";
  gDialog.addParamOKButton.disabled = true;
  gDialog.addParamPanel.openPopup(gDialog.ParamsPlusButton, "above", 0, 23);
  gDialog.paramNameTextbox.focus();
}

function CloseAddParamPanel()
{
  gDialog.addParamPanel.hidePopup();
}

function GetCurrentItsDoc()
{
  var source = GetCurrentItsSource()
  if (source)
    return source.getUserData("itsRules");
  return null;
}

function GetCurrentItsSource()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return null;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  return sources[index];
  return source.getUserData("itsRules");
}

function CheckParamUnicity(aElt)
{
  var itsDoc = GetCurrentItsDoc();
  if (!itsDoc) // sanity case
    return;
  var name = aElt.value;

  var found = itsDoc.querySelector("param[name='" + name +"']");

  gDialog.addParamOKButton.disabled = (!name || found)
}

function CreateNewParam()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var name  = gDialog.paramNameTextbox.value;
  var value = gDialog.paramValueTextbox.value;

  var elt = itsDoc.createElementNS(kITS_NAMESPACE, "param");
  elt.setAttribute("name", name);
  elt.textContent = value;
  itsDoc.documentElement.appendChild(elt);
  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  var item = document.createElement('listitem');
  var cell1 = document.createElement('listcell');
  var cell2 = document.createElement('listcell');
  cell1.setAttribute("label", name);
  item.appendChild(cell1);

  cell2.setAttribute("label", value);
  item.appendChild(cell2);

  gDialog.paramsBox.appendChild(item);
  gDialog.paramsBox.selectedItem = item;

  CloseAddParamPanel();

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  gDialog.paramsBox.selectedIndex = gDialog.paramsBox.getRowCount() - 1;
}

function ParamUp()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var paramIndex = gDialog.paramsBox.selectedIndex;
  var params = itsDoc.querySelectorAll("param");
  var param = params[paramIndex];
  var target = params[paramIndex - 1];

  var txn = new diNodeInsertionTxn(param,
                                   param.parentNode,
                                   target);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  gDialog.paramsBox.selectedIndex = paramIndex - 1;
}

function ParamDown()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var paramIndex = gDialog.paramsBox.selectedIndex;
  var params = itsDoc.querySelectorAll("param");
  var param = params[paramIndex];
  var target = params[paramIndex + 1];

  var txn = new diNodeInsertionTxn(param,
                                   param.parentNode,
                                   target.nextElementSibling);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  gDialog.paramsBox.selectedIndex = paramIndex + 1;
}

/************* RULES HANDLING ******************/

function AddRule(aEvent)
{
  var ruleToCreate = aEvent.originalTarget.value;

  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;
  var queryLanguage = itsDoc.documentElement.hasAttribute("queryLanguage")
                      ? itsDoc.documentElement.getAttribute("queryLanguage")
                      : "xpath";
  var rv = {cancelled: false};
  window.openDialog("chrome://its20/content/ruleDialogs/" + ruleToCreate + ".xul",
                    "_blank",
                    "chrome,modal,dialog=no,titlebar,resizable",
                    rv, null, queryLanguage, itsDoc, gCurrentElement);

  if (rv.cancelled) {
    if (source.localName == "script")
      SerializeITSDocToScriptElement(itsDoc, source);
    else {
      SerializeITSDocToFile(itsDoc, source);
    }
    gLastElement = null;
    SelectionChanged(null, gCurrentElement, true);
    gDialog.rulesetsBox.selectedIndex = index;
    gDialog.rulesBox.selectedIndex = gDialog.rulesBox.getRowCount() - 1;
  }
}

function OnRuleSelected(aList)
{
  if (!gDialog.ParamsPlusButton.disabled) {
    var index = aList.selectedIndex;
    if (index < 0) {
      const allButtonsArray = [
        "RuleMinusButton",
        "RuleDownButton",
        "RuleUpButton"
        ];
      for (var i = 0; i < allButtonsArray.length; i++)
       gDialog[allButtonsArray[i]].disabled = true;
  
      return;
    }
    gDialog.RuleUpButton.disabled = !index;
    gDialog.RuleDownButton.disabled = (index == aList.getRowCount() - 1);
    gDialog.RuleMinusButton.disabled = false;
  }
}

function OnRuleDblclicked(aList)
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var rule = aList.selectedItem.getUserData("rule");
  if (kIMPLEMENTED_RULES.indexOf(rule.localName) == -1)
    return;

  var ruleIndex = aList.selectedIndex;
  var queryLanguage = itsDoc.documentElement.hasAttribute("queryLanguage")
                      ? itsDoc.documentElement.getAttribute("queryLanguage")
                      : "xpath";
  var rv = {cancelled: false};

  window.openDialog("chrome://its20/content/ruleDialogs/" + rule.localName + ".xul",
                    "_blank",
                    "chrome,modal,dialog=no,titlebar,resizable",
                    rv, rule, queryLanguage, itsDoc, gCurrentElement);

  if (rv.cancelled) {
    if (source.localName == "script")
      SerializeITSDocToScriptElement(itsDoc, source);
    else {
      SerializeITSDocToFile(itsDoc, source);
    }
    gLastElement = null;
    SelectionChanged(null, gCurrentElement, true);
    gDialog.rulesetsBox.selectedIndex = index;
    aList.selectedIndex = ruleIndex;
  }
}

function RuleUp()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var ruleIndex = gDialog.rulesBox.selectedIndex;
  var rule = gDialog.rulesBox.selectedItem.getUserData("rule");
  var target = rule.previousElementSibling;

  var txn = new diNodeInsertionTxn(rule,
                                   rule.parentNode,
                                   target);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  gDialog.rulesBox.selectedIndex = ruleIndex - 1;
}

function RuleDown()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var ruleIndex = gDialog.rulesBox.selectedIndex;
  var rule = gDialog.rulesBox.selectedItem.getUserData("rule");
  var target = rule.nextElementSibling;

  var txn = new diNodeInsertionTxn(rule,
                                   rule.parentNode,
                                   target.nextElementSibling);
  EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);

  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  gDialog.rulesBox.selectedIndex = ruleIndex + 1;
}

function DeleteRule()
{
  var index = gDialog.rulesetsBox.selectedIndex;
  if (index < 0) { // sanity case...
    return;
  }
  var doc = gCurrentElement.ownerDocument;
  var sources = doc.querySelectorAll(kITS_OWNER_ELEMENTS_SELECTOR);
  var source = sources[index];
  var itsDoc = source.getUserData("itsRules");
  if (!itsDoc) // sanity case
    return;

  var ruleIndex = gDialog.rulesBox.selectedIndex;
  var rule = gDialog.rulesBox.selectedItem.getUserData("rule");

  rule.parentNode.removeChild(rule);

  if (source.localName == "script")
    SerializeITSDocToScriptElement(itsDoc, source);
  else {
    SerializeITSDocToFile(itsDoc, source);
  }

  gLastElement = null;
  SelectionChanged(null, gCurrentElement, true);
  gDialog.rulesetsBox.selectedIndex = index;
  if (ruleIndex < gDialog.rulesBox.getRowCount())
    gDialog.rulesBox.selectedIndex = ruleIndex;
  else if (ruleIndex > 1)
    gDialog.rulesBox.selectedIndex = ruleIndex - 1;
}
