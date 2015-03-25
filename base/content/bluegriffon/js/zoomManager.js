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

Components.utils.import("resource://gre/modules/Services.jsm");

var BGZoomManager = {

  kZOOM_VALUES:  "toolkit.zoomManager.zoomValues",
  kDEFAULT_ZOOM: "bluegriffon.zoom.default",

  zoomValues: function BGZoomManager_zoomValues()
  {
    var values;
    try {
      values = Services.prefs.getCharPref(this.kZOOM_VALUES);
    }
    catch(e) {
      values = ".5,.75,1,1.25,1.5,2,3";
    }
    return values.split(",").map(parseFloat);
  },

  getMarkupDocumentViewer: function BGZoomManager_getMarkupDocumentViewer()
  {
    return EditorUtils.getCurrentEditorElement()
             .docShell.contentViewer
             .QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
  },

  getCurrentZoom: function BGZoomManager_getCurrentZoom()
  {
    return this.getMarkupDocumentViewer().fullZoom;
  },

  setCurrentZoom: function BGZoomManager_setCurrentZoom(aZoom)
  {
    this.getMarkupDocumentViewer().fullZoom = aZoom;
  },

  fillZoomValues: function BGZoomManager_fillZoomValues(aPopup)
  {
    var valueArray = this.zoomValues();

    var menulist = aPopup.parentNode;
    var child = aPopup.lastChild;
    while (child)
    {
      var tmp = child.previousSibling;
      aPopup.removeChild(child);
      child = tmp;
    }

    var ratio = this.getCurrentZoom();
    menulist.setAttribute("value", ratio*100 +"%");

    for (var i = 0; i < valueArray.length; i++)
    {
      var value = Math.floor(valueArray[i] * 100);
      var item = document.createElement("menuitem");
      item.setAttribute("label", value + "%");
      item.setAttribute("value", value);
      aPopup.appendChild(item);
    }
  },

  applyZoomValue: function BGZoomManager_applyZoomValue(aMenulist)
  {
    if (aMenulist.selectedItem && aMenulist.selectedItem.value)
    {
      this.setCurrentZoom(parseInt(aMenulist.selectedItem.value) / 100);
      EditorUtils.getCurrentEditorElement().contentWindow.focus();
    }
    else
      aMenulist.value = this.getCurrentZoom() * 100 + "%";
  },

  addToSourceViewFontSize: function(aIncrement) {
    var editorElement = EditorUtils.getCurrentEditorElement();
    var sourceIframe = editorElement.previousSibling;
    var sourceEditor = sourceIframe.contentWindow.getEditableElement();

    var fontSize = sourceEditor.ownerDocument
                               .defaultView
                               .getComputedStyle(sourceEditor, "")
                               .getPropertyCSSValue("font-size")
                               .getFloatValue(CSSPrimitiveValue.CSS_PX)
    fontSize = Math.max(fontSize + aIncrement, 6);
    sourceEditor.style.fontSize = fontSize + "px";
  },

  enlarge: function BGZoomManager_enlarge(aMenulist)
  {
    if (GetCurrentViewMode() == "source") {
      this.addToSourceViewFontSize(+1);
      return;
    }
    var zoomValues = this.zoomValues();
    var currentZoom = Math.round(this.getCurrentZoom() * 100) / 100;
    var i = zoomValues.indexOf(currentZoom);
    if (i >= 0 && i < zoomValues.length - 1)
    {
      var value = zoomValues[i+1];
      this.setCurrentZoom(value);
      aMenulist.value = Math.round(value * 100) + "%";
    }
    else if (i == -1)
      for (var index = 0; index < zoomValues.length; index++)
        if (zoomValues[index] > currentZoom)
        {
          var value = zoomValues[index];
          this.setCurrentZoom(value);
          aMenulist.value = Math.round(value * 100) + "%";
          return;
        }
  },

  reduce: function BGZoomManager_reduce(aMenulist)
  {
    if (GetCurrentViewMode() == "source") {
      this.addToSourceViewFontSize(-1);
      return;
    }
    var zoomValues = this.zoomValues();
    var currentZoom = Math.round(this.getCurrentZoom() * 100) / 100;
    var i = zoomValues.indexOf(currentZoom);
    if (i > 0)
    {
      var value = zoomValues[i-1];
      this.setCurrentZoom(value);
      aMenulist.value = Math.round(value * 100) + "%";
    }
    else if (i == -1)
      for (var index = 0; index < zoomValues.length; index++)
        if (zoomValues[index] < currentZoom &&
            zoomValues[index+1] > currentZoom)
        {
          var value = zoomValues[index];
          this.setCurrentZoom(value);
          aMenulist.value = Math.round(value * 100) + "%";
          return;
        }
  },

  onKeyUp: function onKeyUp(aEvent, aMenulist)
  {
    if (aEvent.keyCode != 13)
      return;
    var value = parseInt(aMenulist.value);
    if (value)
    {
      this.setCurrentZoom(value / 100);
    }
    else
    {
      value = Math.floor(this.getCurrentZoom() * 100);
    }
    aMenulist.value = value + "%";
    EditorUtils.getCurrentEditorElement().contentWindow.focus();
  },

  startup: function BGZoomManager_startup()
  {
    var _self = this;
    NotifierUtils.addNotifierCallback("tabSelected",
      function() { _self.onTabSelected(); }, this);
    NotifierUtils.addNotifierCallback("tabCreated",
      function() { _self.onTabCreated(); }, this);
  },

  shutdown: function BGZoomManager_shutdown()
  {
    var _self = this;
    NotifierUtils.removeNotifierCallback("tabSelected",
      function() { _self.onTabSelected(); }, this);
    NotifierUtils.removeNotifierCallback("tabCreated",
      function() { _self.onTabCreated(); }, this);
  },

  onTabSelected: function BGZoomManager_onTabSelect()
  {
    var zoom = this.getCurrentZoom();
    gDialog["menulist-zoompanel"].value = Math.floor(zoom * 100) + "%"; 
  },

  onTabCreated: function BGZoomManager_onTabSelect()
  {
    var defaultZoom;
    try {
      defaultZoom = parseFloat(Services.prefs.getCharPref(this.kDEFAULT_ZOOM));
    }
    catch(e)
    {
      defaultZoom = 1;
    }
    this.setCurrentZoom(defaultZoom);
    gDialog["menulist-zoompanel"].value = Math.floor(defaultZoom * 100) + "%"; 
  }
};

