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

function ToggleProperty(aElt)
{
  var checked   = aElt.hasAttribute("checked");
  var value = (aElt.hasAttribute("value") ? aElt.getAttribute("value") : aElt.value);
  if (!checked &&
      (aElt.nodeName.toLowerCase() == "checkbox" || aElt.getAttribute("type") == "checkbox"))
    value = null;
  var property  = aElt.getAttribute("property");
  var group     = aElt.getAttribute("group");

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

  ApplyLocalITS([{ property: property, value: value }]);
  if (aElt.hasAttribute("filter"))
    ReflowGlobalRulesInUI(gCurrentElement, true, [aElt.getAttribute("filter")]);
}

function CheckToggle(aToggle, aChecked)
{
  if (aChecked)
    aToggle.setAttribute("checked", "true");
  else
    aToggle.removeAttribute("checked");
}

function Toggle(aToggle, aChecked)
{
  if (aChecked) {
    aToggle.setAttribute("checked", "true");
    var group  = aToggle.getAttribute("group");
    if (group) {
      var elts = document.querySelectorAll("toolbarbutton[group='" + group + "']");
      for (var elt of elts)
        if (elt != aToggle)
          elt.removeAttribute("checked");
    }
  }
}

function ApplyLocalITS(aValues)
{
  var editor = EditorUtils.getCurrentEditor();
  editor.beginTransaction();

  for (var i = 0; i < aValues.length; i++) {
    var val = aValues[i];
    if (null != val.value)
      editor.setAttribute(gCurrentElement, val.property, val.value);
    else
      editor.removeAttribute(gCurrentElement, val.property);
  }

  editor.endTransaction();
  ReflowGlobalRulesInUI(gCurrentElement);
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

function DeleteLocalRule(aEvent, aDeleter)
{
  aEvent.stopPropagation();
  aEvent.preventDefault();
  aDeleter();
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

function CloseAllSection(aAlsoCloseOriginalTarget)
{
  var h = document.popupNode;
  while (h && !h.classList.contains("csspropertiesHeader"))
    h = h.parentNode;
  if (!h) return; // sanity check...

  var headers = document.querySelectorAll(".csspropertiesHeader");
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if ((aAlsoCloseOriginalTarget || header != h) &&
        header.hasAttribute("open"))
      ToggleSection(null, header);
  }
}
