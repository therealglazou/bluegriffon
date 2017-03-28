/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Actors for the remote debugger server.
 *
 * NOTE: This file is used from both Thundebird and the Debugger Server
 * extension. Please don't introduce any Thunderbird-specific code
 */

var { Ci, Cu } = require("chrome");
var Services = require("Services");
var DevToolsUtils = require("resource://gre/modules/devtools/DevToolsUtils.js");
var { RootActor } = require("resource://gre/modules/devtools/server/actors/root");
var { DebuggerServer } = require("resource://gre/modules/devtools/server/main");
var { Promise } = Cu.import("resource://gre/modules/Promise.jsm", {});
var { BrowserTabList, BrowserTabActor, BrowserAddonList } = require("devtools/server/actors/webbrowser");

/**
 * Create the root actor for this XUL application.
 *
 * @param aConnection       The debugger connection to create the actor for.
 * @return                  The mail actor for the connection.
 */
function createRootActor(aConnection) {
  let parameters = {
    tabList: new XulTabList(aConnection),
    addonList: new BrowserAddonList(aConnection),
    globalActorFactories: DebuggerServer.globalActorFactories,
    onShutdown: sendShutdownEvent,
  };

  // Create the root actor and set the application type
  let rootActor = new RootActor(aConnection, parameters);
  if (DebuggerServer.chromeWindowType) {
    rootActor.applicationType = DebuggerServer.chromeWindowType.split(":")[0];
  } else {
    rootActor.applicationType = "xulrunner";
  }

  return rootActor;
}

/**
 * Returns the window type of the passed window.
 */
function appShellDOMWindowType(aWindow) {
  /* This is what nsIWindowMediator's enumerator checks. */
  return aWindow.document.documentElement.getAttribute('windowtype');
}

/**
 * Send a debugger shutdown event to all main windows.
 */
function sendShutdownEvent() {
  let windowTypes = DebuggerServer.RemoteDebuggerServer.chromeWindowTypes;
  for (let type of windowTypes) {
    let enumerator = Services.wm.getEnumerator(type);
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      let evt = win.document.createEvent("Event");
      evt.initEvent("Debugger:Shutdown", true, false);
      win.document.documentElement.dispatchEvent(evt);
    }
  }
}

/**
 * The live list of tabs for a XUL Application. The term tab is taken from
 * Firefox tabs, where each browser tab shows up as a tab in the debugger.
 * Not all apps have the concept where each tab is a content tab, so we will
 * be iterating the content windows and presenting them as tabs instead.
 *
 * @param aConnection       The connection to create the tab list for.
 */
function XulTabList(aConnection) {
  this._connection = aConnection;
  this._actorByBrowser = new Map();

  // These windows should be checked for browser elements
  this._checkedWindows = new Set(DebuggerServer.RemoteDebuggerServer.chromeWindowTypes);
}

XulTabList.prototype = {
  _onListChanged: null,
  _actorByBrowser: null,
  _checkedWindows: null,
  _mustNotify: false,
  _listeningToMediator: false,

  get onListChanged() {
    return this._onListChanged;
  },

  set onListChanged(v) {
    if (v !== null && typeof v !== 'function') {
      throw Error("onListChanged property may only be set to 'null' or a function");
    }
    this._onListChanged = v;
    this._checkListening();
  },

  _checkListening: function() {
    let shouldListenToMediator =
        ((this._onListChanged && this._mustNotify) ||
         this._actorByBrowser.size > 0);

    if (this._listeningToMediator !== shouldListenToMediator) {
      let op = shouldListenToMediator ? "addListener" : "removeListener";
      Services.wm[op](this);
      this._listeningToMediator = shouldListenToMediator;
    }
  },

  _notifyListChanged: function() {
    if (this._onListChanged && this._mustNotify) {
      this._onListChanged();
      this._mustNotify = false;
    }
  },

  _getTopWindow: function() {
    let winIter = Services.wm.getZOrderDOMWindowEnumerator(null, true);
    while (winIter.hasMoreElements()) {
      let win = winIter.getNext();
      if (this._checkedWindows.has(appShellDOMWindowType(win))) {
        // This is one of our windows, return it
        return win;
      }
    }
    return null;
  },

  getList: function() {
    let topWindow = this._getTopWindow();

    // Look for all browser elements in all the windows we care about
    for (let winName of this._checkedWindows) {
      let winIter = Services.wm.getEnumerator(winName);
      while (winIter.hasMoreElements()) {
        let win = winIter.getNext();
        let foundSelected = false;
        // Check for browser elements and create a tab actor for each.
        // This will catch content tabs, the message reader and the
        // multi-message reader.
        for (let browser of win.document.getElementsByTagName("browser")) {
          if (browser.currentURI.spec == "about:blank") {
            // about:blank is not particularly interesting. Don't
            // add it to the list.
            continue;
          }
          let actor = this._actorByBrowser.get(browser);
          if (!actor) {
            actor = new BrowserTabActor(this._connection,
                                        browser, null);
            this._actorByBrowser.set(browser, actor);
          }

          // Select the first visible browser in the top xul
          // window.
          let bo = browser.boxObject;
          actor.selected = foundSelected =
              win == topWindow &&
              !foundSelected &&
              bo.height > 0 &&
              bo.width > 0;
        }
      }
    }

    this._mustNotify = true;
    this._checkListening();

    return Promise.resolve([...this._actorByBrowser.values()]);
  },

  onOpenWindow: DevToolsUtils.makeInfallible(function(aWindow) {
    let handleLoad = DevToolsUtils.makeInfallible(() => {
      aWindow.removeEventListener("load", handleLoad, false);

      if (this._checkedWindows.has(appShellDOMWindowType(aWindow))) {
        // This is one of our windows, we need to check for browser
        // elements. Notify is enough, iterate will do the actual actor
        // creation.
        this._notifyListChanged();
      }
    });

    // You can hardly do anything at all with a XUL window at this point; it
    // doesn't even have its document yet. Wait until its document has
    // loaded, and then see what we've got. This also avoids
    // nsIWindowMediator enumeration from within listeners (bug 873589).
    aWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                     .getInterface(Ci.nsIDOMWindow);
    aWindow.addEventListener("load", handleLoad, false);
  }, "XulTabList.prototype.onOpenWindow"),

  onCloseWindow: DevToolsUtils.makeInfallible(function(aWindow) {
    aWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                     .getInterface(Ci.nsIDOMWindow);

    // Only handle our window types
    if (this._checkedWindows.has(appShellDOMWindowType(aWindow))) {
      return;
    }

    // nsIWindowMediator deadlocks if you call its GetEnumerator method from
    // a nsIWindowMediatorListener's onCloseWindow hook (bug 873589), so
    // handle the close in a different tick.
    Services.tm.currentThread.dispatch(DevToolsUtils.makeInfallible(() => {
      let shouldNotify = false;

      // Scan the whole map for browsers that were in this window.
      for (let [browser, actor] of this._actorByBrowser) {
        // The browser document of a closed window has no default view.
        if (!browser.ownerDocument.defaultView) {
          this._actorByBrowser.delete(browser);
          actor.exit();
          shouldNotify = true;
        }
      }

      if (shouldNotify) {
        this._notifyListChanged();
      }
      this._checkListening();
    }, "XulTabList.prototype.onCloseWindow's delayed body"), 0);
  }, "XulTabList.prototype.onCloseWindow"),

  onWindowTitleChange: function() {}
};

exports.register = function(handle) {
  handle.setRootActor(createRootActor);
};

exports.unregister = function(handle) {
  handle.setRootActor(null);
};
