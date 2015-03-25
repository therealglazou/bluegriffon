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

var gRV;
var gRule = null;
var gQueryLanguage = "xpath";
var gSourceDocument = null;
var gCurrentElement = null;

function Startup()
{
  gRV             = window.arguments[0];
  gRule           = window.arguments[1];
  gQueryLanguage  = window.arguments[2];
  gSourceDocument = window.arguments[3];

  gCurrentElement = window.arguments[4];

  GetUIElements();

  if (gRule) {
    gDialog.selectorTextbox.value = gRule.getAttribute("selector");
    if (gRule.getAttribute("locNoteType").toLowerCase() == "description") {
      gDialog.descriptionLocNocTypeButton.setAttribute("checked", "true");
      gDialog.alertLocNocTypeButton.removeAttribute("checked");
    }
    else {
      gDialog.alertLocNocTypeButton.setAttribute("checked", "true");
      gDialog.descriptionLocNocTypeButton.removeAttribute("checked");
    }

    if (gRule.firstElementChild
        && gRule.firstElementChild.namespaceURI == kITS_NAMESPACE
        && gRule.firstElementChild.localName == "locNote") { // locNote child
      gDialog.locNoteTextbox.value = gRule.firstElementChild.textContent;
      gDialog.locNoteSwitchRadiogroup.value = "locNote";
      ToggleLocNoteSwitchRadiogroup({ originalTarget: gDialog.locNoteRadio });
    }
    else if (gRule.hasAttribute("locNotePointer")) { // locNotePointer attribute
      gDialog.locNotePointerTextbox.value = gRule.getAttribute("locNotePointer");
      gDialog.locNoteSwitchRadiogroup.value = "locNotePointer";
      ToggleLocNoteSwitchRadiogroup({ originalTarget: gDialog.locNotePointerRadio });
    }
    else if (gRule.hasAttribute("locNoteRef")) { // locNoteRef attribute
      gDialog.locNoteRefMenulist.value = gRule.getAttribute("locNoteRef");
      gDialog.locNoteSwitchRadiogroup.value = "locNoteRef";
      ToggleLocNoteSwitchRadiogroup({ originalTarget: gDialog.locNoteRefRadio });
    }
    else if (gRule.hasAttribute("locNoteRefPointer")) { // locNoteRefPointer attribute
      gDialog.locNoteRefPointerTextbox.value = gRule.getAttribute("locNoteRefPointer");
      gDialog.locNoteSwitchRadiogroup.value = "locNoteRefPointer";
      ToggleLocNoteSwitchRadiogroup({ originalTarget: gDialog.locNoteRefPointerRadio });
    }
  }
  else {
    gDialog.locNoteSwitchRadiogroup.value = "locNote";
    ToggleLocNoteSwitchRadiogroup({ originalTarget: gDialog.locNoteRadio });
  }
  InitSelectorGroupbox(gQueryLanguage, gRule, gSourceDocument);

  gDialog.selectorTextbox.focus();
}

function Shutdown()
{
  
}

function Accept()
{
  var rule;
  if (gRule) {
    rule = gRule;
    deleteAllChildren(rule);
    rule.removeAttribute("locNotePointer");
    rule.removeAttribute("locNoteRef");
    rule.removeAttribute("locNoteRefPointer");
  }
  else {
    rule = gSourceDocument.createElementNS(kITS_NAMESPACE, "locNoteRule");
    gSourceDocument.documentElement.appendChild(rule);    
  }
  rule.setAttribute("selector", gDialog.selectorTextbox.value);
  rule.setAttribute("locNoteType", gDialog.descriptionLocNocTypeButton.hasAttribute("checked")
                                   ? "description"
                                   : "alert");
  switch(gDialog.locNoteSwitchRadiogroup.value) {
    case "locNote":
      {
        var locNote = gSourceDocument.createElementNS(kITS_NAMESPACE, "locNote");
        locNote.textContent = gDialog.locNoteTextbox.value;
        rule.appendChild(locNote);
      }
    break;
    case "locNotePointer":
      rule.setAttribute("locNotePointer", gDialog.locNotePointerTextbox.value);
      break;
    case "locNoteRef":
      rule.setAttribute("locNoteRef", gDialog.locNoteRefMenulist.value);
      break;
    case "locNotePointer":
      rule.setAttribute("locNoteRefPointer", gDialog.locNoteRefPointerTextbox.value);
      break;

    default: break; // never happens
  }
  gRV.cancelled = true;
}

function ToggleLocNoteSwitchRadiogroup(aEvent)
{
  if (aEvent.originalTarget.localName == "radio") {
    gDialog.locNoteTextbox.disabled           = (aEvent.originalTarget.nextElementSibling != gDialog.locNoteTextbox);
    gDialog.locNotePointerTextbox.disabled    = (aEvent.originalTarget.nextElementSibling != gDialog.locNotePointerTextbox);
    gDialog.locNoteRefMenulist.disabled       = (aEvent.originalTarget.nextElementSibling != gDialog.locNoteRefMenulist);
    gDialog.locNoteRefPointerTextbox.disabled = (aEvent.originalTarget.nextElementSibling != gDialog.locNoteRefPointerTextbox);
    gDialog.locNoteTextbox.removeAttribute("focused");
    gDialog.locNotePointerTextbox.removeAttribute("focused");
    gDialog.locNoteRefMenulist.removeAttribute("focused");
    gDialog.locNoteRefPointerTextbox.removeAttribute("focused");
    aEvent.originalTarget.nextElementSibling.focus();
  }
}