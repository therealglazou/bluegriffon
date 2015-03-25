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
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>
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

Components.utils.import("resource://gre/modules/Services.jsm");

function CustomizeToolbar(id)
{
  // Disable the toolbar context menu items
  var menubar = document.getElementById("composer-main-menubar");
  for (var i = 0; i < menubar.childNodes.length; ++i)
    menubar.childNodes[i].setAttribute("disabled", true);

  var customizePopup = document.getElementById("CustomizeMainToolbar");
  if (customizePopup)
    customizePopup.setAttribute("disabled", "true");
  customizePopup = document.getElementById("CustomizeFormatToolbar");
  if (customizePopup)
    customizePopup.setAttribute("disabled", "true");

  var customizeURL = "chrome://global/content/customizeToolbar.xul";

  try {
    gCustomizeSheet = Services.prefs.getBoolPref("toolbar.customization.usesheet");
  }
  catch(e) { gCustomizeSheet = false; }

  if (gCustomizeSheet) {
    var sheetFrame = document.getElementById("customizeToolbarSheetIFrame");
    var panel = document.getElementById("customizeToolbarSheetPopup");
    sheetFrame.hidden = false;
    sheetFrame.toolbox = gDialog[id];
    sheetFrame.panel = panel;

    // The document might not have been loaded yet, if this is the first time.
    // If it is already loaded, reload it so that the onload initialization code
    // re-runs.
    if (sheetFrame.getAttribute("src") == customizeURL)
      sheetFrame.contentWindow.location.reload()
    else
      sheetFrame.setAttribute("src", customizeURL);

    panel.openPopup(gDialog[id], "after_start", 0, 0);
    return sheetFrame.contentWindow;
  } else {
    window.openDialog(customizeURL,
                      "CustomizeToolbar",
                      "chrome,titlebar,toolbar,location,resizable,dependent",
                      document.getElementById(id));
  }
}

function ToolboxCustomizeDone(aToolboxChanged)
{
  var customizeToolbarSheetIFrame = document.getElementById("customizeToolbarSheetIFrame");
  if (customizeToolbarSheetIFrame)
    customizeToolbarSheetIFrame.hidden = true;
  var customizeToolbarSheetPopup = document.getElementById("customizeToolbarSheetPopup")
  if (customizeToolbarSheetPopup)
    customizeToolbarSheetPopup.hidePopup();

  // Re-enable parts of the UI we disabled during the dialog
  var menubar = document.getElementById("composer-main-menubar");
  for (var i = 0; i < menubar.childNodes.length; ++i)
    menubar.childNodes[i].removeAttribute("disabled");

  var customizePopup = document.getElementById("CustomizeMainToolbar");
  if (customizePopup)
    customizePopup.removeAttribute("disabled");
  customizePopup = document.getElementById("CustomizeFormatToolbar");
  if (customizePopup)
    customizePopup.removeAttribute("disabled");

  // make sure our toolbar buttons have the correct enabled state restored to them...
  if (this.UpdateMainToolbar != undefined)
    UpdateMainToolbar(focus); 
}

function onViewToolbarCommand(aToolbarId, aMenuItemId)
{
  var toolbar = document.getElementById(aToolbarId);
  var menuItem = document.getElementById(aMenuItemId);

  if (!toolbar || !menuItem) return;

  var toolbarCollapsed = toolbar.collapsed;

  // toggle the checkbox
  menuItem.setAttribute('checked', toolbarCollapsed);

  // toggle visibility of the toolbar
  toolbar.collapsed = !toolbarCollapsed;

  document.persist(aToolbarId, 'collapsed');
  document.persist(aMenuItemId, 'checked');
}

function UpdateMainToolbar(caller)
{
}

function UpdateCustomizeMenuPopup(aPopup)
{
  while (aPopup.hasChildNodes())
    aPopup.removeChild(aPopup.lastChild);

  var toolboxes = document.getElementsByTagName("toolbox");
  
}

function InstallCustomizationDoneCallbacks()
{
  gDialog.MainToolbox.customizeDone   = ToolboxCustomizeDone;
  gDialog.FormatToolbox.customizeDone = ToolboxCustomizeDone;
}
