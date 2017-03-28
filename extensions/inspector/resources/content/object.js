/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* ObjectApp -------------------------------------------------
*  The primary object that controls the Inspector compact app.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

//////////// global variables /////////////////////

var inspector;

//////////// global constants ////////////////////

//////////////////////////////////////////////////

window.addEventListener("load", ObjectApp_initialize, false);
window.addEventListener("unload", ObjectApp_destroy, false);

function ObjectApp_initialize()
{
  inspector = new ObjectApp();
  inspector.initialize();
}

function ObjectApp_destroy()
{
  inspector.destroy();
}

////////////////////////////////////////////////////////////////////////////
//// class ObjectApp

function ObjectApp()
{
}

ObjectApp.prototype = 
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  initialize: function()
  {
    this.mInitTarget = window.arguments && window.arguments.length > 0 ? window.arguments[0] : null;

    this.mPanelSet = document.getElementById("bxPanelSet");
    this.mPanelSet.addObserver("panelsetready", this, false);
    this.mPanelSet.initialize();
  },
  
  destroy: function()
  {
  },
  
  doViewerCommand: function(aCommand)
  {
    this.mPanelSet.execCommand(aCommand);
  },
  
  getViewer: function(aUID)
  {
    return this.mPanelSet.registry.getViewerByUID(aUID);
  },
  
  onEvent: function(aEvent)
  {
    switch (aEvent.type) {
      case "panelsetready":
        this.initViewerPanels();
    }
  },

  initViewerPanels: function()
  {
    if (this.mInitTarget)
      this.target = this.mInitTarget;
  },
  
  set target(aObj)
  {
    this.mPanelSet.getPanel(0).subject = aObj;
  }
};

////////////////////////////////////////////////////////////////////////////
//// event listeners

