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

Components.utils.import("resource://gre/modules/InlineSpellChecker.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("resource://gre/modules/urlHelper.jsm");
Components.utils.import("resource://gre/modules/prompterHelper.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/cssHelper.jsm");
Components.utils.import("resource://gre/modules/fileHelper.jsm");
Components.utils.import("resource://gre/modules/l10nHelper.jsm");
Components.utils.import("resource://gre/modules/handlersManager.jsm");
Components.utils.import("resource://gre/modules/screens.jsm");
Components.utils.import("resource://gre/modules/fileChanges.jsm");
Components.utils.import("resource://gre/modules/bgQuit.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

#include blanks.inc

#include observers.inc

#include liveview.inc

#include startup.inc

#include shutdown.inc

#ifdef XP_UNIX
#ifdef XP_MACOSX
var gSYSTEM = "MACOSX";
#else
var gSYSTEM = "UNIX";
#endif
#else
var gSYSTEM = "WINDOWS";
#endif

function OpenLocation(aEvent, type)
{
  window.openDialog("chrome://bluegriffon/content/dialogs/openLocation.xul","_blank",
              "chrome,modal,titlebar", type);
  if (aEvent) aEvent.stopPropagation();
}

function OpenNewWindow(aURL)
{
  // warning, the first argument MUST be null here because when the
  // first window is created, it gets the cmdLine as an argument
  window.delayedOpenWindow("chrome://bluegriffon/content/xul/bluegriffon.xul", "chrome,all,dialog=no", null, aURL);
}

function GetPreferredNewDocumentURL()
{
  var url = window["kHTML_TRANSITIONAL"];
  try {
    var urlId = Services.prefs.getCharPref("bluegriffon.defaults.doctype");
    url = window[urlId]; 
  }
  catch(e) {}
  return url;
}

function NewDocument(aEvent)
{
  var url = GetPreferredNewDocumentURL();

  OpenFile(url, true);
  if (aEvent) aEvent.stopPropagation();
}

function NewDocumentInNewWindow(aEvent)
{
  var url = GetPreferredNewDocumentURL();

  OpenFile(url, false);
  if (aEvent) aEvent.stopPropagation();
}

function NewDocumentWithOptions(aEvent)
{
  var rv = {value: "", where:"tab"};
  window.openDialog("chrome://bluegriffon/content/dialogs/newDocument.xul","_blank",
              "chrome,modal,titlebar", rv);
  if (aEvent) aEvent.stopPropagation();
}

function OpenFile(aURL, aInTab)
{
  // early way out if no URL
  if (!aURL)
    return;
 
  var ebmAvailable = ("EBookManager" in window);
  if (ebmAvailable && aURL.toLowerCase().endsWith(".epub")) {
    var ioService =
      Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
    var fileHandler =
      ioService.getProtocolHandler("file")
               .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var file = fileHandler.getFileFromURLSpec(aURL);

    var windowEnumerator = Services.wm.getEnumerator("bluegriffon");
    var win = null;
    while (windowEnumerator.hasMoreElements()) {
      var w = windowEnumerator.getNext();
      var ebookElt = w.document.querySelector("epub2,epub3,epub31");
      if (ebookElt) {
        var ebook = ebookElt.getUserData("ebook");
        if (file.equals(ebook.packageFile)) {
          w.focus();
          return;
        }
      }
      else if (!win)
        win = w;
    }

    StoreUrlInLocationDB(aURL);
    if (win && !win.EditorUtils.getCurrentEditor()) {
      win.focus();
      win.EBookManager.showEbook(file, aURL);
      win.updateCommands("style");
      return;
    }
    OpenNewWindow(aURL);
    return;
  }

  var alreadyEdited = EditorUtils.isAlreadyEdited(aURL);
  if (alreadyEdited)
  {
    var win    = alreadyEdited.window;
    var editor = alreadyEdited.editor;
    var index  = alreadyEdited.index;
    win.document.getElementById("tabeditor").selectedIndex = index;
    win.document.getElementById("tabeditor").mTabpanels.selectedPanel = editor.parentNode;

    // nothing else to do here...
    win.focus();
    return;
  }

  // force new window if we don't have one already
  var tabeditor = document.getElementById("tabeditor");
  if (tabeditor && aInTab) {
    document.getElementById("tabeditor").addEditor(
         UrlUtils.stripUsernamePassword(aURL, null, null),
         aURL);
    gDialog.structurebar.removeAttribute("class");
  }
  else
    OpenNewWindow(aURL);
}

function OpenFiles(aURLArray, aInTab)
{
  for (var i = 0; i < aURLArray.length; i++)
    OpenFile(aURLArray[i], aInTab);
}

function EditorLoadUrl(aElt, aURL)
{
  try {
    if (aURL)
    {
      var Ci = Components.interfaces;
      var url = UrlUtils.normalizeURL(aURL);

      aElt.webNavigation.loadURI(url, // uri string
             Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE,     // load flags
             null,                                         // referrer
             null,                                         // post-data stream
             null);
    }
  } catch (e) { }
}

function AboutComposer()
{
  var wm = Services.wm;
  var enumerator = wm.getEnumerator( "BlueGriffon:About" );
  while ( enumerator.hasMoreElements() )
  {
    var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
    win.focus();
    return;
  }
  /*window.openDialog(,"_blank",
                    "chrome,modal,dialog=no,titlebar,centerscreen");*/
  OpenAppModalWindow(window, 'chrome://bluegriffon/content/dialogs/aboutDialog.xul', "aboutDialog", true); 
}

function OpenConsole()
{
   let { require } = Components.utils.import("resource://devtools/shared/Loader.jsm", {});
   let HUDService = require("devtools/client/webconsole/hudservice");
   HUDService.openBrowserConsoleOrFocus();
}

function OpenExtensionsManager()
{
  window.openDialog("chrome://mozapps/content/extensions/extensions.xul",
                    "",
                    "chrome,dialog=no,resizable");
}

function StopLoadingPage()
{
  gDialog.tabeditor.stopWebNavigation();
}

//--------------------------------------------------------------------
function onButtonUpdate(button, commmandID)
{
  var commandNode = gDialog[commmandID];
  var state = commandNode.getAttribute("state");
  button.checked = state == "true";
}

function UpdateWindowTitle(aEditorElement)
{
  if (!aEditorElement) {
    aEditorElement = EditorUtils.getCurrentEditorElement();
    if (!aEditorElement) // sanity check
      return "";
  }

  try {
    var doc = aEditorElement.contentDocument;
    doc instanceof Components.interfaces.nsIDOMDocument;
    var windowTitle = doc.title;
    if (!windowTitle)
      windowTitle = L10NUtils.getString("untitled");

    // Append just the 'leaf' filename to the Doc. Title for the window caption
    var docUrl = doc.QueryInterface(Components.interfaces.nsIDOMHTMLDocument).URL;
    if (docUrl && !UrlUtils.isUrlOfBlankDocument(docUrl) && docUrl != "about:blank")
    {
      var scheme = UrlUtils.getScheme(docUrl);
      var filename = UrlUtils.getFilename(docUrl);
      if (filename)
        windowTitle += " [" + scheme + ":/.../" + decodeURI(filename) + "]";

      // TODO: 1. Save changed title in the recent pages data in prefs
    }

    // Set window title with
    var titleModifier = L10NUtils.getString("titleModifier");
    var title = L10NUtils.getBundle()
                         .formatStringFromName("titleFormat",
                                               [windowTitle, titleModifier],
                                               2);
#ifdef CAN_DRAW_IN_TITLEBAR
    gDialog.titleInTitlebar.setAttribute("value", title);
#else
    document.title = title;
#endif
    return windowTitle;                                                       
  } catch (e) { }
  return "";
}

function onParagraphFormatChange(paraMenuList, commandID)
{
  if (!paraMenuList)
    return;

  var commandNode = gDialog[commandID];
  var state = commandNode.getAttribute("state");

  // force match with "normal"
  if (state == "body")
    state = "";

  if (state == "mixed") {
    //Selection is the "mixed" ( > 1 style) state
    paraMenuList.selectedItem = null;
    //paraMenuList.setAttribute("label","--");
    paraMenuList.setAttribute("label", "mixed");
  }
  else
  {
    var menuPopup = gDialog.ParagraphPopup;
    var menuItems = menuPopup.childNodes;
    for (var i=0; i < menuItems.length; i++)
    {
      var menuItem = menuItems.item(i);
      if ("value" in menuItem && menuItem.value == state)
      {
        paraMenuList.selectedItem = menuItem;
        break;
      }
    }
  }
}

function onARIARoleChange(menuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  menuList.value = state;
}

function onARIARoleChangeStructureBar(commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  var popup = gDialog.ARIARoleStructureBarPopup;
  var child = popup.firstElementChild;
  while (child) {
    if (child.getAttribute("value") == state)
      child.setAttribute("checked", "true");
    else
      child.removeAttribute("checked");
    child = child.nextElementSibling;
  }
}

function onColorChange(aElt, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  aElt.color = state;
}

function onColorDisableChange(aElt, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("disabled");
  if (state) {
    aElt.setAttribute("disabled", true);
    aElt.mColorBox.setAttribute("disabled", true);
  }
  else {
    aElt.removeAttribute("disabled");
    aElt.mColorBox.removeAttribute("disabled");
  }
}

/************* Encapsulation menu ******/

function initEncapsulateMenu(menuPopup)
{
  deleteAllChildren(menuPopup);

  var elts = HTML5Helper.mHTML5_ELEMENTS;
  for (var i = 0; i < elts.length; i++) {
    var e = elts[i];
    if (!e.block && !e.empty) {
      var label = e.label;
      try {
        var str = gDialog.bundleHTML5.getString(label);
        label = str;
      }
      catch(e) {}
      var item = document.createElement("menuitem");
      item.setAttribute("label", label);
      item.setAttribute("html5index", i);
      item.setAttribute("oncommand", "Encapsulate(event, this)")
      menuPopup.appendChild(item);
    }
  }
}

function Encapsulate(event, aItem)
{
  event.stopPropagation();
  var elt;
  if (aItem.hasAttribute("html5index")) {
    var index = parseInt(aItem.getAttribute("html5index"));
    elt = HTML5Helper.mHTML5_ELEMENTS[index];
  }
  else {
    elt = { tag:  aItem.getAttribute("tag") };
  }
  EditorUtils.getCurrentEditor().setInlineProperty(elt.tag, "", "");
}
/************* FONT FACE ****************/

function initFontFaceMenu(menuPopup)
{
  //initLocalFontFaceMenu(menuPopup);

  if (menuPopup)
  {
    var children = menuPopup.childNodes;
    if (!children) return;

    var firstHas = { value: false };
    var anyHas = { value: false };
    var allHas = { value: false };

    // we need to set or clear the checkmark for each menu item since the selection
    // may be in a new location from where it was when the menu was previously opened

    // Fixed width (second menu item) is special case: old TT ("teletype") attribute
    EditorUtils.getTextProperty("tt", "", "", firstHas, anyHas, allHas);
    children[1].setAttribute("checked", allHas.value);

    if (!anyHas.value)
      EditorUtils.getTextProperty("font", "face", "", firstHas, anyHas, allHas);

    children[0].setAttribute("checked", !anyHas.value);

    // Skip over default, TT, and separator
    for (var i = 3; i < children.length; i++)
    {
      var menuItem = children[i];
      var faceType = menuItem.getAttribute("value");

      if (faceType)
      {
        EditorUtils.getTextProperty("font", "face", faceType, firstHas, anyHas, allHas);

        // Check the menuitem only if all of selection has the face
        if (allHas.value)
        {
          menuItem.setAttribute("checked", "true");
          break;
        }

        // in case none match, make sure we've cleared the checkmark
        menuItem.removeAttribute("checked");
      }
    }
  }
}

const kFixedFontFaceMenuItems = 7; // number of fixed font face menuitems

function initLocalFontFaceMenu(menuPopup)
{
  if (!BlueGriffonVars.localFonts)
  {
    // Build list of all local fonts once per editor
    try 
    {
      var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                                 .getService(Components.interfaces.nsIFontEnumerator);
      var localFontCount = { value: 0 }
      BlueGriffonVars.localFonts = enumerator.EnumerateAllFonts(localFontCount);
    }
    catch(e) { }
  }
  
  if (!menuPopup)
    return;
  // fill in the menu only once...
  var callingId = menuPopup.parentNode.id;

  if(!BlueGriffonVars.fontMenuOk)
    BlueGriffonVars.fontMenuOk = {};
  if (BlueGriffonVars.fontMenuOk[callingId ] &&
      menuPopup.childNodes.length != kFixedFontFaceMenuItems)
    return;
  BlueGriffonVars.fontMenuOk[callingId ] = callingId ;

  var useRadioMenuitems = (menuPopup.parentNode.localName == "menu"); // don't do this for menulists  
  if (menuPopup.childNodes.length == kFixedFontFaceMenuItems) 
  {
    if (BlueGriffonVars.localFonts.length == 0) {
      menuPopup.childNodes[kFixedFontFaceMenuItems - 1].hidden = true;
    }
    for (var i = 0; i < BlueGriffonVars.localFonts.length; ++i)
    {
      if (BlueGriffonVars.localFonts[i] != "")
      {
        var itemNode = document.createElementNS(BlueGriffonVars.kXUL_NS, "menuitem");
        itemNode.setAttribute("class", "menuitem-non-iconic-accel");
        itemNode.setAttribute("label", BlueGriffonVars.localFonts[i]);
        itemNode.setAttribute("value", BlueGriffonVars.localFonts[i]);
        if (useRadioMenuitems) {
          itemNode.setAttribute("type", "radio");
          itemNode.setAttribute("name", "2");
          itemNode.setAttribute("observes", "cmd_renderedHTMLEnabler");
        }
        menuPopup.appendChild(itemNode);
      }
    }
  }
}

function onFontFaceChange(fontFaceMenuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");

  if (state == "mixed")
  {
    //Selection is the "mixed" ( > 1 style) state
    fontFaceMenuList.selectedItem = null;
    fontFaceMenuList.setAttribute("label","--");
  }
  else
  {
    var menuPopup = fontFaceMenuList.menupopup;
    var menuItems = menuPopup.childNodes;
    for (var i=0; i < menuItems.length; i++)
    {
      var menuItem = menuItems.item(i);
      if (menuItem.getAttribute("label") && ("value" in menuItem && menuItem.value.toLowerCase() == state.toLowerCase()))
      {
        fontFaceMenuList.selectedItem = menuItem;
        break;
      }
    }
  }
}

/************** ARIA DROPDOWNS **************/

function InitializeARIARoleDropdown(aPopup)
{
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
    aPopup.appendChild(item);
  }
}

/************** CLASS MANAGEMENT **************/

function onClassChange(classMenuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  classMenuList.value = state;
}

var gChangingClass = false;
function OnKeyPressInClassMenulist(aEvent)
{
  gChangingClass = true;
  var keyCode = aEvent.keyCode;
  if (keyCode == 13) {
    gDialog.ClassSelect.blur();
  }  
}

function OnBlurFromClassMenulist(aEvent)
{
  if (gChangingClass) {
    gChangingClass = false;
    var node = EditorUtils.getSelectionContainer().node;
    var className = gDialog.ClassSelect.value;
    if (className)
      EditorUtils.getCurrentEditor().setAttribute(node, "class", className);
    else
      EditorUtils.getCurrentEditor().removeAttribute(node, "class");
    // be kind with the rest of the world
    NotifierUtils.notify("selection_strict", node, true);
  }  
}

/************** ID MANAGEMENT **************/

function onIdChange(idMenuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  idMenuList.value = state;
}

var gChangingId = false;
function OnKeyPressInIdMenulist(aEvent)
{
  gChangingId = true;
  var keyCode = aEvent.keyCode;
  if (keyCode == 13) {
    gDialog.IdSelect.blur();
  }  
}

function OnBlurFromIdMenulist(aEvent)
{
  if (gChangingId) {
    gChangingId = false;
    var node = EditorUtils.getSelectionContainer().node;
    var id = gDialog.IdSelect.value;
    if (id)
      EditorUtils.getCurrentEditor().setAttribute(node, "id", id);
    else
      EditorUtils.getCurrentEditor().removeAttribute(node, "id");
    // be kind with the rest of the world
    NotifierUtils.notify("selection_strict", node, true);
  }  
}

/************** STRUCTUREBAR *************/

function UpdateStructureBarContextMenu()
{
  var popupNode = document.popupNode;
  var target    = null;
  if (popupNode)
    target = popupNode.getUserData("node");
  if (target) // sanity check
    try {
      EditorUtils.getCurrentEditor().selectElement(target);
    }
    catch(e) {}

  if (target && target.hasAttribute("lang"))
    gDialog.resetElementLanguageMenuitem.removeAttribute("disabled");
  else
    gDialog.resetElementLanguageMenuitem.setAttribute("disabled", "true");

  if (target && target == target.ownerDocument.body)
  {
    gDialog.deleteElementMenuitem.setAttribute("disabled", "true");
    gDialog.removeTagMenuitem.setAttribute("disabled", "true");
    gDialog.changeTagMenuitem.setAttribute("disabled", "true");
  }
  else
  {
    gDialog.deleteElementMenuitem.removeAttribute("disabled");
    gDialog.removeTagMenuitem.removeAttribute("disabled");
    gDialog.changeTagMenuitem.removeAttribute("disabled");
  }
}

function ResetLanguage(aEvent)
{
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target)
    {
      var editor = EditorUtils.getCurrentEditor();
      editor.removeAttribute(target, "lang");
    }
  }
}

function ShowLanguageDialog(aEvent)
{
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target)
      window.openDialog("chrome://bluegriffon/content/dialogs/languages.xul","_blank",
                        "chrome,modal,titlebar,resizable", target);
  }
}

function UpdateDirectionMenu(aEvent)
{
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target) {
      var direction = target.style.direction;
      switch (direction) {
        case "ltr":
          gDialog.noDirectionContextMenuitem.removeAttribute("checked");
          gDialog.ltrDirectionContextMenuitem.setAttribute("checked", "true");
          gDialog.rtlDirectionContextMenuitem.removeAttribute("checked");
          break;
        case "rtl":
          gDialog.noDirectionContextMenuitem.removeAttribute("checked");
          gDialog.ltrDirectionContextMenuitem.removeAttribute("checked");
          gDialog.rtlDirectionContextMenuitem.setAttribute("checked", "true");
          break;
        default:
          gDialog.noDirectionContextMenuitem.setAttribute("checked", "true");
          gDialog.ltrDirectionContextMenuitem.removeAttribute("checked");
          gDialog.rtlDirectionContextMenuitem.removeAttribute("checked");
          break;
      }
    }
  }
}

function SetDirection(aEvent)
{
  var value = aEvent.originalTarget.getAttribute("value");
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target) {
      var txn = new diStyleAttrChangeTxn(target, "direction", value, "");
      EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
      EditorUtils.getCurrentEditor().incrementModificationCount(1);  
    }
  }
}

function DeleteElement(aEvent)
{
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target)
    {
      var editor = EditorUtils.getCurrentEditor();
      editor.deleteNode(target);
    }
  }
}

function ExplodeElement(aEvent)
{
  var popupNode = document.popupNode;
  if (popupNode)
  {
    var target = popupNode.getUserData("node");
    if (target)
    {
      var editor = EditorUtils.getCurrentEditor();
      var parent = target.parentNode;
      editor.beginTransaction();

      var child = target.firstChild;
      while (child) {
        var tmp = child.nextSibling;
        var clone = child.cloneNode(true)
        var txn = new diNodeInsertionTxn(clone, parent, target);
        editor.transactionManager.doTransaction(txn);

        child = tmp;
      }
      editor.deleteNode(target);

      editor.endTransaction();
    }
  }
}

function ChangeTag(aEvent)
{
  var popupNode = gDialog.structurebar.querySelector("[checked='true']");
  var textbox = document.createElement("textbox");
  textbox.setAttribute("value", popupNode.getAttribute("value"));
  textbox.setAttribute("width", popupNode.boxObject.width);
  textbox.className = "struct-textbox";

  var target = popupNode.getUserData("node");
  textbox.setUserData("node", target, null);
  popupNode.parentNode.replaceChild(textbox, popupNode);

  textbox.addEventListener("keypress", OnKeyPressWhileChangingTag, false);
  textbox.addEventListener("blur", ResetStructToolbar, true);

  textbox.select();
}

function ResetStructToolbar(event)
{
  var editor = EditorUtils.getCurrentEditor();
  var textbox = event.target;
  var element = textbox.getUserData("node");
  textbox.parentNode.removeChild(textbox);
  editor.selectElement(element);
}

function OnKeyPressWhileChangingTag(event)
{
  var editor = EditorUtils.getCurrentEditor();
  var textbox = event.target;

  var keyCode = event.keyCode;
  if (keyCode == 13) {
    var newTag = textbox.value;
    var element = textbox.getUserData("node");
    textbox.parentNode.removeChild(textbox);

    if (newTag.toLowerCase() == element.nodeName.toLowerCase())
    {
      // nothing to do
      GetWindowContent().focus();
      return;
    }

    var offset = 0;
    var childNodes = element.parentNode.childNodes;
    while (childNodes.item(offset) != element) {
      offset++;
    }

    editor.beginTransaction();

    try {
      var newElt = editor.document.createElement(newTag);
      if (newElt) {
        childNodes = element.childNodes;
        var childNodesLength = childNodes.length;
        var i;
        for (i = 0; i < childNodesLength; i++) {
          var clone = childNodes.item(i).cloneNode(true);
          newElt.appendChild(clone);
        }
        editor.insertNode(newElt, element.parentNode, offset+1);
        editor.deleteNode(element);
        editor.selectElement(newElt);

        GetWindowContent().focus();
      }
    }
    catch (e) {}

    editor.endTransaction();

  }
  else if (keyCode == 27) {
    // if the user hits Escape, we discard the changes
    GetWindowContent().focus();
  }
}

/************ VIEW MODE ********/

function ToggleViewMode(aElement)
{
  if (!aElement) // sanity case
    return false;

  var editorElement = EditorUtils.getCurrentEditorElement();
  if (!editorElement) // sanity case
    return false;

  var deck = editorElement.parentNode;
  var editor = EditorUtils.getCurrentEditor();

  var previousWysiwygMedium = deck.getAttribute("wysiwygmedium");
  if (aElement.id == "wysiwygModeButton" || aElement.id == "liveViewModeButton") {
    editor.setMedium("screen");
    deck.removeAttribute("wysiwygmedium");
  }
  else if (aElement.id == "printPreviewModeButton") {
    editor.setMedium("print");
    deck.setAttribute("wysiwygmedium", "print");
  }

  var child = aElement.parentNode.firstChild;
  while (child) {
    if (child == aElement)
      child.setAttribute("selected", "true");
    else
      child.removeAttribute("selected");
    child = child.nextSibling;
  }

  var mode =  aElement.getAttribute("mode");
  var previousmode = EditorUtils.getCurrentViewMode();
  if (mode == previousmode) {
    if (mode == "wysiwyg" && previousWysiwygMedium != deck.getAttribute("wysiwygmedium"))
      NotifierUtils.notify("modeSwitch");
    return true;
  }

  var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;

  // special case, from liveview/source to source
  if (mode == "source" &&
      previousmode == "liveview" &&
      EditorUtils.getLiveViewMode() == "source") {
    gDialog.liveViewModeButton.removeAttribute("selected");
    gDialog.sourceModeButton.setAttribute("selected", "true");
    gDialog.wysiwygModeButton.removeAttribute("selected");
    gDialog.printPreviewModeButton.removeAttribute("selected");

    editorElement.parentNode.setAttribute("currentmode", mode);

    deck.removeAttribute("class");
    editorElement.parentNode.selectedIndex = 1;
    sourceIframe.focus();
    //sourceEditor.refresh();
    sourceEditor.focus();
    NotifierUtils.notify("modeSwitch");

    return true;
  }

  // special case, to liveview/source from source
  if (previousmode == "source" &&
      mode == "liveview") {
    deck.className = "liveview";
    gDialog.liveViewModeButton.setAttribute("selected", "true");
    gDialog.sourceModeButton.removeAttribute("selected");
    gDialog.wysiwygModeButton.removeAttribute("selected");
    gDialog.printPreviewModeButton.removeAttribute("selected");

    editorElement.parentNode.setAttribute("currentmode", mode);
    sourceIframe.focus();
    //sourceEditor.refresh();
    sourceEditor.focus();
    NotifierUtils.notify("modeSwitch");

    return true;
  }

  // special case, from liveview/wysiwyg to wysiwyg
  if (mode == "wysiwyg" &&
      previousmode == "liveview" &&
      EditorUtils.getLiveViewMode() == "wysiwyg") {
    gDialog.liveViewModeButton.removeAttribute("selected");
    gDialog.sourceModeButton.removeAttribute("selected");
    if (deck.getAttribute("wysiwygmedium") == "print") {
      gDialog.printPreviewModeButton.setAttribute("selected", "true");
      gDialog.wysiwygModeButton.removeAttribute("selected");
    }
    else {
      gDialog.wysiwygModeButton.setAttribute("selected", "true");
      gDialog.printPreviewModeButton.removeAttribute("selected");
    }

    editorElement.parentNode.setAttribute("currentmode", mode);

    deck.removeAttribute("class");
    editorElement.parentNode.selectedIndex = 0;
    GetWindowContent().focus();
    NotifierUtils.notify("modeSwitch");

    return true;
  }

  gDialog.bespinToolbox1.hidden = true;
  gDialog.bespinToolbox2.hidden = true;

  var doctype = EditorUtils.getCurrentDocument().doctype;
  var systemId = doctype ? doctype.systemId : null;
  var isXML = false;
  switch (systemId) {
    case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
    case "http://www.w3.org/TR/html4/loose.dtd":
    case "http://www.w3.org/TR/REC-html40/strict.dtd":
    case "http://www.w3.org/TR/REC-html40/loose.dtd":
      isXML = false;
      break;
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
    case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
      isXML = true;
      break;
    case "":
    case "about:legacy-compat":
      isXML = (EditorUtils.getCurrentDocument().documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
      break;
    case null:
      isXML = (EditorUtils.getCurrentDocument().compatMode == "CSS1Compat");
      break;
  }

  if (mode == "source" || mode == "liveview")
  {
    if (mode == "source") {
      gDialog.structurebar.style.visibility = "hidden";
      HandlersManager.hideAllHandlers();
      gDialog.tabeditor.enableRulers(false);
    }

    if ("ResponsiveRulerHelper" in window)
      ResponsiveRulerHelper.unselectAllMQs();
    EditorUtils.cleanup();

    var mimeType = EditorUtils.getCurrentDocumentMimeType();
    const nsIDE = Components.interfaces.nsIDocumentEncoder;
    var encoder = Components.classes["@mozilla.org/layout/documentEncoder;1?type=" + mimeType]
                   .createInstance(nsIDE);

    var flags = EditorUtils.getSerializationFlags(EditorUtils.getCurrentDocument());

    encoder.setCharset(editor.documentCharacterSet);
    encoder.init(EditorUtils.getCurrentDocument(), mimeType, flags.value);
    if (flags.value & nsIDE.OutputWrap)
      encoder.setWrapColumn(flags.maxColumnPref);

    NotifierUtils.notify("beforeEnteringSourceMode");
    var source = encoder.encodeToString();

    var theme = null;
    try {
      theme = GetPrefs().getCharPref("bluegriffon.source.theme");
    }
    catch(e) {}

    var defaultSourceZoom;
    try {
      defaultSourceZoom = parseFloat(Services.prefs.getCharPref("bluegriffon.source.zoom.default"));
    }
    catch(e)
    {
      defaultSourceZoom = 1;
    }
    var zoomFactor = Math.round(defaultSourceZoom * 100) + "%";
    sourceIframe.contentWindow.wrappedJSObject.installCodeMirror(BespinKeyPressCallback,
                                                 BespinChangeCallback,
                                                 BespinActivityCallback,
                                                 UpdateWysiwygLiveView,
                                                 theme,
                                                 zoomFactor);

    var lastEditableChild = editor.document.body.lastChild;
    if (lastEditableChild.nodeType == Node.TEXT_NODE)
      lastEditableChild.data = lastEditableChild.data.replace( /\s*$/, "\n");

    MarkSelection();
    source = encoder.encodeToString();

    UnmarkSelection();

    sourceEditor.setValue(source.replace( /\r\n/g, "\n").replace( /\r/g, "\n"));
    /*if (flags.value & nsIDE.OutputWrap) {
      sourceEditor.setShowPrintMargin(true);
      sourceEditor.setPrintMarginColumn(flags.maxColumnPref);
    }
    else {
      sourceEditor.setShowPrintMargin(false);
    }*/

    if (mode == "liveview") {
      deck.className = "liveview";
      GetWindowContent().focus();
    }
    else {
      deck.removeAttribute("class");
      editorElement.parentNode.selectedIndex = 1;
      sourceIframe.focus();
      sourceEditor.refresh();
      sourceEditor.focus();
    }

    sourceIframe.contentWindow.wrappedJSObject.markSelection();
    sourceIframe.setUserData("oldSource", sourceEditor.getValue(), null);
    sourceIframe.setUserData("lastSaved", "", null);

    sourceIframe.contentWindow.wrappedJSObject.isXML = isXML;
    EditorUtils.getCurrentSourceWindow().ResetModificationCount();
    editorElement.parentNode.setAttribute("currentmode", mode);

    NotifierUtils.notify("afterEnteringSourceMode");
    NotifierUtils.notify("modeSwitch");
  }
  else if (mode == "wysiwyg")
  {
    // Reduce the undo count so we don't use too much memory
    //   during multiple uses of source window 
    //   (reinserting entire doc caches all nodes)

    if (sourceEditor)
    {
      NotifierUtils.notify("beforeEnteringWysiwygMode");
      source = sourceEditor.getValue();
      var spellchecking = Services.prefs.getBoolPref("bluegriffon.spellCheck.enabled");
      Services.prefs.setBoolPref("bluegriffon.spellCheck.enabled", false);
      //sourceEditor.blur();
      var oldSource = sourceIframe.getUserData("oldSource"); 
      if (source != oldSource) {
        var parser = new DOMParser();
        try {
          var doc = parser.parseFromString(source, isXML ? "text/xml" : "text/html");
          if (doc.documentElement.nodeName == "parsererror") {
            var message = doc.documentElement.firstChild.data
                             .replace( /Location\: chrome\:\/\/bluegriffon\/content\/xul\/bluegriffon.xul/g ,
                                       ", ");
            var error = doc.documentElement.lastChild.textContent;
            window.openDialog("chrome://bluegriffon/content/dialogs/parsingError.xul", "_blank",
                              "chrome,modal,titlebar", message, error);
            gDialog.printPreviewModeButton.removeAttribute("selected");
            gDialog.wysiwygModeButton.removeAttribute("selected");

            if (previousmode == "source") {
              gDialog.sourceModeButton.setAttribute("selected", "true");
              gDialog.liveViewModeButton.removeAttribute("selected");
            }
            else {
              gDialog.liveViewModeButton.setAttribute("selected", "true");
              gDialog.sourceModeButton.removeAttribute("selected");
            }

            sourceIframe.focus();
            //sourceEditor.refresh();
            sourceEditor.focus();

            editorElement.parentNode.setAttribute("currentmode", previousmode);
            Services.prefs.setBoolPref("bluegriffon.spellCheck.enabled", spellchecking);
            return false;
          }
          deck.removeAttribute("class");
          gDialog.structurebar.style.visibility = "";
          RebuildFromSource(doc, isXML);
          var lastSaved = sourceIframe.getUserData("lastSaved");
          if (lastSaved == source)
            EditorUtils.getCurrentEditor().resetModificationCount();
        }
        catch(e) {Services.prompt.alert(null, "ToggleViewMode", e);}
      }
      else {
        deck.removeAttribute("class");
        editorElement.parentNode.selectedIndex = 0;
        gDialog.structurebar.style.visibility = "";
        GetWindowContent().focus();
      }
      sourceIframe.setUserData("lastSaved", "", null);
      Services.prefs.setBoolPref("bluegriffon.spellCheck.enabled", spellchecking);
    }
    gDialog.tabeditor.enableRulers(true);

    gDialog.liveViewModeButton.removeAttribute("selected");
    if (deck.getAttribute("wysiwygmedium") == "print") {
      gDialog.printPreviewModeButton.setAttribute("selected", "true");
      gDialog.wysiwygModeButton.removeAttribute("selected");
    }
    else {
      gDialog.wysiwygModeButton.setAttribute("selected", "true");
      gDialog.printPreviewModeButton.removeAttribute("selected");
    }
    gDialog.sourceModeButton.removeAttribute("selected");

    editorElement.parentNode.setAttribute("currentmode", mode);
  }

  editorElement.parentNode.setAttribute("previousMode", mode);
  window.updateCommands("style");
  NotifierUtils.notify("afterLeavingSourceMode");
  NotifierUtils.notify("modeSwitch");
  return true;
}

function CloneElementContents(editor, sourceElt, destElt)
{
  editor.cloneAttributes(destElt, sourceElt);
  var lastChild = destElt.lastChild;
  if (!lastChild || lastChild.nodeName.toLowerCase() != "br") {
    lastChild = editor.document.createElement("br");
    lastChild.setAttribute("type", "_moz");
    editor.insertNode(lastChild, destElt, destElt.childNodes.length);
  }

  var sourceChild = sourceElt.firstChild;
  while (sourceChild) {
    if (sourceChild.nodeType == Node.ELEMENT_NODE) {
      var destChild = editor.document.importNode(sourceChild, true);
      editor.insertNode(destChild, destElt, destElt.childNodes.length);
    }
    else if (sourceChild.nodeType == Node.TEXT_NODE) {
      var t = editor.document.createTextNode(sourceChild.data);
      editor.insertNode(t, destElt, destElt.childNodes.length);
    }
    else if (sourceChild.nodeType == Node.COMMENT_NODE) {
      var c = editor.document.createComment(sourceChild.data);
      editor.insertNode(c, destElt, destElt.childNodes.length);
    }

    sourceChild = sourceChild.nextSibling;
  }

  var child = destElt.firstChild;
  do {
    var stopIt = (child == lastChild);
    editor.deleteNode(child);
    child = destElt.firstChild;
  } while (!stopIt);
}

function RebuildFromSource(aDoc, isXML, aNoReflect)
{
  try {
    if (isXML) {
      var fileExt = UrlUtils.getFileExtension( UrlUtils.getDocumentUrl());
      var xhtmlExt = (fileExt == "xhtm" || fileExt == "xhtml");

      var styles = aDoc.querySelectorAll("style");
      var found = false, switchToCDATA = false;
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var child = style.firstChild;
        while (child) {
          var tmp = child.nextSibling;
  
          if (child.nodeType == Node.COMMENT_NODE) {
            if (xhtmlExt) {
              // XHTML document with xhtml extension and HTML comments, offer to
              // convert to CDATA sections
              if (!found) {
                found = true;
    
                var rv = PromptUtils.confirmWithTitle(
                                      L10NUtils.getString("HTMLCommentsInXHTMLTitle"),
                                      L10NUtils.getString("HTMLCommentsInXHTMLMessage"),
                                      L10NUtils.getString("HTMLCommentsInXHTMLOK"),
                                      L10NUtils.getString("HTMLCommentsInXHTMLCancel"),
                                      "");
                if (rv == 1) { // cancel button
                  child = null;
                  tmp = null;
                }
              }
    
              if (child) {
                var e = aDoc.createCDATASection(child.data);
                style.insertBefore(e, child);
                style.removeChild(child);
              }
            }
            else {
              // if we have a XHTML document with a HTML file extension, the user wants to
              // preserve the HTML comments :-(
              var e = aDoc.createTextNode("<!--" + child.data + "-->");
              style.insertBefore(e, child);
              style.removeChild(child);
            }
          }
  
          child = tmp;
        }
      }
    }
    if (!aNoReflect)
      EditorUtils.getCurrentEditorElement().parentNode.selectedIndex = 0;
    var editor = EditorUtils.getCurrentEditor();

    // make sure everything is aggregated under one single txn
    editor.beginTransaction();
    // clone html attributes
    editor.cloneAttributes(editor.document.documentElement, aDoc.documentElement);
    // clone head
    CloneElementContents(editor, aDoc.querySelector("head"), editor.document.querySelector("head"));
    // clone body
    CloneElementContents(editor, aDoc.querySelector("body"), editor.document.body);


    var valueArray = [];
    if (!Services.prefs.getBoolPref("bluegriffon.display.comments"))
      valueArray.push("comment");
    if (!Services.prefs.getBoolPref("bluegriffon.display.php"))
      valueArray.push("php");
    if (!Services.prefs.getBoolPref("bluegriffon.display.pi"))
      valueArray.push("pi");
    var value = valueArray.join(" ");
    editor.document.documentElement.setAttribute("_moz_hide", value);

    MakePhpAndCommentsVisible(editor.document);

    var elt = editor.document
                .querySelector("[bluegriffonsourceselected]");
    try {
      if (elt) {
        if (elt.hasAttribute("bluegriffonstandalone")) {
          editor.setCaretAfterElement(elt);
          ScrollToElement(elt);
          editor.deleteNode(elt);
        }
        else {
          editor.removeAttribute(elt, "bluegriffonsourceselected");
          if (elt.lastChild) {
            if (elt.lastChild.nodeType == Node.TEXT_NODE) {
              selection.collapse(elt.lastChild, elt.lastChild.data.length);
              ScrollToElement(elt);
            }
            else {
              if (elt.lastChild.nodeType == Node.ELEMENT_NODE) {
                editor.selectElement(elt.lastChild);
                ScrollToElement(elt.lastChild);
              }
              else {
                editor.selectElement(elt);
                ScrollToElement(elt);
              }
            }
          }
          else {
            editor.selectElement(elt);
            ScrollToElement(elt);
          }
        }
      }
    }
    catch(e) {}

    editor.endTransaction();

    // the window title is updated by DOMTitleChanged event
    if (!aNoReflect) {
      NotifierUtils.notify("afterLeavingSourceMode");
      GetWindowContent().focus();
      EditorUtils.getCurrentEditorElement().focus();
    }
  } catch(e) {
    Services.prompt.alert(null, "RebuildFromSource", e);
  }
}


function doCloseTab(aTab)
{
  if ("responsiveStack" in gDialog)
    deleteAllChildren(gDialog.responsiveStack);

  var tabbox = aTab.parentNode.parentNode.parentNode;
  var tabs = aTab.parentNode;
  var tabpanels = tabbox.parentNode.mTabpanels;
  var index = tabs.getIndexOfItem(aTab);
  var selectedIndex = tabbox.selectedIndex;
  var editorBox = tabpanels.childNodes[index];
  tabpanels.removeChild(tabpanels.childNodes[index]);
  tabs.removeChild(aTab);
  if (selectedIndex < tabpanels.childNodes.length)
    tabbox.selectedIndex = selectedIndex;
  else if (tabpanels.childNodes.length)
    tabbox.selectedIndex = selectedIndex - 1;
  if (!tabpanels.childNodes.length) {
    tabbox.parentNode.mHruler.setAttribute("disabled", "true");
    tabbox.parentNode.mVruler.setAttribute("disabled", "true");
    tabbox.parentNode.setAttribute("visibility", "hidden");
    if (gDialog.structurebar) {
      //gDialog.structurebar.className = "hidden";
      gDialog.structurebar.style.visibility = "hidden";
    }
#ifdef CAN_DRAW_IN_TITLEBAR
    gDialog.titleInTitlebar.setAttribute("value", "BlueGriffon");
#else
    document.title = "BlueGriffon";
#endif
    if ("responsiveStack" in gDialog) {
      gDialog.responsiveStack.setAttribute("hidden", "true");
      gDialog.responsiveRuler.setAttribute("style", "display: none");
    }
  }
  window.updateCommands("style");
  NotifierUtils.notify("tabClosed");
#ifdef XP_MACOSX
  if (gDialog.tabeditor)
    gDialog.tabeditor.updateOSXCloseButton();
  UpdateBadge();
#endif
}

function SetLocationDB()
{
  var mDBConn = GetDBConn();

  mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS 'bgLocations' ('id' INTEGER PRIMARY KEY NOT NULL, 'query' VARCHAR NOT NULL, 'querydate' INTEGER NOT NULL, UNIQUE(query))");
  mDBConn.close();
}

function GetDBConn()
{
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  file.append("bgLocations.sqlite");
  
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                          .getService(Components.interfaces.mozIStorageService);
  return storageService.openDatabase(file);
}

function doSaveTabsBeforeQuit()
{
  var tabeditor = EditorUtils.getCurrentTabEditor();
  if (!tabeditor)
    return true;
  var tabs = tabeditor.mTabs.childNodes;
  var l = tabs.length;
  for (var i = l-1; i >= 0; i--) {
    var tab = tabs.item(i);
    tabeditor.selectedIndex = i;
    var closed = cmdCloseTab.doCommand();
    if (1 == closed)
      return false;
  }

  var ebook = document.querySelector("epub2,epub3,epub31");
  if (ebook) {
    if ("deleteTempDir" in ebook)
      ebook.deleteTempDir();
    ebook.parentNode.removeChild(ebook);
  }

  return true;
}

function doQuit()
{
  return doSaveTabsBeforeQuit();
}

function OpenPreferences()
{
  var w = null;
  try {
    w = Services.wm.getMostRecentWindow("bluegriffon-prefs");
  }
  catch(e){}
  if (w)
    w.focus();
  else {
    var features = "chrome,titlebar,toolbar,centerscreen,dialog=no,resizable=yes";
    window.openDialog("chrome://bluegriffon/content/prefs/prefs.xul", "Preferences", features);
  }
}

function OnDoubleClick(aEvent)
{
  var node = aEvent.target;
  while (node && node.nodeType != Node.ELEMENT_NODE)
    node = node.parentNode;
  //EditorUtils.getCurrentEditor().selectElement(node);
  if (!node) // sanity check
    return;

  switch (node.nodeName.toLowerCase()) {
    case "comment":
    case "php":
    case "pi":
      if (node.namespaceURI == "http://disruptive-innovations.com/zoo/bluegriffon") {
        if (node.nodeName.toLowerCase() == "comment"
            && node.lastChild.data.substr(0, 6) == "mozToc")
          CreateOrUpdateTableOfContents();
        else
          window.openDialog("chrome://bluegriffon/content/dialogs/insertCommentOrPI.xul", "_blank",
                            "chrome,close,titlebar,modal,resizable=yes", node);
      }
    case "a":
      if (node.hasAttribute("href")) {
        cmdInsertLinkCommand.doCommand();
      }
      if (node.hasAttribute("name") || node.id) {
        cmdInsertAnchorCommand.doCommand();
      }
      break;
    case "img":
      cmdInsertImageCommand.doCommand();
      break;
    case "video":
      cmdInsertVideoCommand.doCommand();
      break;
    case "audio":
      cmdInsertAudioCommand.doCommand();
      break;
    case "hr":
      cmdInsertHRCommand.doCommand();
      break;
    case "form":
      cmdInsertFormCommand.doCommand();
      break;
    case "input":
      window.openDialog("chrome://bluegriffon/content/dialogs/insertFormInput.xul","_blank",
                        "chrome,modal,titlebar,resizable=no,dialog=yes", node, node.getAttribute("type"));
      break;
   case "fieldset":
      cmdInsertFieldsetCommand.doCommand();
      break;
   case "label":
      cmdInsertLabelCommand.doCommand();
      break;
    case "button":
      cmdInsertButtonCommand.doCommand();
      break;
    case "select":
    case "option":
    case "optgroup":
      cmdInsertSelectCommand.doCommand();
      break;
    case "textarea":
      cmdInsertTextareaCommand.doCommand();
      break;
    case "keygen":
      cmdInsertKeygenCommand.doCommand();
      break;
    case "output":
      break;
    case "progress":
      cmdInsertProgressCommand.doCommand();
      break;
    case "meter":
      cmdInsertMeterCommand.doCommand();
      break;
    case "datalist":
      cmdInsertDatalistCommand.doCommand();
      break;
    case "td":
    case "th":
      // fire the table properties dialog only if the selection is collapsed
      if (EditorUtils.getCurrentEditor().selection.isCollapsed) {
        window.openDialog("chrome://bluegriffon/content/dialogs/insertTable.xul","_blank",
                          "chrome,modal,titlebar,resizable=yes,dialog=no", node);
      }
      break;
    case "li":
    case "ul":
    case "ol":
      {
        var selContainer = EditorUtils.getSelectionContainer();
        if (selContainer.oneElementSelected) {
          cmdEditListCommand.doCommand();
        }
      }
      break;
    default:
      if (node.namespaceURI == "http://www.w3.org/2000/svg")
      {
        while (node.parentNode && node.parentNode.namespaceURI == "http://www.w3.org/2000/svg")
          node = node.parentNode;
        EditorUtils.getCurrentEditor().selectElement(node);
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(node);
        source = '<?xml version="1.0"?>\n' + source;
        try {
          start_svg_edit(source);
        }
        catch(e) {}
      }
    
  }
}

#include findbar.inc

#include autoInsertTable.inc

function AlignAllPanels()
{
  ScreenUtils.alignPanelsForWindow(window);
  return;
}

function UpdateDeckMenu()
{
}

function DeckOrUndeckPanel(aEvent)
{
  var menuitem = aEvent.target;
  // we know the panel is visible...
  var realMenuitem = gDialog.beforeAllPanelsMenuseparator.nextSibling;
  while (realMenuitem) {

    if (realMenuitem.getAttribute("panel") == menuitem.getAttribute("panel")) { // that's the one
      // first close the panel
      start_panel(realMenuitem);
      if (menuitem.getAttribute("checked") == "true")
        realMenuitem.setAttribute("decked", "true");
      else
        realMenuitem.removeAttribute("decked");

      start_panel(realMenuitem);
      return;
    }

    realMenuitem = realMenuitem.nextElementSibling;
  }
}

function UpdatePanelsStatusInMenu()
{
  var child = gDialog.panelsMenuPopup.firstElementChild;
  if ("UNIX" == gSYSTEM) {
    while(child) {
      var w1, w2 = null;
      // TODO case decked="true"
      try {
        var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
        w1 = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow(child.getAttribute("windowType"));
      }
      catch(e){}
      if (!w1) { // try to find a decked panel
        w2 = gDialog.deckedPanelsTabs.querySelector("label[panelid='" + child.getAttribute("panel") + "']");
      }
  
      if (w1) {
        child.setAttribute("checked", "true");
        child.setAttribute("decked",  "false");
      }
      else if (w2) {
        child.setAttribute("checked", "true");
        child.setAttribute("decked",  "true");
      }
      else
        child.setAttribute("checked", "false");
  
      document.persist(child.id, "checked");
      document.persist(child.id, "decked");
      child = child.nextElementSibling;
    }
  }
  else { // NOT LINUX
    while (child) {
      var panel = gDialog[child.getAttribute("panel")];
      if (panel && panel.popupBoxObject.popupState == "open") {
        child.setAttribute("checked", "true");
        child.setAttribute("decked",  "false");
      }
      else if (gDialog.deckedPanelsTabs.querySelector("label[panelid='" + child.getAttribute("panel") + "']")) {
        child.setAttribute("checked", "true");
        child.setAttribute("decked",  "true");
      }
      else
        child.setAttribute("checked", "false");
  
      document.persist(child.id, "checked");
      document.persist(child.id, "decked");
      child = child.nextElementSibling;
    }
  }
}

function start_panel(aElt)
{
  if (!aElt.hasAttribute("url"))
    return;

  UpdatePanelsStatusInMenu();

  if (aElt.getAttribute("checked") == "true") { // panel is visible
    if (aElt.getAttribute("decked") == "true") { // visible in deck
      var tab = gDialog.deckedPanelsTabs.querySelector("label[panelid='" + aElt.getAttribute("panel") + "']");
      if (tab)
        gDialog.deckedPanelsTabs.doCloseDeckedPanel(tab);
      else
        alert("panel not found");
    }
    else { // visible in standalone window
      if ("UNIX" == gSYSTEM) {
        var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
        var w = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow(aElt.getAttribute("windowType"));
        w.close();
      }
      else { // NOT UNIX
        var panel = gDialog[aElt.getAttribute("panel")];
        NotifierUtils.notify("panelClosed", panel.id);
        panel.closePanel(true);
      }
    }
    aElt.setAttribute("checked", "false");
  }
  else { // panel is still invisible
    if (aElt.getAttribute("decked") == "true") { // should be opened in the deck
      gDialog.deckedPanelsTabs.addPanel(aElt.getAttribute("label"),
                                        aElt.getAttribute("url"),
                                        aElt.getAttribute("panel"));
     }
    else { // should be opened as a standalone window or floating panel
      if ("UNIX" == gSYSTEM) {
        window.open(aElt.getAttribute("url"),"_blank",
                    "chrome,resizable,scrollbars=yes");
      }
      else {
        var panel = gDialog[aElt.getAttribute("panel")];
        var iframe = panel.firstElementChild;
        iframe.setAttribute("src", aElt.getAttribute("url"));
        panel.openPanel(null, false);
        NotifierUtils.notify("redrawPanel", panel.id);    
      }
    }
    aElt.setAttribute("checked", "true");
  }
  
  document.persist(aElt.id, "checked");
}

function OnClick(aEvent)
{
  // this is necessary to be able to select for instance video elements
  var target = aEvent.explicitOriginalTarget;
  if (target && (target instanceof HTMLVideoElement
                 || target instanceof HTMLAudioElement
                 || target instanceof Components.interfaces.nsIDOMHTMLSelectElement)) {
    EditorUtils.getCurrentEditor().selectElement(target);
  }
}

// LINUX ONLY :-(
function start_css()
{
  var w = null;
  try {
    w = Services.wm.getMostRecentWindow("BlueGriffon:CSSProperties");
  }
  catch(e){}
  if (w)
    w.focus();
  else
    window.open('chrome://cssproperties/content/cssproperties.xul',"_blank",
               "chrome,resizable,scrollbars=yes");
}

function UpdateTabTooltip(aElement)
{
  while (aElement && aElement.nodeName != "tab")
    aElement = aElement.parentNode;

  if (!aElement || aElement.nodeName != "tab")
    return; // sanity case

  var tabeditor = gDialog.tabeditor;
  var tabs      = tabeditor.mTabs.childNodes;
  var editors   = tabeditor.mTabpanels.childNodes;
  var l = editors.length;
  for (var i = 0; i < l; i++)
  {
    if (tabs.item(i) == aElement)
    {
      var editorElement = editors.item(i).firstChild;
      editor = editorElement.getEditor(editorElement.contentWindow);
  
      // Do QIs now so editor users won't have to figure out which interface to use
      // Using "instanceof" does the QI for us.
      editor instanceof Components.interfaces.nsIEditor;
      editor instanceof Components.interfaces.nsIPlaintextEditor;
      editor instanceof Components.interfaces.nsIHTMLEditor;

      var doctype = editorElement.contentDocument.doctype;
      var systemId = doctype ? doctype.systemId : null;
      switch (systemId) {
        case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
        case "http://www.w3.org/TR/html4/loose.dtd":
        case "http://www.w3.org/TR/REC-html40/strict.dtd":
        case "http://www.w3.org/TR/REC-html40/loose.dtd":
          gDialog["tab-tooltip-html-dialect"].setAttribute("value", "HTML 4");
          break;
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
          gDialog["tab-tooltip-html-dialect"].setAttribute("value", "XHTML 1");
          break;
        case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
          gDialog["tab-tooltip-html-dialect"].setAttribute("value", "XHTML 1.1");
          break;
        case "":
        case "about:legacy-compat":
          gDialog["tab-tooltip-html-dialect"].setAttribute("value",
             (editorElement.contentDocument.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml") ?
               "XHTML 5" : "HTML 5");
          break;
        case null:
	        if (editorElement.contentDocument.compatMode == "CSS1Compat")
	         gDialog["tab-tooltip-html-dialect"].setAttribute("value", "XHTML 5");
	        else
	         gDialog["tab-tooltip-html-dialect"].setAttribute("value", "HTML 4");
	        break;
        default: break; // should never happen...
      }

      gDialog["tab-tooltip-title"].setAttribute("value",
                                       editorElement.contentDocument.title ||
                                         "(" + L10NUtils.getString("untitled") + ")");

      var location = editorElement.contentDocument.location.toString();
      if (!UrlUtils.isUrlOfBlankDocument(location))
        gDialog["tab-tooltip-location"].setAttribute("value",
                                          UrlUtils.stripUsernamePassword(location));
      else
        gDialog["tab-tooltip-location"].setAttribute("value", "");

      function _getMetaElement(aName, aId)
      {
        if (aName)
        {
          var name = aName.toLowerCase();
          try {
            var metanodes = editorElement.contentDocument
                              .getElementsByTagName("meta");
            for (var i = 0; i < metanodes.length; i++)
            {
              var metanode = metanodes.item(i);
              if (metanode && metanode.getAttribute("name") == name) {
                var value = metanode.getAttribute("content")
                value = value ? value.trim() : "";
                gDialog[aId].setAttribute("value", value);
                gDialog[aId].setAttribute("tooltiptext", value);
                return;
              }
            }
          }
          catch(e) {}
        }
        gDialog[aId].setAttribute("value", "");
        gDialog[aId].setAttribute("tooltiptext", "");
      }

      _getMetaElement("author",      "tab-tooltip-author");
      _getMetaElement("description", "tab-tooltip-description");
      _getMetaElement("keywords",    "tab-tooltip-keywords");

      var charset = editor.documentCharacterSet.toLowerCase();
      gDialog["tab-tooltip-charset"].setAttribute("value", charset);

      var docElement = editor.document.documentElement;
      if (docElement.hasAttribute("lang"))
        gDialog["tab-tooltip-language"].setAttribute("value", docElement.getAttribute("lang"));
      else
        gDialog["tab-tooltip-language"].setAttribute("value", "");
      if (docElement.hasAttribute("dir"))
        gDialog["tab-tooltip-text-direction"].setAttribute("value", docElement.getAttribute("dir"));
      else
        gDialog["tab-tooltip-text-direction"].setAttribute("value", "");

      return;
    }

  }          

}

function OpenAddonsSite()
{
  loadExternalURL("http://bluegriffon.com/");
}

function initFontStyleMenu(menuPopup)
{
  for (var i = 0; i < menuPopup.childNodes.length; i++)
  {
    var menuItem = menuPopup.childNodes[i];
    var theStyle = menuItem.getAttribute("state");
    if (theStyle)
    {
      menuItem.setAttribute("checked", theStyle);
    }
  }
}

function ToggleAllTagsMode()
{
  var tab = gDialog.tabeditor.selectedTab;
  if (tab) {
    var editor = EditorUtils.getCurrentEditor();
    editor instanceof Components.interfaces.nsIEditorStyleSheets;
    var scrollTop = editor.document.documentElement.scrollTop;
    if (tab.hasAttribute("alltags")) {
      tab.removeAttribute("alltags");
      editor.enableStyleSheet("chrome://bluegriffon/content/EditorAllTags.css", false);
    }
    else {
      tab.setAttribute("alltags", "true");
      editor.enableStyleSheet("chrome://bluegriffon/content/EditorAllTags.css", true);
    }
    editor.document.documentElement.scrollTop = scrollTop;
  }
}

function UpdateViewMenu()
{
  if (!("tabeditor" in gDialog))
    return;
  var tab = gDialog.tabeditor.selectedTab;
  if (tab) {
    if (tab.hasAttribute("alltags")) {
      gDialog.allTagsModeMenuitem.setAttribute("checked", "true");
      return;
    }
  }
  gDialog.allTagsModeMenuitem.removeAttribute("checked");
}

/*********** CONTEXT MENU ***********/

function GetParentTable(element)
{
  var node = element;
  while (node)
  {
    if (node.nodeName.toLowerCase() == "table")
      return node;

    node = node.parentNode;
  }
  return node;
}

function UpdateEditorContextMenu(event, aMenupopup)
{
  if (event.explicitOriginalTarget.id == "editorContextMenu") {
    var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
    sc.initFromEvent(document.popupRangeParent, document.popupRangeOffset);

    gDialog.spellCheckMenu.disabled = !sc.overMisspelling;

    // the following is finally not desirable ; commented out for the time being
    /*try {
      EditorUtils.getCurrentEditor().selectElement(document.popupNode);
    }
    catch(e) {}*/

    var element = GetParentTable(document.popupNode);
    var idstart = "separator_before_ctableInsertMenu";
    var idend   = "cmenu_tableProperties";
    var elt = gDialog[idstart];
    var currentId;
    do {
      if (element)
        elt.removeAttribute("hidden");
      else
        elt.setAttribute("hidden", "true");
      currentId = elt.id;
      elt = elt.nextElementSibling;
    } while (currentId != idend);
  }
}

function UpdateSpellCheckMenu(aMenupopup)
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");

  var suggestions = 10;
  try {
    suggestions = Services.prefs.getIntPref("bluegriffon.spellCheck.suggestions");
  }
  catch(e) {}

  sc.addSuggestionsToMenu(aMenupopup, gDialog.suggestionsSpellCheckSeparator, suggestions);
}

function CleanSpellCheckMenu()
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
  sc.clearSuggestionsFromMenu();
}

function AddWordToDictionary()
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
  sc.addToDictionary();
}

function UpdateSpellCheckDictionaries(aMenupopup)
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
  sc.addDictionaryListToMenu(aMenupopup, null);
}

function CleanSpellCheckDictionaries()
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
  sc.clearDictionaryListFromMenu();
}

function IgnoreWord()
{
  var sc = EditorUtils.getCurrentEditorElement().getUserData("spellchecker");
  sc.ignoreWord();
}

#ifndef XP_MACOSX
function OpenCharInsertionDialog()
{
  var w = null;
  try {
    w = Services.wm.getMostRecentWindow("BlueGriffon:insertCharsDlg");
  }
  catch(e){}
  if (w)
    w.focus();
  else
   window.openDialog("chrome://bluegriffon/content/dialogs/insertChars.xul","_blank",
                     "chrome,modal=no,titlebar");
}
#endif


var gDummySelectionStartNode = null;
var gDummySelectionEndNode = null;
var gDummySelectionStartData = "";
var gDummySelectionEndData = "";

var gPreservedSelectionStartNode = null;
var gPreservedSelectionEndNode = null;
var gPreservedSelectionStartOffset = 0;
var gPreservedSelectionEndOffset = 0;

function MarkSelection()
{
  gDummySelectionStartNode = null;
  gDummySelectionEndNode = null;
  gDummySelectionStartData = "";
  gDummySelectionEndData = "";
  
  const kBGBGBG = "--BG--";

  var selection = EditorUtils.getCurrentEditor().selection;
  for (var count = 0; count < 1; count++) {
    var range = selection.getRangeAt(count);
    var startContainer = range.startContainer;
    var endContainer   = range.endContainer;
    var startOffset    = range.startOffset;
    var endOffset      = range.endOffset;

    gPreservedSelectionStartNode   = startContainer;
    gPreservedSelectionEndNode     = endContainer;
    gPreservedSelectionStartOffset = startOffset;
    gPreservedSelectionEndOffset   = endOffset;

    if (startContainer.nodeType == Node.TEXT_NODE) {
      var data = startContainer.data;
      gDummySelectionStartNode = startContainer;
      gDummySelectionStartData = data;
      data = data.substr(0, startOffset) + kBGBGBG + data.substr(startOffset);
      startContainer.data = data;
    }
    else if (startContainer.nodeType == Node.ELEMENT_NODE) {
      if (startOffset < startContainer.childNodes.length) {
        var node = startContainer.childNodes.item(startOffset);
        if (node.nodeType == Node.TEXT_NODE) {
          var data = node.data;
          gDummySelectionStartNode = node;
          gDummySelectionStartData = data;
          data = kBGBGBG + data;
          node.data = data;
        }
        else {
          var t = EditorUtils.getCurrentDocument().createTextNode(kBGBGBG);
          gDummySelectionStartNode = t;
          startContainer.insertBefore(t, node);
        }
      }
      else {
        var t = EditorUtils.getCurrentDocument().createTextNode(kBGBGBG);
        gDummySelectionStartNode = t;
        startContainer.appendChild(t);
      }
    }

    if (endContainer.nodeType == Node.TEXT_NODE) {
      // same node as start node???
      if (endContainer == startContainer) {
        var data = endContainer.data;
        gDummySelectionEndNode = endContainer;
        gDummySelectionEndData = data;
        data = data.substr(0, endOffset + kBGBGBG.length) + kBGBGBG + data.substr(endOffset + kBGBGBG.length);
        endContainer.data = data;
      }
      else {
        var data = endContainer.data;
        gDummySelectionEndNode = endContainer;
        gDummySelectionEndData = data;
        data = data.substr(0, endOffset) + kBGBGBG + data.substr(endOffset);
        endContainer.data = data;
      }
    }
    else if (endContainer.nodeType == Node.ELEMENT_NODE) {
      var node = endContainer.childNodes.item(Math.max(0, endOffset - 1));
      if (node.nodeType == Node.TEXT_NODE) {
        var data = node.data;
        gDummySelectionEndNode = node;
        gDummySelectionEndData = data;
        data += kBGBGBG;
        node.data = data;
      }
      else {
        var t = EditorUtils.getCurrentDocument().createTextNode(kBGBGBG);
        gDummySelectionEndNode = t;
        endContainer.insertBefore(t, node.nextSibling);
      }
    }
  }
}

function UnmarkSelection()
{
  if (gDummySelectionEndNode) {
    if (gDummySelectionEndData)
      gDummySelectionEndNode.data = gDummySelectionEndData;
    else
      gDummySelectionEndNode.parentNode.removeChild(gDummySelectionEndNode);
  }

  if (gDummySelectionStartNode) {
    if (gDummySelectionStartData)
      gDummySelectionStartNode.data = gDummySelectionStartData;
    else if (gDummySelectionStartNode.parentNode) // if not already removed....
      gDummySelectionStartNode.parentNode.removeChild(gDummySelectionStartNode);
  }

  var selection = EditorUtils.getCurrentEditor().selection;
  selection.collapse(gPreservedSelectionStartNode, gPreservedSelectionStartOffset);
  selection.extend(gPreservedSelectionEndNode, gPreservedSelectionEndOffset);
}

function MarkSelectionInAce(aSourceEditor)
{
  const kBGBGBG = "--BG--";

  aSourceEditor.setSelection( { line: 0, ch: 0 }, { line: 0, ch: 0 } );

  var searchCursor = aSourceEditor.getSearchCursor(kBGBGBG, { line: 0, ch: 0 }, true);
  searchCursor.findNext();
  var startRow    = searchCursor.from().line;
  var startColumn = searchCursor.from().ch;
  searchCursor.replace("");

  searchCursor = aSourceEditor.getSearchCursor(kBGBGBG, { line: 0, ch: 0 }, true);
  searchCursor.findNext();
  var endRow      = searchCursor.from().line;
  var endColumn   = searchCursor.from().ch;
  searchCursor.replace("");

  aSourceEditor.clearHistory();
  aSourceEditor.setSelection( { line: startRow, ch: startColumn }, { line: endRow, ch: endColumn } );
}

function FillAceThemesMenupopup()
{
  deleteAllChildren(gDialog.themesMenupopup);
  var aceIframe = EditorUtils.getCurrentSourceEditorElement();
  var currentTheme = aceIframe.contentWindow.wrappedJSObject.getCurrentTheme();
  for (var i = 0; i < kTHEMES.length; i++) {
    var s = document.createElement("menuitem");
    s.setAttribute("label", kTHEMES[i]);
    s.setAttribute("value", kTHEMES[i]);
    s.setAttribute("type", "checkbox");
    if (kTHEMES[i] == currentTheme)
      s.setAttribute("checked", "true");
    gDialog.themesMenupopup.appendChild(s);
  }
}

function UseAceTheme(aEvent)
{
  var theme = aEvent.originalTarget.getAttribute("value");
  var aceIframe = EditorUtils.getCurrentSourceEditorElement();
  aceIframe.contentWindow.wrappedJSObject.useTheme(theme);
}

#ifdef XP_MACOSX
function UpdateBadge()
{
  var n = 0;
  var dockIntegration = Services.prefs.getBoolPref("bluegriffon.osx.dock-integration");
  if (dockIntegration) {
    var windowEnumerator = Services.wm.getEnumerator("bluegriffon");
    while (windowEnumerator.hasMoreElements()) {
      var w = windowEnumerator.getNext();
      n += w.gDialog.tabeditor.getNumberOfModifiedDocuments();
    }
  }
  var baseWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                         .getInterface(Components.interfaces.nsIWebNavigation)
                         .QueryInterface(Components.interfaces.nsIBaseWindow);
  var badger = Components.classes["@mozilla.org/widget/macdocksupport;1"]
                 .getService(Components.interfaces.nsIMacDockSupport);
  if (n)
    badger.badgeText = n;
  else
    badger.badgeText = "";
}

function ResetBadge()
{
  var baseWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                         .getInterface(Components.interfaces.nsIWebNavigation)
                         .QueryInterface(Components.interfaces.nsIBaseWindow);
  var badger = Components.classes["@mozilla.org/widget/macdocksupport;1"]
                 .getService(Components.interfaces.nsIMacDockSupport);
  badger.badgeText = "";
}
#endif

function CreateOrUpdateTableOfContents()
{
  window.openDialog("chrome://bluegriffon/content/dialogs/insertTOC.xul","_blank",
                    "chrome,modal,titlebar");
}

function ShowUpdates()
{
  // copied from checkForUpdates in mozilla/browser/base/content/utilityOverlay.js
  var um =
    Components.classes["@mozilla.org/updates/update-manager;1"]
              .getService(Components.interfaces.nsIUpdateManager);
  var prompter =
    Components.classes["@mozilla.org/updates/update-prompt;1"]
              .createInstance(Components.interfaces.nsIUpdatePrompt);

  // If there's an update ready to be applied, show the "Update Downloaded"
  // UI instead and let the user know they have to restart the browser for
  // the changes to be applied.
  if (um.activeUpdate && um.activeUpdate.state == "pending")
    prompter.showUpdateDownloaded(um.activeUpdate);
  else
    prompter.checkForUpdates();
}

function CheckForUpdates(aPopup)
{
  // If there's an active update, substitute its name into the label
  // we show for this item, otherwise display a generic label.
  function getStringWithUpdateName(s, a, key) {
    if (a && a.name)
      return s.formatStringFromName(key, [a.name], 1);
    return s.formatStringFromName(key, ["..."], 1);
  }

  var item = aPopup.querySelector("#menu_updates");
  if (item) {
    // copied from buildHelpMenu in mozilla/browser/base/content/utilityOverlay.js
    var updates =
      Components.classes["@mozilla.org/updates/update-service;1"]
                .getService(Components.interfaces.nsIApplicationUpdateService);
    var um =
      Components.classes["@mozilla.org/updates/update-manager;1"]
                .getService(Components.interfaces.nsIUpdateManager);

    // Disable the UI if the update enabled pref has been locked by the
    // administrator or if we cannot update for some other reason
    var checkForUpdates = item;
    var canCheckForUpdates = updates.canCheckForUpdates;
    checkForUpdates.setAttribute("disabled", !canCheckForUpdates);
    if (!canCheckForUpdates)
      return;

    var strings =
      Services.strings
              .createBundle("chrome://bluegriffon/locale/updates.properties");
    var activeUpdate = um.activeUpdate;

    // By default, show "Check for Updates..."
    var key = "update.checkInsideButton";
    if (activeUpdate) {
      switch (activeUpdate.state) {
      case "downloading":
        // If we're downloading an update at present, show the text:
        // "Downloading Instantbird x.x..." otherwise we're paused, and show
        // "Resume Downloading Instantbird x.x..."
        key = updates.isDownloading ? "update.checkInsideButton" : "update.resumeButton";
        break;
      case "pending":
        // If we're waiting for the user to restart, show: "Apply Downloaded
        // Updates Now..."
        key = "update.restart.applyButton";
        break;
      }
    }
    checkForUpdates.label     = getStringWithUpdateName(key + ".label");
    checkForUpdates.accessKey = strings.GetStringFromName(key + ".accesskey");
    if (um.activeUpdate && updates.isDownloading)
      checkForUpdates.setAttribute("loading", "true");
    else
      checkForUpdates.removeAttribute("loading");
  }
}

function onFontColorChange()
{
  var commandNode = document.getElementById("cmd_bgFontColor");
  if (commandNode)
  {
    var color = commandNode.getAttribute("state");
    var button = document.getElementById("TextColorColorpicker");
    if (button)
    {
      // No color set - get color set on page or other defaults
      if (!color || color == "mixed")
        color = "transparent";
      button.color = color;
    }
  }
}

function RevertTab()
{
  var tab = document.popupNode;

  if (gDialog.tabeditor.selectedTab != tab) {
    // not the current tab, make sure to select it
    var index = 0;
    var child = tab;
    while (child.previousElementSibling) {
      index++;
      child = child.previousElementSibling;
    }
    gDialog.tabeditor.selectedIndex = index;
  }

  var rv = 0;
  if (EditorUtils.isDocumentModified()) {
    var promptService = Services.prompt;

    var title = EditorUtils.getDocumentTitle();
    if (!title)
      title = L10NUtils.getString("untitled");
  
    var msg = L10NUtils.getString("AbandonChanges").replace(/%title%/,title);
    rv = promptService.confirmEx(
               window,
               L10NUtils.getString("RevertCaption"),
               msg,
               (promptService.BUTTON_TITLE_REVERT * promptService.BUTTON_POS_0)
                 + (promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_1),
               null, null, null, null, {value:0});
  }

  if (rv == 0)
  {
    var url = EditorUtils.getDocumentUrl();
    var editorElt = EditorUtils.getCurrentEditorElement();

    editorElt.setAttribute("src", "about:blank");
    editorElt.setAttribute("src", url);
  }
}

function CloseOneTab()
{
  var tab = document.popupNode;

  if (gDialog.tabeditor.selectedTab != tab) {
    // not the current tab, make sure to select it
    var index = 0;
    var child = tab;
    while (child.previousElementSibling) {
      index++;
      child = child.previousElementSibling;
    }
    gDialog.tabeditor.selectedIndex = index;
  }

  cmdCloseTab.doCommand();
}

function CloseAllTabsButOne()
{
  var tab = document.popupNode;

  var child = tab.parentNode.firstElementChild;
  while (child) {
    var tmp = child.nextElementSibling;

    if (child != tab) {
      var index = 0;
      var child2 = child;
      while (child2.previousElementSibling) {
        index++;
        child2 = child2.previousElementSibling;
      }
      gDialog.tabeditor.selectedIndex = index;

      if (cmdCloseTab.doCommand() == 1)
        child = null;
      else
        child = tmp;
    }
    else
      child = tmp;
  }
}

#include phpAndComments.inc

function onTitlebarMaxClick() {
  if (window.windowState == window.STATE_MAXIMIZED)
    window.restore();
  else
    window.maximize();
}

function onViewToolbarsPopupShowing()
{
  var structurebar = Services.prefs.getBoolPref("bluegriffon.ui.structurebar.show");
  var statusbar = Services.prefs.getBoolPref("bluegriffon.ui.statusbar.show");
  var vertical_toolbar = Services.prefs.getBoolPref("bluegriffon.ui.vertical_toolbar.show");
  var horizontal_toolbars = Services.prefs.getBoolPref("bluegriffon.ui.horizontal_toolbars.show");

  gDialog.viewStructurebarMenuitem.setAttribute("checked", structurebar);
  gDialog.viewStatusbarMenuitem.setAttribute("checked", statusbar);
  gDialog.viewFormatToolbarMenuitem.setAttribute("checked", horizontal_toolbars);
  gDialog.viewFormatToolbar2Menuitem.setAttribute("checked", vertical_toolbar);
}

function ToggleToolbar(aPrefInfix)
{
  var prefName = "bluegriffon.ui." + aPrefInfix + ".show";
  var value = Services.prefs.getBoolPref(prefName);
  Services.prefs.setBoolPref(prefName, !value);
}

/***** COLOR BUTTONS (sigh...) *****/

function ApplyDirectTextColorChange(aColor)
{
    var editor = EditorUtils.getCurrentEditor();
    var isCSSEnabled = editor.isCSSEnabled;
    editor.isCSSEnabled = true;
    editor.setInlineProperty('font', 'color', aColor)
    editor.isCSSEnabled = isCSSEnabled;
}

function ApplyDirectBackgroundColorChange(aColor)
{
    var editor = EditorUtils.getCurrentEditor();
    var isCSSEnabled = editor.isCSSEnabled;
    editor.isCSSEnabled = true;
    editor.setBackgroundColor(aColor)
    editor.isCSSEnabled = isCSSEnabled;
}

