/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/RemoteDebuggerServer.jsm");
/**
 * Handler to call when the checked state of the menuitem is toggled. Sets the
 * remote-enabled preference of the debugger and starts the debugger if needed.
 */
function toggleDebugger() {
  let shouldEnable = document.getElementById("devtoolsDebugger").getAttribute("checked") == "true";
  Services.prefs.setBoolPref("devtools.debugger.remote-enabled", shouldEnable);

  RemoteDebuggerServer.extraInit = function(DebuggerServer) {
    DebuggerServer.registerModule("resource://gre/modules/XULRootActor.js");
  };
  RemoteDebuggerServer.startstop(shouldEnable);
}

/**
 * Intialize the checked state, to be used when the view menu is opened.
 */
function initDebuggerToolsMenu() {
  let debuggerEnabled = Services.prefs.getBoolPref("devtools.debugger.remote-enabled");
  document.getElementById("devtoolsDebugger")
          .setAttribute("checked", debuggerEnabled);
}

/**
 * Intialize everything needed on load in the window for the debugger, i.e
 * menuitem checked state listeners.
 */
function loadDebugger() {
  window.removeEventListener("load", loadDebugger, false);
  let viewPopup = document.getElementById("toolsPopup");
  viewPopup.addEventListener("popupshowing", initDebuggerToolsMenu, false);

  // Call these functions once to start or stop the debugger on startup.
  initDebuggerToolsMenu();
  toggleDebugger();
}

/**
 * Shutdown everything needed on load in the window for the debugger, i.e
 * menuitem checked state listeners.
 */
function unloadDebugger() {
  window.removeEventListener("unload", unloadDebugger, false);
  let viewPopup = document.getElementById("toolsPopup");
  viewPopup.removeEventListener("popupshowing", initDebuggerToolsMenu, false);
}

// Load and unload the debugger when the window loads/unloads.
window.addEventListener("load", loadDebugger, false);
window.addEventListener("unload", unloadDebugger, false);
