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
 * The Original Code is Composer.
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

Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");

var gMain = null;
const disabledUI = ["ProjectPlusButton", "ProjectMinusButton", "ProjectConfigButton",
                    "scriptLists"];

var gIsPanelActive = true;

function Startup()
{
  GetUIElements();

  if (window.top &&
      "NotifierUtils" in window.top)
    gMain = window.top;
  else if (window.top && window.top.opener &&
           "NotifierUtils" in window.top.opener)
    gMain = window.top.opener;

  if (!gMain)
    return;

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
}

function Shutdown()
{
  gMain.NotifierUtils.removeNotifierCallback("tabClosed",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("tabCreated",
                                    Inspect,
                                    window);
  gMain.NotifierUtils.removeNotifierCallback("tabSelected",
		                                         Inspect,
		                                         window);
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

function RedrawAll(aNotification, aPanelId)
{
  if (aPanelId == "panel-scripteditor") {
    gIsPanelActive = true;
  }
}

function PanelClosed(aNotification, aPanelId)
{
  if (aPanelId == "panel-scripteditor")
    gIsPanelActive = false;
}

function Inspect()
{
  if (gMain.EditorUtils)
  {
    var editor = gMain.EditorUtils.getCurrentEditor();
    var visible = editor && (gMain.GetCurrentViewMode() == "wysiwyg");
    gDialog.mainBox.style.visibility = visible ? "" : "hidden";
    if (!visible) {
      return;
    }

    if (!editor || !editor.document)
      return;

    while (gDialog.scriptLists.firstChild)
      gDialog.scriptLists.removeChild(gDialog.scriptLists.lastChild);

    var scripts = editor.document.querySelectorAll("head > script");
    var l = scripts.length;

    for (var i = 0; i < l; i++)
    {
      var s = scripts[i];

      var item = document.createElement("listitem");
      item.setAttribute("scriptIndex", i);
      var hasSrc = s.hasAttribute("src");
      var url = s.src;
      if (!UrlUtils.isTextURI(url))
        url = UrlUtils.makeAbsoluteUrl(url);

      item.setAttribute("image", hasSrc ? "chrome://scripteditor/skin/web.png"
                                        : "chrome://scripteditor/skin/embedded.png");
      if (hasSrc && UrlUtils.newURI(s.src).scheme != "file") {
        item.setAttribute("style", "font-style: italic");
        item.setAttribute("label", s.getAttribute("src"));
        item.setAttribute("tooltiptext", "External script at " + s.getAttribute("src"));
      }
      else {
        var contents = hasSrc ? GetFileContents(url) : "";
        item.setAttribute("label", (hasSrc ? contents : s.textContent).substr(0, 60).replace( /\n/g, " ").trim());
        item.setAttribute("tooltiptext", hasSrc ? "External script at " + s.getAttribute("src") + "\n\n" + contents
                                                : s.textContent.trim());
      }


      item.setAttribute("class", "listitem-iconic " + (hasSrc ? "external" : "embedded"));
      item.setAttribute("crop",  hasSrc ? "center" : "end");
      item.setAttribute("scriptsrc", url);

      gDialog.scriptLists.appendChild(item);
    }
    gDialog.ProjectPlusButton.removeAttribute("disabled");
    gDialog.ProjectMinusButton.setAttribute("disabled", "true");
    gDialog.ProjectConfigButton.setAttribute("disabled", "true");
  }
}

function EnablePanel(aKeyword)
{
  for (var i = 0; i < disabledUI.length; i++)
  {
    gDialog[disabledUI[i]].removeAttribute("disabled");
  }

  if (gDialog.scriptLists.selectedIndex == -1)
  {
    gDialog.ProjectMinusButton.setAttribute("disabled", "true");
    gDialog.ProjectConfigButton.setAttribute("disabled", "true");
  }

  Inspect();
}

function DisablePanel(aKeyword)
{
  for (var i = 0; i < disabledUI.length; i++)
  {
    gDialog[disabledUI[i]].setAttribute("disabled", "true");
  }
}

function SelectScript()
{
  var item = gDialog.scriptLists.selectedItem;
  if (!item) return; // sanity check
  gDialog.ProjectMinusButton.removeAttribute("disabled");
  gDialog.ProjectConfigButton.removeAttribute("disabled");
}

function UpdateConfigMenu()
{
  var index = gDialog.scriptLists.selectedIndex;
  var item  =  gDialog.scriptLists.selectedItem;
  var classes = item.classList;
  gDialog.editScriptMenuitem.disabled  = !classes.contains("embedded");

  gDialog.moveUpMenuitem.disabled = (index == 0);
  gDialog.moveDownMenuitem.disabled = (index == gDialog.scriptLists.itemCount - 1);
}

function onDbleClick(aTarget)
{
  if (aTarget.nodeName != "listitem")
    return;
  var classes = aTarget.classList;
  var scriptSrc = aTarget.getAttribute("scriptsrc");
  if (classes.contains("embedded") || scriptSrc.substr(0, 8) == "file:///")
  {
    var scriptIndex = parseInt(aTarget.getAttribute("scriptIndex"));
    var editor = gMain.EditorUtils.getCurrentEditor();
    var scripts = editor.document.querySelectorAll("head > script");
    var s = scripts[scriptIndex];
    var source;
    if (classes.contains("embedded"))
      source = s.textContent;
    else
      source = GetFileContents(scriptSrc);
    var rv = {value: source, cancelled: false};
    window.openDialog("chrome://scripteditor/content/editor.xul","_blank",
                      "chrome,modal=yes,titlebar,resizable=yes,dialog=no", rv, scriptSrc);
    if (!rv.cancelled)
    {
      if (classes.contains("embedded"))
        s.textContent = rv.value;
      else
        SaveFileContents(scriptSrc, rv.value);
      Inspect();
    }
  }
}

function EditScript()
{
  var item  = gDialog.scriptLists.selectedItem;
  onDbleClick(item);
}

function DeleteScript()
{
	var captionStr = gDialog.bundle.getString("ConfirmDeletionTitle");
	var msgStr = gDialog.bundle.getString("ConfirmDeletion");
	var confirmed = PromptUtils.confirm(captionStr, msgStr);
  if (confirmed)
  {
    var item  =  gDialog.scriptLists.selectedItem;
    var scriptIndex = parseInt(item.getAttribute("scriptIndex"));
    var editor = gMain.EditorUtils.getCurrentEditor();
    var scripts = editor.document.querySelectorAll("head > script");
    var s = scripts[scriptIndex];
    editor.deleteNode(s);
    Inspect();
  }
}

function AddExternalScript()
{
  var result = {value:null};
  var captionStr = gDialog.bundle.getString("AddExternalScriptTitle");
  var msgStr = gDialog.bundle.getString("PromptScriptURL");
  var confirmed = PromptUtils.prompt(window, captionStr, msgStr, result, null, {value:0});
  if (confirmed)
  {
    var editor = gMain.EditorUtils.getCurrentEditor();
    var s = editor.createElementWithDefaults("script");
    s.setAttribute("type", "application/x-javascript");
    s.setAttribute("src",  result.value);
    gMain.EditorUtils.appendHeadElement(s);
    Inspect();
  }
}

function AddEmbeddedScript()
{
  var editor = gMain.EditorUtils.getCurrentEditor();
  var s = editor.createElementWithDefaults("script");
  s.setAttribute("type", "application/x-javascript");
  gMain.EditorUtils.appendHeadElement(s);
  Inspect();
  onDbleClick(gDialog.scriptLists.getItemAtIndex(gDialog.scriptLists.itemCount - 1));
}

function Move(aIncrement)
{
  var item  =  gDialog.scriptLists.selectedItem;
  var scriptIndex = parseInt(item.getAttribute("scriptIndex"));
  var editor = gMain.EditorUtils.getCurrentEditor();
  var scripts = editor.document.querySelectorAll("head > script");
  var s = scripts[scriptIndex];
  var newPosition = scripts[scriptIndex + aIncrement];
  var head = newPosition.parentNode;
  editor.beginTransaction();
  editor.deleteNode(s);
  var position = 0;
  while(newPosition.previousSibling)
  {
    newPosition = newPosition.previousSibling;
    position++;
  }
  editor.insertNode(s, head, position + (aIncrement > 0 ? 1 : 0));
  editor.endTransaction();

  Inspect();
  gDialog.scriptLists.selectedIndex = scriptIndex + aIncrement;
}

function GetFileContents(aSpec)
{
  var data = "";
  var file = UrlUtils.newLocalFile(aSpec);
  var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                createInstance(Components.interfaces.nsIFileInputStream);
  var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                createInstance(Components.interfaces.nsIConverterInputStream);
  fstream.init(file, -1, 0, 0);
  cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
  
  let (str = {}) {
    let read = 0;
    do { 
      read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
      data += str.value;
    } while (read != 0);
  }
  cstream.close(); // this closes fstream
  return data;
}

function SaveFileContents(aSpec, aSource)
{
  var file = UrlUtils.newLocalFile(aSpec);
  var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                 createInstance(Components.interfaces.nsIFileOutputStream);
  
  // use 0x02 | 0x10 to open file for appending.
  foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
  // write, create, truncate
  // In a c file operation, we have no need to set file mode with or operation,
  // directly using "r" or "w" usually.
  
  // if you are sure there will never ever be any non-ascii text in data you can 
  // also call foStream.writeData directly
  var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                  createInstance(Components.interfaces.nsIConverterOutputStream);
  converter.init(foStream, "UTF-8", 0, 0);
  converter.writeString(aSource);
  converter.close(); // this closes foStream
}
