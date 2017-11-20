
var gContentWindow = null;
var gURLArray = [];
var gBoundDelayedStartup = null;

function Startup()
{
  SetLocationDB();
  // do we have a URL to open ?
  try {
    if (window.arguments && window.arguments[0]) {
      var cl = window.arguments[0];
      if (cl && cl instanceof Components.interfaces.nsIMutableArray) {
        for (var i = 0; i < cl.Count(); i++) {
          var url = cl.GetElementAt(i).QueryInterface(Components.interfaces.nsISupportsString).data;
          var localFile = UrlUtils.newLocalFile(url);
          if (localFile) { // if localFile is null, then consider it's a remote URL
            var ioService =
              Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
            var fileHandler =
              ioService.getProtocolHandler("file")
                      .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
            url = fileHandler.getURLSpecFromFile(localFile);
          }
          gURLArray.push(url);
        }
      }
    }
    else if (window.arguments.length >= 2 &&
             window.arguments[1])
      gURLArray = [ window.arguments[1] ];
  }
  catch(e) { gURLArray = []; }

  GetUIElements();

  ComposerCommands.setupMainCommands();
  window.updateCommands("style");
  RestoreShortcuts();
  RestorePanels();

  InitializeARIARoleDropdown(gDialog.ARIARolePopup);
  InitializeARIARoleDropdown(gDialog.ARIARoleStructureBarPopup);

  gDialog.structurebar.init();

  ResizeEventNotifier.startup();
  EditorScrolledNotifier.startup();
  BGZoomManager.startup();
  BGUpdateManager.generateAppId();
  BGUpdateManager.check(false);
  
  initLocalFontFaceMenu(gDialog.FontFacePopup);

  try {
    var pbi = Services.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    pbi.addObserver("bluegriffon.", BlueGriffonPrefsObserver, false);
  } catch(ex) {
  }

  BlueGriffonQuitHelper.init();

  NotifierUtils.addNotifierCallback("selection_strict", BlueGriffon_lookForFileChanges, this);
  NotifierUtils.addNotifierCallback("selection",        UpdateSourceLiveView, this);

  window.addEventListener("sizemodechange", onSizeModeChange, false);

  if ("ActiveViewManager" in window)
    ActiveViewManager.init();

  ShowReleaseNotes();

  // Wait until chrome is painted before executing code not critical to making the window visible
  gBoundDelayedStartup = _delayedStartup.bind(window);
  window.addEventListener("MozAfterPaint", gBoundDelayedStartup);
}

function _cancelDelayedStartup() {
  window.removeEventListener("MozAfterPaint", gBoundDelayedStartup);
  gBoundDelayedStartup = null;
}

function _delayedStartup() {
  _cancelDelayedStartup();
  // let's finish with the url
  try {
    for (var i = 0; i < gURLArray.length; i++) {
      var url = gURLArray[i];
      if (url) {
        var ebmAvailable = ("EBookManager" in window);
        if (ebmAvailable && url.toLowerCase().endsWith(".epub")) {
          EBookManager.showEbook(UrlUtils.newLocalFile(url), url);
        }
        else {
          OpenFile(url, true);
        }
      }
    }
  }
  catch(e) {}
}

var gLookingForFileChangesTimeout = null;

function BlueGriffon_lookForFileChanges() {
  if (gLookingForFileChangesTimeout)
    clearTimeout(gLookingForFileChangesTimeout);

  gLookingForFileChangesTimeout = setTimeout(function() { FileChangeUtils.lookForChanges(); }, 500);
}

function RestoreShortcuts()
{
  try {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("shortcuts.sqlite");
    
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                            .getService(Components.interfaces.mozIStorageService);
    var dbConn = storageService.openDatabase(file);

    // no table, no chocolate
    if (!dbConn.tableExists("shortcuts"))
      return;

    // remove all existing shortcuts...
    var elts = document.querySelectorAll("#composer-main-menubar *[key], toolbar *[key]");
    for (var i = 0; i < elts.length; i++) {
      var elt = elts[i];
      var keyId = elt.getAttribute("key");
      elt.removeAttribute("key");
      var keyElt = document.getElementById(keyId);
      if (keyElt) { //sanity check
        var keyset = keyElt.parentNode;
        keyset.removeChild(keyElt);
       }
    }

    // get all shortcuts, pre-defined or user-defined
    var statement = dbConn.createStatement("SELECT * from 'shortcuts'");
    var stepExecuted = false;

    // for each entry in the shortcuts db
    while (statement.executeStep()) {
      stepExecuted = true;
      var selector = statement.getUTF8String(1);
      var modifiers = statement.getUTF8String(2);
      var key = statement.getUTF8String(3);

      var elt = document.querySelector(selector);
      // recreate a key
      var keyset = document.getElementById("mainKeySet");
      keyElt = document.createElement("key");
      keyElt.setAttribute("modifiers", modifiers);
      if (key.length == 1)
        keyElt.setAttribute("key", key);
      else
        keyElt.setAttribute("keycode", key);
      if (elt.hasAttribute("command"))
        keyElt.setAttribute("command", elt.getAttribute("command"));
      if (elt.hasAttribute("oncommand"))
        keyElt.setAttribute("oncommand", elt.getAttribute("oncommand"));
      if (!elt.hasAttribute("command") && !elt.hasAttribute("oncommand")) {
        var cmdStr = 'var e = document.createEvent("Events"); e.initEvent("command", true, true); document.querySelector("'
                     + selector
                     +'").dispatchEvent(e);';
        keyElt.setAttribute("oncommand", cmdStr);
      }

      var keyId =  "key-" + modifiers.replace( /,/g , "-") + key;
      keyElt.setAttribute("id", keyId);
      keyset.appendChild(keyElt);
      elt.setAttribute("key", keyId);

      var parent = keyset.parentNode;
      var nextSibling = parent.nextSibling;
      parent.removeChild(keyset);
      parent.insertBefore(keyset, nextSibling);
    }
    dbConn.close();

    // Wait !!!! Did we execute any step here? If we didn't, indicating there is not a
    // a single shortcut in BlueGriffon, it's most probably because of the shortcuts bug
    // in 2.4.x...
    if (!stepExecuted) {
      var fixForShortcutsBug = Services.prefs.getBoolPref("bluegriffon.kungfudeathgrip.shortcuts2017");
      if (!fixForShortcutsBug) {
        // There Can Be Only One
        Services.prefs.setBoolPref("bluegriffon.kungfudeathgrip.shortcuts2017", true);
        // we need to delete the erroneously empty shortcuts.sqlite file
        file.remove(false);
        // and then restart :-(
        var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                         .getService(Components.interfaces.nsIAppStartup);

        appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                        Components.interfaces.nsIAppStartup.eAttemptQuit);
      }
    }
  }
  catch(e) {
    // no shortcut DB yet, do nothing
  }
}

function RestorePanels()
{
  var items = document.querySelectorAll("#panelsMenuPopup > menuitem[panel]");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var panelid = item.getAttribute("panel");
    var panel = document.getElementById(panelid);
    //var s = ""; for (var k = 0; k < item.attributes.length; k++) s+= item.attributes.item(k).nodeName + "=" + item.attributes.item(k).nodeValue + "\n"; alert(s);
    if (item.getAttribute("checked") == "true") {
      if (panel) {
        if (item.getAttribute("decked") == "true") {
          gDialog.deckedPanelsTabs.addPanel(item.getAttribute("label"),
                                            item.getAttribute("url"),
                                            panelid);
        }
        else {
          panel.firstElementChild.setAttribute("src", item.getAttribute("url"));
        }
  	  }
  	  else { // linux case :(
        if (item.getAttribute("decked") == "true") {
          gDialog.deckedPanelsTabs.addPanel(item.getAttribute("label"),
                                            item.getAttribute("url"),
                                            panelid);
        }
        else {
          window.open(item.getAttribute("url"),"_blank",
                     "chrome,resizable,scrollbars=yes");
        }
      }
    }
  }
}

function ShowReleaseNotes(aForce)
{
  const kRELEASE_NOTES_PREF = "bluegriffon.release_notes.last";

  var gApp = Services.appinfo;
  var appVersion = gApp.version;
  var lastReleaseNotes = Services.prefs.getCharPref(kRELEASE_NOTES_PREF);

  if (aForce || Services.vc.compare(lastReleaseNotes, appVersion) < 0) {
    if (!aForce) {
      Services.prefs.setCharPref(kRELEASE_NOTES_PREF, appVersion);
    }

    var _window = window;
    setTimeout(_window.openDialog, aForce ? 0 : 1000,
               "chrome://bluegriffon/content/dialogs/releaseNotes.xul", "_blank",
               "chrome,modal,titlebar,resizable=yes,dialog=no");
  }
}
