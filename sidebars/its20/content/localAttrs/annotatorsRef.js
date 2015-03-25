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

function AnnotatorsRefSectionResetter()
{
  gDialog.annotatorsRefBox.suppressOnSelect = true;
  var child = gDialog.annotatorsRefBox.lastElementChild;
  while (child && child.localName == "listitem") {
    var tmp = child.previousElementSibling;
    child.parentNode.removeChild(child);
    child = tmp;
  }
  gDialog.annotatorsRefBox.suppressOnSelect = false;
}

function AnnotatorsRefSectionIniter(aElt)
{
  gDialog.deleteAnnotatorsRefRule.removeAttribute("visible");

  var elt = aElt;
  while (elt && elt.nodeType == Node.ELEMENT_NODE) {
    if (elt.hasAttribute("its-annotators-ref")) {
      var ar = elt.getAttribute("its-annotators-ref");
      var arArray = ar.split(" ");
      for (var i = 0; i < arArray.length; i++) {
        var oneAr = arArray[i];
        var match = oneAr.match( /^([^\|]+)\|([^\|]+)$/);
        if (match) {
          var dataCategory = match[1].toLowerCase();
          if (!gDialog.annotatorsRefBox.querySelector("listcell[label='" + dataCategory + "']")) {
            var item = document.createElement('listitem');
            var cell1 = document.createElement('listcell');
            var cell2 = document.createElement('listcell');
            cell1.setAttribute("label", dataCategory);
            item.appendChild(cell1);
  
            cell2.setAttribute("label", match[2]);
            cell1.setAttribute("crop", "center");
            item.appendChild(cell2);
            if (gCurrentElement != elt) {
              item.className = "ancestor";
              item.setUserData("ancestor", elt, null);
            }
      
            gDialog.annotatorsRefBox.appendChild(item);
            // show a close button if we have local settings
            if (gCurrentElement == elt)
              gDialog.deleteAnnotatorsRefRule.setAttribute("visible", "true");
          }
        }
      }
    }

    elt = elt.parentNode;
  }

  // section 5.8 of spec
  CheckAnnotatorsRef();
}

/* user clicked on the deletion button for local attrs
 * 
 */
function AnnotatorsRefSectionDeleter()
{
  ApplyLocalITS( [
                   { property: "its-annotators-ref", value: null }
                 ]);
  ReflowGlobalRulesInUI(gCurrentElement, true, ["annotatorsRef"]);
}

function AnnotatorsRefSelected(aList)
{
  var index = aList.selectedIndex;
  var item  = aList.selectedItem;
  if (index < 0
      || item.className == "ancestor") {
    gDialog.AnnotatorsRefMinusButton.disabled = true;
    gDialog.AnnotatorsRefDownButton.disabled = true;
    gDialog.AnnotatorsRefUpButton.disabled = true;
    gDialog.AnnotatorsRefConfigButton.disabled = (index < 0);
    return;
  }

  gDialog.AnnotatorsRefConfigButton.disabled = true;
  gDialog.AnnotatorsRefMinusButton.disabled = false;
  gDialog.AnnotatorsRefDownButton.disabled = (!item.nextElementSibling
                                              || item.nextElementSibling.className == "ancestor");
  gDialog.AnnotatorsRefUpButton.disabled = !index;
}

function DeleteAnnotatorsRef()
{
  var index = gDialog.annotatorsRefBox.selectedIndex;
  if (index < 0) // sanity check
    return;

  gDialog.annotatorsRefBox.removeChild(gDialog.annotatorsRefBox.selectedItem);
  ApplyAnnotatorsRefChanges();
  if (index < gDialog.annotatorsRefBox.getRowCount())
    gDialog.annotatorsRefBox.selectedIndex = index;
  else if (index > 1)
    gDialog.annotatorsRefBox.selectedIndex = index -1;
}

function ApplyAnnotatorsRefChanges()
{
  var listitems = gDialog.annotatorsRefBox.querySelectorAll("listitem");
  var value = "";
  for (var listitem of listitems) {
    if (listitem.className != "ancestor") {
      var dataCategory = listitem.firstElementChild.getAttribute("label");
      var processorIRI = listitem.lastElementChild.getAttribute("label");
      value += (value ? " " : "") + dataCategory.trim() + "|" + processorIRI.trim();
    }
  }
  ApplyLocalITS( [
                   { property: "its-annotators-ref", value: (value ? value : null) }
                 ]);
  ReflowGlobalRulesInUI(gCurrentElement, true, ["annotatorsRef"]);
}

function AnnotatorsRefDown()
{
  var index = gDialog.annotatorsRefBox.selectedIndex;
  var item  = gDialog.annotatorsRefBox.selectedItem;
  gDialog.annotatorsRefBox.insertBefore(item, item.nextElementSibling.nextElementSibling);
  ApplyAnnotatorsRefChanges();
  gDialog.annotatorsRefBox.selectedIndex = index + 1;
}

function AnnotatorsRefUp()
{
  var index = gDialog.annotatorsRefBox.selectedIndex;
  var item  = gDialog.annotatorsRefBox.selectedItem;
  gDialog.annotatorsRefBox.insertBefore(item, item.previousElementSibling);
  ApplyAnnotatorsRefChanges();
  gDialog.annotatorsRefBox.selectedIndex = index - 1;
}

function SelectAnnotatorsRefElement()
{
  var item = gDialog.annotatorsRefBox.selectedItem;
  var ownerNode = item.getUserData("ancestor");
  EditorUtils.getCurrentEditor().selectElement(ownerNode);
}

function ShowAnnotatorsRefDataCategories(aPopup)
{
  deleteAllChildren(aPopup);
  const dataCategories = [
    { type: "translateRule", value: "translate" },
    { type: "locNoteRule", value: "localizatio-note" },
    { type: "termRule", value: "terminology" },
    { type: "dirRule", value: "directionality" },
    { type: "langRule", value: "language-information" },
    { type: "withinTextRule", value: "elements-with-text" },
    { type: "domainRule", value: "domain" },
    { type: "textAnalysisRule", value: "text-analysis" },
    { type: "localeFilterRule", value: "locale-filter" },
    { type: "provRule", value: "provenance" },
    { type: "externalResourceRefRule", value: "external-resource" },
    { type: "targetPointerRule", value: "target-pointer" },
    { type: "idValueRule", value: "id-value" },
    { type: "preserveSpaceRule", value: "preserve-space" },
    { type: "locQualityIssueRule", value: "localization-quality-issue" },
    { type: "mtConfidenceRule", value: "mt-confidence" },
    { type: "allowedCharactersRule", value: "allowed-characters" },
    { type: "storageSizeRule", value: "storage-size" }
  ];
  for (var i = 0; i < dataCategories.length; i++) {
    aPopup.parentNode.appendItem(gDialog.its20Bundle.getString(dataCategories[i].type), dataCategories[i].value);
  }
}

function AddAnnotatorsRef()
{
  gDialog.addAnnotatorsRefPanel.openPopup(gDialog.AnnotatorsRefPlusButton, "above", 0, 23);
  gDialog.processorIRITextbox.focus();
}

function CloseAnnotatorsRefPanel()
{
  gDialog.addAnnotatorsRefPanel.hidePopup();
}

function CheckAnnotatorsRefPanel()
{
  gDialog.addAnnotatorsRefButton.disabled = !(gDialog.dataCategoryMenulist.value && gDialog.processorIRITextbox.value);
}

function CreateNewAnnotatorsRef()
{
  var dataCategory = gDialog.dataCategoryMenulist.value;
  var processorIRI = gDialog.processorIRITextbox.value;

  var item = gDialog.annotatorsRefBox.querySelector("listcell[label='" + dataCategory + "']:first-child");
  var spot = gDialog.annotatorsRefBox.querySelector("listitem.ancestor");
  if (item) { // already exists...
    item.nextElementSibling.setAttribute("label", processorIRI);
    if (item.parentNode.className == "ancestor") {
      item.parentNode.className = "";
      item.setUserData("ancestor", null, null);
  
      if (spot != item.parentNode)
        gDialog.annotatorsRefBox.insertBefore(item.parentNode, spot);
    }
  }
  else { // does not exist yet
    item = document.createElement('listitem');
    var cell1 = document.createElement('listcell');
    var cell2 = document.createElement('listcell');
    cell1.setAttribute("label", dataCategory);
    item.appendChild(cell1);
  
    cell2.setAttribute("label", processorIRI);
    cell1.setAttribute("crop", "center");
    item.appendChild(cell2);
    gDialog.annotatorsRefBox.insertBefore(item, spot);
  }
  CloseAnnotatorsRefPanel();
  ApplyAnnotatorsRefChanges();
}