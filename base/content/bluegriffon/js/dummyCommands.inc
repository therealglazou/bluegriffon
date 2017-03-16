//-----------------------------------------------------------------------------------
var cmdDummyHTML =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // do nothing
  }

};

var cmdDummySource =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            (EditorUtils.getCurrentViewMode() == "source" ||
             EditorUtils.getCurrentViewMode() == "liveview"));
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // do nothing
  }

};

var cmdDummyAll =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive);
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // do nothing
  }

};

var cmdViewModeEnabler =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive &&
            gDialog.sourceModeButton.getAttribute("busy") != "true");
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    // do nothing
  }
};

var cmdMarkupCleaner =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    try {
      window.openDialog("chrome://bluegriffon/content/dialogs/markupCleaner.xul", "_blank",
              "chrome,close,titlebar,modal");
    }
    catch(ex) {}
    GetWindowContent().focus();
  }
};

var cmdGotoLinkCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode()) {
      var element = EditorUtils.getObjectForProperties(["a"], "href");
      if (element) {
        var url = UrlUtils.makeRelativeUrl(element.getAttribute("href"));
        if (url.length && url[0] == "#")
          return true;
      }
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["a"], "href");
    var target = UrlUtils.makeRelativeUrl(element.getAttribute("href"));
    if (target)
      target = target.substr(1);
    else
      return; // sanity check
    // first check ID...
    var doc = EditorUtils.getCurrentDocument();
    var targetElement = doc.getElementById(target) || doc.querySelector("a[name='" + target + "']");
    if (targetElement) {
      ScrollToElement(targetElement);
      EditorUtils.getCurrentEditor().selectElement(targetElement);
    }
  }
};

var cmdEditLinkCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    if (EditorUtils.getCurrentEditorElement() &&
        EditorUtils.isDocumentEditable() &&
        EditorUtils.isEditingRenderedHTML() &&
        EditorUtils.isWysiwygMode()) {
      var element = EditorUtils.getObjectForProperties(["a"], "href");
      if (element) {
        var url = UrlUtils.makeAbsoluteUrl(element.getAttribute("href"));
        try {
          var uri = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService(Components.interfaces.nsIIOService)
                              .newURI(url, null, null);
          if (uri.specIgnoringRef != EditorUtils.getDocumentUrl())
            return true;
        }
        catch(e) {}
      }
    }
    return false;
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = EditorUtils.getObjectForProperties(["a"], "href");
    var target = element.href;
    OpenFile(target, true);
  }
};

function GetSelectionContainerForNavigation()
{
  var s = EditorUtils.getCurrentEditor().selection;
  var r = s.getRangeAt(0);
  var sc = r.startContainer;
  if (s.isCollapsed ||
      (sc == s.getRangeAt(0).endContainer)) {
    if (sc.nodeType == Node.ELEMENT_NODE)
      return sc.childNodes.item(r.startOffset);
    return sc;
  }

  return s.getRangeAt(0).commonAncestorContainer;
}

var cmdStructureClimbCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var element = GetSelectionContainerForNavigation();
    var editor = EditorUtils.getCurrentEditor();
    if (element.parentNode && element.parentNode != element.ownerDocument.documentElement)
      editor.selectElement(element.parentNode)
  }

};

var cmdStructureFirstChildCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var s = EditorUtils.getCurrentEditor().selection;
    var element = GetSelectionContainerForNavigation();
    var editor = EditorUtils.getCurrentEditor();
    if (element && element.firstChild) {
      if (element.firstChild.nodeType == Node.ELEMENT_NODE)
        editor.selectElement(element.firstChild);
      else {
        var e = element.firstChild;
        while (e) {
          if (e.nodeType != Node.TEXT_NODE
              || e.data.match( /[^\s\r\n]/g )) {
            if (e.nodeType == Node.ELEMENT_NODE)
              editor.selectElement(e);
            else {
              s.removeAllRanges();
              var range = EditorUtils.getCurrentDocument().createRange();
              range.selectNode(e);
              s.addRange(range);
            }
            return;
          }
          e = e.nextSibling;
        }
      }
    }
   }

};

var cmdStructureNextCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var s = EditorUtils.getCurrentEditor().selection;
    var element = GetSelectionContainerForNavigation();
    var editor = EditorUtils.getCurrentEditor();
    if (element && element.nextSibling) {
      if (element.nextSibling.nodeType == Node.ELEMENT_NODE)
        editor.selectElement(element.nextSibling);
      else {
        s.removeAllRanges();
        var range = EditorUtils.getCurrentDocument().createRange();
        range.selectNode(element.nextSibling);
        s.addRange(range);
      }
    }
    else {
      // no next sibling, climb up until we find one
      var result = null;
      while (!result
             && element
             && element.parentNode != element.ownerDocument.documentElement) {
        if (element.nextSibling) {
          var e = element.nextSibling;
          while (e && !result) {
            if (e
                && (e.nodeType != Node.TEXT_NODE
                    || e.data.match( /[^\s\r\n]/g ))) {
              result = e;
            }

            e = e.nextSibling;
          }
        }

        element = element.parentNode;
      }

      if (result) {
        if (result.nodeType == Node.ELEMENT_NODE)
          editor.selectElement(result);
        else {
          s.removeAllRanges();
          var range = EditorUtils.getCurrentDocument().createRange();
          range.selectNode(result);
          s.addRange(range);
        }
      }
    }
   }

};

var cmdStructurePreviousCommand =
{
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    var s = EditorUtils.getCurrentEditor().selection;
    var element = GetSelectionContainerForNavigation();
    var editor = EditorUtils.getCurrentEditor();
    if (element && element.previousSibling) {
      if (element.previousSibling.nodeType == Node.ELEMENT_NODE)
        editor.selectElement(element.previousSibling);
      else {
        s.removeAllRanges();
        var range = EditorUtils.getCurrentDocument().createRange();
        range.selectNode(element.previousSibling);
        s.addRange(range);
      }
    }
    else {
      // no next sibling, climb up until we find one
      var result = null;
      while (!result
             && element
             && element.parentNode != element.ownerDocument.documentElement) {
        if (element.previousSibling) {
          var e = element.previousSibling;
          while (e && !result) {
            if (e
                && (e.nodeType != Node.TEXT_NODE
                    || e.data.match( /[^\s\r\n]/g ))) {
              result = e;
            }

            e = e.previousSibling;
          }
        }

        element = element.parentNode;
      }

      if (result) {
        if (result.nodeType == Node.ELEMENT_NODE)
          editor.selectElement(result);
        else {
          s.removeAllRanges();
          var range = EditorUtils.getCurrentDocument().createRange();
          range.selectNode(result);
          s.addRange(range);
        }
      }
    }
   }

};

var cmdCommentOrPICommand = {
  isCommandEnabled: function(aCommand, dummy)
  {
    return (EditorUtils.getCurrentEditorElement() &&
            EditorUtils.isDocumentEditable() &&
            EditorUtils.isEditingRenderedHTML() &&
            !EditorUtils.activeViewActive  &&
            EditorUtils.isWysiwygMode());
  },

  getCommandStateParams: function(aCommand, aParams, aRefCon) {},
  doCommandParams: function(aCommand, aParams, aRefCon) {},

  doCommand: function(aCommand)
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertCommentOrPI.xul", "_blank",
                      "chrome,close,titlebar,modal,resizable=yes", null);
  }
};

