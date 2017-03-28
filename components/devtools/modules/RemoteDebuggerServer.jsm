/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["RemoteDebuggerServer"];

/**
 * A module to wrap the devtools DebuggerServer with some extra methods.
 */

Components.utils.import("resource://gre/modules/Services.jsm");

/** Load the debugger module, if its available. */
var debugServerSupported = (function() {
  try {
    Components.utils.import("resource://gre/modules/devtools/dbg-server.jsm");
    return true;
  } catch (e) {
    return false;
  }
})();

/** @return the list of main windows, see isMainWindow */
function getMainWindows() {
  let found = [];
  let windows = Services.wm.getEnumerator(null);
  while (windows.hasMoreElements()) {
    let win = windows.getNext();
    if (isMainWindow(win)) {
      found.push(win);
    }
  }
  return found;
}

/**
 * Check if the window is the "main window" by checking if the host part
 * matches the basename of the filename.
 *
 * @param aWindow       The window to check
 */
function isMainWindow(aWindow) {
  let urlParser = Components.classes["@mozilla.org/network/url-parser;1?auth=no"]
                            .getService(Components.interfaces.nsIURLParser);
  let baseName, bnpos = {}, bnlen = {};
  let path = aWindow.location.pathname;
  urlParser.parseFilePath(path, path.length, {}, {}, bnpos, bnlen, {}, {});
  baseName = path.substr(bnpos.value, bnlen.value);
  return (aWindow.location.hostname == baseName);
}

/**
 * The Frontend for the remote debugger, starts, stops and initializes the
 * actors.
 */
var RemoteDebuggerServer = {
  /** @return true if the debugger server is running */
  get listening() { return DebuggerServer && DebuggerServer._listener != null; },

  /** @return the number of connections to the debugger server */
  get connections() { return DebuggerServer ? Object.keys(DebuggerServer._connections).length : 0; },

  /** @return true if the debugger server could be loaded */
  get supported() { return debugServerSupported; },

  /**
   * Get all windows that should be checked by the actors. The first one
   * will be used as the chrome window type for DebuggerServer. If this is not
   * set explicitly, it will be detected once from the open window urls.
   */
  get chromeWindowTypes() {
    if (!this._chromeWindowTypes) {
      let mainWindows = getMainWindows().map(function(win) {
        return win.document.documentElement.getAttribute("windowtype");
      });
      this._chromeWindowTypes = mainWindows;
    }

    return this._chromeWindowTypes || [];
  },
  set chromeWindowTypes(v) { this._chromeWindowTypes = v; },

  /**
   * Set a function to wrap the DebuggerServer's onConnectionChange
   * notification. This is not failsafe with multiple functions or other
   * callers changing the DebuggerServer's function, so it should be used
   * with caution.
   */
  get onConnectionChange() { return DebuggerServer.onConnectionChange; },
  set onConnectionChange(aFunc) {
    if (this.supported) {
      if (aFunc) {
        if (!this._origConnChange) {
          this._origConnChange = DebuggerServer.onConnectionChange;
        }
        DebuggerServer.onConnectionChange = aFunc;
      } else {
        DebuggerServer.onConnectionChange = this._origConnChange;
        this._origConnChange = null;
      }
    }
    return aFunc;
  },

  /**
   * Ensure the Remote Debugger is properly initialized.
   */
  _checkInit: function() {
    if (DebuggerServer.initialized && DebuggerServer.createRootActor) {
      return;
    }

    // Initialize the debugger, if non-local connections are permitted then
    // have the default prompt kick in.
    DebuggerServer.init(() => {
      return Services.prefs.getBoolPref("devtools.debugger.force-local") ||
             DebuggerServer._defaultAllowConnection();
    });

    // Load the toolkit actors first
    DebuggerServer.addBrowserActors();

    // Set up the chrome window type
    DebuggerServer.chromeWindowType = this.chromeWindowTypes[0];

    // Set up the extra actors. Pass DebuggerServer for convenience
    this.extraInit(DebuggerServer);
  },

  extraInit: function(DebuggerServer) {
    // Overwrite this to add your actors
  },

  /**
   * Start or stop the server depending on the parameters
   *
   * @param start   If true, start the server, else stop.
   * @return        True if the debugger server was started.
   */
  startstop: function(start) {
    if (start) {
      this.start();
    } else {
      this.stop();
    }
    return this.listening;
  },

  /**
   * Start the debugger server
   *
   * @return    True, if the server was successfully started
   */
  start: function() {
    if (!this.supported) {
      return false;
    }

    this._checkInit();
    Services.prefs.setBoolPref('devtools.debugger.remote-enabled', true);

    // Make sure chrome debugging is enabled, no sense in starting otherwise.
    DebuggerServer.allowChromeProcess = true;

    let port = Services.prefs.getIntPref('devtools.debugger.remote-port') || 6000;
    try {
      let listener = DebuggerServer.createListener();
      listener.portOrPath = port;

      // Expose this listener via wifi discovery, if enabled.
      if (Services.prefs.getBoolPref("devtools.remote.wifi.visible") &&
          !Services.prefs.getBoolPref("devtools.debugger.force-local")) {
        listener.discoverable = true;
      }

      listener.open();
    } catch (e) {
      Components.utils.reportError("Unable to start debugger server: " + e);
      return false;
    }
    return true;
  },

  /**
   * Stop the debugger server.
   *
   * @param aForce      If not passed or true, force debugger server shutdown
   * @return            True, if the server was successfully stopped
   */
  stop: function(aForce=true) {
    if (!this.supported) {
      return false;
    }

    Services.prefs.setBoolPref('devtools.debugger.remote-enabled', false);
    try {
      DebuggerServer.closeAllListeners(aForce);
    } catch (e) {
      Components.utils.reportError("Unable to stop debugger server: " + e);
      return false;
    }
    return true;
  }
};

// Add this to DebuggerServer so the actors can make use of it without loading
// this file, because the URL is different between loading as an extension and
// directly.
DebuggerServer.RemoteDebuggerServer = RemoteDebuggerServer;
