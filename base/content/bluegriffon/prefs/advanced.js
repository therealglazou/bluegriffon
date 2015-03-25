function OnAdvancedPaneLoad()
{
  GetUIElements();

  try {
    // Query available and selected locales
    
    var chromeRegService = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService();
    var xulChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIXULChromeRegistry);
    var toolkitChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIToolkitChromeRegistry);

    var selectedLocale = xulChromeReg.getSelectedLocale("bluegriffon");
    var availableLocales = toolkitChromeReg.getLocalesForPackage("bluegriffon");

    // Render locale menulist by iterating through the query result from getLocalesForPackage()
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    var localeListbox = gDialog["locale-listbox"];

    var selectedItem = null;
    
    while(availableLocales.hasMore()) {
  
      var locale = availableLocales.getNext();
      var localeId = locale;
  
      var listitem = document.createElementNS(XUL_NS, "listitem");
      listitem.setAttribute("value", locale);
      var match = locale.match( /^([a-zA-Z]*)(\-([a-zA-Z]*))?$/ );
      if (match && match[1]) {
        locale += " (" + gDialog.bundleLanguages.getString(match[1].toLowerCase());
        if (match[3])
          locale += ", " + gDialog.bundleRegions.getString(match[3].toLowerCase());
        locale += ")";
      }
      listitem.setAttribute("label", locale);

      localeListbox.appendChild(listitem);
      if (localeId == selectedLocale) {
        // Is this the current locale?
         setTimeout(function(a, b) {a.selectedItem = b}, 100, localeListbox, listitem);
      }
  
    }


  } catch (err) {  }

  setTimeout(SwitchToSystemLocale, 100, document.getElementById("matchOSRadiogroup"));
}

function changeLocale() {

  try {
    // Which locale did the user select?
    var localeListbox = gDialog["locale-listbox"];
    if (localeListbox.selectedItem) {
      var newLocale = localeListbox.selectedItem.value;
      
      // Write preferred locale to local user config
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefBranch);
      var supportsString = Components.classes["@mozilla.org/supports-string;1"]
                                     .createInstance(Components.interfaces.nsISupportsString);
      supportsString.data = newLocale;
      prefs.setComplexValue("general.useragent.locale",
                            Components.interfaces.nsISupportsString,
                            supportsString);
    }
    var main = EditorUtils.getCurrentEditorWindow();
    if (EditorUtils.getCurrentEditorElement())
      if (!main.ToggleViewMode(main.gDialog.wysiwygModeButton))
        return;
    if (main.doSaveTabsBeforeQuit()) {
    // Restart application
      var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                       .getService(Components.interfaces.nsIAppStartup);
  
      appStartup.quit(Components.interfaces.nsIAppStartup.eRestart |
                      Components.interfaces.nsIAppStartup.eAttemptQuit);
    }
    
  } catch(err) {
  
    alert("Couldn't change locale: " + err);
  }
}

function OpenNetworkParams()
{
  document.documentElement.openSubDialog("chrome://bluegriffon/content/prefs/connection.xul",
                                         "", null);
}

function SwitchToSystemLocale(aElt)
{
  var listbox = document.getElementById("locale-listbox");
  if (aElt.value == "true")
    listbox.setAttribute("disabled", "true");
  else
    listbox.removeAttribute("disabled");
}

function ResetPreviewers()
{
  const handlerSvc = Components.classes["@mozilla.org/uriloader/handler-service;1"].
                     getService(Components.interfaces.nsIHandlerService);
  var e = handlerSvc.enumerate();
  var handlers = [];
  while (e.hasMoreElements()) {
    var handler = e.getNext().QueryInterface(Components.interfaces.nsIHandlerInfo);
    handlers.push(handler);
  }

  for (var i = 0; i < handlers.length; i++)
    handlerSvc.remove(handlers[i]);
}

