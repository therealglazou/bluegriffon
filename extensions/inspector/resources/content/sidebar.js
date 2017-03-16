/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* InspectorSidebar -----------------------------------------------------------
*   The primary object that controls the Inspector sidebar.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var inspector;

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kObserverServiceContractID  = "@mozilla.org/observer-service;1";

const gNavigator = GetWindowContent();

//////////////////////////////////////////////////////////////////////////////

function InspectorSidebar_initialize()
{
  inspector = new InspectorSidebar();
  inspector.initialize();
}

window.addEventListener("load", InspectorSidebar_initialize, false);

//////////////////////////////////////////////////////////////////////////////
//// class InspectorSidebar

function InspectorSidebar()
{
}

InspectorSidebar.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  get document()
  {
    return this.mDocPanel.viewer.subject;
  },

  initialize: function IS_Initialize()
  {
    this.installNavObserver();

    this.mPanelSet = document.getElementById("bxPanelSet");
    this.mPanelSet.addObserver("panelsetready", this, false);
    this.mPanelSet.initialize();
  },

  destroy: function IS_Destroy()
  {
  },

  doViewerCommand: function IS_DoViewerCommand(aCommand)
  {
    this.mPanelSet.execCommand(aCommand);
  },

  getViewer: function IS_GetViewer(aUID)
  {
    return this.mPanelSet.registry.getViewerByUID(aUID);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Viewer Panels

  initViewerPanels: function IS_InitViewerPanels()
  {
    this.mDocPanel = this.mPanelSet.getPanel(0);
    this.mDocPanel.addObserver("subjectChange", this, false);
    this.mObjectPanel = this.mPanelSet.getPanel(1);
  },

  onEvent: function IS_OnEvent(aEvent)
  {
    if (aEvent.type == "panelsetready") {
      this.initViewerPanels();
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Navigation

  setTargetWindow: function IS_SetTargetWindow(aWindow)
  {
    this.setTargetDocument(aWindow.document);
  },

  setTargetDocument: function IS_SetTargetDocument(aDoc)
  {
    this.mPanelSet.getPanel(0).subject = aDoc;
  },

  installNavObserver: function IS_InstallNavObserver()
  {
    var observerService = XPCU.getService(kObserverServiceContractID,
                                          "nsIObserverService");
    observerService.addObserver(NavLoadObserver, "EndDocumentLoad", false);
  }
};

var NavLoadObserver = {
  observe: function NLO_Observe(aWindow)
  {
    inspector.setTargetWindow(aWindow);
  }
};
