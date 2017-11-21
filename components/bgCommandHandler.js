Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/urlHelper.jsm");

const nsISupports            = Components.interfaces.nsISupports;

const nsICommandLine         = Components.interfaces.nsICommandLine;
const nsICommandLineHandler  = Components.interfaces.nsICommandLineHandler;
const nsIContentHandler      = Components.interfaces.nsIContentHandler;
const nsIDocShellTreeItem    = Components.interfaces.nsIDocShellTreeItem;
const nsIDOMChromeWindow     = Components.interfaces.nsIDOMChromeWindow;
const nsIDOMWindow           = Components.interfaces.nsIDOMWindow;
const nsIFileURL             = Components.interfaces.nsIFileURL;
const nsIHttpProtocolHandler = Components.interfaces.nsIHttpProtocolHandler;
const nsIInterfaceRequestor  = Components.interfaces.nsIInterfaceRequestor;
const nsINetUtil             = Components.interfaces.nsINetUtil;
const nsIPrefBranch          = Components.interfaces.nsIPrefBranch;
const nsIPrefLocalizedString = Components.interfaces.nsIPrefLocalizedString;
const nsISupportsString      = Components.interfaces.nsISupportsString;
const nsIURIFixup            = Components.interfaces.nsIURIFixup;
const nsIWebNavigation       = Components.interfaces.nsIWebNavigation;
const nsIWindowMediator      = Components.interfaces.nsIWindowMediator;
const nsIWindowWatcher       = Components.interfaces.nsIWindowWatcher;
const nsICategoryManager     = Components.interfaces.nsICategoryManager;
const nsIWebNavigationInfo   = Components.interfaces.nsIWebNavigationInfo;
const nsIBrowserSearchService = Components.interfaces.nsIBrowserSearchService;
const nsICommandLineValidator = Components.interfaces.nsICommandLineValidator;
const nsIXULAppInfo          = Components.interfaces.nsIXULAppInfo;
const nsIObserver            = Components.interfaces.nsIObserver;

const NS_BINDING_ABORTED = Components.results.NS_BINDING_ABORTED;
const NS_ERROR_WONT_HANDLE_CONTENT = 0x805d0001;
const NS_ERROR_ABORT = Components.results.NS_ERROR_ABORT;

const URI_INHERITS_SECURITY_CONTEXT = nsIHttpProtocolHandler
                                        .URI_INHERITS_SECURITY_CONTEXT;

// Flag used to indicate that the arguments to openWindow can be passed directly.
const NO_EXTERNAL_URIS = 1;

function openWindow(parent, url, target, features, args, noExternalArgs) {
  var wwatch = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(nsIWindowWatcher);

  if (noExternalArgs == NO_EXTERNAL_URIS) {
    // Just pass in the defaultArgs directly
    var argstring;
    if (args) {
      argstring = Components.classes["@mozilla.org/supports-string;1"]
                            .createInstance(nsISupportsString);
      argstring.data = args;
    }

    return wwatch.openWindow(parent, url, target, features, argstring);
  }
  
  // Pass an array to avoid the browser "|"-splitting behavior.
  var argArray = Components.classes["@mozilla.org/array;1"]
                    .createInstance(Components.interfaces.nsIMutableArray);

  // add args to the arguments array
  var stringArgs = null;
  if (args instanceof Array) // array
    stringArgs = args;
  else if (args) // string
    stringArgs = [args];

  if (stringArgs) {
    // put the URIs into argArray
    var uriArray = Components.classes["@mozilla.org/array;1"]
                       .createInstance(Components.interfaces.nsIMutableArray);
    stringArgs.forEach(function (uri) {
      var sstring = Components.classes["@mozilla.org/supports-string;1"]
                              .createInstance(nsISupportsString);
      sstring.data = uri;
      uriArray.appendElement(sstring);
    });
    argArray.appendElement(uriArray);
  } else {
    argArray.appendElement(null);
  }

  return wwatch.openWindow(parent, url, target, features, argArray);
}


function nsBlueGriffonContentHandler() {
}
nsBlueGriffonContentHandler.prototype = {
  classID: Components.ID("{207D7161-7548-4BA3-99C9-01AE98C53A32}"),

  _xpcom_factory: {
    createInstance: function bch_factory_ci(outer, iid) {
      if (outer)
        throw Components.results.NS_ERROR_NO_AGGREGATION;
      return gBlueGriffonContentHandler.QueryInterface(iid);
    }
  },

  /* helper functions */

  mChromeURL : null,

  get chromeURL() {
    if (this.mChromeURL) {
      return this.mChromeURL;
    }

    var prefb = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(nsIPrefBranch);
    this.mChromeURL = prefb.getCharPref("browser.chromeURL");

    return this.mChromeURL;
  },

  /* nsISupports */
  QueryInterface : XPCOMUtils.generateQI([nsICommandLineHandler,
                                          nsIContentHandler]),

  /* nsICommandLineHandler */
  handle : function bch_handle(cmdLine) {
    if (!cmdLine.length)
      return;

    var urlArray = [];
    var url = null;
    var ar = null;

    // deal with -file arguments
    do {
      var ar = cmdLine.handleFlagWithParam("file", false);
      if (ar) {
        cmdLine.preventDefault = true;
        try {
          var localFile = UrlUtils.newLocalFile(ar);
          var ioService =
            Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
          var fileHandler =
            ioService.getProtocolHandler("file")
                    .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
          url = fileHandler.getURLSpecFromFile(localFile);
          urlArray.push(url);
        }
        catch(e) {}
      }
    }
    while (ar);

    do {
      url = cmdLine.handleFlagWithParam("url", false);
      if (url)
        urlArray.push(url);
    }
    while(url);
    
#ifndef XP_MACOSX
    if (cmdLine.length) {
      for (var i = 0; i < cmdLine.length; i++) {
        var arg = cmdLine.getArgument(i);
        if (arg[0] != "-")
          urlArray.push(arg);
      }
    }
#endif

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
               .getService(nsIWindowMediator);
    var e = Services.wm.getEnumerator("bluegriffon");
    var mostRecent = null;
    if (e && e.hasMoreElements()) {
      mostRecent = e.getNext();
    }

    if (urlArray && urlArray.length) {
      cmdLine.preventDefault = true;
      if (mostRecent) {
        var navNav = mostRecent.QueryInterface(nsIInterfaceRequestor)
                          .getInterface(nsIWebNavigation);
        var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
        var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                              .getInterface(nsIDOMWindow);
        rootWin.OpenFiles(urlArray, true);
        return;
      }
      return openWindow(null, "chrome://bluegriffon/content/xul/bluegriffon.xul",
                              "_blank",
                              "chrome,dialog=no,all",
                              urlArray);
    }
  },

  helpInfo : "",

  /* nsIContentHandler */

  handleContent : function bch_handleContent(contentType, context, request) {
    Services.prompt.alert(null, "nsBlueGriffonContentHandler", "handleContent");
  }
};

function nsDefaultCommandLineHandler() {
}

nsDefaultCommandLineHandler.prototype = {
  classID: Components.ID("{87B61700-9D3D-47FE-802D-10F57F30AD9A}"),

  /* nsISupports */
  QueryInterface : function dch_QI(iid) {
    if (!iid.equals(nsISupports) &&
        !iid.equals(nsICommandLineHandler) &&
        !iid.equals(nsIObserver))
      throw Components.results.NS_ERROR_NO_INTERFACE;

    return this;
  },

  // List of uri's that were passed via the command line without the app
  // running and have already been handled. This is compared against uri's
  // opened using DDE on Win32 so we only open one of the requests.
  _handledURIs: [ ],

  /* nsICommandLineHandler */
  handle : function dch_handle(cmdLine) {
    if (!cmdLine.length)
      return;

    var urlArray = [];
    var url = null;
    var ar = null;

    // deal with -file arguments
    do {
      var ar = cmdLine.handleFlagWithParam("file", false);
      if (ar) {
        cmdLine.preventDefault = true;
        try {
          var localFile = UrlUtils.newLocalFile(ar);
          var ioService =
            Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
          var fileHandler =
            ioService.getProtocolHandler("file")
                    .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
          url = fileHandler.getURLSpecFromFile(localFile);
          urlArray.push(url);
        }
        catch(e) {}
      }
    }
    while (ar);

    do {
      url = cmdLine.handleFlagWithParam("url", false);
      if (url)
        urlArray.push(url);
    }
    while(url);
  
#ifndef XP_MACOSX
    if (cmdLine.length) {
      for (var i = 0; i < cmdLine.length; i++) {
        var arg = cmdLine.getArgument(i);
        if (arg[0] != "-")
          urlArray.push(arg);
      }
    }
#endif

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
              .getService(nsIWindowMediator);
    var e = Services.wm.getEnumerator("bluegriffon");
    var mostRecent = null;
    if (e && e.hasMoreElements()) {
      mostRecent = e.getNext();
    }

    if (urlArray && urlArray.length) {
      cmdLine.preventDefault = true;
      if (mostRecent) {
        var navNav = mostRecent.QueryInterface(nsIInterfaceRequestor)
                          .getInterface(nsIWebNavigation);
        var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
        var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                              .getInterface(nsIDOMWindow);
        rootWin.OpenFiles(urlArray, true);
        return;
      }
      return openWindow(null, "chrome://bluegriffon/content/xul/bluegriffon.xul",
                              "_blank",
                              "chrome,dialog=no,all",
                              urlArray);
    }

    if (mostRecent) {
      mostRecent.focus();
      return mostRecent;
    }
#ifdef TAGADA
    var wwatch = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                           .getService(nsIWindowWatcher);
    return wwatch.openWindow(null, this.hiddenChromeURL,
                             "_blank",
                             "chrome,dialog=no,all",
                             cmdLine);
#else
    if (!cmdLine.preventDefault)
      return openWindow(null, "chrome://bluegriffon/content/xul/bluegriffon.xul",
                               "_blank",
                               "chrome,dialog=no,all",
                               "");
#endif

  },

#ifdef XP_MACOSX
  mHiddenChromeURL : null,

  get hiddenChromeURL() {
    if (this.mHiddenChromeURL) {
      return this.mHiddenChromeURL;
    }

    var prefb = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(nsIPrefBranch);
    this.mHiddenChromeURL = prefb.getCharPref("browser.hiddenWindowChromeURL");

    return this.mHiddenChromeURL;
  },
#endif

  helpInfo : ""
};

var gBlueGriffonContentHandler = new nsBlueGriffonContentHandler();

var components = [nsBlueGriffonContentHandler, nsDefaultCommandLineHandler];
var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
