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
Components.utils.import("resource://gre/modules/cssInspector.jsm");
Components.utils.import("resource://gre/modules/prompterHelper.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var gMain = null;
var gCurrentElement = null;
var gIsPanelActive = true;
var gPrefs = null;
var gNestedRoleDropdown;
var gBundle = null;

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

  gNestedRoleDropdown = (gDialog.treeViewCheckbox.getAttribute("checked") == "true");
  gBundle = gDialog.ariaBundle;

  ResetRoleDropdown();
  
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
  gMain.NotifierUtils.addNotifierCallback("redrawPanel",
                                          RedrawAll,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("panelClosed",
                                          PanelClosed,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("afterEnteringSourceMode",
                                          Inspect,
                                          window);
  gMain.NotifierUtils.addNotifierCallback("afterLeavingSourceMode",
                                          Inspect,
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
    gMain.NotifierUtils.removeNotifierCallback("selection_strict",
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
    gMain.NotifierUtils.removeNotifierCallback("afterEnteringSourceMode",
                                               Inspect,
                                               window);
    gMain.NotifierUtils.removeNotifierCallback("afterLeavingSourceMode",
                                               Inspect,
                                               window);
  }
}

function Inspect()
{
  if (gMain && gMain.EditorUtils) {
    var editor = gMain.EditorUtils.getCurrentEditor();
    var visible = editor && (gMain.EditorUtils.isWysiwygMode());
    gDialog.mainBox.style.visibility = visible ? "" : "hidden";
    gMain.document.querySelector("[panelid='panel-aria']").className = visible ? "" : "inactive";
    if (!visible) {
      return;
    }

    if (editor) {
      var node = gMain.EditorUtils.getSelectionContainer().node;
      if (node) {
        SelectionChanged(null, node, true);
      }
    }
  }
}

function RedrawAll(aNotification, aPanelId)
{
  if (aPanelId == "panel-aria") {
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
  if (aPanelId == "panel-aria")
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
  if (node.hasAttribute("role") || node.hasAttributeNS("http://www.idpf.org/2007/ops", "type")) {
    var role = node.getAttribute("role") || node.getAttributeNS("http://www.idpf.org/2007/ops", "type");
    gDialog.roleMenulist.value = role;

    CheckConstraints(node, role);

    PopulateProperties(role, "required", "requiredProperties");
    PopulateProperties(role, "properties", "properties");
    PopulateInheritedProperties(role, "inheritedProperties");
  }
  else {
    gDialog.roleMenulist.value = "";

    gDialog.constraintsSectionHeader.setAttribute("hidden", "true");
    gDialog.contextSection.setAttribute("hidden", "true");
    gDialog.ownsSection.setAttribute("hidden", "true");

    gDialog.requiredPropertiesHeader.setAttribute("hidden", "true");
    gDialog.propertiesHeader.setAttribute("hidden", "true");
    gDialog.inheritedPropertiesHeader.setAttribute("hidden", "true");

    gDialog.requiredPropertiesSection.setAttribute("hidden", "true");
    gDialog.propertiesSection.setAttribute("hidden", "true");
    gDialog.inheritedPropertiesSection.setAttribute("hidden", "true");
  }
// XXX
}

function PopulateNestedRoleMenupopup(aPopup, aRoles)
{
  if (aPopup.getAttribute("id") == "roleMenupopup" && aPopup.firstElementChild)
    return;

  if (!aRoles)
    aRoles = kWAI_ARIA_11_ROLES["roletype"].sub;

  if (!aRoles)
    return;

  var roles = aRoles.split(" ");
  for (var i = 0; i < roles.length; i++) {
    var role = roles[i];
    var roleObject = kWAI_ARIA_11_ROLES[role];
    if (!roleObject)
      Services.prompt.alert(null, "Error in aria-roles.js", role + " " + roleObject);
    if ("sub" in roleObject) {
      var menu = document.createElement("menu");
      menu.setAttribute("label", role + "...");
      var popup = document.createElement("menupopup");
      if (!("abstract" in roleObject)) {
        var item = document.createElement("menuitem");
        item.setAttribute("label", role);
        item.setAttribute("value", role);
        var separator = document.createElement("menuseparator");
        popup.appendChild(item);
        popup.appendChild(separator);
      }
      menu.appendChild(popup)
      aPopup.appendChild(menu);

      PopulateNestedRoleMenupopup(popup, roleObject.sub);
    }
    else {
      var item = document.createElement("menuitem");
      item.setAttribute("label", role);
      item.setAttribute("value", role);
      aPopup.appendChild(item);
    }
  }
}

function CheckConstraints(aNode, aRole)
{
  var roleObject = kWAI_ARIA_11_ROLES[aRole];
  if ("context" in roleObject || "owns" in roleObject) {
    gDialog.constraintsSectionHeader.removeAttribute("hidden");

    if ("context" in roleObject) {
      gDialog.contextSection.removeAttribute("hidden");
      var contexts = roleObject.context.split(" ");
      var parent = aNode.parentNode;
      var ok = false;
      while (parent && parent.nodeType == Node.ELEMENT_NODE) {
        if (parent.hasAttribute("role")) {
          if (context.indexOf(parent.getAttribute("role")) != -1) {
            gDialog.contextLabel.setAttribute("value", gBundle.getString("ok"));
            ok = true;
            parent = null;
          }
        }
        else
          parent = parent.parentNode;
      }
      if (!ok)
        gDialog.contextLabel.setAttribute("value",
                                          gBundle.getString("mustBeContainedIn") +
                                            roleObject.context.replace(/ /, gBundle.getString("or")));
    }
    else
      gDialog.contextSection.setAttribute("hidden", "true");

    if ("owns" in roleObject) {
      gDialog.ownsSection.removeAttribute("hidden");
      var owns = roleObject.owns;
      var query = null;
      if (typeof owns == "function") {
        var rv = owns(aNode);
        if (rv)
          gDialog.ownsLabel.setAttribute("value", rv);
        else
          gDialog.ownsLabel.setAttribute("value", gBundle.getString("ok"));
      }
      else if (owns.indexOf(",")) {
        var queries = owns.split(",");
        for (var i = 0; i < queries.length; i++) {
          query = aNode.querySelector("[role='" + queries[i] + "']");
          if (!query)
            break;
        }
        if (query)
          gDialog.ownsLabel.setAttribute("value", gBundle.getString("ok"));
        else
          gDialog.ownsLabel.setAttribute("value",
                                         gBundle.getString("mustContain") +
                                           roleObject.owns.replace(/,/, gBundle.getString("and")));
      }
      else {
        var query = aNode.querySelector(owns);
        if (query)
          gDialog.ownsLabel.setAttribute("value", gBundle.getString("ok"));
        else
          gDialog.ownsLabel.setAttribute("value",
                                         gBundle.getString("mustContain") +
                                           roleObject.context.replace(/ /, gBundle.getString("or")));
      }
    }
    else
      gDialog.ownsSection.setAttribute("hidden", "true");
  }
  else {
    gDialog.constraintsSectionHeader.setAttribute("hidden", "true");
    gDialog.contextSection.setAttribute("hidden", "true");
    gDialog.ownsSection.setAttribute("hidden", "true");
  }
}

function ToggleRoleDropdown()
{
  gNestedRoleDropdown = !gNestedRoleDropdown;
  ResetRoleDropdown();
}

function ResetRoleDropdown()
{
  var child = gDialog.roleMenupopup.firstChild;
  deleteAllChildren(gDialog.roleMenupopup);

  if (gNestedRoleDropdown)
    PopulateNestedRoleMenupopup(gDialog.roleMenupopup);
  else {
    var roles = [];
    for (var i in kWAI_ARIA_11_ROLES)
      if (!("abstract" in kWAI_ARIA_11_ROLES[i]))
        roles.push(i);
    roles.sort();

    for (var i = 0; i < roles.length; i++) {
      var role = roles[i];
      var item = document.createElement("menuitem");
      item.setAttribute("label", role);
      item.setAttribute("value", role);
      gDialog.roleMenupopup.appendChild(item);
    }
  }
}

function SetRole(aEvent)
{
  if (gCurrentElement) {
    var editor = EditorUtils.getCurrentEditor();
    var role = aEvent.originalTarget.value;
    var dealWithEpubType = Services.prefs.getBoolPref("bluegriffon.aria.epub-type") &&
                           EditorUtils.isXHTMLDocument();

    if (dealWithEpubType) {
      editor.beginTransaction();
      editor.setAttribute(gCurrentElement, "role", role);

      var docElt = EditorUtils.getCurrentDocument().documentElement;
      if (!docElt.hasAttributeNS("http://www.w3.org/2000/xmlns/", "epub")) {
        var txn = new diSetAttributeNSTxn(docElt, "xmlns:epub", "http://www.w3.org/2000/xmlns/", "http://www.idpf.org/2007/ops");
        editor.transactionManager.doTransaction(txn);
      }
      var txn = new diSetAttributeNSTxn(gCurrentElement, "type", "http://www.idpf.org/2007/ops", role);
      editor.transactionManager.doTransaction(txn);

      editor.endTransaction();
    }
    else {
      if (gCurrentElement.hasAttributeNS("http://www.idpf.org/2007/ops", "type")) {
        editor.beginTransaction();
        editor.setAttribute(gCurrentElement, "role", role);

        var txn = new diRemoveAttributeNSTxn(gCurrentElement, "type", "http://www.idpf.org/2007/ops");
        editor.transactionManager.doTransaction(txn);

        editor.endTransaction();
      }
      else
        editor.setAttribute(gCurrentElement, "role", role);
    }

    gDialog.roleMenulist.setAttribute("label", role);
    gDialog.roleMenulist.setAttribute("value", role);

    SelectionChanged(null, gCurrentElement, true);
    gMain.NotifierUtils.notify("selection_strict", gCurrentElement, true);
    gMain.gDialog.ARIARoleSelect.value = role;
    EditorUtils.getCurrentEditorWindow().content.focus();
  }
}

function PopulateProperties(aRole, aAttribute, aIdPrefix)
{
  if (!aRole) // sanity check
    return;

  var roleObject = kWAI_ARIA_11_ROLES[aRole];

  if (aAttribute in roleObject) {
    gDialog[aIdPrefix + "Header"].removeAttribute("hidden");
    gDialog[aIdPrefix + "Section"].removeAttribute("hidden");
    deleteAllChildren(gDialog[aIdPrefix + "Rows"]);

    var properties = roleObject[aAttribute].split(" ");
    for (var i = 0; i < properties.length; i++)
      AddPropertyWidget(properties[i], gDialog[aIdPrefix + "Rows"]);
  }
  else {
    gDialog[aIdPrefix + "Header"].setAttribute("hidden", "true");
    gDialog[aIdPrefix + "Section"].setAttribute("hidden", "true");
  }
}

var inheritedAll = null;

function PopulateInheritedProperties(aRole, aIdPrefix)
{
  deleteAllChildren(gDialog.inheritedPropertiesRows);

  if (!aRole) // sanity check
    return;

  var roleObject = kWAI_ARIA_11_ROLES[aRole];
  var requiredProperties = ("required" in roleObject) ? roleObject.required.split(" ") : [];
  var otherProperties = ("properties" in roleObject) ? roleObject.properties.split(" ") : [];
  var properties = requiredProperties.concat(otherProperties);

  inheritedAll = [];
  aRole = ("sup" in roleObject) ? roleObject.sup : "";
  if (aRole)
    GetAllInheritedProperties(aRole, properties);

  inheritedAll = inheritedAll.sort();
  if (inheritedAll.length) {
    gDialog.inheritedPropertiesHeader.removeAttribute("hidden");
    gDialog.inheritedPropertiesSection.removeAttribute("hidden");
  }
  else {
    gDialog.inheritedPropertiesHeader.setAttribute("hidden", "true");
    gDialog.inheritedPropertiesSection.setAttribute("hidden", "true");
  }

  for (var i = 0; i < inheritedAll.length; i++)
    AddPropertyWidget(inheritedAll[i], gDialog.inheritedPropertiesRows);
}

function GetAllInheritedProperties(aRole, aRoleProperties)
{
  var roles = aRole.split(" ");
  for (var i = 0; i < roles.length; i++) {
    var role = roles[i];
    var roleObject = kWAI_ARIA_11_ROLES[role];

    var requiredProperties = ("required" in roleObject) ? roleObject.required.split(" ") : [];
    var otherProperties = ("properties" in roleObject) ? roleObject.properties.split(" ") : [];
    var properties = requiredProperties.concat(otherProperties);

    for (var j = 0; j < properties.length; j++) {
      var p = properties[j];
      if (aRoleProperties.indexOf(p) == -1 &&
          inheritedAll.indexOf(p) == -1)
        inheritedAll.push(p);
    }
    role = ("sup" in roleObject) ? roleObject.sup : "";
    if (role)
      GetAllInheritedProperties(role, aRoleProperties);
  }
}

function AddPropertyWidget(aProperty, aXULElt)
{
  if (!(aProperty in kWAI_ARIA_11_PROPERTIES)) {
    Services.prompt.alert(null, "Error in kWAI_ARIA_11_PROPERTIES", aProperty);
    return;
  }

  var property = kWAI_ARIA_11_PROPERTIES[aProperty];
  var value = property.value;
  var def = property["default"] || "";
  var deprecated = property["deprecated"] || "";

  var row = document.createElement("row");
  row.setAttribute("align", "center");

  var label = document.createElement("label");
  label.setAttribute("value", aProperty + ":");
  row.appendChild(label);
  aXULElt.appendChild(row);

  var hbox = document.createElement("hbox");
  hbox.setAttribute("align", "center");
  hbox.setAttribute("default", def);
  hbox.setAttribute("deprecated", deprecated);
  if (value == "#ID") {
    hbox.setAttribute("class", "aria-id");
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }
  else if (value == "#STRING" || value == "#IDS") {
    hbox.setAttribute("class", "aria-string");
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }
  else if (value[0] != "#" && value[0] != "[") {
    hbox.setAttribute("class", "aria-tokens");
    hbox.setAttribute("values", value);
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }
  else if (value[0] == "[") {
    row.setAttribute("align", "baseline");
    hbox.setAttribute("class", "aria-token-list");
    hbox.setAttribute("values", value.substr(1, value.length - 2));
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }
  else if (value.substr(0, 5) == "#INT(") {
    var min = parseInt(value.substr(5));
    hbox.setAttribute("class", "aria-integer");
    hbox.setAttribute("min", min);
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }
  else if (value == "#NUMBER") {
    var min = parseInt(value.substr(5));
    hbox.setAttribute("class", "aria-integer");
    hbox.setAttribute("min", Number.NEGATIVE_INFINITY);
    hbox.setAttribute("decimalplaces", "Infinity");
    hbox.setAttribute("value", gCurrentElement.getAttribute(aProperty) || "");
    hbox.setAttribute("aria-attribute", aProperty);
    row.appendChild(hbox);
  }

  if (deprecated) {
    var deprecatedLabel = document.createElement("label");
    deprecatedLabel.setAttribute("value", gBundle.getString("deprecated"));
    row.appendChild(deprecatedLabel);
  }
}
