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
Components.utils.import("resource://app/modules/l10nHelper.jsm");

function LocNoteSectionResetter()
{
  // reset the UI for local Localization Note attributes
  gDialog.descriptionLocNoteTypeButton.removeAttribute("checked");
  gDialog.alertLocNoteTypeButton.removeAttribute("checked");
  gDialog.locNoteRadio.checked = true;
  gDialog.locNoteTextbox.value = "";
  gDialog.locNoteRefRadio.checked = false;
  gDialog.locNoteRefMenulist.value = "";
}

function LocNoteSectionIniter(aElt)
{
  var hasNote    = aElt.hasAttribute("its-loc-note");
  var hasNoteRef = aElt.hasAttribute("its-loc-note-ref");

  // according to the spec (section 8.3.2), we need one of the two attributes
  if (hasNote || hasNoteRef) {
    // reflect its-loc-note-type in UI
    switch (aElt.hasAttribute("its-loc-note-type")
            ? aElt.getAttribute("its-loc-note-type").toLowerCase()
            : "") {
      case "description":
        gDialog.descriptionLocNoteTypeButton.setAttribute("checked", "true");
        gDialog.alertLocNoteTypeButton.removeAttribute("checked");
        break;
      case "alert":
        gDialog.descriptionLocNoteTypeButton.removeAttribute("checked");
        gDialog.alertLocNoteTypeButton.setAttribute("checked", "true");
        break;
      default:
        gDialog.descriptionLocNoteTypeButton.removeAttribute("checked");
        gDialog.alertLocNoteTypeButton.removeAttribute("checked");
        break;
    }
  }

  // now update the UI for the attributes if present
  if (hasNoteRef) {
    gDialog.locNoteRadiogroup.value = "locNoteRef";
    gDialog.locNoteTextbox.value = "";
    gDialog.locNoteRefMenulist.value = aElt.getAttribute("its-loc-note-ref")
  }
  else if (hasNote) {
    gDialog.locNoteRadiogroup.value = "locNote";
    gDialog.locNoteTextbox.value = aElt.hasAttribute("its-loc-note")
                                   ? aElt.getAttribute("its-loc-note")
                                   : "";
    gDialog.locNoteRefMenulist.value = "";
  }

  // we have to deal with inheritance...
  if (aElt.parentNode
      && aElt.parentNode.nodeType == Node.ELEMENT_NODE
      && !gDialog.descriptionLocNoteTypeButton.hasAttribute("checked")
      && !gDialog.alertLocNoteTypeButton.hasAttribute("checked"))
    ReflowGlobalRulesInUI(aElt.parentNode, false, ["locNoteRule"]);

  // show a close button if we have local settings
  if (gCurrentElement == aElt) {
    if (hasNote || hasNoteRef || aElt.hasAttribute("its-loc-note-type"))
      gDialog.deleteLocNoteRule.setAttribute("visible", "true");
    else
      gDialog.deleteLocNoteRule.removeAttribute("visible");
  } 
}

/* list all the IDs in the document
 * 
 */
function ListAllIDrefs(menuPopup)
{
  deleteAllChildren(menuPopup);

  var currentId = "";
  if (gCurrentElement && gCurrentElement.hasAttribute("id")) {
    currentId = gCurrentElement.id;
  }

  var targets = EditorUtils.getCurrentEditor().document.querySelectorAll("[id],a[name]");
  var targetsArray = [];
  for (var i = 0; i< targets.length; i++) {
    var t = targets[i];
    if (t.id)
      targetsArray.push(t.id);
    if (t.nodeName.toLowerCase() == "a" && t.hasAttribute("name"))
      targetsArray.push(t.getAttribute("name"));
  }
  targetsArray.sort();
  if (targetsArray.length) {
    var item = "#" + targetsArray[0];
    if (targetsArray[0] != currentId)
      menuPopup.parentNode.appendItem(item, item);
    for (var i = 1; i < targetsArray.length; i++) {
      if (targetsArray[i] != targetsArray[i-1]
          && targetsArray[i] != currentId) {
        var item = "#" + targetsArray[i];
        menuPopup.parentNode.appendItem(item, item);
      }
    }
  }
}

/* apply the UI changes
 * 
 */
function ApplyLocNoteChanges(e)
{
  if (e)
    e.parentNode.selectedItem = e.previousElementSibling

  var locNoteType = gDialog.descriptionLocNoteTypeButton.hasAttribute("checked")
                    ? "description"
                    : (gDialog.alertLocNoteTypeButton.hasAttribute("checked")
                       ? "alert"
                       : "");
  if (locNoteType) {
    if (gDialog.locNoteRadio.selected) {
      ApplyLocalITS( [
                       { property: "its-loc-note-type", value: locNoteType },
                       { property: "its-loc-note", value: gDialog.locNoteTextbox.value },
                       { property: "its-loc-note-ref", value: null }
                     ]);
    }
    else if (gDialog.locNoteRefRadio.selected) {
      ApplyLocalITS( [
                       { property: "its-loc-note-type", value: locNoteType },
                       { property: "its-loc-note", value: null },
                       { property: "its-loc-note-ref", value: gDialog.locNoteRefMenulist.value }
                     ]);
    }
  }
  else
    ApplyLocalITS( [
                     { property: "its-loc-note-type", value: null },
                     { property: "its-loc-note", value: null },
                     { property: "its-loc-note-ref", value: null }
                   ]);
  ReflowGlobalRulesInUI(gCurrentElement, true, ["locNoteRule"]);
}

/* user clicked on the deletion button for local attrs
 * 
 */
function LocNoteSectionDeleter()
{
  ApplyLocalITS( [
                   { property: "its-loc-note-type", value: null },
                   { property: "its-loc-note", value: null },
                   { property: "its-loc-note-ref", value: null }
                 ]);
  ReflowGlobalRulesInUI(gCurrentElement, true, ["locNoteRule"]);
}

function ToggleLocNote(aElt)
{
  var checked   = aElt.hasAttribute("checked");
  var value = (aElt.hasAttribute("value") ? aElt.getAttribute("value") : aElt.value);
  if (!checked &&
      (aElt.nodeName.toLowerCase() == "checkbox" || aElt.getAttribute("type") == "checkbox"))
    value = null;
  var group = aElt.getAttribute("group");

  var others = [];
  if (group)
    others = document.querySelectorAll("[group='" + group + "']");

  for (var i = 0; i < others.length; i++) {
    var e = others[i];
    if (e != aElt) {
      if (group) {
        e.removeAttribute("checked");
      }
    }
  }

  ApplyLocNoteChanges(null);
}
