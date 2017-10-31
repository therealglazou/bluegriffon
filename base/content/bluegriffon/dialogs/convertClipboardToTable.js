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
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998-1999
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Charles Manske (cmanske@netscape.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");

var gIndex;
var gCommaIndex = "0";
var gSpaceIndex = "1";
var gTabIndex   = "2";
var gOtherIndex = "3";

// dialog initialization code
function Startup()
{
  gDialog.sepRadioGroup      = document.getElementById("SepRadioGroup");
  gDialog.sepCharacterInput  = document.getElementById("SepCharacterInput");
  gDialog.deleteSepCharacter = document.getElementById("DeleteSepCharacter");
  gDialog.collapseSpaces     = document.getElementById("CollapseSpaces");

  // We persist the user's separator character
  gDialog.sepCharacterInput.value = gDialog.sepRadioGroup.getAttribute("character");

  gIndex = gDialog.sepRadioGroup.getAttribute("index");

  switch (gIndex)
  {
    case gCommaIndex:
    default:
      gDialog.sepRadioGroup.selectedItem = document.getElementById("comma");
      break;
    case gSpaceIndex:
      gDialog.sepRadioGroup.selectedItem = document.getElementById("space");
      break;
    case gTabIndex:
      gDialog.sepRadioGroup.selectedItem = document.getElementById("tab");
      break;
    case gOtherIndex:
      gDialog.sepRadioGroup.selectedItem = document.getElementById("other");
      break;
  }

  // Set initial enable state on character input and "collapse" checkbox
  SelectCharacter(gIndex);

#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function InputSepCharacter()
{
  var str = gDialog.sepCharacterInput.value;

  // Limit input to 1 character
  if (str.length > 1)
    str = str.slice(0,1);

  // We can never allow tag or entity delimiters for separator character
  if (str == "<" || str == ">" || str == "&" || str == ";" || str == " ")
    str = "";

  gDialog.sepCharacterInput.value = str;
}

function SetElementEnabledById(aId, aEnabled)
{
  var elt = document.getElementById(aId);
  if (aId) {
    if (aEnabled)
      elt.removeAttribute("disabled");
    else
      elt.setAttribute("disabled", "true");
  }
}

function SelectCharacter(radioGroupIndex)
{
  gIndex = radioGroupIndex;
  SetElementEnabledById("SepCharacterInput", gIndex == gOtherIndex);
  SetElementEnabledById("CollapseSpaces", gIndex == gSpaceIndex);
}

function onAccept()
{
  var sepCharacter = "";
  switch ( gIndex )
  {
    case gCommaIndex:
      sepCharacter = ",";
      break;
    case gSpaceIndex:
      sepCharacter = " ";
      break;
    case gTabIndex:
      sepCharacter = "\t";
      break;
    case gOtherIndex:
      sepCharacter = gDialog.sepCharacterInput.value.slice(0,1);
      break;
  }

  var editor = EditorUtils.getCurrentEditor();
  var str = "";

  var flavors = ["text/unicode"];
  var hasData =
    Services.clipboard.hasDataMatchingFlavors(flavors, flavors.length, Services.clipboard.kGlobalClipboard);

  if (hasData) {
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].
                  createInstance(Components.interfaces.nsITransferable);
    trans.init(null);
    flavors.forEach(trans.addDataFlavor);

    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
    var data = {};
    var dataLen = {};
    trans.getTransferData(flavors[0], data, dataLen);

    if (data) {
      data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
      str = data.data.substring(0, dataLen.value / 2);
      str = str.replace( /\r/g, "<br>");
      str = str.replace( /\n/g, "<br>");
    }
  }

  // Replace separator characters with table cells
  var replaceString;
  if (gDialog.deleteSepCharacter.checked)
  {
    replaceString = "";
  }  
  else
  {
    // Don't delete separator character,
    //  so include it at start of string to replace
    replaceString = sepCharacter;
  }

  replaceString += "<td>"; 

  if (sepCharacter.length > 0)
  {
    var tempStr = sepCharacter;
    var regExpChars = ".!@#$%^&*-+[]{}()\|\\\/";
    if (regExpChars.indexOf(sepCharacter) >= 0)
      tempStr = "\\" + sepCharacter;

    if (gIndex == gSpaceIndex)
    {
      // If checkbox is checked, 
      //   one or more adjacent spaces are one separator
      if (gDialog.collapseSpaces.checked)
          tempStr = "\\s+"
        else
          tempStr = "\\s";
    }
    var pattern = new RegExp(tempStr, "g");
    str = str.replace(pattern, replaceString);
  }

  // Put back tag contents that we removed above
  searchStart = 0;
  var stackIndex = 0;
  do {
    start = str.indexOf("<", searchStart);
    end = start + 1;
    if (start >= 0 && str.charAt(end) == ">")
    {
      // We really need a FIFO stack!
      str = str.slice(0, end) + stack[stackIndex++] + str.slice(end);
    }
    searchStart = end;

  } while (start >= 0);

  // End table row and start another for each br or p
  str = str.replace(/\s*<br>\s*/g, "</tr>\n<tr><td>");

  // Add the table tags and the opening and closing tr/td tags
  // Default table attributes should be same as those used in nsHTMLEditor::CreateElementWithDefaults()
  // (Default width="100%" is used in EdInsertTable.js)
  str = "<table border=\"1\" width=\"100%\" cellpadding=\"2\" cellspacing=\"2\">\n<tr><td>" + str + "</tr>\n</table>\n";

  editor.beginTransaction();
  editor.insertHTML(str);
  editor.endTransaction();

  // Save persisted attributes
  gDialog.sepRadioGroup.setAttribute("index", gIndex);
  if (gIndex == gOtherIndex)
    gDialog.sepRadioGroup.setAttribute("character", sepCharacter);

  return true;
}

function onCancel()
{
  window.close();
  return true;
}
