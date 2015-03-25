Components.utils.import("resource://gre/modules/Services.jsm");

const nsIInterfaceRequestor  = Components.interfaces.nsIInterfaceRequestor;
const nsIWebNavigation       = Components.interfaces.nsIWebNavigation;
const nsIDocShellTreeItem    = Components.interfaces.nsIDocShellTreeItem;
const nsIDOMWindow           = Components.interfaces.nsIDOMWindow;

var bgWindow = null;

function OnShortcutsPaneLoad()
{
  GetUIElements();
  bgWindow = Services.wm.getMostRecentWindow("bluegriffon");

  if (bgWindow) {
    gDialog.commandsShortcutsTree.disabled = false;
    GetMenuItems(gDialog.menubarShortcutsTreechildren,
                 bgWindow.gDialog["composer-main-menubar"],
                 "#composer-main-menubar");
    var toolbars = bgWindow.document.querySelectorAll("toolbar");
    for (var i = 0; i < toolbars.length; i++) {
      var toolbar = toolbars[i];
      if (toolbar.id)
        GetToolbarItems(gDialog.toolbarsShortcutsTreechildren,
                        toolbar,
                        "#" + toolbar.id);
      else
        GetToolbarItems(gDialog.toolbarsShortcutsTreechildren,
                        toolbar,
                        "toolbar:nth-of-type(" + (i+1) + ")");
    }
  }
  else { // certainly only on Mac...
    Services.prompt.alert(null, gDialog.shortcutsBundle.getString("NoMainWindowAvaialble"),
                                gDialog.shortcutsBundle.getString("PleaseOpenOneMainWindow"));
    gDialog.commandsShortcutsTree.disabled = true;
  }
}

function GetToolbarItems(aTreechildren, aElt, aSelector)
{
  var child = aElt.firstChild;
  var index = 1;
  while (child) {
    switch (child.nodeName.toLowerCase()) {
      case "toolbaritem":
      case "menupopup":
         if (child.id)
            GetToolbarItems(aTreechildren, child, "#" + child.id);
          else
            GetToolbarItems(aTreechildren, child, aSelector + "> :nth-child(" + index + ")");
          break;
      case "menulist":
        {
          var item     = document.createElement("treeitem");
          var row      = document.createElement("treerow");
          var cell     = document.createElement("treecell");
          var children = document.createElement("treechildren");
          item.setAttribute("container", "true");
          cell.setAttribute("label", child.getAttribute("tooltiptext"));
          row.appendChild(cell);
          item.appendChild(row);
          item.appendChild(children);
          aTreechildren.appendChild(item);
          if (child.id)
            GetToolbarItems(children, child, "#" + child.id);
          else
            GetToolbarItems(children, child, aSelector + "> :nth-child(" + index + ")");
        }
        break;
      case "menuitem":
      case "toolbarbutton":
        {
          var label = "";
          if (child.hasAttribute("label"))
            label = child.getAttribute("label");
          else if (child.hasAttribute("command")) {
            var cmdElt = bgWindow.document.getElementById(child.getAttribute("command"));
            if (cmdElt && cmdElt.hasAttribute("label"))
              label = cmdElt.getAttribute("label");
          }
          if (!label && child.hasAttribute("tooltiptext"))
            label = child.getAttribute("tooltiptext")

          // wait, wait, wait, we have the case of a toolbarbutton type="menu" thing... sigh
          if (child.nodeName.toLowerCase() == "toolbarbutton"
              && (child.getAttribute("type") == "menu"
                  || child.getAttribute("type") == "menu-button")) {
          var item     = document.createElement("treeitem");
          var row      = document.createElement("treerow");
          var cell     = document.createElement("treecell");
          var children = document.createElement("treechildren");
          item.setAttribute("container", "true");
          cell.setAttribute("label", label);
          row.appendChild(cell);
          item.appendChild(row);
          item.appendChild(children);
          aTreechildren.appendChild(item);
          if (child.id)
            GetToolbarItems(children, child, "#" + child.id);
          else
            GetToolbarItems(children, child, aSelector + "> :nth-child(" + index + ")");
            break;
          }

          if (true) { // here, we must keep everything
            var item     = document.createElement("treeitem");
            var row      = document.createElement("treerow");
            var cell     = document.createElement("treecell");
            cell.setAttribute("label", label);
            row.appendChild(cell);
            if (child.hasAttribute("key")) {
              var keyElt = bgWindow.document.getElementById(child.getAttribute("key"));
              if (keyElt) {
                var cell2 = document.createElement("treecell");
                var modifiers = keyElt.getAttribute("modifiers");
                var modifiersArray = modifiers.split(",");
                var keyString = (keyElt.hasAttribute("keycode")
                                 ? keyElt.getAttribute("keycode").replace( /VK_/ , "")
                                 : keyElt.getAttribute("key")).toUpperCase();
                var str = GetModifiersStringFromModifiersArray(modifiersArray);
                cell2.setAttribute("label", str + keyString);
                item.setAttribute("shortcut", str + keyString);
                item.setAttribute("modifiers", modifiers);
                item.setAttribute("kbdkey", keyString);
                item.setAttribute("toolbaritem", "true");
                row.appendChild(cell2);
              }
            }
            item.appendChild(row);
            aTreechildren.appendChild(item);
            if (child.id)
              item.setAttribute("selector", "#" + child.id);
            else
              item.setAttribute("selector", aSelector + "> :nth-child(" + index + ")");
          }
        }
        break;
      default: break;
    }
    child = child.nextElementSibling;
    index++;
  }
}

function GetMenuItems(aTreechildren, aElt, aSelector)
{
  var child = aElt.firstChild;
  var index = 1;
  while (child) {
    switch (child.nodeName.toLowerCase()) {
      case "menu":
        {
          var item     = document.createElement("treeitem");
          var row      = document.createElement("treerow");
          var cell     = document.createElement("treecell");
          var children = document.createElement("treechildren");
          item.setAttribute("container", "true");
          cell.setAttribute("label", child.getAttribute("label"));
          row.appendChild(cell);
          item.appendChild(row);
          item.appendChild(children);
          aTreechildren.appendChild(item);
          if (child.id)
            GetMenuItems(children, child, "#" + child.id);
          else
            GetMenuItems(children, child, aSelector + "> :nth-child(" + index + ")");
        }
        break;
      case "menupopup":
        if (child.id)
          GetMenuItems(aTreechildren, child, "#" + child.id);
        else
          GetMenuItems(aTreechildren, child, aSelector + "> :nth-child(" + index + ")");
        break;
      case "menuitem":
        {
          var label = "";
          if (child.hasAttribute("label"))
            label = child.getAttribute("label");
          else if (child.hasAttribute("command")) {
            var cmdElt = bgWindow.document.getElementById(child.getAttribute("command"));
            if (cmdElt && cmdElt.hasAttribute("label"))
              label = cmdElt.getAttribute("label");
          }
          if (label) {
            var item     = document.createElement("treeitem");
            var row      = document.createElement("treerow");
            var cell     = document.createElement("treecell");
            cell.setAttribute("label", label);
            row.appendChild(cell);
            if (child.hasAttribute("key")) {
              var keyElt = bgWindow.document.getElementById(child.getAttribute("key"));
              if (keyElt) {
                var cell2 = document.createElement("treecell");
                var modifiers = keyElt.getAttribute("modifiers");
                var modifiersArray = modifiers.split(",");
                var keyString = (keyElt.hasAttribute("keycode")
                                 ? keyElt.getAttribute("keycode").replace( /VK_/ , "")
                                 : keyElt.getAttribute("key")).toUpperCase();
                var str = GetModifiersStringFromModifiersArray(modifiersArray);
                cell2.setAttribute("label", str + keyString);
                item.setAttribute("shortcut", str + keyString);
                item.setAttribute("modifiers", modifiers);
                item.setAttribute("kbdkey", keyString);
                row.appendChild(cell2);
              }
            }
            item.appendChild(row);
            aTreechildren.appendChild(item);
            if (child.id)
              item.setAttribute("selector", "#" + child.id);
            else
              item.setAttribute("selector", aSelector + "> :nth-child(" + index + ")");
            break;
          }
        }
        break;
      default: break;
    }

    child = child.nextElementSibling;
    index++;
  }
}

function GetModifiersStringFromModifiersArray(modifiersArray)
{
  var str = "";
  if (modifiersArray.indexOf("shift") != -1)
#ifdef XP_MACOSX
    str += "⇧";
#else
    str += "shift-";
#endif

  if (modifiersArray.indexOf("control") != -1)
#ifdef XP_MACOSX
    str += "⌃";
#else
    str += "ctrl-";
#endif

  if (modifiersArray.indexOf("alt") != -1)
#ifdef XP_MACOSX
    str += "⌥";
#else
    str += "alt";
#endif
  if (modifiersArray.indexOf("meta") != -1)
#ifdef XP_UNIX
#ifdef XP_MACOSX
    str += "⌘";
#else
    str += "meta-";
#endif
#else
    str += "windows-"
#endif
  if (modifiersArray.indexOf("accel") != -1)
#ifdef XP_MACOSX
    str += "⌘";
#else
    str += "ctrl-";
#endif

  return str;
}

function EditShortCut()
{
  var tree = gDialog.commandsShortcutsTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    return;
  }

  var index = view.selection.currentIndex;
  var item = contentView.getItemAtIndex(index);
  if (item.hasAttribute("container"))
    return;

  var selector    = item.getAttribute("selector");
  var modifiers   = item.getAttribute("modifiers");
  var kbdkey      = item.getAttribute("kbdkey");
  var shortcut    = item.getAttribute("shortcut");
  var rv         = {};
  window.openDialog("chrome://bluegriffon/content/prefs/editShortcut.xul",
                    "_blank",
                    "chrome,modal,titlebar,resizable=no",
                    item.firstChild.firstChild.getAttribute("label"),
                    selector, modifiers, kbdkey, shortcut, rv);
  if (rv && ("cancelled" in rv))
    return;

  if (rv && ("deleted" in rv)) {
    DeleteShortCut(item);
    return;
  }

  AddShortCut(item, rv);
}

function _DeleteShortCut(aItem)
{
  aItem.removeAttribute("shortcut");
  aItem.removeAttribute("modifiers");
  aItem.removeAttribute("kbdkey");
  aItem.firstChild.removeChild(aItem.firstChild.lastChild);

  var selector = aItem.getAttribute("selector");
  var ee = Services.wm.getEnumerator("bluegriffon");
  while (ee.hasMoreElements()) {
    var w = ee.getNext();
    var navNav = w.QueryInterface(nsIInterfaceRequestor)
                   .getInterface(nsIWebNavigation);
    var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
    var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                          .getInterface(nsIDOMWindow);
    var elt = rootWin.document.querySelector(selector);
    if (elt) { // sanity check
      var keyId = elt.getAttribute("key");
      if (keyId) {
        try {
          var keyElt = rootWin.document.getElementById(keyId)
          if (keyElt) {
            elt.setAttribute("key", "");
            elt.removeAttribute("key");
            var keyset = keyElt.parentNode;
            keyElt.parentNode.removeChild(keyElt);

            // need to reinstall the keyset...
            var parent = keyset.parentNode;
            var nextSibling = parent.nextSibling;
            parent.removeChild(keyset);
            parent.insertBefore(keyset, nextSibling);
          }
        }
        catch(e) {}
      }
    }
  }
}

function DeleteShortCut(aItem)
{
  _DeleteShortCut(aItem);
  StoreAllShortcuts();
}

function AddShortCut(aItem, aRv)
{
  // modify the tree in the prefs window

  var mArray = [];
  if (aRv.shiftKey) mArray.push("shift");
  if (aRv.altKey)   mArray.push("alt");
  if (aRv.ctrlKey)  mArray.push("control");
  if (aRv.metaKey)  mArray.push("meta");
  aItem.setAttribute("modifiers", mArray.length ? mArray.join(",") : "");

  aItem.setAttribute("kbdkey", aRv.key);

  // check if shortcut is already used...
  var conflictItems = document.querySelectorAll("treeitem[kbdkey='" + aRv.key +"']");
  for (var i = 0; i < conflictItems.length; i++) {
    var ci = conflictItems[i];
    if (ci != aItem) {
      var m = ci.getAttribute("modifiers").toLowerCase()
#ifdef XP_MACOSX
                .replace( /accel/ , "meta")
#else
                .replace( /accel/ , "control")
#endif
                .split(",");
      if (m.sort().toSource() == mArray.sort().toSource()) {
        // something to remove guys...
        var selector = ci.getAttribute("selector");
        _DeleteShortCut(ci);
      }
    }
  }

  if (aItem.getAttribute("shortcut")) { // already has a key mapping
    aItem.firstChild.lastChild.setAttribute("label", aRv.shortcut);
    // now modify the menu item itself
    // don't forget the menu item already has a key attached
    var selector = aItem.getAttribute("selector");
    var ee = Services.wm.getEnumerator("bluegriffon");
    while (ee.hasMoreElements()) {
      var w = ee.getNext();
      var navNav = w.QueryInterface(nsIInterfaceRequestor)
                     .getInterface(nsIWebNavigation);
      var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
      var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                            .getInterface(nsIDOMWindow);
      var elt = rootWin.document.querySelector(selector);
      if (elt) { // sanity check
        var keyId = elt.getAttribute("key");
        if (keyId) {
          try {
            var keyElt = rootWin.document.getElementById(keyId)
            if (keyElt) {
              elt.removeAttribute("key");

              keyElt.setAttribute("modifiers", aItem.getAttribute("modifiers"));
              keyElt.removeAttribute("key");
              keyElt.removeAttribute("keycode");
              if (aRv.key.length == 1)
                keyElt.setAttribute("key", aRv.key);
              else
                keyElt.setAttribute("keycode", aRv.key);

              var parent = keyElt.parentNode;
              var nextSibling = parent.nextSibling;
              parent.parentNode.removeChild(parent);
              nextSibling.parentNode.insertBefore(parent, nextSibling);
              elt.setAttribute("key", keyId);
            }
          }
          catch(e) {}
        }
      }
    }
  }
  else {
    var cell = document.createElement("treecell");
    cell.setAttribute("label", aRv.shortcut);
    aItem.firstChild.appendChild(cell);
    // no key mapping yet
    var selector = aItem.getAttribute("selector");
    var isToolbarItem = aItem.hasAttribute("toolbaritem");
    
    var ee = Services.wm.getEnumerator("bluegriffon");
    while (ee.hasMoreElements()) {
      var w = ee.getNext();
      var navNav = w.QueryInterface(nsIInterfaceRequestor)
                     .getInterface(nsIWebNavigation);
      var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
      var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                            .getInterface(nsIDOMWindow);
      var elt = rootWin.document.querySelector(selector);
      var keyset = rootWin.document.getElementById("mainKeySet");
      if (elt) { // sanity check
        var keyElt = rootWin.document.createElement("key");
        keyElt.setAttribute("modifiers", mArray.length ? mArray.join(",") : "");
        if (aRv.key.length == 1)
          keyElt.setAttribute("key", aRv.key);
        else
          keyElt.setAttribute("keycode", aRv.key);
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

        var keyId =  "key-" + (mArray.length ? mArray.join("-") : "") + aRv.key;
        keyElt.setAttribute("id", keyId);
        keyset.appendChild(keyElt);
        elt.setAttribute("key", keyId);

        var parent = keyset.parentNode;
        var nextSibling = parent.nextSibling;
        parent.removeChild(keyset);
        parent.insertBefore(keyset, nextSibling);
      }
    }
  }

  aItem.setAttribute("shortcut", aRv.shortcut);

  StoreAllShortcuts();
}

function GetDBConn()
{
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  file.append("shortcuts.sqlite");
  
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                          .getService(Components.interfaces.mozIStorageService);
  return storageService.openDatabase(file);
}

function InitShortcutDB()
{
  // create the SQLite table if it does not exist already
  var mDBConn = GetDBConn();
  mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS 'shortcuts' ('id' INTEGER PRIMARY KEY NOT NULL, \
'selector' VARCHAR NOT NULL DEFAULT '', \
'modifiers' VARCHAR NOT NULL DEFAULT '', \
'key' VARCHAR NOT NULL DEFAULT '')");

  mDBConn.close();
}

function StoreAllShortcuts()
{
  InitShortcutDB();
  // clobber all
  var mDBConn = GetDBConn();
  mDBConn.executeSimpleSQL("DELETE FROM 'shortcuts'");

  var items = gDialog.commandsShortcutsTree.querySelectorAll("treeitem[shortcut]");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var selector    = item.getAttribute("selector");
    var modifiers   = item.getAttribute("modifiers");
    var kbdkey      = item.getAttribute("kbdkey");
    var statement = mDBConn.createStatement(
      "INSERT INTO 'shortcuts' ('selector','modifiers','key') VALUES(?1, ?2, ?3)");

    statement.bindStringParameter(0, selector);
    statement.bindStringParameter(1, modifiers);
    statement.bindStringParameter(2, kbdkey);
    statement.execute();
    statement.finalize();
  }
  mDBConn.close();
}
