/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* AccessibleEventsViewer --------------------------------------------
*  The viewer for the accessible events occured on a document accessible.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
****************************************************************/

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;
var gBundle;

///////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kObserverServiceCID = "@mozilla.org/observer-service;1";
const kAccessibleRetrievalCID = "@mozilla.org/accessibleRetrieval;1";

const Ci = Components.interfaces;
const nsIObserverService = Ci.nsIObserverService;
const nsIAccessibleRetrieval = Ci.nsIAccessibleRetrieval;
const nsIAccessibleEvent = Ci.nsIAccessibleEvent;
const nsIAccessible = Ci.nsIAccessible;
const nsIPropertyElement = Ci.nsIPropertyElement;

const gAccInterfaces =
[
  Ci.nsIAccessible,
  Ci.nsIAccessibleDocument,
  Ci.nsIAccessibleEditableText,
  Ci.nsIAccessibleHyperLink,
  Ci.nsIAccessibleHyperText,
  Ci.nsIAccessibleImage,
  Ci.nsIAccessibleSelectable,
  Ci.nsIAccessibleTable,
  Ci.nsIAccessibleTableCell,
  Ci.nsIAccessibleText,
  Ci.nsIAccessibleValue
];

if ("nsIAccessNode" in Ci)
  gAccInterfaces.push(Ci.nsIAccessNode);

/**
 * QI nsIAccessNode interface if any, used for compatibility with Gecko versions
 * prior to Gecko13.
 */
function QIAccessNode(aAccessible)
{
  return "nsIAccessNode" in Ci ?
    XPCU.QI(aAccessible, Ci.nsIAccessNode) : aAccessible;
}

///////////////////////////////////////////////////////////////////////////////
//// Initialization

window.addEventListener("load", AccessibleEventsViewer_initialize, false);

function AccessibleEventsViewer_initialize()
{
  gBundle = document.getElementById("accessiblePropsBundle");

  viewer = new AccessibleEventsViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

///////////////////////////////////////////////////////////////////////////////
//// class AccessibleEventsViewer

function AccessibleEventsViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);

  this.mTree = document.getElementById("olAccessibleEvents");
  this.mOlBox = this.mTree.treeBoxObject;

  this.mWatchTree = document.getElementById("watchEventList");
  this.mWatchBox = this.mWatchTree.treeBoxObject;
}

AccessibleEventsViewer.prototype =
{
  // initialization

  mSubject: null,
  mPane: null,
  mView: null,

  // interface inIViewer

  get uid() { return "accessibleEvents"; },
  get pane() { return this.mPane; },
  get selection() { return this.mSelection; },

  get subject() { return this.mSubject; },
  set subject(aObject)
  {
    this.mWatchView = new WatchAccessibleEventsListView();

    if (this.mView) {
      this.mView.destroy();
    }
    this.mView = new AccessibleEventsView(aObject, this.mWatchView);

    this.mOlBox.view = this.mView;
    this.mWatchBox.view = this.mWatchView;

    this.mObsMan.dispatchEvent("subjectChange", { subject: aObject });
  },

  initialize: function initialize(aPane)
  {
    this.mPane = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function destroy()
  {
    this.mView.destroy();
    this.mOlBox.view = null;
    this.mWatchBox.view = null;
  },

  isCommandEnabled: function isCommandEnabled(aCommand)
  {
    return false;
  },

  getCommand: function getCommand(aCommand)
  {
    return null;
  },

  // event dispatching

  addObserver: function addObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },
  removeObserver: function removeObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  // utils

  onItemSelected: function onItemSelected()
  {
    var idx = this.mTree.currentIndex;
    var object = this.mView.getObject(idx);

    // Set subject for right panel view.
    this.mSelection = object.accessnode;

    // Set parameters for right panel view.
    if (this.pane.panelset.panelCount > 1) {
      this.pane.panelset.getPanel(1).params = {
        accessibleEvent: object.event,
        accessibleEventHandlerOutput: object.eventHandlerOutput
      };
    }

    this.mObsMan.dispatchEvent("selectionChange",
                               { selection: this.mSelection } );
  },

  onWatchViewItemSelected: function onWatchViewItemSelected()
  {
    this.mWatchView.updateHandlerEditor();
    this.mWatchView.updateHandlerState();
  },

  onWatchViewHandlerStateChanged:
    function onWatchViewHandlerStateChanged(aState)
  {
    this.mWatchView.updateHandlerState(aState);
  },

  onWatchViewKeyPressed: function onWatchViewKeyPressed(aEvent)
  {
    // SPACE key was pressed. Toggle the row's Watched column tick.
    if (aEvent.charCode == KeyEvent.DOM_VK_SPACE)
      this.mWatchView.toggleEventWatched();
  },

  /**
   * Clear the list of handled events.
   */
  clearEventsList: function clearEventsList()
  {
    this.mView.clear();
  },

  /**
   * Start or stop to watch all events.
   *
   * @param  aDoWatch  [in] indicates whether to start or stop events watching.
   */
  watchAllEvents: function watchAllEvents(aDoWatch)
  {
    this.mWatchView.watchAllEvents(aDoWatch);
  },

  /**
   * Shows context help for event handler editor.
   */
  showWatchViewHandlerHelp: function showWatchViewHandlerHelp()
  {
    openDialog("chrome://inspector/content/viewers/accessibleEvents/handlerHelpDialog.xul",
               "_blank", "chrome,modal,centerscreen");
  },

  /**
   * Open/hide handler editor.
   */
  toggleHandlerEditor: function toggleHandlerEditor(aSplitter)
  {
    var state = aSplitter.getAttribute("state");
    if (state == "collapsed") {
      aSplitter.setAttribute("state", "open");
    }
    else {
      aSplitter.setAttribute("state", "collapsed");
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
//// AccessibleEventsView

function AccessibleEventsView(aObject, aWatchView)
{
  this.mWatchView = aWatchView;
  this.mEvents = [];
  this.mRowCount = 0;

  this.mAccService = XPCU.getService(kAccessibleRetrievalCID,
                                     nsIAccessibleRetrieval);

  this.mAccessible = aObject instanceof nsIAccessible ?
    aObject : this.mAccService.getAccessibleFor(aObject);

  this.canSkipTreeTraversal = false;
  this.mDOMIRootDocumentAccessible = null;
  var acc = QIAccessNode(this.mAccService.getAccessibleFor(document));
  if ("rootDocument" in acc) {
    this.mDOMIRootDocumentAccessible = acc.rootDocument;
    this.mApplicationAccessible = this.mDOMIRootDocumentAccessible.parent;

    // We can skip accessible tree traversal for perf on Gecko 2.0 if the
    // inspected accessible is application accessible.
    this.canSkipTreeTraversal =
      (this.mAccessible == this.mApplicationAccessible);
  }
  else {
    // Gecko 1.9.2 compatibility.
    while (acc.parent) {
      this.mDOMIRootDocumentAccessible = acc;
      acc = acc.parent;
    }
    this.mApplicationAccessible = acc;
  }

  this.mObserverService = XPCU.getService(kObserverServiceCID,
                                          nsIObserverService);

  this.mObserverService.addObserver(this, "accessible-event", false);
}

AccessibleEventsView.prototype = new inBaseTreeView();

/**
 * Global variables used to store event object and user's event handler output
 * from helper functions.
 */
var gEvent = null;
var gEventHandlerOutput = [ ];

AccessibleEventsView.prototype.observe =
function observe(aSubject, aTopic, aData)
{
  var event = XPCU.QI(aSubject, nsIAccessibleEvent);
  var accessible = event.accessible;
  if (!accessible)
    return;

  var accessnode = QIAccessNode(accessible);

  // Ignore events on this DOM Inspector to avoid a mess (Gecko 2.0).
  if (accessnode.rootDocument &&
      accessnode.rootDocument == this.mDOMIRootDocumentAccessible) {
    return;
  }

  // Ignore events having target not in subtree of currently inspected
  // document accessible.
  if (!this.canSkipTreeTraversal) {
    var parentDocAccessible = accessible.document;
    while (true) {
      // The target accessible is inspected document accessible or its child.
      if (parentDocAccessible == this.mAccessible) {
        break;
      }

      // Ignore events on this DOM inspector to avoid a mess.
      if (parentDocAccessible == this.mDOMIRootDocumentAccessible) {
        return;
      }

      // Ignore events that aren't in subtree of inspected accessible.
      if (!parentDocAccessible.parent || !parentDocAccessible.parent.document) {
        return;
      }

      parentDocAccessible = parentDocAccessible.parent.document;
    }
  }

  // Ignore unwatched events.
  var type = event.eventType;
  if (!this.mWatchView.isEventWatched(type))
    return;

  // Execute user handlers.
  gEvent = event;
  gEventHandlerOutput = [ ];
  var expr = this.mWatchView.getHandlerExpr(type);
  if (expr) {
    for (let idx = 0; idx < gAccInterfaces.length; idx++) {
      // Accessibility interfaces implicit query.
      accessible instanceof gAccInterfaces[idx];
    }

    try {
      var f = Function("event", "target", expr);
      f(event, accessible);
    }
    catch (ex) {
      output(ex);
    }
  }

  // Put event into list.
  var date = new Date();
  var node = accessnode.DOMNode;
  var role = "", name = "";
  try {
    // may fail prior Gecko 2.0
    role = this.mAccService.getStringRole(accessible.role);
    name = accessible.name;
  } catch(e) {
  }

  var eventObj = {
    event: event,
    eventHandlerOutput: gEventHandlerOutput,
    accessnode: accessnode,
    node: node,
    id: node.id || "",
    nodename: node ? node.nodeName : "",
    name: name,
    role: role,
    type: this.mAccService.getStringEventType(type),
    time: date.toLocaleTimeString()
  };

  this.mEvents.unshift(eventObj);
  ++this.mRowCount;
  this.mTree.rowCountChanged(0, 1);
}

AccessibleEventsView.prototype.destroy =
function destroy()
{
  this.mObserverService.removeObserver(this, "accessible-event");
}

AccessibleEventsView.prototype.clear =
function clear()
{
  var count = this.mRowCount;
  this.mRowCount = 0;
  this.mEvents = [];
  this.mTree.rowCountChanged(0, -count);
}

/**
 * Return object to be used as a subject for the right panel. It could be either
 * DOM node or accessible object depending on whether accessible has a DOM node.
 * Also the returned object has properties that can used by accessibleEvent
 * view to represent information about accessible event and output from user
 * defined accessible event handlers.
 */
AccessibleEventsView.prototype.getObject =
function getObject(aRow)
{
  return aRow < 0 ? null : this.mEvents[aRow];
}

AccessibleEventsView.prototype.getCellText =
function getCellText(aRow, aCol)
{
  if (aCol.id == "olcEventType")
    return this.mEvents[aRow].type;
  if (aCol.id == "olcEventTime")
    return this.mEvents[aRow].time;
  if (aCol.id == "olcEventTargetNodeName")
    return this.mEvents[aRow].nodename;
  if (aCol.id == "olcEventTargetNodeID")
    return this.mEvents[aRow].id;
  if (aCol.id == "olcEventTargetRole")
    return this.mEvents[aRow].role;
  if (aCol.id == "olcEventTargetName")
    return this.mEvents[aRow].name;
  return "";
}

///////////////////////////////////////////////////////////////////////////////
//// WatchAccessibleEventsListView

const kIgnoredEvents = -1;
const kMutationEvents = 0;
const kChangeEvents = 1;
const kNotificationEvents = 2;
const kSelectionEvents = 3;
const kMenuEvents = 4;
const kDocumentEvents = 5;
const kTextEvents = 6;
const kTableEvents = 7;
const kWindowEvents = 8;
const kHyperLinkEvents = 9;
const kHyperTextEvents = 10;

function WatchAccessibleEventsListView()
{
  // nsITreeView
  this.__proto__ = new inBaseTreeView();

  this.__defineGetter__(
    "rowCount",
    function watchview_getRowCount()
    {
      var rowCount = 0;

      for (var idx = 0; idx < this.mChildren.length; idx++) {
        rowCount++;

        if (this.mChildren[idx].open)
        rowCount += this.mChildren[idx].children.length;
      }

      return rowCount;
    }
  );

  this.getCellText = function watchview_getCellText(aRowIndex, aCol)
  {
    if (aCol.id == "welEventType") {
      var data = this.getData(aRowIndex);
      return data.text;
    }

    return "??";
  };

  this.getCellValue = function watchview_getCellValue(aRowIndex, aCol)
  {
    if (aCol.id == "welIsWatched") {
      var data = this.getData(aRowIndex);
      return data.value;
    }
    else if (aCol.id == "welIsHandlerEnabled") {
      var data = this.getData(aRowIndex);
      return data.isHandlerEnabled;
    }

    return false;
  };

  this.getParentIndex = function watchview_getParentIndex(aRowIndex)
  {
    var info = this.getInfo(aRowIndex);
    return info.parentIndex;
  };

  this.hasNextSibling = function(aRowIndex, aAfterIndex)
  {
    var info = this.getInfo(aRowIndex);
    var siblings = info.parentData.children;
    return siblings[siblings.length - 1] != info.data;
  };

  this.getLevel = function watchview_getLevel(aRowIndex)
  {
    var info = this.getInfo(aRowIndex);
    return info.level;
  };

  this.isContainer = function watchview_isContainer(aRowIndex)
  {
    var info = this.getInfo(aRowIndex);
    return info.level == 0;
  };

  this.isContainerOpen = function watchview_isContainerOpen(aRowIndex)
  {
    var data = this.getData(aRowIndex);
    return data.open;
  };

  this.isContainerEmpty = function watchview_isContainerEmpty(aRowIndex)
  {
    return false;
  };

  this.toggleOpenState = function watchview_toogleOpenState(aRowIndex)
  {
    var data = this.getData(aRowIndex);

    data.open = !data.open;
    var rowCount = data.children.length;

    if (data.open)
      this.mTree.rowCountChanged(aRowIndex + 1, rowCount);
    else
      this.mTree.rowCountChanged(aRowIndex + 1, -rowCount);

    this.mTree.invalidateRow(aRowIndex);
  };

  this.isEditable = function watchview_isEditable(aRowIndex, aCol)
  {
    if (aCol.id == "welIsWatched" ||
        (aCol.id == "welIsHandlerEnabled" && !this.isContainer(aRowIndex))) {
      return true;
    }
    return false;
  };

  this.setCellValue = function watchview_setCellValue(aRowIndex, aCol, aValue)
  {
    if (aCol.id == "welIsWatched") {
      var newValue = aValue == "true";

      var info = this.getInfo(aRowIndex);
      var data = info.data;

      data.value = newValue;

      if (this.isContainer(aRowIndex)) {
        var children = data.children;
        for (var idx = 0; idx < children.length; idx++)
          children[idx].value = newValue;

        this.mTree.invalidateColumnRange(aRowIndex, aRowIndex + children.length,
                                         aCol);
        return;
      }

      this.mTree.invalidateCell(aRowIndex, aCol);

      var parentData = info.parentData;
      if (parentData.value && !newValue) {
        parentData.value = false;
        this.mTree.invalidateCell(info.parentIndex, aCol);
      }
    }
    else if (aCol.id == "welIsHandlerEnabled") {
      var newValue = aValue == "true";
      this.updateHandlerState(newValue, aRowIndex);
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  ///// Public

  /**
   * Return true if the given event type is watched.
   */
  this.isEventWatched = function watchview_isEventWatched(aType)
  {
    return this.mReverseData[aType].value;
  };

  /**
   * Start or stop to watch all events.
   */
  this.watchAllEvents = function watchview_watchAllEvents(aAll)
  {
    for (var idx = 0; idx < this.mChildren.length; idx++) {
      var data = this.mChildren[idx];
      data.value = aAll;
      for (var jdx = 0; jdx < data.children.length; jdx++) {
        var subdata = data.children[jdx];
        subdata.value = aAll;
      }
    }

    this.mTree.invalidate();
  };

  this.getHandlerExpr = function watchview_getHandlerExpr(aType)
  {
    var data = this.mReverseData[aType];
    if (data.isHandlerEnabled) {
      return data.handlerSource;
    }

    return "";
  }

  this.toggleEventWatched = function watchview_toggleEventWatched()
  {
    var idx = this.selection.currentIndex;
    var colWatched = this.mTree.columns.welIsWatched;
    var newValue = !this.getCellValue(idx, colWatched);

    // setCellValue() needs the new value to be passed as a string.
    this.setCellValue(idx, colWatched, newValue.toString());
  }

  /**
   * Updates state and value of handler source editor.
   */
  this.updateHandlerEditor = function watchview_updateHandlerEditor()
  {
    var idx = this.selection.currentIndex;

    if (idx == -1 || this.isContainer(idx)) {
      this.mHandlerState.hidden = true;
      this.mHandlerEditor.disabled = true;
      this.mHandlerEditor.value = "";
      this.mHandlerEditorLabel.hidden = false;
      return;
    }

    this.mHandlerState.hidden = false;
    this.mHandlerEditorLabel.hidden = true;
    this.mHandlerEditor.disabled = false;

    var data = this.getData(idx);

    var label = gBundle.getFormattedString("handlerEditorLabel", [data.text]);
    this.mHandlerState.label = label;
    this.mHandlerEditor.value = data.handlerSource;
  }

  /**
   * Updates state of handler (enabled or disabled) and UI displaying the state.
   * @param aValue [optional]
   *        New value of handler state column at the given row index, if
   *        undefined then data wasn't changed, needs to update UI
   * @param aRowIdx [optional]
   *        The given row index, if missed then current row index is used
   */
  this.updateHandlerState =
    function watchview_updateHandlerState(aValue, aRowIdx)
  {
    var updateData = aValue != undefined;
    var updateCheckbox = !updateData || aRowIdx == this.selection.currentIndex;

    var rowIdx = aRowIdx == undefined ? this.selection.currentIndex : aRowIdx;

    var data = this.getData(rowIdx);

    if (updateData) {
      data.isHandlerEnabled = aValue;
      var col = this.mTree.columns.getNamedColumn("welIsHandlerEnabled");
      this.mTree.invalidateCell(rowIdx, col);
    }

    if (updateCheckbox) {
      this.mHandlerState.checked = data.isHandlerEnabled;
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  ///// Private

  /**
   * Return the data of the tree item at the given row index.
   */
  this.getData = function watchview_getData(aRowIndex)
  {
    return this.getInfo(aRowIndex).data;
  };

  /**
   * Return an object describing the tree item at the given row index:
   *
   * {
   *   data: null, // the data of tree item
   *   parentIndex: -1, // index of parent row
   *   parentData: null, // the data of parent tree item
   *   level: 0 // the level of the tree item
   * };
   */
  this.getInfo = function watchview_getInfo(aRowIndex)
  {
    var info = {
      data: null,
      parentIndex: -1,
      parentData: null,
      level: 0
    };

    var groupIdx = 0;
    var rowIdx = aRowIndex;

    for (var idx = 0; idx < this.mChildren.length; idx++) {
      var groupItem = this.mChildren[idx];

      if (rowIdx == 0) {
        info.data = groupItem;
        return info;
      }

      rowIdx--;
      if (groupItem.open) {
        var typeItemLen = groupItem.children.length;
        if (rowIdx < typeItemLen) {
          info.data = groupItem.children[rowIdx];
          info.parentIndex = idx;
          info.parentData = groupItem;
          info.level = 1;
          return info;
        }

        rowIdx -= typeItemLen;
      }
    }

    return info;
  };

  /**
   * Initialize the tree view.
   */
  this.init = function watchview_init()
  {
    // Register event groups.
    for (var idx = 0; idx < gEventGroupMap.length; idx++)
      this.registerEventGroup(idx, gBundle.getString(gEventGroupMap[idx]));

    // Register event types.
    for (var idx = 1; idx < gEventTypesMap.length; idx++) {
      var props = gEventTypesMap[idx];
      this.registerEventType(props.group, idx, props.isIgnored);
    }

    // Prepare handler source editor.
    this.mHandlerState = document.getElementById("welHandlerState");
    this.mHandlerEditor = document.getElementById("welHandlerEditor");
    this.mHandlerEditorLabel = document.getElementById("welHandlerEditorLabel");
    this.mHandlerEditor.addEventListener("input", this, false);
    this.mHandlerEditor.disabled = true;
  };

  /**
   * Add tree item for the group.
   */
  this.registerEventGroup = function watchview_registerEventGroup(aType, aName)
  {
    var item = {
      text: aName,
      value: true,
      handlerSource: "",
      open: false,
      children: []
    };

    this.mChildren[aType] = item;
  };

  /**
   * Add tree item for the event type.
   */
  this.registerEventType = function watchview_registerEventType(aGroup, aType,
                                                                aIgnored)
  {
    if (aGroup == kIgnoredEvents)
      return;

    var item = {
      text: this.mAccService.getStringEventType(aType),
      value: !aIgnored,
      isHandlerEnabled: false,
      handlerSource: ""
    };

    var groupItem = this.mChildren[aGroup];
    if (aIgnored)
      groupItem.value = false;

    var children = groupItem.children;
    children.push(item);

    this.mReverseData[aType] = item;
  };

  /**
   * Listen for 'input' event from handler source textbox to record the handler.
   */
  this.handleEvent = function watchview_handleEvent(aEvent)
  {
    if (aEvent.target != this.mHandlerEditor) {
      return;
    }

    switch (aEvent.type) {
      case "input":
        var idx = this.selection.currentIndex;

        // Enable/disable event handler automatically.
        var isEnabled = this.mHandlerEditor.value != "";
        this.updateHandlerState(isEnabled, idx);

        // Update event handler code.
        var data = this.getData(idx);
        data.handlerSource = this.mHandlerEditor.value;
        break;
    }
  }

  this.mAccService = XPCU.getService(kAccessibleRetrievalCID,
                                     nsIAccessibleRetrieval);

  this.mChildren = [];
  this.mReverseData = [];
  this.mHandlers = {};

  this.mHandlerState = null;
  this.mHandlerEditor = null;
  this.mHandlerEditorLabel = null;

  this.init();
}

function eventProps(aGroup, aValue)
{
  this.group = aGroup;
  this.isIgnored = aValue;
}

/**
 * The map of event groups.
 */
var gEventGroupMap =
[
  "mutationEvents", // kMutationEvents
  "changeEvents", // kChangeEvents,
  "notificationEvents", // kNotificationEvents,
  "selectionEvents", // kSelectionEvents
  "menuEvents", // kMenuEvents,
  "documentEvents", // kDocumentEvents,
  "textEvents", // kTextEvents,
  "tableEvents", // kTableEvents,
  "windowEvents", // kWindowEvents,
  "hyperLinkEvents", // kHyperLinkEvents
  "hyperTextEvents", // kHyperTextEvents
];

/**
 * The map of event types. Events are listed in the order of nsIAccessibleEvent.
 */
var gEventTypesMap =
[
  new eventProps(kIgnoredEvents), // No event

  new eventProps(kMutationEvents), // EVENT_SHOW
  new eventProps(kMutationEvents), // EVENT_HIDE
  new eventProps(kMutationEvents), // EVENT_REORDER

  new eventProps(kChangeEvents), // EVENT_ACTIVE_DECENDENT_CHANGED

  new eventProps(kNotificationEvents), // EVENT_FOCUS

  new eventProps(kChangeEvents), // EVENT_STATE_CHANGE
  new eventProps(kChangeEvents), // EVENT_LOCATION_CHANGE
  new eventProps(kChangeEvents), // EVENT_NAME_CHANGE
  new eventProps(kChangeEvents), // EVENT_DESCRIPTION_CHANGE
  new eventProps(kChangeEvents), // EVENT_VALUE_CHANGE
  new eventProps(kChangeEvents), // EVENT_HELP_CHANGE
  new eventProps(kChangeEvents), // EVENT_DEFACTION_CHANGE
  new eventProps(kChangeEvents), // EVENT_ACTION_CHANGE
  new eventProps(kChangeEvents), // EVENT_ACCELERATOR_CHANGE

  new eventProps(kSelectionEvents), // EVENT_SELECTION
  new eventProps(kSelectionEvents), // EVENT_SELECTION_ADD
  new eventProps(kSelectionEvents), // EVENT_SELECTION_REMOVE
  new eventProps(kSelectionEvents), // EVENT_SELECTION_WITHIN

  new eventProps(kNotificationEvents), // EVENT_ALERT
  new eventProps(kNotificationEvents), // EVENT_FOREGROUND

  new eventProps(kMenuEvents), // EVENT_MENU_START
  new eventProps(kMenuEvents), // EVENT_MENU_END
  new eventProps(kMenuEvents), // EVENT_MENUPOPUP_START
  new eventProps(kMenuEvents), // EVENT_MENUPOPUP_END

  new eventProps(kNotificationEvents), // EVENT_CAPTURE_START
  new eventProps(kNotificationEvents), // EVENT_CAPTURE_END
  new eventProps(kNotificationEvents), // EVENT_MOVESIZE_START
  new eventProps(kNotificationEvents), // EVENT_MOVESIZE_END
  new eventProps(kNotificationEvents), // EVENT_CONTEXTHELP_START
  new eventProps(kNotificationEvents), // EVENT_CONTEXTHELP_END
  new eventProps(kNotificationEvents, true), // EVENT_DRAGDROP_START
  new eventProps(kNotificationEvents, true), // EVENT_DRAGDROP_END
  new eventProps(kNotificationEvents), // EVENT_DIALOG_START
  new eventProps(kNotificationEvents), // EVENT_DIALOG_END
  new eventProps(kNotificationEvents), // EVENT_SCROLLING_START
  new eventProps(kNotificationEvents), // EVENT_SCROLLING_END
  new eventProps(kNotificationEvents), // EVENT_MINIMIZE_START
  new eventProps(kNotificationEvents), // EVENT_MINIMIZE_END

  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_LOAD_START
  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_LOAD_COMPLETE
  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_RELOAD
  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_LOAD_STOPPED
  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_ATTRIBUTES_CHANGED
  new eventProps(kDocumentEvents), // EVENT_DOCUMENT_CONTENT_CHANGED

  new eventProps(kChangeEvents), // EVENT_PROPERTY_CHANGED

  new eventProps(kSelectionEvents), // EVENT_SELECTION_CHANGED

  new eventProps(kChangeEvents), // EVENT_TEXT_ATTRIBUTE_CHANGED

  new eventProps(kTextEvents), // EVENT_TEXT_CARET_MOVED
  new eventProps(kTextEvents), // EVENT_TEXT_CHANGED
  new eventProps(kTextEvents), // EVENT_TEXT_INSERTED
  new eventProps(kTextEvents), // EVENT_TEXT_REMOVED
  new eventProps(kTextEvents), // EVENT_TEXT_UPDATED
  new eventProps(kTextEvents), // EVENT_TEXT_SELECTION_CHANGED

  new eventProps(kNotificationEvents), // EVENT_VISIBLE_DATA_CHANGED
  new eventProps(kNotificationEvents), // EVENT_TEXT_COLUMN_CHANGED
  new eventProps(kNotificationEvents), // EVENT_SECTION_CHANGED

  new eventProps(kTableEvents), // EVENT_TABLE_CAPTION_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_MODEL_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_SUMMARY_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_ROW_DESCRIPTION_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_ROW_HEADER_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_ROW_INSERT
  new eventProps(kTableEvents), // EVENT_TABLE_ROW_DELETE
  new eventProps(kTableEvents), // EVENT_TABLE_ROW_REORDER
  new eventProps(kTableEvents), // EVENT_TABLE_COLUMN_DESCRIPTION_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_COLUMN_HEADER_CHANGED
  new eventProps(kTableEvents), // EVENT_TABLE_COLUMN_INSERT
  new eventProps(kTableEvents), // EVENT_TABLE_COLUMN_DELETE
  new eventProps(kTableEvents), // EVENT_TABLE_COLUMN_REORDER

  new eventProps(kWindowEvents), // EVENT_WINDOW_ACTIVATE
  new eventProps(kWindowEvents), // EVENT_WINDOW_CREATE
  new eventProps(kWindowEvents), // EVENT_WINDOW_DEACTIVATE
  new eventProps(kWindowEvents), // EVENT_WINDOW_DESTROY
  new eventProps(kWindowEvents), // EVENT_WINDOW_MAXIMIZE
  new eventProps(kWindowEvents), // EVENT_WINDOW_MINIMIZE
  new eventProps(kWindowEvents), // EVENT_WINDOW_RESIZE
  new eventProps(kWindowEvents), // EVENT_WINDOW_RESTORE

  new eventProps(kHyperLinkEvents), // EVENT_HYPERLINK_END_INDEX_CHANGED
  new eventProps(kHyperLinkEvents), // EVENT_HYPERLINK_NUMBER_OF_ANCHORS_CHANGED
  new eventProps(kHyperLinkEvents), // EVENT_HYPERLINK_SELECTED_LINK_CHANGED

  new eventProps(kHyperTextEvents), // EVENT_HYPERTEXT_LINK_ACTIVATED
  new eventProps(kHyperTextEvents), // EVENT_HYPERTEXT_LINK_SELECTED

  new eventProps(kHyperLinkEvents), // EVENT_HYPERLINK_START_INDEX_CHANGED

  new eventProps(kHyperTextEvents), // EVENT_HYPERTEXT_CHANGED
  new eventProps(kHyperTextEvents), // EVENT_HYPERTEXT_NLINKS_CHANGED

  new eventProps(kChangeEvents), // EVENT_OBJECT_ATTRIBUTE_CHANGED
  new eventProps(kChangeEvents), // EVENT_PAGE_CHANGED

  new eventProps(kDocumentEvents) // EVENT_INTERNAL_LOAD
];

////////////////////////////////////////////////////////////////////////////////
//// Functions and objects for usage in event handler editor.

var accRetrieval = XPCU.getService(kAccessibleRetrievalCID,
                                   nsIAccessibleRetrieval);

function output(aValue)
{
  gEventHandlerOutput.push(aValue);
}

function outputRole(aAccessible)
{
  output(accRetrieval.getStringRole(aAccessible.role));
}

function outputStates(aAccessible)
{
  var stateObj = {}, extraStateObj = {};
  aAccessible.getState(stateObj, extraStateObj);
  var states = accRetrieval.getStringStates(stateObj.value,
                                            extraStateObj.value);

  var list = [];
  for (let i = 0; i < states.length; i++) {
    list.push(states.item(i));
  }

  output(list.join());
}

function outputAttrs(aAccessible)
{
  var str = "";
  var attrs = aAccessible.attributes;
  if (attrs) {
    var enumerate = attrs.enumerate();
    while (enumerate.hasMoreElements()) {
      var prop = XPCU.QI(enumerate.getNext(), nsIPropertyElement);
      str += prop.key + ": " + prop.value + "; ";
    }

    if (str)
      output(str);
  }
}

function outputTree(aAccessible, aHighlightList)
{
  var treeObj = {
    cols: {
      outputtreeRole: {
        name: gBundle.getString("role"),
        flex: 2,
        isPrimary: true
      },
      outputtreeName: {
        name: gBundle.getString("name"),
        flex: 2
      },
      outputtreeNodename: {
        name: gBundle.getString("nodeName"),
        flex: 1
      },
      outputtreeId:{
        name: gBundle.getString("id"),
        flex: 1
      }
    },
    view: new inAccTreeView(aAccessible, aHighlightList)
  };

  output(treeObj);
}

function outputDOMAttrs(aAccessible)
{
  var DOMNode = QIAccessNode(aAccessible).DOMNode;
  var DOMAttributes = DOMNode.attributes;
  for (let i = 0; i < DOMAttributes.length; i++) {
    var DOMAttribute = DOMAttributes.item(i);
    output(DOMAttribute.name + ": " + DOMAttribute.value);
  }
}

////////////////////////////////////////////////////////////////////////////////
//// Private functions.

function inAccTreeView(aAccessible, aHighlightList)
{
  inDataTreeView.call(this);

  var list = this.generateChildren(aAccessible, aHighlightList);
  if (list) {
    this.expandNodes(list);
  }
}

inAccTreeView.prototype = new inDataTreeView();

// nsITreeView
inAccTreeView.prototype.getRowProperties =
  function inAccTreeView_getRowProperties(aRowIdx, aProperties)
{
  var data = this.getDataAt(aRowIdx);
  if (data && data.properties) {
    if (!aProperties)
      return data.properties.join(" ");

    for (let i = 0; i < data.properties.length; i++) {
      var atom = this.createAtom(data.properties[i]);
      aProperties.AppendElement(atom);
    }
  }

  return "";
};

inAccTreeView.prototype.getCellProperties =
  function inAccTreeView_getCellProperties(aRowIdx, aCol, aProperties)
{
  return this.getRowProperties(aRowIdx, aProperties);
};

// Initialization
inAccTreeView.prototype.generateChildren =
  function inAccTreeView_generateChildren(aAccessible, aHighlightList, aParent,
                                          aIsUnattached)
{
  var data = {
    properties: []
  };

  var accessible = QIAccessNode(aAccessible);

  // Highlight the row for accessible from the list.
  var isHighlighted =
    aHighlightList && aHighlightList.indexOf(aAccessible) != -1;
  if (isHighlighted) {
    data.properties.push("highlight");
  }

  // Gray out the row for accessible unattached from the tree.
  if (aIsUnattached) {
    data.properties.push("grayout");
  }

  // Add cells data.
  data["outputtreeRole"] = accRetrieval.getStringRole(aAccessible.role);
  data["outputtreeName"] = aAccessible.name;
  data["outputtreeNodename"] = accessible.DOMNode.nodeName;
  data["outputtreeId"] =
    ("id" in accessible.DOMNode ? accessible.DOMNode.id : "");

  var parent = this.appendChild(aParent, data);
  var nodesToExpand = null;

  // Insert highlighted row for target of handled hide event if it's specified
  // in the list (works for Gecko versions higher 13).
  var containsUnattached = false;
  var accBeforeUnattached = null;
  if ("nsIAccessibleHideEvent" in Ci &&
      gEvent instanceof Ci.nsIAccessibleHideEvent &&
      gEvent.targetParent == aAccessible) {
    containsUnattached = true;
    try {
      if (gEvent.targetNextSibling.parent == aAccessible) {
        accBeforeUnattached = gEvent.targetNextSibling;
      }
    } catch (e) {
    }
    try {
      if (!accBeforeUnattached &&
          gEvent.targetPrevSibling.parent == aAccessible) {
        accBeforeUnattached = gEvent.targetPrevSibling.nextSibling;
      }
    } catch (e) {
    }
  }

  // Add children.
  var childCount = aAccessible.childCount;
  for (let i = 0; i < childCount; i++) {
    var child = aAccessible.getChildAt(i);

    // Add unattached child before current child.
    if (accBeforeUnattached == child) {
      var list =
        this.generateChildren(gEvent.accessible, aHighlightList, parent, true);
      if (list) {
        nodesToExpand = list.concat(nodesToExpand || []);
      }
    }

    var list =
      this.generateChildren(child, aHighlightList, parent);
    if (list) {
      nodesToExpand = list.concat(nodesToExpand || []);
    }
  }

  // Put unattached child as last child of the parent, we don't have good guess
  // about its hierarchy position.
  if (containsUnattached && !accBeforeUnattached) {
    var list =
      this.generateChildren(gEvent.accessible, aHighlightList, parent, true);
    if (list) {
      nodesToExpand = list.concat(nodesToExpand || []);
    }
  }

  return nodesToExpand ? nodesToExpand.concat(parent) : isHighlighted && [];
};
