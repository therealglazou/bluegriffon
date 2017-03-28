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
 * Portions created by the Initial Developer are Copyright (C) 2008
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

var gNode = null;
var gOkButton = null;
var returnValue = null;

 function Startup()
{
  if (!window.arguments)
    return;

  var parameter = window.arguments[0];

  GetUIElements();
  BGLanguagesHelper.init();

  if (parameter instanceof Element)
  {
    gNode = parameter;
    gDialog.clearSubtree.removeAttribute("hidden");

    if (gNode.hasAttribute("lang"))
    {
      var lang = gNode.getAttribute("lang");
      var kids = gDialog.languageListBox.getElementsByAttribute("value", lang);
      if (kids && kids.item(0)) {
        gDialog.languageListBox.clearSelection();
        gDialog.languageListBox.selectItem(kids[0]);
        kids[0].setAttribute("selected", "true");
        gDialog.languageListBox.ensureElementIsVisible(kids[0]);
        gDialog.currentLanguage.value = kids[0].getAttribute("label");
      }
      else
        gDialog.currentLanguage.value = lang;
    }
    else
      gDialog.currentLanguageBox.setAttribute("hidden", "true");

    //window.sizeToContent();
  }
  else {
    returnValue = window.arguments[1];
    if (returnValue && ("lang" in returnValue) && returnValue.lang)
      gDialog.currentLanguage.value = returnValue.lang;
  }
  gOkButton = document.documentElement.getButton("accept");
  gOkButton.setAttribute("disabled", "true");
#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function onAccept()
{
  var lang = null;
  if (gDialog.otherTextBox.value)
    lang = gDialog.otherTextBox.value;
  else
    lang = gDialog.languageListBox.value;

  if (gNode)
  {
    var editor = EditorUtils.getCurrentEditor();
    var clearSubtree = gDialog.clearSubtree.checked;
    if (clearSubtree)
      editor.beginTransaction();

    editor.setAttribute(gNode, "lang", lang);

    if (clearSubtree)
    {
      var elementsHavingLang = gNode.querySelectorAll("*[lang]");
      for (var i = 0; i < elementsHavingLang.length; i++)
        editor.removeAttribute(elementsHavingLang[i], "lang");
    }

    if (clearSubtree)
      editor.endTransaction();
  }
  else
    returnValue.lang = lang;
}

function onListboxSelect()
{
  try {
    if (gDialog.languageListBox.value)
    {
      gOkButton.removeAttribute("disabled");
    }
  }
  catch(e) {}
}

function onListboxDblClick(aEvent)
{
  if (aEvent.originalTarget.localName == "listitem") {
    // we're sure it's selected
    onAccept();
    window.close();
  }
}

function onTextboxInput()
{
  try {
    if (gDialog.otherTextBox.value)
      gOkButton.removeAttribute("disabled");
    else
    {
      if (gDialog.languageListBox.value)
        gOkButton.removeAttribute("disabled");
      else
        gOkButton.setAttribute("disabled", "true");
    }
  }
  catch(e) {}
}
