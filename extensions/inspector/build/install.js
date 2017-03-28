/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var gVersion = "0.5";

var err = initInstall("DOM Inspector", "inspector", gVersion);
logComment("initInstall: " + err);

var fProgram = getFolder("Program");
logComment("fProgram: " + fProgram);

err = addDirectory("", gVersion, "bin", fProgram, "", true);
logComment("addDirectory: " + err);

registerChrome(CONTENT | DELAYED_CHROME, getFolder("Chrome","inspector.jar"), "content/inspector/");
registerChrome(LOCALE | DELAYED_CHROME, getFolder("Chrome","inspector.jar"), "locale/en-US/inspector/");
registerChrome(SKIN | DELAYED_CHROME, getFolder("Chrome","inspector.jar"), "skin/modern/inspector/");
registerChrome(SKIN | DELAYED_CHROME, getFolder("Chrome","inspector.jar"), "skin/classic/inspector/");

if (getLastError() == SUCCESS) {
  err = performInstall(); 
  logComment("performInstall: " + err);
} else {
  cancelInstall(err);
}
