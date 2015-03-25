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
    if (gRule.getAttribute("term").toLowerCase() == "yes") {
      gDialog.yesTermButton.setAttribute("checked", "true");
      gDialog.noTermButton.removeAttribute("checked");
    }
    else {
      gDialog.noTermButton.setAttribute("checked", "true");
      gDialog.yesTermButton.removeAttribute("checked");
    }

    if (gRule.hasAttribute("termInfoPointer")) { // termInfoPointer attribute
      gDialog.termInfoPointerTextbox.value = gRule.getAttribute("termInfoPointer");
      gDialog.termInfoSwitchRadiogroup.value = "termInfoPointer";
      ToggleTermInfoSwitchRadiogroup({ originalTarget: gDialog.termInfoPointerRadio });
    }
    else if (gRule.hasAttribute("termInfoRef")) { // termInfoRef attribute
      gDialog.termInfoRefMenulist.value = gRule.getAttribute("termInfoRef");
      gDialog.termInfoSwitchRadiogroup.value = "termInfoRef";
      ToggleTermInfoSwitchRadiogroup({ originalTarget: gDialog.termInfoRefRadio });
    }
    else if (gRule.hasAttribute("termInfoRefPointer")) { // termInfoRefPointer attribute
      gDialog.termInfoRefPointerTextbox.value = gRule.getAttribute("termInfoRefPointer");
      gDialog.termInfoSwitchRadiogroup.value = "termInfoRefPointer";
      ToggleTermInfoSwitchRadiogroup({ originalTarget: gDialog.termInfoRefPointerRadio });
    }
    else {
      gDialog.termInfoSwitchRadiogroup.value = "none";
      ToggleTermInfoSwitchRadiogroup({ originalTarget: gDialog.noTermInfoRadio });
    }
  }
  else {
    gDialog.termInfoSwitchRadiogroup.value = "none";
    ToggleTermInfoSwitchRadiogroup({ originalTarget: gDialog.noTermInfoRadio });
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
    rule.removeAttribute("termInfoPointer");
    rule.removeAttribute("termInfoRef");
    rule.removeAttribute("termInfoRefPointer");
  }
  else {
    rule = gSourceDocument.createElementNS(kITS_NAMESPACE, "termRule");
    gSourceDocument.documentElement.appendChild(rule);    
  }
  rule.setAttribute("selector", gDialog.selectorTextbox.value);
  rule.setAttribute("term", gDialog.yesTermButton.hasAttribute("checked")
                            ? "yes"
                            : "no");
  switch(gDialog.termInfoSwitchRadiogroup.value) {
    case "termInfoPointer":
      rule.setAttribute("termInfoPointer", gDialog.termInfoPointerTextbox.value);
      break;
    case "termInfoRef":
      rule.setAttribute("termInfoRef", gDialog.termInfoRefMenulist.value);
      break;
    case "termInfoPointer":
      rule.setAttribute("termInfoRefPointer", gDialog.termInfoRefPointerTextbox.value);
      break;

    case "none":
    default: break; // never happens
  }
  gRV.cancelled = true;
}

function ToggleTermInfoSwitchRadiogroup(aEvent)
{
  if (aEvent.originalTarget.localName == "radio") {
    gDialog.termInfoPointerTextbox.disabled    = (aEvent.originalTarget.nextElementSibling != gDialog.termInfoPointerTextbox);
    gDialog.termInfoRefMenulist.disabled       = (aEvent.originalTarget.nextElementSibling != gDialog.termInfoRefMenulist);
    gDialog.termInfoRefPointerTextbox.disabled = (aEvent.originalTarget.nextElementSibling != gDialog.termInfoRefPointerTextbox);
    gDialog.termInfoPointerTextbox.removeAttribute("focused");
    gDialog.termInfoRefMenulist.removeAttribute("focused");
    gDialog.termInfoRefPointerTextbox.removeAttribute("focused");
    if (aEvent.originalTarget.getAttribute("value") != "none")
      aEvent.originalTarget.nextElementSibling.focus();
  }
}