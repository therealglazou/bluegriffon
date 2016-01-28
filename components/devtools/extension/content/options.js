/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://dbgserver/modules/RemoteDebuggerServer.jsm");
Components.utils.import("resource://gre/modules/PluralForm.jsm");

/**
 * Toggle the debugger and reinitialize the UI
 */
function toggleDebugger() {
  applyChanges();
  RemoteDebuggerServer.startstop(!RemoteDebuggerServer.listening);
  updateState();
}

/**
 * Initialize the options pane
 */
function initPane() {
  RemoteDebuggerServer.onConnectionChange = updateState;
  window.addEventListener("unload", function() {
    RemoteDebuggerServer.onConnectionChange = null;
  }, false);
  updateState();
}

/**
 * Update the label states, i.e on connection change
 */
function updateState() {
  let buttonKey = "";
  let statusKey = "";
  let statusArg = null;

  if (RemoteDebuggerServer.supported) {
    if (RemoteDebuggerServer.listening) {
      buttonKey = "stop";
      if (RemoteDebuggerServer.connections > 0) {
        statusKey = "connected";
        statusArg = RemoteDebuggerServer.connections;
      } else {
        statusKey = "listening";
      }
    } else {
      buttonKey = "start";
      statusKey = "idle";
    }
  } else {
    buttonKey = "start";
    statusKey = "unsupported";
  }

  let strings = document.getElementById("strings");
  let btn = document.getElementById("toggleDebugger-button");
  btn.label = strings.getString("options." + buttonKey + ".label");
  btn.disabled = !RemoteDebuggerServer.supported;

  let lbl = document.getElementById("status-label");
  if (statusArg) {
    let status = strings.getFormattedString("options." + statusKey + ".label", [statusArg]);
    lbl.textContent = PluralForm.get(statusArg, status).replace("#1", statusArg);
  } else {
    lbl.textContent = strings.getString("options." + statusKey + ".label");
  }
  lbl.setAttribute("tooltiptext", strings.getString("options." + statusKey + ".tooltip"));
}

/**
 * Apply the pref changes (useful for non-instant-apply platforms)
 */
function applyChanges() {
  document.getElementById("dbgserver-prefpane").writePreferences(false);
  Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .savePrefFile(null);
}
