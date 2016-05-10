/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* JSObjectViewer --------------------------------------------
*  The viewer for all facets of a javascript object.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
****************************************************************/

//////////// global variables /////////////////////

var viewer;
var bundle;

//////////////////////////////////////////////////

window.addEventListener("load", JSObjectViewer_initialize, false);

function JSObjectViewer_initialize()
{
  bundle = document.getElementById("inspector-bundle");
  viewer = new JSObjectViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}
