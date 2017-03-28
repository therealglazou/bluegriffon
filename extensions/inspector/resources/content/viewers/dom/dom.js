/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* DOMViewer ------------------------------------------------------------------
*  Views all nodes within a document.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://global/content/XPCNativeWrapper.js
*   chrome://inspector/content/hooks.js
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/events/ObserverManager.js
*   chrome://inspector/content/jsutil/system/PrefUtils.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/xul/FrameExchange.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kDOMViewClassID             = "@mozilla.org/inspector/dom-view;1";
const kPromptServiceClassID       = "@mozilla.org/embedcomp/prompt-service;1";
const kAccessibleRetrievalClassID = "@mozilla.org/accessibleRetrieval;1";
const kDOMUtilsClassID            = "@mozilla.org/inspector/dom-utils;1";
const kDeepTreeWalkerClassID      = "@mozilla.org/inspector/deep-tree-walker;1";
const nsIDOMNode                  = Components.interfaces.nsIDOMNode;
const nsIDOMElement               = Components.interfaces.nsIDOMElement;
const nsIDOMDocument              = Components.interfaces.nsIDOMDocument;
const nsIDOMCharacterData         = Components.interfaces.nsIDOMCharacterData;

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", DOMViewer_initialize, false);
window.addEventListener("unload", DOMViewer_destroy, false);

function DOMViewer_initialize()
{
  viewer = new DOMViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

function DOMViewer_destroy()
{
  PrefUtils.removeObserver("inspector", PrefChangeObserver);
  viewer.removeClickListeners();
  viewer = null;
}

//////////////////////////////////////////////////////////////////////////////
//// class DOMViewer

function DOMViewer() // implements inIViewer
{
  this.mObsMan = new ObserverManager(this);

  this.mDOMUtils = XPCU.getService(kDOMUtilsClassID, "inIDOMUtils");

  this.mDOMTree = document.getElementById("trDOMTree");
  this.mDOMTreeBody = document.getElementById("trDOMTreeBody");

  // prepare and attach the DOM DataSource
  this.mDOMView = XPCU.createInstance(kDOMViewClassID, "inIDOMView");
  this.mDOMView.showSubDocuments = true;
  // hide attribute nodes
  this.mDOMView.whatToShow &= ~(NodeFilter.SHOW_ATTRIBUTE);
  this.mDOMTree.treeBoxObject.view = this.mDOMView;

  PrefUtils.addObserver("inspector", PrefChangeObserver);
}

DOMViewer.prototype =
{
  mSubject: null,
  mDOMView: null,
  // searching stuff
  mFindResult: null,
  mColumns: null,
  mFindDir: null,
  mFindParams: null,
  mFindType: null,
  mFindWalker: null,
  mSelecting: false,

  mSelectionBatchNest: 0,
  mPendingSelection: null,

  /**
   * Prevent the viewer from dispatching selectionChange events while batches
   * are underway.  The last change in selection while disabled is remembered,
   * however, and when all batches have ended, an event is dispatched for it.
   * To prevent this pending selectionChange from being dispatched, set
   * mPendingSelection to null before calling endSelectionBatch.
   *
   * Nested batches are permitted.
   */
  beginSelectionBatch: function DVr_BeginSelectionBatch()
  {
    ++this.mSelectionBatchNest;
  },

  endSelectionBatch: function DVr_EndSelectionBatch()
  {
    --this.mSelectionBatchNest;
    if (this.mSelectionBatchNest < 0) {
      Components.utils.reportError("Attempted to end a selection batch " +
                                   "that doesn't exist");
    }
    else if (!this.mSelectionBatchNest && this.mPendingSelection) {
      this.changeSelection(this.mPendingSelection);
      this.mPendingSelection = null;
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// interface inIViewer

  //// attributes

  get uid() {
    return "dom"
  },

  get pane() {
    return this.mPanel
  },

  get editable() {
    return true;
  },

  get selection() {
    return this.mSelection
  },

  get subject() {
    return this.mSubject
  },

  set subject(aObject) {
    this.mSubject = aObject;
    this.mDOMView.rootNode = aObject;
    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
    this.setInitialSelection(aObject);
  },

  //// methods

  /**
   * Properly sets up the DOM Viewer
   *
   * @param aPane
   *        The panel this references.
   */
  initialize: function DVr_initialize(aPane)
  {
    this.mPanel = aPane;

    this.setAnonContent(PrefUtils.getPref("inspector.dom.showAnon"));
    this.setProcessingInstructions(
      PrefUtils.getPref("inspector.dom.showProcessingInstructions")
    );
    this.setAccessibleNodes(
      PrefUtils.getPref("inspector.dom.showAccessibleNodes")
    );
    this.setWhitespaceNodes(
      PrefUtils.getPref("inspector.dom.showWhitespaceNodes")
    );

    this.pane.panelset.addTransactionListener(this);

    aPane.notifyViewerReady(this);
  },

  destroy: function DVr_Destroy()
  {
    this.mDOMTree.treeBoxObject.view = null;
    this.pane.panelset.removeTransactionListener(this);
  },

  isCommandEnabled: function DVr_IsCommandEnabled(aCommand)
  {
    // NB: Don't confuse selected nodes and currentNode.  currentNode derives
    // from currentIndex.  Think of currentIndex like the position of the
    // cursor in a textbox.  Commands like Copy need text to be selected,
    // while Paste and Insert need no selection, only that the cursor be in
    // the area we're interested in.
    // XXX Bring all commands around to handling multiple selection.
    var clipboardNode = null;
    var currentNode = null;
    var parentNode = null;
    var selectedNode = this.selectedNode;
    if (/^cmdEditPaste/.test(aCommand)) {
      if (this.mPanel.panelset.clipboardFlavor != "inspector/dom-node") {
        return false;
      }
      clipboardNode = this.mPanel.panelset.getClipboardData();
    }
    if (/^cmdEdit(Paste|Insert)/.test(aCommand)) {
      currentNode =
        viewer.currentNode && new XPCNativeWrapper(viewer.currentNode);
      parentNode = currentNode && currentNode.parentNode;
    }
    switch (aCommand) {
      case "cmdEditPaste":
      case "cmdEditPasteBefore":
        // Paste before and after, like Insert, don't operate on a selection,
        // but the other paste commands do.
        return this.isValidChild(parentNode, clipboardNode);
      case "cmdEditPasteReplace":
        return !!selectedNode &&
               this.isValidChild(parentNode, clipboardNode, selectedNode);
      case "cmdEditPasteFirstChild":
      case "cmdEditPasteLastChild":
        return this.isValidChild(selectedNode, clipboardNode);
      case "cmdEditPasteAsParent":
        return !!selectedNode &&
               this.isValidChild(clipboardNode, selectedNode) &&
               this.isValidChild(parentNode, clipboardNode, selectedNode);
      case "cmdEditInsertAfter":
      case "cmdEditInsertBefore":
      	return parentNode instanceof nsIDOMElement;
      case "cmdEditInsertFirstChild":
      case "cmdEditInsertLastChild":
      	return selectedNode instanceof nsIDOMElement;
      case "cmdEditCut":
      case "cmdEditCopy":
        return !!selectedNode;
      case "cmdEditDelete":
        // If at least one of the selected nodes can be deleted, allow it.
        let selectedNodes = this.getSelectedNodes();
        for (let i = 0, n = selectedNodes.length; i < n; ++i) {
          if (cmdEditDelete.isDeletable(selectedNodes[i])) {
            return true;
          }
        }
        return false;
      case "cmdInspectBrowser":
        if (!(selectedNode instanceof nsIDOMElement)) {
          return false;
        }
        let n = selectedNode.localName.toLowerCase();
        return n == "tabbrowser" || n == "browser" || n == "iframe" ||
               n == "frame" || n == "editor";
      case "cmdBlink":
        return selectedNode instanceof nsIDOMElement;
      case "cmdCopyXML":
      case "cmdShowPseudoClasses":
        return true;
      case "cmdEditInspectInNewWindow":
        return this.mDOMTree.view.selection.count == 1;
    }
    return false;
  },

 /**
  * Determines whether the passed parent/child combination is valid.
  * @param parent
  * @param child
  * @param replaced
  *        the node the child is replacing (optional)
  * @return whether the passed parent can have the passed child as a child,
  */
  isValidChild: function DVr_IsValidChild(parent, child, replaced)
  {
    // the document (fragment) node must be an only child and can't be
    // replaced
    if (parent == null) {
      return false;
    }
    // the only types that can ever have children
    if (parent.nodeType != nsIDOMNode.ELEMENT_NODE &&
        parent.nodeType != nsIDOMNode.DOCUMENT_NODE &&
        parent.nodeType != nsIDOMNode.DOCUMENT_FRAGMENT_NODE) {

      return false;
    }
    // the only types that can't ever be children
    if (child.nodeType == nsIDOMNode.DOCUMENT_NODE ||
        child.nodeType == nsIDOMNode.DOCUMENT_FRAGMENT_NODE ||
        child.nodeType == nsIDOMNode.ATTRIBUTE_NODE) {

      return false;
    }
    // doctypes can only be the children of documents
    if (child.nodeType == nsIDOMNode.DOCUMENT_TYPE_NODE &&
        parent.nodeType != nsIDOMNode.DOCUMENT_NODE) {

      return false;
    }
    // only elements and fragments can have text, cdata, and entities as
    // children
    if (parent.nodeType != nsIDOMNode.ELEMENT_NODE &&
        parent.nodeType != nsIDOMNode.DOCUMENT_FRAGMENT_NODE &&
        (child.nodeType == nsIDOMNode.TEXT_NODE ||
         child.nodeType == nsIDOMNode.CDATA_NODE ||
         child.nodeType == nsIDOMNode.ENTITY_NODE)) {

      return false;
    }
    // documents can only have one document element or doctype
    if (parent.nodeType == nsIDOMNode.DOCUMENT_NODE &&
        (child.nodeType == nsIDOMNode.ELEMENT_NODE ||
         child.nodeType == nsIDOMNode.DOCUMENT_TYPE_NODE) &&
        (!replaced || child.nodeType != replaced.nodeType)) {

      for (var i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeType == child.nodeType) {
          return false;
        }
      }
    }
    return true;
  },

  getCommand: function DVr_GetCommand(aCommand)
  {
    if (aCommand in window) {
      try {
        return new window[aCommand]();
      }
      catch (ex) {
        // User canceled the transaction.
      }
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// nsITransactionListener implementation

  willDo: function DVr_WillDo(aManager, aTransaction)
  {
    var command = aTransaction.wrappedJSObject;
    if (command instanceof cmdEditDelete) {
      let nodes = command.nodes;
      let deletables = [];
      for (let i = 0, n = nodes.length; i < n; ++i) {
        let node = nodes[i];
        if (cmdEditDelete.isDeletable(node)) {
          deletables.push(node);
        }
      }

      // Save the currentNode and the linked pane's current subject, but
      // don't overwrite them on redo.
      if (!("oldCurrentNode" in command)) {
        command.oldCurrentNode = this.currentNode;
        command.oldLinkedSubject = this.mSelection;
      }

      if (cmdEditDelete.isDeletable(this.mSelection)) {
        command.newLinkedSubject =
          this.getNextInNextBestChain(this.mSelection, undefined,
                                      function DVr_WillDo_Filter(aNode)
                                      {
                                        return deletables.indexOf(aNode) >= 0;
                                      });
      }
    }
  },

  didDo: function DVr_DidDo(aManager, aTransaction, aResult)
  {
    var command = aTransaction.wrappedJSObject;
    if (command instanceof cmdEditDelete) {
      if (!("newLinkedSubject" in command)) {
        // The linked panel's old subject wasn't deletable, but the
        // transaction went through because other selected nodes were.  Leave
        // things alone and let the linked subject and any other non-deletable
        // nodes remain selected.
        return;
      }
      let newLinkedSubject = command.newLinkedSubject;
      let selection = this.mDOMTree.view.selection;
      if (selection.count > 0) {
        // There are still some nodes selected (because they weren't
        // deletable).  newLinkedSubject should be one of them.
        let idx = this.getRowIndexFromNode(newLinkedSubject);
        if (!selection.isSelected(idx)) {
          debug("node chosen for new linked subject was apparently deletable");
          return;
        }
        this.changeSelection(newLinkedSubject);
      }
      else {
        this.showNodeInTree(newLinkedSubject);
      }
    }
  },

  willUndo: stubImpl,

  didUndo: function DVr_DidUndo(aManager, aTransaction, aResult)
  {
    var command = aTransaction.wrappedJSObject;
    if (command instanceof cmdEditDelete) {
      // Find all "deleted" rows and select them, even any that weren't
      // deletable.  We also want currentNode and mSelection to reflect the
      // values they had before this transaction.
      let nodes = command.nodes;
      if (!nodes.length) {
        return;
      }

      // Disable selectionChange events, because otherwise the linked pane's
      // viewers will be flipping around, which is also computational overhead
      // that we just don't need.
      this.mDOMTree.treeBoxObject.beginUpdateBatch();
      this.beginSelectionBatch();

      this.mDOMTree.view.selection.clearSelection();
      for (let i = nodes.length - 1; i >= 0; --i) {
        this.showNodeInTree(nodes[i], true);
      }
      this.changeSelection(command.oldLinkedSubject);
      this.mDOMTree.currentIndex =
        this.getRowIndexFromNode(command.oldCurrentNode);

      this.endSelectionBatch();
      this.mDOMTree.treeBoxObject.endUpdateBatch();
    }
  },

  willRedo: function DVr_WillRedo(aManager, aTransaction)
  {
    var command = aTransaction.wrappedJSObject;
    if (command instanceof cmdEditDelete) {
      this.willDo(aManager, aTransaction);
    }
  },

  didRedo: function DVr_DidRedo(aManager, aTransaction, aResult)
  {
    var command = aTransaction.wrappedJSObject;
    if (command instanceof cmdEditDelete) {
      this.didDo(aManager, aTransaction, aResult);
    }
  },

  willBeginBatch: stubImpl,

  didBeginBatch: stubImpl,

  willEndBatch: stubImpl,

  didEndBatch: stubImpl,

  willMerge: stubImpl,

  didMerge: stubImpl,

  ////////////////////////////////////////////////////////////////////////////
  //// Event Dispatching

  addObserver: function DVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function DVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// UI Commands

  showFindDialog: function DVr_ShowFindDialog()
  {
    var win =
      openDialog("chrome://inspector/content/viewers/dom/findDialog.xul",
                 "_blank", "chrome,dependent", this.mFindType, this.mFindDir,
                 this.mFindParams);
  },

  /**
   * Toggles the setting for displaying anonymous content.
   */
  toggleAnonContent: function DVr_ToggleAnonContent()
  {
    var value = PrefUtils.getPref("inspector.dom.showAnon");
    PrefUtils.setPref("inspector.dom.showAnon", !value);
  },

  /**
   * Sets the UI and filters for anonymous content.
   *
   * @param aValue
   *        The value that we should be setting things to.
   */
  setAnonContent: function DVr_SetAnonContent(aValue)
  {
    this.mDOMView.showAnonymousContent = aValue;
    this.mPanel.panelset.setCommandAttribute("cmd:toggleAnon", "checked",
                                             aValue);
  },

  toggleSubDocs: function DVr_ToggleSubDocs()
  {
    var val = !this.mDOMView.showSubDocuments;
    this.mDOMView.showSubDocuments = val;
    this.mPanel.panelset.setCommandAttribute("cmd:toggleSubDocs", "checked",
                                             val);
  },

  /**
   * Toggles the visibility of Processing Instructions.
   */
  toggleProcessingInstructions: function DVr_ToggleProcessingInstructions()
  {
    var value = PrefUtils.getPref("inspector.dom.showProcessingInstructions");
    PrefUtils.setPref("inspector.dom.showProcessingInstructions", !value);
  },

  /**
   * Sets the visibility of Processing Instructions.
   *
   * @param aValue
   *        The visibility of the instructions.
   */
  setProcessingInstructions: function DVr_SetProcessingInstructions(aValue)
  {
    this.mPanel.panelset
      .setCommandAttribute("cmd:toggleProcessingInstructions", "checked",
                           aValue);
    if (aValue) {
      this.mDOMView.whatToShow |= NodeFilter.SHOW_PROCESSING_INSTRUCTION;
    }
    else {
      this.mDOMView.whatToShow &= ~NodeFilter.SHOW_PROCESSING_INSTRUCTION;
    }
  },

  /**
   * Toggle state of 'Show Accessible Nodes' option.
   */
  toggleAccessibleNodes: function DVr_ToggleAccessibleNodes()
  {
    var value = PrefUtils.getPref("inspector.dom.showAccessibleNodes");
    PrefUtils.setPref("inspector.dom.showAccessibleNodes", !value);
  },

  /**
   * Set state of 'Show Accessible Nodes' option.
   *
   * @param aValue
   *        if true then accessible nodes will be shown
   */
  setAccessibleNodes: function DVr_SetAccessibleNodes(aValue)
  {
    if (!(kAccessibleRetrievalClassID in Components.classes)) {
      aValue = false;
    }

    this.mDOMView.showAccessibleNodes = aValue;
    this.mPanel.panelset.setCommandAttribute("cmd:toggleAccessibleNodes",
                                             "checked", aValue);
  },

  /**
   * Return state of 'Show Accessible Nodes' option.
   */
  getAccessibleNodes: function DVr_GetAccessibleNodes()
  {
    return this.mDOMView.showAccessibleNodes;
  },

  /**
   * Toggles the value for whitespace nodes.
   */
  toggleWhitespaceNodes: function DVr_ToggleWhitespaceNodes()
  {
    var value = PrefUtils.getPref("inspector.dom.showWhitespaceNodes");
    PrefUtils.setPref("inspector.dom.showWhitespaceNodes", !value);
  },

  /**
   * Sets the UI for displaying whitespace nodes.
   *
   * @param aValue
   *        true if whitespace nodes should be shown
   */
  setWhitespaceNodes: function DVr_SetWhitespaceNodes(aValue)
  {
    this.mPanel.panelset.setCommandAttribute("cmd:toggleWhitespaceNodes",
                                             "checked", aValue);
    this.mDOMView.showWhitespaceNodes = aValue;
  },

  showColumnsDialog: function DVr_ShowColumnsDialog()
  {
    var win =
      openDialog("chrome://inspector/content/viewers/dom/columnsDialog.xul",
                 "_blank", "chrome,dependent", this);
  },

  cmdShowPseudoClasses: function DVr_CmdShowPseudoClasses()
  {
    var node = this.selectedNode;

    if (node) {
      openDialog("chrome://inspector/content/viewers/dom/" +
                   "pseudoClassDialog.xul",
                 "_blank", "chrome", node);
    }
  },

  cmdBlink: function DVr_CmdBlink()
  {
    this.flashElement(this.selectedNode);
  },

  onTreeSelectionChange: function DVr_OnTreeSelectionChange()
  {
    // NB: We're called on deselection, too.
    var currentIndex = this.mDOMTree.currentIndex;
    var currentNode = this.currentNode;

    if (this.mDOMTree.view.selection.isSelected(currentIndex)) {
      this.changeSelection(currentNode);
    }
    // Otherwise, we were deselected.  We only care, though, if we're the
    // object viewer's subject, and there are other nodes selected.  (If no
    // nodes are selected, we'll leave mSelection alone and won't fire any
    // events, because nobody wants to inspect null.)
    else if (this.mSelection == currentNode &&
             this.mDOMTree.view.selection.count) {
      // Find closest nearby selected node and use that.
      var nearestSelectedIndex =
        InsUtil.getNearestIndex(currentIndex, this.getSelectedIndexes());
      this.changeSelection(this.getNodeFromRowIndex(nearestSelectedIndex));
    }

    viewer.pane.panelset.updateAllCommands();
  },

  /**
   * Change the viewer selection.  Note that "selection" here refers to the
   * (not formalized) inIViewer::selection, *not* the tree selection.  See
   * bug 570879.
   * @param aNode
   *        The new viewer selection.  If there is an object panel linked to
   *        ours, this will be used for its subject.
   */
  changeSelection: function DVr_ChangeSelection(aNode)
  {
    if (this.mSelectionBatchNest) {
      this.mPendingSelection = aNode;
    }
    else {
      this.mSelection = aNode;
      this.mObsMan.dispatchEvent("selectionChange", { selection: aNode } );
      if (this.mSelection) {
        this.flashElement(this.mSelection, true);
      }
    }
  },

  setInitialSelection: function DVr_SetInitialSelection(aObject)
  {
    var fireSelected = this.mDOMTree.currentIndex == 0;

    if (this.mPanel.params) {
      this.showNodeInTree(this.mPanel.params);
    }
    else {
      this.showNodeInTree(aObject, false, true);
    }

    if (fireSelected) {
      this.onTreeSelectionChange();
    }
  },

  onPopupShowing: function DVr_OnPopupShowing(aPopup)
  {
    if (aPopup.id != "ppDOMContext") {
      // This is a nested menupopup, and it should have been already taken
      // care of.
      return;
    }
    this.checkMenu(aPopup);
  },

  /**
   * Recursively enable/disable descendants of a given popup, based on whether
   * their commands are enabled or disabled.  If the descendant has a
   * checkvalid attribute, the descendant will be hidden as well as disabled.
   * Recursively checked menus will be enabled or disabled depending on
   * whether there are one or more enabled children in their respective
   * menupopups.
   * @param aPopup
   *        The menupopup at which to start checking.
   * @return true if the popup contains any enabled items
   */
  checkMenu: function DVr_CheckMenu(aPopup) {
    // We can't use XBL getters/setters here, because we're using recursion,
    // and items in nested menus won't have CSS frames since they're not
    // visible.
    var hasEnabledItems = false;
    for (let i = 0; i < aPopup.childNodes.length; ++i) {
      let el = aPopup.childNodes[i];
      if (el.localName == "menuseparator") {
        continue;
      }
      let subject = el;
      let isEnabled = false;
      let checkValid = false;
      if (el.hasAttribute("command")) {
        let cmd = document.getElementById(el.getAttribute("command"));
        if (cmd) {
          checkValid = el.hasAttribute("checkvalid");
          isEnabled = this.isCommandEnabled(cmd.id);
          subject = cmd;
        }
      }
      else if (el.localName == "menu") {
        let kid = el.firstChild;
        while (kid) {
          if (kid.localName == "menupopup") {
            // Disable this menu if none of the descendants are enabled.
            isEnabled = this.checkMenu(kid);
            break;
          }
          kid = kid.nextSibling;
        }
      }
      else if (el.getAttribute("disabled") != "true") {
        // There is no command here.  (Maybe we're being extended?)  We'll
        // leave it up to third parties to manage enabling/disabling their own
        // menuitems, and assume that they already reflect the correct state
        // by the time we're called.
        isEnabled = true;
      }

      if (isEnabled) {
        hasEnabledItems = true;
        subject.removeAttribute("disabled");
      }
      else {
        subject.setAttribute("disabled", "true");
      }

      if (checkValid) {
        el.hidden = !isEnabled;
      }
    }

    return hasEnabledItems;
  },

  cmdInspectBrowser: function DVr_CmdInspectBrowser()
  {
    var node = this.selectedNode;
    var n = node && node.localName.toLowerCase();
    if (n == "iframe" || n == "frame" ||
        (node.namespaceURI == kXULNSURI && (n == "browser" ||
                                            n == "tabbrowser" ||
                                            n == "editor"))) {
      this.pane.subject = node.contentDocument;
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// XML Serialization

  cmdCopySelectedXML: function DVr_CmdCopySelectedXML()
  {
    var node = this.selectedNode;
    if (node) {
      var xml = this.toXML(node);

      var helper = XPCU.getService(kClipboardHelperClassID,
                                   "nsIClipboardHelper");
      helper.copyString(xml);
    }
  },

  toXML: function DVr_ToXML(aNode)
  {
    return (new XMLSerializer()).serializeToString(aNode);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Click Selection

  selectByClick: function DVr_SelectByClick()
  {
    if (this.mSelecting) {
      this.stopSelectByClick();
      this.removeClickListeners();
    }
    else {
      // wait until after user releases the mouse after selecting this command
      // from a UI element
      window.setTimeout("viewer.startSelectByClick()", 10);
    }
  },

  startSelectByClick: function DVr_StartSelectByClick()
  {
    this.mSelecting = true;
    this.mSelectDocs = this.getAllDocuments();

    for (var i = 0; i < this.mSelectDocs.length; ++i) {
      var doc = this.mSelectDocs[i];
      doc.addEventListener("mousedown", MouseDownListener, true);
      doc.addEventListener("mouseup", EventCanceller, true);
      doc.addEventListener("click", ListenerRemover, true);
      // If user moves the mouse out of the original target area, there
      // will be no onclick event fired.... so we have to deal with
      // that.
      doc.addEventListener("mouseout", ListenerRemover, true);
    }
    this.mPanel.panelset.setCommandAttribute("cmd:selectByClick", "checked",
                                             "true");
  },

  doSelectByClick: function DVr_DoSelectByClick(aTarget)
  {
    if (aTarget.nodeType == nsIDOMNode.TEXT_NODE) {
      aTarget = aTarget.parentNode;
    }

    this.stopSelectByClick();
    this.showNodeInTree(aTarget);
  },

  stopSelectByClick: function DVr_StopSelectByClick()
  {
    this.mSelecting = false;

    this.mPanel.panelset.setCommandAttribute("cmd:selectByClick", "checked",
                                             null);
  },

  removeClickListeners: function DVr_RemoveClickListeners()
  {
    if (!this.mSelectDocs) { // we didn't select an element by click
      return;
    }

    for (var i = 0; i < this.mSelectDocs.length; ++i) {
      var doc = this.mSelectDocs[i];
      doc.removeEventListener("mousedown", MouseDownListener, true);
      doc.removeEventListener("mouseup", EventCanceller, true);
      doc.removeEventListener("click", ListenerRemover, true);
      doc.removeEventListener("mouseout", ListenerRemover, true);
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Find Methods

  startFind: function DVr_StartFind(aType, aDir)
  {
    this.mFindResult = null;
    this.mFindType = aType;
    this.mFindDir = aDir;
    this.mFindParams = [];
    for (var i = 2; i < arguments.length; ++i) {
      this.mFindParams[i-2] = arguments[i];
    }

    var fn = null;
    switch (aType) {
      case "id":
        fn = "doFindElementById";
        break;
      case "tag":
        fn = "doFindElementsByTagName";
        break;
      case "attr":
        fn = "doFindElementsByAttr";
        break;
    };

    this.mFindFn = fn;
    this.mFindWalker = this.createDOMWalker(this.mDOMView.rootNode);
    this.findNext();
  },

  findNext: function DVr_FindNext()
  {
    var walker = this.mFindWalker;
    if (!walker) {
      Components.utils.reportError("deep tree walker unavailable");
      return;
    }
    var result = null;
    var currentNode = walker.currentNode;
    while (currentNode) {
      if (this[this.mFindFn](walker)) {
        result = walker.currentNode;
        walker.nextNode();
        break;
      }
      currentNode = walker.nextNode();
    }

    if (result && result != this.mFindResult) {
      this.showNodeInTree(result);
      this.mFindResult = result;
      this.mDOMTree.focus();
    }
    else {
      var bundle = this.mPanel.panelset.stringBundle;
      var msg = bundle.getString("findNodesDocumentEnd.message");
      var title = bundle.getString("findNodesDocumentEnd.title");

      var promptService = XPCU.getService(kPromptServiceClassID,
                                         "nsIPromptService");
      promptService.alert(window, title, msg);
    }
  },

  doFindElementById: function DVr_DoFindElementById(aWalker)
  {
    var re = new RegExp(this.mFindParams[0], "i");

    // NB: In HTML getAttribute can return null, so we have to check that it's
    // actually set; if we don't and the search string is "null", implicit
    // toString conversion means that we'll match on every element without an
    // ID.  Additionally, for elements without an ID, getAttribute returns an
    // empty string in XUL (bug 232598), so our check must handle that...
    return aWalker.currentNode &&
           aWalker.currentNode.nodeType == nsIDOMNode.ELEMENT_NODE &&
           aWalker.currentNode.hasAttribute("id") &&
           re.test(aWalker.currentNode.getAttribute("id"));
  },

  doFindElementsByTagName: function DVr_DoFindElementsByTagName(aWalker)
  {
    var re = new RegExp(this.mFindParams[0], "i");

    return aWalker.currentNode &&
           aWalker.currentNode.nodeType == nsIDOMNode.ELEMENT_NODE &&
           re.test(aWalker.currentNode.localName);
  },

  doFindElementsByAttr: function DVr_DoFindElementsByAttr(aWalker)
  {
    var re = new RegExp(this.mFindParams[1], "i");

    return aWalker.currentNode &&
           aWalker.currentNode.nodeType == nsIDOMNode.ELEMENT_NODE &&
           aWalker.currentNode.hasAttribute(this.mFindParams[0]) &&
           re.test(aWalker.currentNode.getAttribute(this.mFindParams[0]));
  },

  /**
   * Makes sure each ancestor in the given node's ancestor chain is open, so
   * so that there exists a row in the tree that represents the node.  That
   * row will be selected and scrolled into view.  If that node doesn't have a
   * row in the tree, the nearest ancestor is used as a fallback.  Further
   * parameters allow finer control over what it means to "show" a node,
   * including overriding the default behavior.
   *
   * @param aNode
   *        Node to show.
   * @param aAugment [optional]
   *        true if selection should add to the current selection, false if it
   *        should clear it and be the only row selected.  This has no effect
   *        if aNoSelect is true.
   * @param aExpand [optional]
   *        true if the node's open state should be changed to open.
   * @param aNoVisible [optional]
   *        true if you don't care whether the given node is scrolled into
   *        sight.
   * @param aNoSelect [optional]
   *        true if you don't want the given element to be selected.
   * @return The current index of the given node in the tree.
   */
  showNodeInTree:
    function DVr_ShowNodeInTree(aNode, aAugment, aExpand, aNoVisible,
                                aNoSelect)
  {
    var bx = this.mDOMTree.treeBoxObject;

    if (!aNode) {
      if (!aAugment && !aNoSelect) {
        bx.view.selection.select(-1);
      }
      return -1;
    }

    // Keep searching until a pre-created ancestor is found, and then open
    // each ancestor until the row for the given node is created.
    var line = [];
    var parent = aNode;
    var index = null;
    while (parent) {
      index = this.getRowIndexFromNode(parent);
      line.push(parent);
      if (index < 0) {
        // The row for this node hasn't been created yet.
        parent =
          this.mDOMUtils.getParentForNode(parent,
                                          this.mDOMView.showAnonymousContent);
      }
      else {
        // The ancestor chain is already open above this point.
        break;
      }
    }

    // We've got all the ancestors, now open them one-by-one from the top
    // down.
    var view = bx.view;
    var lastIndex;
    for (let i = line.length - 1; i >= 0; --i) {
      index = this.getRowIndexFromNode(line[i]);
      if (index < 0)  {
        index = -1;
        break; // We can't find the row, so stop trying to descend.
      }
      if ((aExpand || i > 0) && !view.isContainerOpen(index)) {
        view.toggleOpenState(index);
      }
      lastIndex = index;
    }

    if (lastIndex >= 0) {
      if (!aNoVisible) {
        bx.ensureRowIsVisible(lastIndex);
      }
      if (!aNoSelect) {
        view.selection.rangedSelect(lastIndex, lastIndex, aAugment);
      }
    }

    return index;
  },

  /**
   * Rebuild the tree by re-opening previously opened rows, re-selecting
   * previously selected rows, and restoring the viewer selection and the
   * node previously at currentNode, if possible.
   * @param aIncludeAnons [optional]
   *        If a rebuild was triggered in response to a pref change for
   *        showing anonymous content, this must be former pref value.
   */
  rebuild: function DVr_Rebuild(aIncludeAnons)
  {
    var selection = this.mDOMTree.view.selection;

    // Remember all non-ignorable nodes of open rows.  Re-opening them will be
    // the first step to recreating the tree's state.
    var opened = [];
    for (let i = 0, n = this.mDOMTree.view.rowCount; i < n; ++i) {
      if (this.mDOMTree.view.isContainerOpen(i)) {
        let node = this.getNodeFromRowIndex(i);
        if (!this.isIgnorableNode(node)) {
          opened.push(node);
        }
      }
    }

    // Remember all nodes of selected rows.  Also save the indexes of rows of
    // non-ignorable nodes so we can determine the best viewer selection
    // candidate below.
    var ignorableSelectedNodes = [];
    var nonIgnorableSelectedNodes = [];
    var nonIgnorableSelectedIndexes = [];
    let selectedIndexes = this.getSelectedIndexes();
    for (let i = 0, n = selectedIndexes.length; i < n; ++i) {
      let idx = selectedIndexes[i];
      let node = this.getNodeFromRowIndex(idx);
      if (this.isIgnorableNode(node)) {
        ignorableSelectedNodes.push(node);
      }
      else {
        nonIgnorableSelectedNodes.push(node);
        nonIgnorableSelectedIndexes.push(idx);
      }
    }

    // Remember the node showing in the object pane.  If the current node
    // there is going to be filtered out, pick another one by using the same
    // algorithm used when a row is deselected.
    var viewerSelection = this.selection;
    if (this.isIgnorableNode(viewerSelection)) {
      let idx = this.getRowIndexFromNode(viewerSelection);
      let nearestNonIgnorableSelectedIndex =
        InsUtil.getNearestIndex(idx, nonIgnorableSelectedIndexes);
      viewerSelection =
        this.getNodeFromRowIndex(nearestNonIgnorableSelectedIndex);
    }
    if (!viewerSelection) {
      // There was no nearest non-ignorable selected node (ostensibly, because
      // there are no non-ignorable selected nodes), so find a fallback from
      // the next-best chain.
      if (nonIgnorableSelectedNodes.length) {
        debug("some nodes are non-ignorable, but no suitable viewer " +
              "selection was found");
      }
      viewerSelection =
        this.getNextInNextBestChain(this.selection, aIncludeAnons);
    }

    // Remember currentNode.
    var currentNode = this.currentNode;
    if (this.isIgnorableNode(currentNode)) {
      currentNode = this.getNextInNextBestChain(currentNode, aIncludeAnons);
    }

    selection.clearSelection();
    this.mDOMView.rebuild();

    // We're now operating under the new inIDOMView parameters.  Restore the
    // previously opened rows.  This won't, however, ensure that all non-
    // ignorable nodes which were previously exposed will be re-exposed.
    // Consider the case of going from not showing anons to showing them, and
    // where the ancestor of a previously exposed, non-ignorable node (or the
    // node itself) is inserted as a "child" of an anonymous node.  See the
    // comments below about re-selecting nodes for how we deal with this.
    this.mDOMTree.treeBoxObject.beginUpdateBatch();
    for (let i = 0, n = opened.length; i < n; ++i) {
      let idx = 
        this.showNodeInTree(opened[i], false, // Don't augment the selection.
                                       true,  // Expand to show children.
                                       true,  // The node need not be visible.
                                       true); // Don't select it.
      if (idx < 0) {
        debug("previously opened node expected to be in tree but isn't");
      }
    }

    // Re-select all rows for non-ignorable nodes which had been previously
    // selected.
    this.beginSelectionBatch();
    for (let i = 0, n = nonIgnorableSelectedNodes.length; i < n; ++i) {
      let idx = this.showNodeInTree(nonIgnorableSelectedNodes[i], true);
      if (idx < 0) {
        debug("previously selected node expected to have row in tree but " +
              "doesn't");
      }
    }

    // For rows of previously selected nodes which are ignorable, we call
    // showNodeInTree on them without selecting them, in order to make sure as
    // much of their ancestor chain is exposed as possible.  This two-phase
    // system is necessary because it's not guaranteed that all non-ignorable
    // rows which were exposed before are now exposed again.  See the above
    // comments about re-opening nodes for why this is true.
    for (let i = 0, n = ignorableSelectedNodes.length; i < n; ++i) {
      let idx = this.showNodeInTree(ignorableSelectedNodes[i], false, false,
                                    true, true);
      if (idx >= 0) {
        debug("previously selected node expected to be ignorable but still " +
              "has a row in the tree");
        // Well, I guess we'll go ahead and select it then...
        selection.toggleSelect(idx);
      }
    }

    // Restore the viewer selection.
    if (!selection.count) {
      // All previously selected nodes have been filtered out.  Select the
      // fallback we found from the next-best chain.
      this.showNodeInTree(viewerSelection);
    }
    else if (this.mPendingSelection != viewerSelection) {
      // The previous viewer selection should now be one of the selected
      // nodes, but it's not the one that was selected last.
      if (this.getRowIndexFromNode(viewerSelection) >= 0) {
        this.changeSelection(viewerSelection);
      }
      else {
        debug("new viewer selection expected to have row in tree but " +
              "doesn't");
      }
    }

    // Attempt to restore currentIndex to the previous currentNode.
    var currentIndex = this.showNodeInTree(currentNode, false, false, true,
                                           true);
    if (currentIndex >= 0) {
      this.mDOMTree.currentIndex = currentIndex;
    }
    else if (currentNode) {
      debug("currentNode expected to have row in tree but doesn't");
    }

    this.mDOMTree.treeBoxObject.endUpdateBatch();
    this.endSelectionBatch();
  },

  /**
   * Determine whether the given node will be displayed in the tree, based on
   * the tree's current show parameters and node filters.
   * @param aNode
   *        A node contained within the subtree of the tree's root (including
   *        any subdocuments and their children).
   * @return A boolean indicating whether the node is ignorable
   */
  isIgnorableNode: function DVr_IsIgnorableNode(aNode)
  {
    if (!(aNode instanceof nsIDOMNode)) {
      return true;
    }

    // The node filter doesn't actually get checked for documents in
    // inDOMView.
    if (!(aNode instanceof nsIDOMDocument)) {
      let nodeTypeFilter = 1 << (aNode.nodeType - 1);
      if (!(this.mDOMView.whatToShow & nodeTypeFilter)) {
        return true;
      }
    }

    if (aNode instanceof nsIDOMCharacterData &&
        this.mDOMUtils.isIgnorableWhitespace(aNode) &&
        !this.mDOMView.showWhitespaceNodes) {
      return true;
    }

    if (aNode != this.mDOMView.rootNode) {
      if (!this.mDOMView.showSubDocuments &&
          aNode.ownerDocument != this.mDOMView.rootNode) {
        return true;
      }
  
      if (!this.mDOMView.showAnonymousContent) {
        // Anonymous nodes are obviously ignorable,  but so are non-anonymous
        // nodes in the contentDocument of an anonymous element (as is the
        // contentDocument itself).
        let current = aNode;
        if (current instanceof nsIDOMDocument) {
          current = this.mDOMUtils.getParentForNode(current, true);
        }
        while (current && current.ownerDocument) {
          if (current.ownerDocument.getBindingParent(current)) {
            return true;
          }
          if (current.ownerDocument == this.mDOMView.rootNode) {
            break;
          }
          current = this.mDOMUtils.getParentForNode(current.ownerDocument, 
                                                    true);
        }
      }
    }

    return false;
  },

  /**
   * The next-best chain extending from a given node is defined as the next
   * non-ignorable siblings in document order, followed the preceding non-
   * ignorable siblings in reverse document order, followed by the parent node
   * (if it's non-ignorable) and its non-ignorable siblings ordered similarly,
   * continuing all the way up the ancestor chain.
   * @param aNode
   *        The node for which we'll traverse its next-best chain.
   * @param aIncludeAnons [optional]
   *        Whether to consider the effects of anonymous content on the chain
   *        structure.  Note that this is not necessarily the same as the DOM
   *        view's showAnonymousContent attribute, and even if true, won't
   *        affect whether anonymous nodes can be returned.  However, the
   *        default is whatever the showAnonymousContent attribute's value is.
   * @param aFilterFn [optional]
   *        If specified, when a node is considered, aFilterFn will be called
   *        with that node as its only parameter.  A truthy return value will
   *        disqualify the node's eligibility to be returned as the next in
   *        the next-best chain.  NB: A falsy return value won't guarantee
   *        that the node will positively appear in the chain; all nodes still
   *        need to pass the isIgnorableNode check.
   * @return The next node in the next-best chain.
   */
  getNextInNextBestChain:
    function DVr_GetNextInNextBestChain(aNode, aIncludeAnons, aFilterFn)
  {
    if (!aNode) {
      return null;
    }

    var withoutFilter = function DVr_GetNextInNextBestChain_IsIgnorable(aNode)
    {
      return viewer.isIgnorableNode(aNode);
    };
    var withFilter =
      function DVr_GetNextInNextBestChain_FilteredIsIgnorable(aNode)
    {
      return viewer.isIgnorableNode(aNode) || aFilterFn(aNode);
    };

    var isIgnorable = aFilterFn ? withFilter : withoutFilter;
    

    // The approach is broken down as follows:
    // 1. Locating the topmost ignorable node in the ancestor chain (including
    //    the given node).
    // 2. Locating the next non-ignorable sibling of that ancestor, beginning
    //    by searching forward in the sibling group starting at that node then
    //    backwards if we exhaust the list of all siblings that follow.
    var showAnons = this.mDOMView.showAnonymousContent;
    var ancestorChain = [];
    var ancestor = aNode;
    while (ancestor != this.mDOMView.rootNode) {
      ancestor = this.mDOMUtils.getParentForNode(ancestor, showAnons);
      if (!ancestor) {
        break;
      }
      ancestorChain.push(ancestor);
    }
    var topmost = aNode;
    for (let i = ancestorChain.length - 1; i >= 0; --i) {
      // XXX This is O(h*d), where h is the node depth from the root, and d is
      // the document nesting level of aNode's ownerDocument.  If the document
      // consists entirely of nested iframes/browsers/what-have-you, that
      // means it will technically be O(h^2).  There's room for optimization
      // here, but d is expected to be much smaller than h in practice, i.e.,
      // anywhere between 1 and something like 3, and I can't think of a good
      // way to get around this right now without creating API awkwardness.
      if (isIgnorable(ancestorChain[i])) {
        topmost = ancestorChain[i];
        break;
      }
    }
    // Short circuit for rootNode; it won't have any siblings.
    if (topmost == this.mDOMView.rootNode) {
      // Just in case for some crazy reason the root node is ignorable...
      return isIgnorable(topmost) ? null : topmost;
    }

    // Follow through on step 2.

    // The nature of anonymous content means that the nodes around aNode can
    // get completely rearranged, depending on whether we're showing anonymous
    // content or not.  If we're getting called from a rebuild due to a pref
    // change for showing anonymous content, showAnons is going to reflect the
    // new value.  If that's why we are getting called, we want to select from
    // the next-best chain based on the order nodes were visually presented
    // when the user toggled the pref, which is is why we need the
    // aIncludeAnons override, since showAnons is untrustworthy here.
    var includeAnons =
      aIncludeAnons === undefined ? showAnons : aIncludeAnons;
    // NB: By allowing includeAnons to deviate from showAnons above, we can't
    // guarantee that ancestor will be non-ignorable (it might be anonymous,
    // and we're not showing anons), so we'll need to check for it later.
    ancestor = this.mDOMUtils.getParentForNode(topmost, includeAnons);
    // As a side-effect of special-casing the rootNode-as-topmost check
    // earlier, we're guaranteed ancestor is non-null here.
    var walker = this.createDOMWalker(ancestor, includeAnons);
    var current = walker.firstChild();

    // We have to relocate the walker over topmost by iterating over nodes
    // until we get there.  We'll save the ones we pass up along the way so we
    // can immediately begin looking at those preceding nodes in reverse order
    // if we find that we've exhausted all of the nodes that follow.
    var preceding = [];
    while (current != topmost) {
      preceding.push(current);
      current = walker.nextSibling();
      if (!current) {
        debug("unexpected end of nodes");
        return null;
      }
    }

    // Look for the next non-ignorable in the nodes that follow topmost.
    do {
      current = walker.nextSibling();
      if (!isIgnorable(current)) {
        return current;
      }
    } while (current);

    // Look for the next non-ignorable in the nodes that precede topmost.
    for (let i = preceding.length - 1; i >= 0; --i) {
      current = preceding[i];
      if (!isIgnorable(current)) {
        return current;
      }
    }

    // All of the adjacent nodes are ignorable, too.  Use topmost's parent,
    // which we know to be non-ignorable (by virtue of it being an ancestor of
    // topmost).  Recall from before that we can't be sure that the ancestor
    // we've got in |ancestor| is non-ignorable, though...
    if (includeAnons != showAnons) {
      ancestor = this.mDOMUtils.getParentForNode(topmost, showAnons);
    }

    return ancestor;
  },

  /**
   * Convenience method for instantiating a deep tree walker, using much of
   * the same preferences as the DOM view.
   * @param aRoot
   *        The root node to begin traversal.  See the W3 Traversal spec for
   *        more information.
   * @param aShowAnons [optional]
   *        Whether to include anonymous content in the walk.  This is the
   *        same as setting showAnonymousContent on an instantiated deep tree
   *        walker.  The default is the value of the showAnonymousContent
   *        attribute on the DOM view.
   */
  createDOMWalker:
    function DVr_CreateDOMWalker(aRoot, aShowAnons)
  {
    var walker = XPCU.createInstance(kDeepTreeWalkerClassID,
                                     "inIDeepTreeWalker");
    walker.showAnonymousContent = aShowAnons === undefined ?
                                    this.mDOMView.showAnonymousContent :
                                    aShowAnons;
    walker.showSubDocuments = this.mDOMView.showSubDocuments;
    walker.init(aRoot, this.mDOMView.whatToShow);
    return walker;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Columns

  // XXX re-implement custom columns code someday

  initColumns: function DVr_InitColumns()
  {
    var colPref = PrefUtils.getPref("inspector.dom.columns");
    var cols = colPref.split(",")
    this.mColumns = cols;
    this.mColumnHash = {};
  },

  saveColumns: function DVr_SaveColumns()
  {
    var cols = this.mColumns.join(",");
    PrefUtils.setPref("inspector.dom.columns", cols);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Flashing

  flashElement: function DVr_FlashElement(aElement, aIsOnSelect)
  {
    // make sure we only try to flash element nodes, and don't
    // flash the documentElement (it's too darn big!)
    if (aElement.nodeType == nsIDOMNode.ELEMENT_NODE &&
        aElement != aElement.ownerDocument.documentElement) {

      var flasher = this.mPanel.panelset.flasher;
      if (aIsOnSelect) {
        flasher.flashElementOnSelect(aElement);
      }
      else {
        flasher.flashElement(aElement);
      }
    }
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Prefs

  /**
   * Called by PrefChangeObserver.
   *
   * @param aName
   *        The name of the preference that has been changed.
   */
  onPrefChanged: function DVr_OnPrefChanged(aName)
  {
    var value = PrefUtils.getPref(aName);
    var includeAnons = undefined;

    switch (aName) {
      case "inspector.dom.showAnon":
        includeAnons = this.mDOMView.showAnonymousContent;
        this.setAnonContent(value);
        break;

      case "inspector.dom.showProcessingInstructions":
        this.setProcessingInstructions(value);
        break;

      case "inspector.dom.showAccessibleNodes":
        this.setAccessibleNodes(value);
        break;

      case "inspector.dom.showWhitespaceNodes":
        this.setWhitespaceNodes(value);
        break;

      default:
        return;
    }

    this.rebuild(includeAnons);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Uncategorized

  getAllDocuments: function DVr_GetAllDocuments()
  {
    var doc = this.mDOMView.rootNode;
    var results = [doc];
    this.findDocuments(doc, results);
    return results;
  },

  findDocuments: function DVr_FindDocuments(aDoc, aArray)
  {
    this.addKidsToArray(aDoc.getElementsByTagName("frame"), aArray);
    this.addKidsToArray(aDoc.getElementsByTagName("iframe"), aArray);
    this.addKidsToArray(aDoc.getElementsByTagNameNS(kXULNSURI, "browser"),
                        aArray);
    this.addKidsToArray(aDoc.getElementsByTagNameNS(kXULNSURI, "tabbrowser"),
                        aArray);
    this.addKidsToArray(aDoc.getElementsByTagNameNS(kXULNSURI, "editor"),
                        aArray);
  },

  addKidsToArray: function DVr_AddKidsToArray(aKids, aArray)
  {
    for (var i = 0; i < aKids.length; ++i) {
      try {
        aArray.push(aKids[i].contentDocument);
        // Now recurse down into the kid and look for documents there
        this.findDocuments(aKids[i].contentDocument, aArray);
      }
      catch (ex) {
        // if we can't access the content document, skip it
      }
    }
  },

  /**
   * Get the node corresponding to the tree's currentIndex (the row with the
   * focus rect).  NB: This is *not* a method to get the tree's selection.
   * Use selectedNode or getSelectedNodes for that.
   * @return the node corresponding to the tree's currentIndex, which may or
   *         may not be a part of the tree's selection
   */
  get currentNode()
  {
    var index = this.mDOMTree.currentIndex;
    return this.getNodeFromRowIndex(index);
  },

  /**
   * Get the node represented by the tree's selection.
   * @return The currently selected node, or null if zero or two or more nodes
   *         are selected.
   */
  get selectedNode()
  {
    if (this.mDOMTree.view.selection.count == 1) {
      var minAndMax = {};
      this.mDOMTree.view.selection.getRangeAt(0, minAndMax, minAndMax);
      return this.getNodeFromRowIndex(minAndMax.value);
    }
    return null;
  },

  /**
   * Get the nodes corresponding to the tree's selected rows.
   * @return An array of nodes.
   */
  getSelectedNodes: function DVr_GetSelectedNodes()
  {
    var nodes = [];
    var indexes = this.getSelectedIndexes();
    for (let i = 0, n = indexes.length; i < n; ++i) {
      nodes.push(this.getNodeFromRowIndex(indexes[i]));
    }
    return nodes;
  },

  /**
   * Determine the tree's selected rows.
   * @return An array of row indexes.
   */
  getSelectedIndexes: function DVr_GetSelectedIndexes()
  {
    var indexes = [];
    var selection = this.mDOMTree.view.selection;
    for (let i = 0, n = selection.getRangeCount(); i < n; ++i) {
      var min = {};
      var max = {};
      selection.getRangeAt(i, min, max);
      for (let j = min.value; j <= max.value; ++j) {
        indexes.push(j);
      }
    }
    return indexes;
  },

  getNodeFromRowIndex: function DVr_GetNodeFromRowIndex(aIndex)
  {
    try {
      return this.mDOMView.getNodeFromRowIndex(aIndex);
    }
    catch (ex) {
      return null;
    }
  },

  getRowIndexFromNode: function DVr_GetRowIndexFromNode(aNode)
  {
    try {
      return this.mDOMView.getRowIndexFromNode(aNode);
    }
    catch (ex) {
      return -1;
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
//// Command Objects

/**
 * Deletes one or more nodes from the tree.
 */
function cmdEditDelete()
{
  // Approach:
  // 1. Order the nodes with the primary criterion being the node depth, with
  //    the nodes of greatest depth appearing near the beginning of the list.
  //    The secondary (tiebreaker) criterion is applied only to nodes which
  //    are siblings, and is the node order, corresponding to the nodes'
  //    indexing in their parents' childNodes NodeLists.
  // 2. Iterate over the list, storing the current node's parent and its next
  //    sibling (or null if it's the last of its parent's children).
  //
  // Observe that after the nodes are deleted, this allows us to cleanly undo
  // this transaction by working backwards and reinserting nodes.
  var nodes = viewer.getSelectedNodes().sort(cmdEditDelete.sortComparator);

  this.nodes = [];
  this.mParents = [];
  this.mSiblings = [];

  var didPrompt = false;
  for (let i = 0, n = nodes.length; i < n; ++i) {
    let node = nodes[i];

    // If we delete a descendant of an anonymous node and that anonymous
    // node's binding parent, the nodes array and the mParents array (and
    // potentially the mSiblings array) would continue to needlessly reference
    // nodes from that anonymous subtree.  Even if the binding parent gets
    // restored via undo, a new anonymous content tree will be created for it,
    // so we can eliminate the references to the nodes in the old subtree.
    let bindingParent = node.ownerDocument.getBindingParent(node);
    if (bindingParent && cmdEditDelete.isDeletable(bindingParent) &&
        nodes.indexOf(bindingParent, i) >= 0) { // XXX O(1/2 * n^2)
      // Notify about the issue described above, and ask if it's okay to
      // continue.
      if (!didPrompt) {
        let bundle = viewer.pane.panelset.stringBundle;
        let msg = bundle.getString("irrecoverableSubtree.message");
        let title = bundle.getString("irrecoverableSubtree.title");

        let promptService = XPCU.getService(kPromptServiceClassID,
                                            "nsIPromptService");
        let confirmation = promptService.confirm(window, title, msg);

        if (!confirmation) {
          throw new Error("User canceled transaction");
        }

        didPrompt = true;
      }
    }
    else {
      this.nodes.push(node);
      this.mParents.push(node.parentNode);
      this.mSiblings.push(node.nextSibling);
    }
  }

  this.wrappedJSObject = this;
}

cmdEditDelete.sortComparator = function Delete_SortComparator(a, b)
{
  // Sibling nodes get arranged by natural order.
  if (a.parentNode && a.parentNode == b.parentNode) {
    let kids = a.parentNode.childNodes;
    for (let i = 0, n = kids.length; i < n; ++i) {
      if (kids[i] == a) {
        return -1;
      }
      if (kids[i] == b) {
        break;
      }
    }
    return 1;
  }

  // Otherwise, nodes at greatest depth appear first.
  var rootNode = viewer.mDOMView.rootNode;
  var showAnons = viewer.mDOMView.showAnonymousContent;
  var aAncestor = viewer.mDOMUtils.getParentForNode(a, showAnons);
  var bAncestor = viewer.mDOMUtils.getParentForNode(b, showAnons);

  // Check for equivalence to the root node, too, because getParentForNode
  // will walk all the way up the tree (e.g., out of a content document to a
  // browser containing it).
  while (aAncestor != bAncestor && aAncestor && bAncestor &&
         aAncestor != rootNode && bAncestor != rootNode) {
    aAncestor = viewer.mDOMUtils.getParentForNode(aAncestor, showAnons);
    bAncestor = viewer.mDOMUtils.getParentForNode(bAncestor, showAnons);
  }
  if (!aAncestor || aAncestor == rootNode) {
    return 1;
  }
  return -1;
};

/**
 * Determine if a node is deletable by our deletion methods.
 * @param aNode
 *        The node to check.
 * @param aFailure [optional]
 *        Outparam whose value will correspond to a cmdEditDelete error
 *        constant.  If the node is found to be deletable, aFailure will be
 *        not be altered.
 * @return Boolean indicating deletability.
 */
cmdEditDelete.isDeletable = function Delete_IsDeletable(aNode, aFailure)
{
  var failure = aFailure || { };
  if (!aNode) {
    failure.value = this.NODE_NULL;
    return false;
  }
  var parent = aNode.parentNode;
  if (!parent) {
    failure.value = this.NO_PARENT;
    return false;
  }
  if (Array.indexOf(parent.childNodes, aNode) < 0) {
    failure.value = this.NOT_EXPLICIT_CHILD;
    return false;
  }
  return true;
};

cmdEditDelete.NODE_NULL = 1;
cmdEditDelete.NO_PARENT = 2;
cmdEditDelete.NOT_EXPLICIT_CHILD = 3;

cmdEditDelete.prototype = new inBaseCommand(false);
cmdEditDelete.prototype.constructor = cmdEditDelete;

cmdEditDelete.prototype.nodes = null;

cmdEditDelete.prototype.doTransaction = function Delete_DoTransaction()
{
  // Note that the "indexes" here refer to the given nodes' indexes in this
  // instance's |nodes| array, not the row indexes of the view.
  this.mDeletedIndexes = [];
  for (let i = 0, n = this.nodes.length; i < n; ++i) {
    let node = this.nodes[i];
    let failure = {};
    if (cmdEditDelete.isDeletable(node, failure)) {
      try {
        this.mParents[i].removeChild(node);
        this.mDeletedIndexes.push(i);
      }
      catch (ex) {
        Components.utils.reportError(node + " was expected to be deletable but isn't");
      }
    }
    else {
      let consoleMsg = node.toString();
      switch (failure.value) {
        case cmdEditDelete.NO_PARENT:
          consoleMsg += " has no parent node and cannot be deleted.";
          break;
        case cmdEditDelete.NOT_EXPLICIT_CHILD:
          consoleMsg += " is anonymous to its parent node and cannot be deleted.";
          break;
      }
      this.logString(consoleMsg);
    }
  }
};

cmdEditDelete.prototype.logString = function Delete_LogString(aMessage)
{
  if (("mConsoleService" in this)) {
    // This is not the first call.
    if (this.mConsoleService) {
      this.mConsoleService.logStringMessage(aMessage);
    }
    else {
      dump(aMessage);
    }
  }
  else {
    try {
      this.mConsoleService = XPCU.getService("@mozilla.org/consoleservice;1",
                                             "nsIConsoleService");
    }
    catch (ex) {
      // Null it out for the next call, so we can use our fallback.
      this.mConsoleService = null;
    }
    this.logString(aMessage);
  }
};

cmdEditDelete.prototype.undoTransaction = function Delete_UndoTransaction()
{
  // Recall that since not all nodes in this.nodes are necessarily deletable,
  // this.mDeletedIndexes is a list of indexes into this.nodes where the node
  // at each index is one which was found to be deletable and was successfully
  // removed.
  for (let i = this.mDeletedIndexes.length - 1; i >= 0; --i) {
    let idx = this.mDeletedIndexes[i];
    try {
      this.mParents[idx].insertBefore(this.nodes[idx], this.mSiblings[idx]); 
    }
    catch (ex) {
      // XXX allow recovery from external manipulation
      Components.utils.reportError("Couldn't undo deletion for node " +
                                   this.nodes[idx]);
    }
  }
};

function cmdEditCut() {}

cmdEditCut.prototype = new inBaseCommand(false);

cmdEditCut.prototype.cmdCopy = null;
cmdEditCut.prototype.cmdDelete = null;

cmdEditCut.prototype.doTransaction = function Cut_DoTransaction()
{
  if (!this.cmdCopy) {
    this.cmdDelete = new cmdEditDelete();
    this.cmdCopy = new cmdEditCopy();
  }
  this.cmdCopy.doTransaction();
  this.cmdDelete.doTransaction();
};

cmdEditCut.prototype.undoTransaction = function Cut_UndoTransaction()
{
  this.cmdDelete.undoTransaction();
};

function cmdEditCopy() {
  this.mNode = viewer.selectedNode;
}

cmdEditCopy.prototype = new inBaseCommand();

cmdEditCopy.prototype.mNode = null;

cmdEditCopy.prototype.doTransaction = function Copy_DoTransaction()
{
  if (this.mNode) {
    viewer.pane.panelset.setClipboardData(this.mNode.cloneNode(true),
                                          "inspector/dom-node", null);
  }
};

/**
 * Pastes the node on the clipboard as the next sibling of the selected node.
 */
function cmdEditPaste() {}

cmdEditPaste.prototype = new inBaseCommand(false);

cmdEditPaste.prototype.pastedNode = null;
cmdEditPaste.prototype.pastedBefore = null;

cmdEditPaste.prototype.doTransaction = function Paste_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var ref = this.pastedBefore || viewer.currentNode;
  if (ref) {
    this.pastedNode = node.cloneNode(true);
    this.pastedBefore = ref;
    ref.parentNode.insertBefore(this.pastedNode, ref.nextSibling);
    return false;
  }
  return true;
};

cmdEditPaste.prototype.undoTransaction = function Paste_UndoTransaction()
{
  if (this.pastedNode) {
    this.pastedNode.parentNode.removeChild(this.pastedNode);
  }
};

/**
 * Pastes the node on the clipboard as the previous sibling of the selected
 * node.
 */
function cmdEditPasteBefore() {}

cmdEditPasteBefore.prototype = new inBaseCommand(false);

cmdEditPasteBefore.prototype.pastedNode = null;
cmdEditPasteBefore.prototype.pastedBefore = null;

cmdEditPasteBefore.prototype.doTransaction =
  function PasteBefore_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var ref = this.pastedBefore || viewer.currentNode;
  if (ref) {
    this.pastedNode = node.cloneNode(true);
    this.pastedBefore = ref;
    ref.parentNode.insertBefore(this.pastedNode, ref);
    return false;
  }
  return true;
};

cmdEditPasteBefore.prototype.undoTransaction =
  function PasteBefore_UndoTransaction()
{
  if (this.pastedNode) {
    this.pastedNode.parentNode.removeChild(this.pastedNode);
  }
};

/**
 * Pastes the node on the clipboard in the place of the selected node,
 * overwriting it.
 */
function cmdEditPasteReplace() {}

cmdEditPasteReplace.prototype = new inBaseCommand(false);

cmdEditPasteReplace.prototype.pastedNode = null;
cmdEditPasteReplace.prototype.originalNode = null;

cmdEditPasteReplace.prototype.doTransaction =
  function PasteReplace_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var selected = this.originalNode || viewer.selectedNode;
  if (selected) {
    this.pastedNode = node.cloneNode(true);
    this.originalNode = selected;
    selected.parentNode.replaceChild(this.pastedNode, selected);
    return false;
  }
  return true;
};

cmdEditPasteReplace.prototype.undoTransaction =
  function PasteReplace_UndoTransaction()
{
  if (this.pastedNode) {
    this.pastedNode.parentNode.replaceChild(this.originalNode,
                                            this.pastedNode);
  }
};

/**
 * Pastes the node on the clipboard as the first child of the selected node.
 */
function cmdEditPasteFirstChild() {}

cmdEditPasteFirstChild.prototype = new inBaseCommand(false);

cmdEditPasteFirstChild.prototype.pastedNode = null;
cmdEditPasteFirstChild.prototype.pastedBefore = null;

cmdEditPasteFirstChild.prototype.doTransaction =
  function PasteFirstChild_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var selected = this.pastedBefore || viewer.selectedNode;
  if (selected) {
    this.pastedNode = node.cloneNode(true);
    this.pastedBefore = selected.firstChild;
    selected.insertBefore(this.pastedNode, this.pastedBefore);
    return false;
  }
  return true;
};

cmdEditPasteFirstChild.prototype.undoTransaction =
  function PasteFirstChild_UndoTransaction()
{
  if (this.pastedNode) {
    this.pastedNode.parentNode.removeChild(this.pastedNode);
  }
};

/**
 * Pastes the node on the clipboard as the last child of the selected node.
 */
function cmdEditPasteLastChild() {}

cmdEditPasteLastChild.prototype = new inBaseCommand(false);

cmdEditPasteLastChild.prototype.pastedNode = null;
cmdEditPasteLastChild.prototype.selectedNode = null;

cmdEditPasteLastChild.prototype.doTransaction =
  function PasteLastChild_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var selected = this.selectedNode || viewer.selectedNode;
  if (selected) {
    this.pastedNode = node.cloneNode(true);
    this.selectedNode = selected;
    selected.appendChild(this.pastedNode);
    return false;
  }
  return true;
};

cmdEditPasteLastChild.prototype.undoTransaction =
  function PasteLastChild_UndoTransaction()
{
  if (this.selectedNode) {
    this.selectedNode.removeChild(this.pastedNode);
  }
};

/**
 * Pastes the node on the clipboard in the place of the selected node, making
 * the selected node its child.
 */
function cmdEditPasteAsParent() {}

cmdEditPasteAsParent.prototype = new inBaseCommand(false);

cmdEditPasteAsParent.prototype.pastedNode = null;
cmdEditPasteAsParent.prototype.originalNode = null;
cmdEditPasteAsParent.prototype.originalParentNode = null;

cmdEditPasteAsParent.prototype.doTransaction =
  function PasteAsParent_DoTransaction()
{
  var node = this.pastedNode || viewer.pane.panelset.getClipboardData();
  var selected = this.originalNode || viewer.selectedNode;
  var parent = this.originalParentNode || selected.parentNode;
  if (selected) {
    this.pastedNode = node.cloneNode(true);
    this.originalNode = selected;
    this.originalParentNode = parent;
    parent.replaceChild(this.pastedNode, selected);
    this.pastedNode.appendChild(selected);
    return false;
  }
  return true;
};

cmdEditPasteAsParent.prototype.undoTransaction =
  function PasteAsParent_UndoTransaction()
{
  if (this.pastedNode) {
    this.originalParentNode.replaceChild(this.originalNode,
                                         this.pastedNode);
  }
};

/**
 * Generic prototype for inserting a new node somewhere
 */
function InsertNode() {}

InsertNode.prototype = new inBaseCommand(false);

InsertNode.prototype.insertedNode = null;
InsertNode.prototype.originalNode = null;
InsertNode.prototype.attr = null;

InsertNode.prototype.insertNode = function Insert_InsertNode()
{
};

InsertNode.prototype.createNode = function Insert_CreateNode()
{
  var doc = this.originalNode.ownerDocument;
  if (!this.attr) {
    this.attr = { type: null, value: null,
                  namespaceURI: this.originalNode.namespaceURI,
                  accepted: false,
                  enableNamespaces: doc.contentType != "text/html" };

    window.openDialog("chrome://inspector/content/viewers/dom/" +
                        "insertDialog.xul",
                      "insert", "chrome,modal,centerscreen", doc,
                      this.attr);
  }

  if (this.attr.accepted) {
    switch (this.attr.type) {
      case nsIDOMNode.ELEMENT_NODE:
        if (this.attr.enableNamespaces) {
          this.insertedNode = doc.createElementNS(this.attr.namespaceURI,
                                                  this.attr.value);
        }
        else {
          this.insertedNode = doc.createElement(this.attr.value);
        }
        break;
      case nsIDOMNode.TEXT_NODE:
        this.insertedNode = doc.createTextNode(this.attr.value);
        break;
    }
    return true;
  }
  return false;
};

InsertNode.prototype.doTransaction = function Insert_DoTransaction()
{
  if (this.originalNode) {
    if (this.createNode()) {
      this.insertNode();
      return false;
    }
  }
  return true;
};

InsertNode.prototype.undoTransaction = function Insert_UndoTransaction()
{
  if (this.insertedNode) {
    this.insertedNode.parentNode.removeChild(this.insertedNode);
  }
};

/**
 * Inserts a node after the selected node.
 */
function cmdEditInsertAfter()
{
  this.originalNode = viewer.currentNode;
}

cmdEditInsertAfter.prototype = new InsertNode();

cmdEditInsertAfter.prototype.insertNode = function InsertAfter_InsertNode()
{
  this.originalNode.parentNode.insertBefore(this.insertedNode,
                                            this.originalNode.nextSibling);
};

/**
 * Inserts a node before the selected node.
 */
function cmdEditInsertBefore()
{
  this.originalNode = viewer.currentNode;
}

cmdEditInsertBefore.prototype = new InsertNode();

cmdEditInsertBefore.prototype.insertNode = function InsertBefore_InsertNode()
{
  this.originalNode.parentNode.insertBefore(this.insertedNode,
                                            this.originalNode);
};

/**
 * Inserts a node as the first child of the selected node.
 */
function cmdEditInsertFirstChild()
{
  this.originalNode = viewer.selectedNode;
}

cmdEditInsertFirstChild.prototype = new InsertNode();

cmdEditInsertFirstChild.prototype.insertNode =
  function InsertFirstChild_InsertNode()
{
  this.originalNode.insertBefore(this.insertedNode,
                                 this.originalNode.firstChild);
};

/**
 * Inserts a node as the last child of the selected node.
 */
function cmdEditInsertLastChild()
{
  this.originalNode = viewer.selectedNode;
}

cmdEditInsertLastChild.prototype = new InsertNode();

cmdEditInsertLastChild.prototype.insertNode =
  function InsertLastChild_InsertNode()
{
  this.originalNode.appendChild(this.insertedNode);
};

function cmdEditInspectInNewWindow()
{
  this.mObject = viewer.selectedNode;
}

cmdEditInspectInNewWindow.prototype = new cmdEditInspectInNewWindowBase();

//////////////////////////////////////////////////////////////////////////////
//// Listener Objects

var MouseDownListener = {
  handleEvent: function MDL_HandleEvent(aEvent)
  {
    aEvent.stopPropagation();
    aEvent.preventDefault();

    var target = viewer.mDOMView.showAnonymousContent ?
                                   aEvent.originalTarget :
                                   aEvent.target;
    viewer.doSelectByClick(target);
  }
};

var EventCanceller = {
  handleEvent: function EC_HandleEvent(aEvent)
  {
    aEvent.stopPropagation();
    aEvent.preventDefault();
  }
};

var ListenerRemover = {
  handleEvent: function LR_HandleEvent(aEvent)
  {
    if (!viewer.mSelecting) {
      if (aEvent.type == "click") {
        aEvent.stopPropagation();
        aEvent.preventDefault();
      }
      viewer.removeClickListeners();
    }
  }
};

var PrefChangeObserver = {
  observe: function PCO_Observe(aSubject, aTopic, aData)
  {
    viewer.onPrefChanged(aData);
  }
};

function gColumnAddListener(aIndex)
{
  viewer.onColumnAdd(aIndex);
}

function gColumnRemoveListener(aIndex)
{
  viewer.onColumnRemove(aIndex);
}

function dumpDOM2(aNode)
{
  dump(DOMViewer.prototype.toXML(aNode));
}

function stubImpl(aNode)
{
}
