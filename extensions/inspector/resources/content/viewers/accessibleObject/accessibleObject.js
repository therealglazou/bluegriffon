/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* AccessibleObjectViewer --------------------------------------------
*  The viewer for the accessible object.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/events/ObserverManager.js
****************************************************************/

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;
var bundle;
var accService;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const nsIAccessibleRetrieval = Components.interfaces.nsIAccessibleRetrieval;
const nsIAccessible = Components.interfaces.nsIAccessible;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", AccessibleObjectViewer_initialize, false);

function AccessibleObjectViewer_initialize()
{
  bundle = document.getElementById("inspector-bundle");
  accService = XPCU.getService(kAccessibleRetrievalCID, nsIAccessibleRetrieval);

  viewer = new JSObjectViewer();

  viewer.__defineGetter__(
    "uid",
    function uidGetter()
    {
      return "accessibleObject";
    }
  );

  viewer.__defineSetter__(
    "subject",
    function subjectSetter(aObject)
    {
      var accObject = aObject instanceof nsIAccessible ?
        aObject : accService.getAccessibleFor(aObject);
      this.setSubject(accObject);
    }
   );

  viewer.initialize(parent.FrameExchange.receiveData(window));
}
