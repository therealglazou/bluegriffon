/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");

function startup(aData, aReasion) {
  // Register the resource:// location
  let resource = Services.io
                         .getProtocolHandler("resource")
                         .QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution("dbgserver", aData.resourceURI);

  // Load the debug server and start it if enabled.
  Cu.import("resource://dbgserver/modules/RemoteDebuggerServer.jsm");
  let remoteEnabled = Services.prefs.getBoolPref("devtools.debugger.remote-enabled");

  RemoteDebuggerServer.extraInit = function(DebuggerServer) {
    DebuggerServer.registerModule("resource://gre/modules/XULRootActor.js");
  };
  RemoteDebuggerServer.startstop(remoteEnabled);
}

function shutdown(aData, aReason) {
  if (aReason == APP_SHUTDOWN) return;

  // Make sure to stop the debug server on disable and uninstall
  if (aReason == ADDON_DISABLE || aReason == ADDON_UNINSTALL) {
    RemoteDebuggerServer.stop();
  }

  // Unload our debug server
  Cu.unload("resource://dbgserver/modules/RemoteDebuggerServer.jsm");

  // Unregister the dbgserve resource:// location
  let resource = Services.io
                         .getProtocolHandler("resource")
                         .QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution("dbgserver", null);
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
