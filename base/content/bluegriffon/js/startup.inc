
var gContentWindow = null;

function Startup()
{
  SetLocationDB();
  var url = null;
  // do we have a URL to open ?
  try {
    if (window.arguments && window.arguments[0]) {
      var cl = window.arguments[0];
      if (cl && cl instanceof Components.interfaces.nsIMutableArray) {
        url = cl.GetElementAt(0).QueryInterface(Components.interfaces.nsISupportsString).data;
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
      }
    }
    else if (window.arguments.length >= 2 &&
             window.arguments[1])
      url = window.arguments[1];
  }
  catch(e) { url = null; }

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

  // let's finish with the url
  if (url) {
    var ebmAvailable = ("EBookManager" in window);
    if (ebmAvailable && url.toLowerCase().endsWith(".epub")) {
      setTimeout(EBookManager.showEbook, 100, UrlUtils.newLocalFile(url), url);
    }
    else
      setTimeout(OpenFile, 100, url, true);
  }

  setTimeout(LoadLastTabs, 1000);
  BlueGriffonQuitHelper.init();

  NotifierUtils.addNotifierCallback("selection_strict", BlueGriffon_lookForFileChanges, this);
  NotifierUtils.addNotifierCallback("selection",        UpdateSourceLiveView, this);

  window.addEventListener("sizemodechange", onSizeModeChange, false);

  if ("ActiveViewManager" in window)
    ActiveViewManager.init();
}

var gLookingForFileChangesTimeout = null;

function BlueGriffon_lookForFileChanges() {
  if (gLookingForFileChangesTimeout)
    clearTimeout(gLookingForFileChangesTimeout);

  gLookingForFileChangesTimeout = setTimeout(function() { FileChangeUtils.lookForChanges(); }, 500);
}

var gLastTabsArray;
function LoadLastTabs()
{
  var lastTabs = "";
  gLastTabsArray = [];
  try {
    lastTabs = Services.prefs.getCharPref("bluegriffon.defaults.lastTabs");
    Services.prefs.setCharPref("bluegriffon.defaults.lastTabs", "");
  }
  catch(e) {}
  if (lastTabs) {
    gLastTabsArray = lastTabs.split("|");
    //gLastTabsArray.reverse();
    NotifierUtils.addNotifierCallback("tabCreated", OpenTabFromPreviousSession);
    var url = gLastTabsArray.pop();
    OpenFile(url, true);
  }
}

function OpenTabFromPreviousSession(aReason, aContext)
{
  if (gLastTabsArray.length) {
    var url = gLastTabsArray.pop();
    OpenFile(url, true);
  }
  else {
    NotifierUtils.removeNotifierCallback("tabCreated", OpenTabFromPreviousSession);
  }
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

    var statement = dbConn.createStatement("SELECT * from 'shortcuts'");

    while (statement.executeStep()) {
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
