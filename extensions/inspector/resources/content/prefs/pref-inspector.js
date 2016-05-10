/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * vim: ts=2 sw=2 sts=2
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Startup()
{
  SidebarPrefs_initialize();
  enableBlinkPrefs(document.getElementById("inspector.blink.on").value);
}

function enableBlinkPrefs(aTruth)
{
  /* 
   * define the pair of label and control used in the prefpane to allow
   * disabling of both elements, if a pref is locked.
   */
  let els = {
    lbElBorderColor: "cprElBorderColor",
    lbElBorderWidth: "txfElBorderWidth",
    lbElDuration: "txfElDuration",
    lbElSpeed: "txfElSpeed",
    "": "cbElInvert"
  };

  for (let [label, control] in Iterator(els)) {
    let controlElem = document.getElementById(control);

    // only remove disabled attribute, if pref isn't locked
    if (aTruth && !isPrefLocked(controlElem)) {
      controlElem.removeAttribute("disabled");
      if (label)
        document.getElementById(label).removeAttribute("disabled");
    } else {
      controlElem.setAttribute("disabled", true);
      if (label)
        document.getElementById(label).setAttribute("disabled", true);
    }
  }
}

function isPrefLocked(elem)
{
  if (!elem.hasAttribute("preference"))
    return false;

  return document.getElementById(elem.getAttribute("preference")).locked;
}
