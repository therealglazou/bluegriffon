/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* XBLBindingsViewer ----------------------------------------------------------
*  Inspects the XBL bindings for a given element, including anonymous content,
*  methods, properties, event handlers, and resources.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kDOMViewContractID = "@mozilla.org/inspector/dom-view;1";
const kDOMUtilsContractID = "@mozilla.org/inspector/dom-utils;1";
const kXBLNSURI = "http://www.mozilla.org/xbl";

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", XBLBindingsViewer_initialize, false);

function XBLBindingsViewer_initialize()
{
  viewer = new XBLBindingsViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));
}

//////////////////////////////////////////////////////////////////////////////
//// Class XBLBindingsViewer

function XBLBindingsViewer()
{
  this.mURL = window.location;
  this.mObsMan = new ObserverManager(this);
  this.mDOMUtils = XPCU.getService(kDOMUtilsContractID, "inIDOMUtils");

  this.mBindingsList = document.getElementById("mlBindings");

  this.mContentTree = document.getElementById("olContent");
  this.mMethodTree = document.getElementById("olMethods");
  this.mPropTree = document.getElementById("olProps");
  this.mHandlerTree = document.getElementById("olHandlers");
  this.mResourceTree = document.getElementById("olResources");

  this.mTreeViews = {};

  this.generateViewGetterAndSetter("contentView", this.mContentTree);
  this.generateViewGetterAndSetter("methodView", this.mMethodTree);
  this.generateViewGetterAndSetter("propView", this.mPropTree);
  this.generateViewGetterAndSetter("handlerView", this.mHandlerTree);
  this.generateViewGetterAndSetter("resourceView", this.mResourceTree);

  this.mControllers = {};

  this.addController(this.mBindingsList, BindingsListController);
  this.addController(this.mResourceTree, ResourceTreeController);

  // prepare and attach the content DOM datasource
  var contentView = XPCU.createInstance(kDOMViewContractID, "inIDOMView");
  contentView.whatToShow &= ~(NodeFilter.SHOW_TEXT);
  XPCU.QI(contentView, "nsITreeView");
  this.contentView = contentView;
}

XBLBindingsViewer.prototype =
{
  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPane: null,
  mControllers: null,
  mTreeViews: null,

  ////////////////////////////////////////////////////////////////////////////
  //// Interface inIViewer

  get uid()
  {
    return "xblBindings";
  },

  get pane()
  {
    return this.mPane;
  },

  get subject()
  {
    return this.mSubject;
  },

  set subject(aObject)
  {
    this.mSubject = aObject instanceof Components.interfaces.nsIDOMNode ?
      aObject : aObject.DOMNode;

    this.populateBindings();

    this.displayBinding(this.mBindingsList.value);

    this.mObsMan.dispatchEvent("subjectChange", { subject: this.mSubject });
  },

  initialize: function XBLBVr_Initialize(aPane)
  {
    this.mPane = aPane;

    aPane.notifyViewerReady(this);
  },

  destroy: function XBLBVr_Destroy()
  {
    this.contentView = null;
    this.methodView = null;
    this.propView = null;
    this.handlerView = null;
    this.resourceView = null;
  },

  isCommandEnabled: function XBLBVr_IsCommandEnabled(aCommand)
  {
    var controller =
      document.commandDispatcher.getControllerForCommand(aCommand);
    return !!controller && controller.isCommandEnabled(aCommand);
  },

  getCommand: function XBLBVr_GetCommand(aCommand)
  {
    var controller =
      this.mControllers[document.commandDispatcher.focusedElement.id];
    if (controller) {
      return controller.getCommand(aCommand);
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Event Dispatching

  addObserver: function XBLBVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function XBLBVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Displaying Binding Info

  populateBindings: function XBLBVr_PopulateBindings()
  {
    var urls = this.mDOMUtils.getBindingURLs(this.mSubject);

    this.mBindingsList.removeAllItems();

    for (let i = 0, n = urls.length; i < n; ++i) {
      var url = urls.queryElementAt(i, Components.interfaces.nsIURI).spec;
      var currentItem = this.mBindingsList.appendItem(url, url);
      currentItem.crop = "center";
      currentItem.tooltipText = url;
    }

    this.mBindingsList.selectedIndex = 0;
  },

  displayBinding: function XBLBVr_DisplayBinding(aURL)
  {
    this.mBindingsList.tooltipText = aURL;
    this.mBindingURL = aURL;
    if (aURL) {
      var req = new XMLHttpRequest();
      req.addEventListener("load", gDocLoadListener, true);
      req.open("GET", aURL);
      req.overrideMimeType("application/xml");
      req.send(null);
    }
    else {
      this.doDisplayBinding(null);
    }
  },

  doDisplayBinding: function XBLBVr_DoDisplayBinding(doc)
  {
    if (doc) {
      var url = this.mBindingURL;
      var poundPt = url.indexOf("#");
      var id = url.substr(poundPt + 1);
      var bindings = doc.getElementsByTagNameNS(kXBLNSURI, "binding");
      var binding = null;
      for (var i = 0; i < bindings.length; ++i) {
        if (bindings[i].getAttribute("id") == id) {
          binding = bindings[i];
          break;
        }
      }
      this.mBinding = binding;
    }
    else {
      this.mBinding = null;
    }

    this.displayContent();
    this.displayMethods();
    this.displayProperties();
    this.displayHandlers();
    this.displayResources();

    // switch to the first non-disabled tab if the one that's showing is
    // disabled, otherwise, you can't use the keyboard to switch tabs
    var tabbox = document.getElementById("bxBindingAspects");
    if (tabbox.selectedTab.disabled) {
      for (let i = 0; i < tabbox.tabs.childNodes.length; ++i) {
         if (!tabbox.tabs.childNodes[i].disabled) {
           tabbox.selectedTab = tabbox.tabs.childNodes[i];
           break;
         }
      }
    }

    this.mBindingsList.disabled = !this.mBinding;
  },

  displayContent: function XBLBVr_DisplayContent()
  {
    this.contentView.rootNode = this.mBinding &&
      this.mBinding.getElementsByTagNameNS(kXBLNSURI, "content").item(0);
    this.mContentTree.disabled = !this.contentView.rootNode;
    document.getElementById("tbContent").disabled =
      !this.contentView.rootNode;
    if (this.contentView.rootNode) {
      this.contentView.selection.select(0);
    }
  },

  displayMethods: function XBLBVr_DisplayMethods()
  {
    this.methodView =
      this.mBinding ? new MethodTreeView(this.mBinding) : null;

    var active = this.mBinding &&
      this.mBinding.getElementsByTagNameNS(kXBLNSURI, "method").length > 0;
    this.mMethodTree.disabled = !active;
    document.getElementById("tbMethods").disabled = !active;
    if (active && this.methodView.rowCount) {
      this.methodView.selection.select(0);
    }
  },

  displayProperties: function XBLBVr_DisplayProperties()
  {
    this.propView =
      this.mBinding ? new PropTreeView(this.mBinding) : null;

    var active = this.mBinding &&
      this.mBinding.getElementsByTagNameNS(kXBLNSURI, "property").length > 0;
    this.mPropTree.disabled = !active;
    document.getElementById("tbProps").disabled = !active;
    if (active && this.propView.rowCount) {
      this.propView.selection.select(0);
    }
  },

  displayHandlers: function XBLBVr_DisplayHandlers()
  {
    this.handlerView =
      this.mBinding ? new HandlerTreeView(this.mBinding) : null;

    var active = this.mBinding &&
      this.mBinding.getElementsByTagNameNS(kXBLNSURI, "handler").length > 0;
    this.mHandlerTree.disabled = !active;
    document.getElementById("tbHandlers").disabled = !active;
    if (active && this.handlerView.rowCount) {
      this.handlerView.selection.select(0);
    }
  },

  displayResources: function XBLBVr_DisplayResources()
  {
    this.resourceView =
      this.mBinding ? new ResourceTreeView(this.mBinding) : null;

    var active = this.mBinding &&
      this.mBinding.getElementsByTagNameNS(kXBLNSURI, "resources").length > 0;
    document.getElementById("tbResources").disabled = !active;
    this.mResourceTree.disabled = !active;
  },

  displayMethod: function XBLBVr_DisplayMethod(aMethod)
  {
    var body = aMethod.getElementsByTagNameNS(kXBLNSURI, "body").item(0);
    document.getElementById("txbMethodCode").value = 
      this.justifySource(this.readDOMText(body));
  },

  displayProperty: function XBLBVr_DisplayProperty(aProp)
  {
    var rgroup = document.getElementById("rgPropGetterSetter");
    var getradio = document.getElementById("raPropGetter");
    var setradio = document.getElementById("raPropSetter");

    // disable/enable radio buttons
    getradio.disabled =
      !aProp || !(aProp.hasAttribute("onget") ||
                  aProp.getElementsByTagName("getter").length);
    setradio.disabled =
      !aProp || !(aProp.hasAttribute("onset") ||
                  aProp.getElementsByTagName("setter").length);

    // make sure a valid radio button is selected
    if (rgroup.selectedIndex < 0) {
      rgroup.selectedIndex = 0;
    }
    if (rgroup.selectedItem.disabled) {
      var other = rgroup.getItemAtIndex((rgroup.selectedIndex + 1) % 2);
      if (!other.disabled) {
        rgroup.selectedItem = other;
      }
    }

    // display text
    var et = rgroup.value;
    var text = "";
    if (et && aProp) {
      text = aProp.getAttribute("on" + et);
      if (!text) {
        let kids = aProp.getElementsByTagNameNS(kXBLNSURI, et + "ter");
        text = this.readDOMText(kids.item(0));
      }
    }
    document.getElementById("txbPropCode").value = this.justifySource(text);
  },

  displayHandler: function XBLBVr_DisplayHandler(aHandler)
  {
    var text = "";
    if (aHandler) {
      text = aHandler.getAttribute("action") || this.readDOMText(aHandler);
    }
    document.getElementById("txbHandlerCode").value =
      this.justifySource(text);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Selection

  onMethodSelected: function XBLBVr_OnMethodSelected()
  {
    var idx = this.mMethodTree.currentIndex;
    var methods = this.mBinding.getElementsByTagNameNS(kXBLNSURI, "method");
    var method = methods[idx];
    this.displayMethod(method);
  },

  onPropSelected: function XBLBVr_OnPropSelected()
  {
    var idx = this.mPropTree.currentIndex;
    var props = this.mBinding.getElementsByTagNameNS(kXBLNSURI, "property");
    var prop = props[idx];
    this.displayProperty(prop);
  },

  onHandlerSelected: function XBLBVr_OnHandlerSelected()
  {
    var idx = this.mHandlerTree.currentIndex;
    var handlers = this.mBinding.getElementsByTagNameNS(kXBLNSURI, "handler");
    var handler = handlers[idx];
    this.displayHandler(handler);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Misc

  /**
   * Generates getter and setter methods for property named by the given
   * identifier.  The setter will set the tree's view and cache it.  The
   * getter will recall the cached view.
   * @param aIdentifier
   *        The name of the property where the getter and setter should live.
   * @param aTree
   *        The tree whose view should be set in the setter.
   */
  generateViewGetterAndSetter:
    function XBLBVr_GenerateViewGetterAndSetter(aIdentifier, aTree)
  {
    this.__defineSetter__(aIdentifier, function(aVal)
      {
	aTree.view = aVal;
	return this.mTreeViews[aIdentifier] = aVal;
      });
    this.__defineGetter__(aIdentifier, function()
      {
	return this.mTreeViews[aIdentifier];
      });
  },

  /**
   * Creates a controller, registers it with this viewer, and appends it to
   * the controllers of the given element.
   * @param aEl
   *        The element to which we should add the controller.  aEl.id must be
   *        non-empty.
   * @param aControllerConstructor
   *        A constructor function whose instances will implement
   *        nsIController.  aEl will be passed as the first parameter during
   *        construction.
   */
  addController: function XBLBVr_AddController(aEl, aControllerConstructor) {
    var controller = new aControllerConstructor(aEl);
    this.mControllers[aEl.id] = controller;
    aEl.controllers.appendController(controller);
  },


  onPopupShowing: function XBLBVr_OnPopupShowing(aPopup)
  {
    var kids = aPopup.childNodes;
    for (let i = 0, n = kids.length; i < n; ++i) {
      let command = document.getElementById(kids[i].command);
      if (this.isCommandEnabled(command.id)) {
        command.removeAttribute("disabled");
      }
      else {
        command.setAttribute("disabled", "true");
      }
    }
  },

  readDOMText: function XBLBVr_ReadDOMText(aEl)
  {
    if (!aEl) {
      return "";
    }

    var text = aEl.nodeValue || "";
    for (var i = 0; i < aEl.childNodes.length; ++i) {
      text += this.readDOMText(aEl.childNodes[i]);
    }
    return text;
  },

  // Remove newlines at the beginning of the string and the lowest level of
  // indentation from the beginning of each line, since most XBL getters,
  // setters, methods, and handlers are handwritten CDATA.
  justifySource: function XBLBVr_JustifySource(aStr)
  {
    // convert indentation to use spaces
    while (/^ *\t/m.test(aStr)) {
      aStr = aStr.replace(/^((        )*) {0,7}\t/gm, "$1        ");
    }
    // remove trailing spaces from all lines
    aStr = aStr.replace(/ +$/gm, "");
    // lose the trailing blank lines
    aStr = aStr.replace(/\n*$/, "");
    // lose the initial blank lines
    aStr = aStr.replace(/^\n*/, "");
    // now check if, for some crazy reason, there are lines in the rest of the
    // source at a lower indentation level than the first line
    var indentations = aStr.match(/^ *(?=[^\n])/gm);
    if (indentations) {
      indentations.sort();
      if (indentations[0]) {
        aStr = aStr.replace(RegExp("^" + indentations[0], "gm"), "");
      }
    }
    return aStr;
  }
};

//////////////////////////////////////////////////////////////////////////////
//// Controllers

function BindingsListController(aBindingsList) {}

BindingsListController.prototype = {

  commands: {
    cmdEditCopyFileURI: function BLC_CopyFileURI()
    {
      this.mString = document.popupNode.value;
    },

    cmdEditViewFileURI: function BLC_ViewFileURI()
    {
      this.mURI = document.popupNode.value;
    }
  },

  getCommand: function BLC_GetCommand(aCommand)
  {
    if (this.supportsCommand(aCommand)) {
      return new this.commands[aCommand]();
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// nsIController Implementation

  isCommandEnabled: function BLC_IsCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdEditCopyFileURI":
      case "cmdEditViewFileURI":
        return !!document.popupNode.value;
    }
    return false;
  },

  supportsCommand: function BLC_SupportsCommand(aCommand)
  {
    return aCommand in this.commands;
  },

  doCommand: function BLC_DoCommand(aCommand) {},

  onEvent: function BLC_OnEvent(aEvent) {}
}

let commands = BindingsListController.prototype.commands;
commands.cmdEditCopyFileURI.prototype = new cmdEditCopySimpleStringBase();
commands.cmdEditViewFileURI.prototype = new cmdEditViewFileURIBase();

function ResourceTreeController(aTree) {}

ResourceTreeController.prototype = {

  commands: {
    cmdEditCopyFileURI: function RTC_CopyFileURI()
    {
      this.mString = viewer.resourceView.getSelectedResourceURI();
    },
  
    cmdEditViewFileURI: function RTC_ViewFileURI()
    {
      this.mURI = viewer.resourceView.getSelectedResourceURI();
    }
  },

  getCommand: function RTC_GetCommand(aCommand)
  {
    if (this.supportsCommand(aCommand)) {
      return new this.commands[aCommand]();
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// nsIController Implementation

  isCommandEnabled: function RTC_IsCommandEnabled(aCommand)
  {
    switch (aCommand) {
      case "cmdEditCopyFileURI":
        return !!viewer.resourceView.getSelectedResourceURI();
      case "cmdEditViewFileURI":
        return !!viewer.resourceView.getSelectedResourceURI() &&
               viewer.resourceView.getSelectedResourceType() != "image";
    }
    return false;
  },

  supportsCommand: function RTC_SupportsCommand(aCommand)
  {
    return aCommand in this.commands;
  },

  doCommand: function RTC_DoCommand(aCommand) {},

  onEvent: function RTC_OnEvent(aEvent) {}
}

commands = ResourceTreeController.prototype.commands;
commands.cmdEditCopyFileURI.prototype = new cmdEditCopySimpleStringBase();
commands.cmdEditViewFileURI.prototype = new cmdEditViewFileURIBase();

//////////////////////////////////////////////////////////////////////////////
//// MethodTreeView

function MethodTreeView(aBinding)
{
  this.mMethods = aBinding.getElementsByTagNameNS(kXBLNSURI, "method");
  this.mRowCount = this.mMethods ? this.mMethods.length : 0;
}

MethodTreeView.prototype = new inBaseTreeView();

MethodTreeView.prototype.getCellText =
function MTV_GetCellText(aRow, aCol)
{
  if (aCol.id == "olcMethodName") {
    var method = this.mMethods[aRow];
    var name = method.getAttribute("name");
    var params = method.getElementsByTagNameNS(kXBLNSURI, "parameter");
    var pstr = "";
    if (params.length) {
      pstr += params[0].getAttribute("name");
    }
    for (var i = 1; i < params.length; ++i) {
      pstr += ", " + params[i].getAttribute("name");
    }
    return name + "(" + pstr + ")";
  }

  return "";
}

//////////////////////////////////////////////////////////////////////////////
//// PropTreeView

function PropTreeView(aBinding)
{
  this.mProps = aBinding.getElementsByTagNameNS(kXBLNSURI, "property");
  this.mRowCount = this.mProps ? this.mProps.length : 0;
}

PropTreeView.prototype = new inBaseTreeView();

PropTreeView.prototype.getCellText =
function PTV_GetCellText(aRow, aCol)
{
  if (aCol.id == "olcPropName") {
    return this.mProps[aRow].getAttribute("name");
  }

  return "";
}

//////////////////////////////////////////////////////////////////////////////
//// HandlerTreeView

function HandlerTreeView(aBinding)
{
  this.mHandlers = aBinding.getElementsByTagNameNS(kXBLNSURI, "handler");
  this.mRowCount = this.mHandlers ? this.mHandlers.length : 0;
}

HandlerTreeView.prototype = new inBaseTreeView();

HandlerTreeView.prototype.getCellText =
function HTV_GetCellText(aRow, aCol)
{
  var handler = this.mHandlers[aRow];
  if (aCol.id == "olcHandlerEvent") {
    return handler.getAttribute("event");
  }
  else if (aCol.id == "olcHandlerPhase") {
    return handler.getAttribute("phase");
  }

  return "";
}

//////////////////////////////////////////////////////////////////////////////
//// ResourceTreeView

function ResourceTreeView(aBinding)
{
  this.mResources = [];
  var res = aBinding.getElementsByTagNameNS(kXBLNSURI, "resources").item(0);
  if (res) {
    var kids = res.childNodes;
    for (var i = 0; i < kids.length; ++i) {
      if (kids[i].nodeType == Node.ELEMENT_NODE) {
        this.mResources.push(kids[i]);
      }
    }
  }

  this.mRowCount = this.mResources.length;

  this.wrappedJSObject = this;
}

ResourceTreeView.prototype = new inBaseTreeView();

ResourceTreeView.prototype.getCellText =
function RTV_GetCellText(aRow, aCol)
{
  var resource = this.mResources[aRow];
  if (aCol.id == "olcResourceType") {
    return resource.localName;
  }
  else if (aCol.id == "olcResourceSrc") {
    return resource.getAttribute("src");
  }

  return "";
}

ResourceTreeView.prototype.getSelectedResourceURI =
  function RTV_GetSelectedResourceURI()
{
  if (this.selection.count == 1) {
    let minAndMax = {};
    this.selection.getRangeAt(0, minAndMax, minAndMax);
    return this.mResources[minAndMax.value].getAttribute("src");
  }
  return null;
};

ResourceTreeView.prototype.getSelectedResourceType =
  function RTV_GetSelectedResourceType()
{
  if (this.selection.count == 1) {
    let minAndMax = {};
    this.selection.getRangeAt(0, minAndMax, minAndMax);
    return this.mResources[minAndMax.value].localName;
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
//// Event Listeners

function gDocLoadListener(event)
{
  viewer.doDisplayBinding(event.target.responseXML);
}
