// implements nsIObserver
var gEditorDocumentObserver =
{ 
  observe: function(aSubject, aTopic, aData)
  {
    // Should we allow this even if NOT the focused editor?
    var commandManager = EditorUtils.getCurrentCommandManager();
    if (commandManager != aSubject)
      return;

    var editor = EditorUtils.getCurrentEditor();
    gContentWindow = GetWindowContent();
    switch(aTopic)
    {
      case "obs_documentCreated":
        // placeholder; TBD

        // TBD : 1. DONE
        //       2. add override stylesheets if needed
        //       3. call "load" notifier callbacks
        //       4. update window title
        //       5. place initial selection
        //       6. check DTD strictness

        // Get state to see if document creation succeeded
        var params = EditorUtils.newCommandParams();
        if (!params)
          return;

        try {
          var spellChecker = new InlineSpellChecker(editor);
          var prefs = Services.prefs;
          var enabled = prefs.getBoolPref("bluegriffon.spellCheck.enabled");
          spellChecker.enabled = enabled;
          EditorUtils.getCurrentEditorElement().setUserData("spellchecker", spellChecker, null);
        }
        catch(e) { }

        try {
          commandManager.getCommandState(aTopic, gContentWindow, params);
          var errorStringId = 0;
          var editorStatus = params.getLongValue("state_data");
          if (!editor && editorStatus == nsIEditingSession.eEditorOK)
          {
            editorStatus = nsIEditingSession.eEditorErrorUnknown;
          }

          switch (editorStatus)
          {
            case nsIEditingSession.eEditorErrorCantEditFramesets:
              errorStringId = "CantEditFramesetMsg";
              break;
            case nsIEditingSession.eEditorErrorCantEditMimeType:
              errorStringId = "CantEditMimeTypeMsg";
              break;
            case nsIEditingSession.eEditorErrorUnknown:
              errorStringId = "CantEditDocumentMsg";
              break;
            // Note that for "eEditorErrorFileNotFound, 
            // network code popped up an alert dialog, so we don't need to
          }
          if (errorStringId)
            PromptUtils.alertWithTitle("", L10NUtils.getString(errorStringId));
        } catch(e) {  }

        // We have a bad editor -- nsIEditingSession will rebuild an editor
        //   with a blank page, so simply abort here
        if (editorStatus)
          return; 

        GetWindowContent().focus();
        
        NotifierUtils.notify("documentCreated");
        break;

      case "cmd_setDocumentModified":
        gDialog.tabeditor.showCurrentTabAsModified(EditorUtils.isDocumentModified());    // || IsHTMLSourceChanged());

#ifdef XP_MACOSX
        gDialog.tabeditor.updateOSXCloseButton();
        UpdateBadge();
#endif
        // TBD : 1. update web navigation commands
        //       2. DONE

        break;

      case "obs_documentWillBeDestroyed":
        // placeholder; TBD
        break;

      case "obs_documentLocationChanged":
        // TBD : 1. update base URL
        break;

      case "cmd_bold":
        // Update all style items
        // cmd_bold is a proxy; see EditorSharedStartup (above) for details
        window.updateCommands("style");
        // update the undo/redo items too
        window.updateCommands("undo");
        // and finally the main toolbar
        window.updateCommands("navigation");
        break;
    }
  }
}

var ResizeEventNotifier = {
  startup: function ResizeEventNotifier_startup()
  {
    var _self = this;
    window.addEventListener("resize", function(e) {_self.onResizeEvent(e); }, false);
    var tabeditor = EditorUtils.getCurrentTabEditor();
    if (tabeditor)
      tabeditor.addEventListener("resize", this.doNotify, false);
  },

  shutdown: function ResizeEventNotifier_shutdown()
  {
    var _self = this;
    window.removeEventListener("resize", function(e) {_self.onResizeEvent(e); }, false);
    var tabeditor = EditorUtils.getCurrentTabEditor();
    if (tabeditor)
      tabeditor.removeEventListener("resize", this.doNotify, false);
  },

  doNotify: function()
  {
    NotifierUtils.notify("resizeEvent");
  },

  onResizeEvent: function ResizeEventNotifier_onResizeEvent(aEvent)
  {
    if (aEvent.target.document.location.href == "chrome://bluegriffon/content/xul/bluegriffon.xul")
      this.doNotify();
  }
};

var EditorScrolledNotifier =  {
  startup: function EditorScrolledNotifier_startup()
  {
    var tabeditor = document.getElementById("tabeditor");
    tabeditor.addEventListener("scroll", this.onEditorScrolled, false);
  },

  shutdown: function EditorScrolledNotifier_shutdown()
  {
    var tabeditor = document.getElementById("tabeditor");
    tabeditor.removeEventListener("scroll", this.onEditorScrolled, false);
  },

  onEditorScrolled: function EditorScrolledNotifier_onEditorScrolled(aEvent)
  {
    NotifierUtils.notify("editorScrolled");
  }
};

var BlueGriffonPrefsObserver = {
  observe: function(subject, topic, prefName)
  {
    // verify that we're changing a button pref
    if (topic != "nsPref:changed")
      return;

    const kSTRUCTUREBAR_PREFS = "bluegriffon.structurebar";
    const kUI_PREFS           = "bluegriffon.ui";

    if (prefName == "bluegriffon.returnKey.createsParagraph") {
      var value = Services.prefs.getBoolPref("bluegriffon.returnKey.createsParagraph");
      var editors = gDialog.tabeditor.mTabpanels.childNodes;
      for (var i = 0; i < editors.length; i++) {
        try {
          var e = editors[i].firstChild;
          var innerEditor = e.getEditor(e.contentWindow);
          innerEditor.returnInParagraphCreatesNewParagraph = value;
        }
        catch(e) {}
      }
    }

    else if (prefName == "bluegriffon.spellCheck.enabled") {
      var value = Services.prefs.getBoolPref("bluegriffon.spellCheck.enabled");
      var editors = gDialog.tabeditor.mTabpanels.childNodes;
      for (var i = 0; i < editors.length; i++) {
        try {
          var e = editors[i].firstChild;
          var innerEditor = e.getEditor(e.contentWindow);
          innerEditor.setSpellcheckUserOverride(value);
        }
        catch(e) {}
      }
    }

    else if (prefName == "bluegriffon.toolbar.enabled") {
      var value = Services.prefs.getBoolPref("bluegriffon.toolbar.enabled");
      var mainToolbar = gDialog.MainToolbar;
      if (value)
        mainToolbar.removeAttribute("hidden");
      else
        mainToolbar.setAttribute("hidden", "true");
    }

    else if (prefName == "bluegriffon.toolbar.icons") {
      var value = Services.prefs.getCharPref("bluegriffon.toolbar.icons");
      document.documentElement.setAttribute("iconsize", value);
      document.persist(document.documentElement.id, "iconsize");
    }

    else if (prefName == "bluegriffon.tabs.position") {
      var value = Services.prefs.getCharPref("bluegriffon.tabs.position");
      gDialog.tabeditor.setAttribute("tabmode", value);
    }

    else if (prefName == "bluegriffon.wysiwyg.theme") {
      var value = Services.prefs.getCharPref("bluegriffon.wysiwyg.theme");
      var root = document.documentElement;
      if (value == "black" &&
          root.getAttribute("forcecleartheme") != "true")
        root.removeAttribute("cleartheme");
      else
        root.setAttribute("cleartheme", "true");
      if (root.id)
        document.persist(root.id, "cleartheme");

      ApplyWysiwygThemeChange(document, value);
    }

    else if (prefName == "bluegriffon.source.theme") {
      var value = Services.prefs.getCharPref("bluegriffon.source.theme");
      var tabeditor = gDialog.tabeditor;
      var panels = tabeditor.mTabpanels;
      var decks = panels.childNodes;
      for (var i = 0; i < decks.length; i++) {
        decks[i].lastElementChild.contentWindow.wrappedJSObject.useTheme(value);
      }
    }

    else if (prefName == "bluegriffon.osx.dock-integration") {
      var value = Services.prefs.getBoolPref("bluegriffon.osx.dock-integration");
      if (value)
        UpdateBadge();
      else
        ResetBadge();
    }

    else if (prefName.substr(0, kSTRUCTUREBAR_PREFS.length) == kSTRUCTUREBAR_PREFS
             && gDialog.structurebar.mLastNode)
      gDialog.structurebar.selectionChanged(
                null,
                gDialog.structurebar.mLastNode,
                gDialog.structurebar.mOneElementSelected);

    else if (prefName == "bluegriffon.display.comments"
             || prefName == "bluegriffon.display.php"
             || prefName == "bluegriffon.display.pi") {
      var valueArray = [];
      if (!Services.prefs.getBoolPref("bluegriffon.display.comments"))
        valueArray.push("comment");
      if (!Services.prefs.getBoolPref("bluegriffon.display.php"))
        valueArray.push("php");
      if (!Services.prefs.getBoolPref("bluegriffon.display.pi"))
        valueArray.push("pi");
      var value = valueArray.join(" ");

      var editors = gDialog.tabeditor.mTabpanels.childNodes;
      for (var i = 0; i < editors.length; i++) {
        try {
          var e = editors[i].firstChild;
          var innerEditor = e.getEditor(e.contentWindow);
          innerEditor.document.documentElement.setAttribute("_moz_hide", value);
        }
        catch(e) {}
      }
    }

    else if (prefName.substr(0, kUI_PREFS.length) == kUI_PREFS) {
      var xulElements = [];
      /*Services.prompt.alert(null, "foo",
        gDialog.structurebar + " "+ gDialog.statusbar + " " +
        gDialog.FormatToolbox + " "+ gDialog.MainToolbox + " " +
        gDialog.FormatMenulistsToolbox)*/
      switch (prefName) {
        case "bluegriffon.ui.structurebar.show":
          xulElements = [ gDialog.structurebar ];
          break
        case "bluegriffon.ui.statusbar.show":
          xulElements = [ gDialog.statusbar ];
          break;
        case "bluegriffon.ui.vertical_toolbar.show":
          xulElements = [ gDialog.FormatToolbox ];
          break;
        case "bluegriffon.ui.horizontal_toolbars.show":
          xulElements = [ gDialog.MainToolbox, gDialog.FormatMenulistsToolbox ];
          break;
        default: break;
      }
      var prefValue = Services.prefs.getBoolPref(prefName);
      for (var i = 0; i < xulElements.length; i++) {
        var elt = xulElements[i];
        if (elt == gDialog.MainToolbox) {
          // special case for the main toolbar otherwise modal dialogs (sheets)
          // appear at bottom of the window on OS X...
          if (prefValue)
            elt.removeAttribute("height");
          else
            elt.setAttribute("height", "1");
        }
        else if (prefValue)
          elt.removeAttribute("hidden");
        else
          elt.setAttribute("hidden", "true");
        document.persist(elt.id, "hidden");
        document.persist(elt.id, "height");
      }
    }

    else if (prefName == "bluegriffon.display.anchors") {
      var value = Services.prefs.getBoolPref("bluegriffon.display.anchors");
      var editors = gDialog.tabeditor.mTabpanels.childNodes;
      for (var i = 0; i < editors.length; i++) {
        try {
          var e = editors[i].firstChild;
          var innerEditor = e.getEditor(e.contentWindow);
          if (value)
            innerEditor.document.documentElement.setAttribute("_moz_showanchors", "true");
          else
            innerEditor.document.documentElement.removeAttribute("_moz_showanchors");
        }
        catch(e) {}
      }
    }
  }
};


const nsIDCW = Components.interfaces.nsIDOMChromeWindow;
var gLastWindowState = -1;

function onSizeModeChange()
{
  var badger = Components.classes["@disruptive-innovations.com/osintegration/badger;1"]
                         .createInstance(Components.interfaces.diIOSIntegration);
  var wm = Services.wm;
  var hidden = wm.getMostRecentWindow("hidden-main");
  var enumerator = wm.getEnumerator( "" );
  switch (window.windowState) {
    case nsIDCW.STATE_MINIMIZED:
      {
        // minified
        gLastWindowState = window.windowState;
        while ( enumerator.hasMoreElements() )
        {
          var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
          if (win.opener
              && win.document.documentElement.id != "Bluegriffon"
              && (win.opener == window || win.opener.document.documentElement.id == "hidden-window")) {
            var baseWindow = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                   .getInterface(Components.interfaces.nsIWebNavigation)
                                   .QueryInterface(Components.interfaces.nsIBaseWindow);
            badger.show(baseWindow, false);
          }
        }
      }
      break;
    default:
      if (gLastWindowState == nsIDCW.STATE_MINIMIZED) {
        // raised
        gLastWindowState = -1;
        while ( enumerator.hasMoreElements() )
        {
          var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
          if (win.opener
              && win.document.documentElement.id != "Bluegriffon"
              && (win.opener == window || win.opener.document.documentElement.id == "hidden-window")) {
            var baseWindow = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                   .getInterface(Components.interfaces.nsIWebNavigation)
                                   .QueryInterface(Components.interfaces.nsIBaseWindow);
            badger.show(baseWindow, true);
          }
        }
      }
      break;
  }
}

