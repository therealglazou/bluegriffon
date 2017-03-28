/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* InspectorApp ---------------------------------------------------------------
*   The primary object that controls the Inspector application.
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var inspector;

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kIsMac = /Mac/.test(navigator.platform);
const kInspectorTitle =  kIsMac ?  "" : " - " + document.title;

const kAccessibleRetrievalContractID =
  "@mozilla.org/accessibleRetrieval;1";
const kClipboardHelperContractID =
  "@mozilla.org/widget/clipboardhelper;1";
const kPromptServiceContractID =
  "@mozilla.org/embedcomp/prompt-service;1";
const kFOStreamContractID =
  "@mozilla.org/network/file-output-stream;1";
const kEncoderContractIDbase =
  "@mozilla.org/layout/documentEncoder;1?type=";
const kSerializerContractID =
  "@mozilla.org/xmlextras/xmlserializer;1";
const kWindowMediatorContractID =
  "@mozilla.org/appshell/window-mediator;1";
const kFilePickerContractID =
  "@mozilla.org/filepicker;1";

const nsIAccessible            = Components.interfaces.nsIAccessible;
const nsIWebNavigation         = Components.interfaces.nsIWebNavigation;
const nsIDocShellTreeItem      = Components.interfaces.nsIDocShellTreeItem;
const nsIDocShell              = Components.interfaces.nsIDocShell;

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", InspectorApp_initialize, false);
window.addEventListener("unload", InspectorApp_destroy, false);

function InspectorApp_initialize()
{
  inspector = new InspectorApp();

  // window.arguments may be either a string or a node.
  // If passed via a command line handler, it will be a uri string.
  // If passed via navigator hooks, it will be a dom node to inspect.
  var initNode, initURI;
  if (window.arguments && window.arguments.length) {
    if (typeof window.arguments[0] == "string") {
      initURI = window.arguments[0];
    }
    else if (window.arguments[0] instanceof Components.interfaces.nsIDOMNode) {
      initNode = window.arguments[0];
    }
  }
  inspector.initialize(initNode, initURI);

  // Enable/disable Mac outlier keys.
  if (kIsMac) {
    document.getElementById("keyEnterLocation2").setAttribute("disabled",
                                                              "true");
  }
  else {
    document.getElementById("keyEditDeleteMac").setAttribute("disabled",
                                                             "true");
  }

  if (/Win/.test(navigator.platform)) {
    document.getElementById("mnEditRedo").setAttribute("key", "keyEditRedo2");
  }

  // Get rid of any menus that we expose as overlay points for integration
  // with several applications but aren't of use with the one hosting us here.
  var menubar = document.getElementById("mbrInspectorMain");
  var kid = menubar.firstChild;
  while (kid) {
    let nextSibling = kid.nextSibling;
    if (!kid.hasChildNodes()) {
      menubar.removeChild(kid);
    }
    kid = nextSibling;
  }
}

function InspectorApp_destroy()
{
  inspector.destroy();
}

//////////////////////////////////////////////////////////////////////////////
//// Class InspectorApp

function InspectorApp()
{
}

InspectorApp.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mShowBrowser: false,
  mClipboardHelper: null,
  mPromptService: null,

  mDocPanel: null,
  mObjectPanel: null,
  mDocViewerListPopup: null,
  mObjectViewerListPopup: null,

  mLastKnownDocPanelSubject: null,
  mLastKnownObjectPanelSubject: null,

  get document()
  {
    return this.mDocPanel.viewer.subject
  },

  get panelset()
  {
    return this.mPanelSet;
  },

  initialize: function IA_Initialize(aTarget, aURI)
  {
    this.mInitTarget = aTarget;

    var el = document.getElementById("bxBrowser");
    el.addEventListener("pageshow", BrowserPageShowListener, true);

    this.setBrowser(false, true);

    this.mClipboardHelper = XPCU.getService(kClipboardHelperContractID,
                                            "nsIClipboardHelper");
    this.mPromptService = XPCU.getService(kPromptServiceContractID,
                                          "nsIPromptService");

    this.mDocViewerListPopup =
      document.getElementById("mppDocViewerList");
    this.mObjectViewerListPopup =
      document.getElementById("mppObjectViewerList");

    this.mPanelSet = document.getElementById("bxPanelSet");
    this.mPanelSet.addObserver("panelsetready", this);
    this.mPanelSet.initialize();

    // check if accessibility service is available
    if (!(kAccessibleRetrievalContractID in Components.classes)) {
      var elm = document.getElementById("cmd:toggleAccessibleNodes");
      if (elm) {
        elm.setAttribute("disabled", "true");
      }

      elm = document.getElementById("mnInspectApplicationAccessible");
      if (elm) {
        elm.setAttribute("disabled", "true");
      }
    }

    if (aURI) {
      this.gotoURL(aURI);
    }
  },

  destroy: function IA_Destroy()
  {
    InsUtil.persistAll("bxDocPanel");
    InsUtil.persistAll("bxObjectPanel");
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Viewer Panels

  initViewerPanels: function IA_InitViewerPanels()
  {
    this.mDocPanel = this.mPanelSet.getPanel(0);
    this.mDocPanel.addObserver("subjectChange", this);
    this.mObjectPanel = this.mPanelSet.getPanel(1);
    this.mObjectPanel.addObserver("subjectChange", this);

    if (this.mInitTarget) {
      if (this.mInitTarget.nodeType == Node.DOCUMENT_NODE) {
        this.setTargetDocument(this.mInitTarget, false);
      }
      else if (this.mInitTarget.nodeType == Node.ELEMENT_NODE) {
        this.setTargetDocument(this.mInitTarget.ownerDocument, false);
        this.mDocPanel.params = this.mInitTarget;
      }
      this.mInitTarget = null;
    }
  },

  onEvent: function IA_OnEvent(aEvent)
  {
    switch (aEvent.type) {
      case "panelsetready":
        this.initViewerPanels();
        break;
      case "subjectChange":
        // A subjectChange really means the *viewer's* subject changed, and
        // one will be dispatched everytime a new viewer is loaded.  Don't
        // update the entries if the panel's subject is the same as before and
        // the subjectChange was only dispatched because of a new viewer.
        if (aEvent.target == this.mDocPanel.viewer) {
          let panel = this.mDocPanel;
          let mpp = this.mDocViewerListPopup;
          // Update the viewer list.
          if (this.mLastKnownDocPanelSubject != aEvent.subject) {
            panel.rebuildViewerList(mpp);
            this.mLastKnownDocPanelSubject = aEvent.subject;
          }
          panel.updateViewerListSelection(mpp);

          if (aEvent.subject) {
            if ("location" in aEvent.subject) {
              // display document url
              this.locationText = aEvent.subject.location;
  
              document.title =
                (aEvent.subject.title || aEvent.subject.location) +
                kInspectorTitle;
  
              this.updateCommand("cmdSave");
            }
            else if (("nsIAccessibleApplication" in Components.interfaces &&
                      aEvent.subject instanceof
                        Components.interfaces.nsIAccessibleApplication) ||
                     (aEvent.subject instanceof nsIAccessible &&
                      !aEvent.subject.parent)) {
              // Update title for application accessible in compatible way for
              // Gecko 2.0 and 1.9.2.
              this.locationText = "";

              var title = this.mPanelSet.
                stringBundle.getString("applicationAccesible.title");
              document.title = title + kInspectorTitle;

              this.updateCommand("cmdSave");
            }
          }
        }
        else if (aEvent.target == this.mObjectPanel.viewer) {
          let panel = this.mObjectPanel;
          let mpp = this.mObjectViewerListPopup;
          // Update the viewer list.
          if (this.mLastKnownObjectPanelSubject != aEvent.subject) {
            panel.rebuildViewerList(mpp);
            this.mLastKnownObjectPanelSubject = aEvent.subject;
          }
          panel.updateViewerListSelection(mpp);
        }
        break;
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// UI Commands

  updateCommand: function IA_UpdateCommand(aCommand)
  {
    var command = document.getElementById(aCommand);

    var disabled = false;
    switch (aCommand) {
      case "cmdSave":
        var doc = this.mDocPanel.subject;
        disabled =
          !((kEncoderContractIDbase + doc.contentType) in Components.classes ||
            (kSerializerContractID in Components.classes));
        break;
    }

    command.setAttribute("disabled", disabled);
  },

  doViewerCommand: function IA_DoViewerCommand(aCommand)
  {
    this.mPanelSet.execCommand(aCommand);
  },

  enterLocation: function IA_EnterLocation()
  {
    this.locationBar.focus();
    this.locationBar.select();
  },

  showPrefsDialog: function IA_ShowPrefsDialog()
  {
    goPreferences("inspector_pane");
  },

  toggleBrowser: function IA_ToggleBrowser(aToggleSplitter)
  {
    this.setBrowser(!this.mShowBrowser, aToggleSplitter)
  },

  /**
   * Toggle 'blink on select' command.
   */
  toggleFlashOnSelect: function IA_ToggleFlashOnSelect()
  {
    this.mPanelSet.flasher.flashOnSelect =
      !this.mPanelSet.flasher.flashOnSelect;
  },

  setBrowser: function IA_SetBrowser(aValue, aToggleSplitter)
  {
    this.mShowBrowser = aValue;
    if (aToggleSplitter) {
      this.openSplitter("Browser", aValue);
    }
    var cmd = document.getElementById("cmdToggleDocument");
    cmd.setAttribute("checked", aValue);
  },

  openSplitter: function IA_OpenSplitter(aName, aTruth)
  {
    var splitter = document.getElementById("spl" + aName);
    if (aTruth) {
      splitter.open();
    }
    else {
      splitter.close();
    }
  },

 /**
  * Saves the current document state in the inspector.
  */
  save: function IA_Save()
  {
    var picker = XPCU.createInstance(kFilePickerContractID, "nsIFilePicker");
    var title = document.getElementById("mi-save").label;
    picker.init(window, title, picker.modeSave)
    picker.appendFilters(picker.filterHTML | picker.filterXML |
                         picker.filterXUL);
    if (picker.show() == picker.returnCancel) {
      return;
    }

    var fos = XPCU.createInstance(kFOStreamContractID, "nsIFileOutputStream");
    const flags = 0x02 | 0x08 | 0x20; // write, create, truncate

    var doc = this.mDocPanel.subject;
    if ((kEncoderContractIDbase + doc.contentType) in Components.classes) {
      // first we try to use the document encoder for that content type.  If
      // that fails, we move on to the xml serializer.
      var encoder =
        XPCU.createInstance(kEncoderContractIDbase + doc.contentType,
                            "nsIDocumentEncoder");
      encoder.init(doc, doc.contentType, encoder.OutputRaw);
      encoder.setCharset(doc.characterSet);
      fos.init(picker.file, flags, -1, 0);
      try {
        encoder.encodeToStream(fos);
      }
      finally {
        fos.close();
      }
    }
    else {
      var serializer = XPCU.createInstance(kSerializerContractID,
                                          "nsIDOMSerializer");
      fos.init(picker.file, flags, -1, 0);
      try {
        serializer.serializeToStream(doc, fos);
      }
      finally {
        fos.close();
      }
    }
  },

  exit: function IA_Exit()
  {
    window.close();
    // Todo: remove observer service here
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Navigation

  gotoTypedURL: function IA_GotoTypedURL()
  {
    var url = document.getElementById("tfURLBar").value;
    this.gotoURL(url);
  },

  gotoURL: function IA_GotoURL(aURL, aNoSaveHistory)
  {
    this.mPendingURL = aURL;
    this.mPendingNoSave = aNoSaveHistory;
    this.browseToURL(aURL);
    this.setBrowser(true, true);
  },

  browseToURL: function IA_BrowseToURL(aURL)
  {
    try {
      this.webNavigation.loadURI(aURL, nsIWebNavigation.LOAD_FLAGS_NONE, null,
                                 null, null);
    }
    catch(ex) {
      // nsIWebNavigation.loadURI will spit out an appropriate user prompt, so
      // we don't need to do anything here.  See nsDocShell::DisplayLoadError()
    }
  },

 /**
  * Creates the submenu for Inspect Content/Chrome Document
  */
  showInspectDocumentList:
    function IA_ShowInspectDocumentList(aEvent, aChrome)
  {
    var menu = aEvent.target;
    var ww = XPCU.getService(kWindowMediatorContractID, "nsIWindowMediator");
    var windows = ww.getXULWindowEnumerator(null);
    var docs = [];

    while (windows.hasMoreElements()) {
      try {
        // Get the window's main docshell
        var windowDocShell =
          XPCU.QI(windows.getNext(), "nsIXULWindow").docShell;
        this.appendContainedDocuments(docs, windowDocShell,
                                      aChrome ?
                                        nsIDocShellTreeItem.typeChrome :
                                        nsIDocShellTreeItem.typeContent);
      }
      catch (ex) {
        // We've failed with this window somehow, but we're catching the error
        // so the others will still work
        Components.utils.reportError(ex);
      }
    }

    // Clear out any previous menu
    this.emptyChildren(menu);

    // Now add what we found to the menu
    if (!docs.length) {
      var noneMenuItem = document.createElementNS(kXULNSURI, "menuitem");
      var label = this.mPanelSet.stringBundle.getString(
        "inspectWindow.noDocuments.message"
      );
      noneMenuItem.setAttribute("label", label);
      noneMenuItem.setAttribute("disabled", true);
      menu.appendChild(noneMenuItem);
    }
    else {
      for (var i = 0; i < docs.length; i++) {
        this.addInspectDocumentMenuItem(menu, docs[i], i + 1);
      }
    }
  },

 /**
  * Appends to the array the documents contained in docShell (including the
  * passed docShell itself).
  *
  * @param array
  *        The array to append to.
  * @param docShell
  *        The docshell to look for documents in.
  * @param type
  *        One of the types defined in nsIDocShellTreeItem.
  */
  appendContainedDocuments:
    function IA_AppendContainedDocuments(array, docShell, type)
  {
    // Load all the window's content docShells
    var containedDocShells = docShell.getDocShellEnumerator(type,
                                      nsIDocShell.ENUMERATE_FORWARDS);
    while (containedDocShells.hasMoreElements()) {
      try {
        // Get the corresponding document for this docshell
        var childDoc = XPCU.QI(containedDocShells.getNext(), "nsIDocShell")
                         .contentViewer.DOMDocument;

        // Ignore the DOM Inspector's browser docshell if it's not being used
        if (docShell.contentViewer.DOMDocument.location.href !=
              document.location.href ||
            childDoc.location.href != "about:blank") {
          array.push(childDoc);
        }
      }
      catch (ex) {
        // We've failed with this document somehow, but we're catching the
        // error so the others will still work
        dump(ex + "\n");
      }
    }
  },

 /**
  * Creates a menu item for Inspect Document.
  *
  * @param doc
  *        Document related to this menu item.
  * @param docNumber
  *        The position of the document.
  */
  addInspectDocumentMenuItem:
    function IA_AddInspectDocumentMenuItem(parent, doc, docNumber)
  {
    var menuItem = document.createElementNS(kXULNSURI, "menuitem");
    menuItem.doc = doc;
    // Use the URL if there's no title
    var title = doc.title || doc.location.href;
    // The first ten items get numeric access keys
    if (docNumber < 10) {
      menuItem.setAttribute("label", docNumber + " " + title);
      menuItem.setAttribute("accesskey", docNumber);
    }
    else {
      menuItem.setAttribute("label", title);
    }
    parent.appendChild(menuItem);
  },

  setTargetApplicationAccessible: function setTargetApplicationAccessible()
  {
    var accService =
      XPCU.getService(kAccessibleRetrievalContractID, "nsIAccessibleRetrieval");

    if (accService) {
      if ("getApplicationAccessible" in accService) {
        this.mDocPanel.subject = accService.getApplicationAccessible();
      }
      else {
        // Gecko 1.9.2 support.
        var accessible = accService.getAccessibleFor(document);
        while (accessible.parent) {
          accessible = accessible.parent;
        }
        this.mDocPanel.subject = accessible;
      }
    }
  },

  setTargetWindow: function IA_SetTargetWindow(aWindow)
  {
    this.setTargetDocument(aWindow.document, true);
  },

  setTargetDocument: function IA_SetTargetDocument(aDoc, aIsInternal)
  {
    var cmd = document.getElementById("cmdToggleDocument");

    if (aIsInternal == undefined) {
      aIsInternal = false;
    }

    cmd.setAttribute("disabled", !aIsInternal);
    this.setBrowser(aIsInternal, true);

    this.mDocPanel.subject = aDoc;
  },

  get webNavigation()
  {
    var browser = document.getElementById("ifBrowser");
    return browser.webNavigation;
  },

  get locationBar()
  {
    return document.getElementById("tfURLBar");
  },

  ////////////////////////////////////////////////////////////////////////////
  //// UI Labels Getters and Setters

  get locationText()
  {
    return this.locationBar.value;
  },

  set locationText(aText)
  {
    this.locationBar.value = aText;
  },

  get statusText()
  {
    return document.getElementById("txStatus").value;
  },

  set statusText(aText)
  {
    document.getElementById("txStatus").value = aText;
  },

  get progress()
  {
    return document.getElementById("pmStatus").value;
  },

  set progress(aPct)
  {
    document.getElementById("pmStatus").value = aPct;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Document Loading

  documentLoaded: function IA_DocumentLoaded()
  {
    this.setTargetWindow(content);

    var url = this.webNavigation.currentURI.spec;

    // put the url into the urlbar
    this.locationText = url;

    // add url to the history, unless explicity told not to
    if (!this.mPendingNoSave) {
      this.addToHistory(url);
    }

    this.mPendingURL = null;
    this.mPendingNoSave = null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// History

  addToHistory: function IA_AddToHistory(aURL)
  {
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Uncategorized

  get isViewingContent()
  {
    return this.mPanelSet.getPanel(0).subject != null;
  },

  fillInTooltip: function IA_FillInTooltip(aMenuItem)
  {
    var doc = aMenuItem.doc;
    if (!doc) {
      return false;
    }

    var titleLabel = document.getElementById("docItemsTitle");
    var uriLabel = document.getElementById("docItemsURI");
    titleLabel.value = doc.title;
    uriLabel.value = doc.location.href;
    titleLabel.hidden = !titleLabel.value;
    return true;
  },

  initPopup: function IA_InitPopup(aPopup)
  {
    var items = aPopup.getElementsByTagName("menuitem");
    var js, fn, item;
    for (var i = 0; i < items.length; i++) {
      item = items[i];
      fn = "isDisabled" in item ? item.isDisabled : null;
      if (!fn) {
        js = item.getAttribute("isDisabled");
        if (js) {
          fn = new Function(js);
          item.isDisabled = fn;
        }
        else {
          // to prevent annoying "strict" warning messages
          item.isDisabled = null;
        }
      }
      if (fn) {
        if (item.isDisabled()) {
          item.setAttribute("disabled", "true");
        }
        else {
          item.removeAttribute("disabled");
        }
      }

      fn = null;
    }
  },

  emptyChildren: function IA_EmptyChildren(aNode)
  {
    while (aNode.hasChildNodes()) {
      aNode.removeChild(aNode.lastChild);
    }
  },

  onSplitterOpen: function IA_OnSplitterOpen(aSplitter)
  {
    if (aSplitter.id == "splBrowser") {
      this.setBrowser(aSplitter.isOpened, false);
    }
  },

  onViewerListCommand: function IA_OnViewerListCommand(aItem)
  {
    var mpp = aItem.parentNode;
    if (mpp == this.mDocViewerListPopup) {
      this.mDocPanel.onViewerListCommand(aItem);
    }
    else if (mpp == this.mObjectViewerListPopup) {
      this.mObjectPanel.onViewerListCommand(aItem);
    }
  },

  // needed by overlayed commands from viewer to get references to a specific
  // viewer object by name
  getViewer: function IA_GetViewer(aUID)
  {
    return this.mPanelSet.registry.getViewerByUID(aUID);
  }
};

////////////////////////////////////////////////////////////////////////////
//// Event Listeners

function BrowserPageShowListener(aEvent)
{
  // since we will also get pageshow events for frame documents,
  // make sure we respond to the top-level document load
  if (aEvent.target.defaultView == content) {
    inspector.documentLoaded();
  }
}
