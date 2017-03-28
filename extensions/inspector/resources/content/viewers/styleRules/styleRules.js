/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* StyleRulesViewer -----------------------------------------------------------
*  The viewer for CSS style rules that apply to a DOM element.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   chrome://inspector/content/utils.js
*   chrome://inspector/content/jsutil/xpcom/XPCU.js
*   chrome://inspector/content/jsutil/rdf/RDFU.js
*   chrome://global/content/viewSourceUtils.js
*   chrome://inspector/content/jsutil/commands/baseCommands.js
*****************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//// Global Variables

var viewer;
var gPromptService;

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kDOMUtilsCID = "@mozilla.org/inspector/dom-utils;1";
const kPromptServiceCID = "@mozilla.org/embedcomp/prompt-service;1";

//////////////////////////////////////////////////////////////////////////////

window.addEventListener("load", StyleRulesViewer_initialize, false);

function StyleRulesViewer_initialize()
{
  viewer = new StyleRulesViewer();
  viewer.initialize(parent.FrameExchange.receiveData(window));

  gPromptService = XPCU.getService(kPromptServiceCID, "nsIPromptService");
}

//////////////////////////////////////////////////////////////////////////////
//// Class StyleRulesViewer

function StyleRulesViewer() // implements inIViewer
{
  this.mObsMan = new ObserverManager(this);

  this.mURL = window.location;
  this.mRuleTree = document.getElementById("olStyleRules");
  this.mRuleBoxObject = this.mRuleTree.treeBoxObject;
  this.mPropsTree = document.getElementById("olStyleProps");
  this.mPropsBoxObject = this.mPropsTree.treeBoxObject;
  this.mFocusedTree = null;
  this.mDOMUtils = XPCU.getService(kDOMUtilsCID, "inIDOMUtils");
}

StyleRulesViewer.prototype =
{

  ////////////////////////////////////////////////////////////////////////////
  //// Initialization

  mSubject: null,
  mPanel: null,

  ////////////////////////////////////////////////////////////////////////////
  //// Interface inIViewer

  get uid()
  {
    return "styleRules"
  },

  get pane()
  {
    return this.mPanel
  },

  get selection()
  {
    return null
  },

  get subject()
  {
    return this.mSubject
  },

  set subject(aObject)
  {
    this.mSubject =
      ("@mozilla.org/accessibleRetrieval;1" in Components.classes &&
       aObject instanceof Components.interfaces.nsIAccessible) ?
      aObject.DOMNode : aObject;

    // update the rule tree
    this.mRuleView = new StyleRuleView(this.mSubject);
    this.mRuleBoxObject.view = this.mRuleView;
    // clear the props tree
    this.mPropsTree.disabled = true;
    this.mPropsTree.contextMenu = null;
    this.mPropsView = null;
    this.mPropsBoxObject.view = null;

    this.mObsMan.dispatchEvent("subjectChange", { subject: this.mSubject });
  },

  initialize: function SRVr_Initialize(aPane)
  {
    this.mPanel = aPane;
    aPane.notifyViewerReady(this);
  },

  destroy: function SRVr_Destroy()
  {
    // We need to remove the views at this time or else they will attempt to
    // re-paint while the document is being deconstructed, resulting in
    // some nasty XPConnect assertions
    this.mRuleBoxObject.view = null;
    this.mPropsBoxObject.view = null;
  },

  isCommandEnabled: function SRVr_IsCommandEnabled(aCommand)
  {
    var rule = this.getSelectedRule();
    var fileURI = rule && rule.parentStyleSheet && rule.parentStyleSheet.href;
    // XXX can't edit resource: stylesheets because of bug 343508, and
    // CSSFontFaceRules because of bug 443978
    var isEditable = !(/^resource:/.test(fileURI) ||
                       rule instanceof CSSFontFaceRule);

    var propFocus = this.mFocusedTree == this.mPropsTree;
    var propCount = this.mPropsTree.view.selection.count;

    switch (aCommand) {
      // ppStylePropsContext
      // The first three of these are context-sensitive; until they are
      // supported for the rule pane, they are meaningless when it has focus.
      case "cmdEditCopy":
        return propFocus && propCount > 0;
      case "cmdEditDelete":
        return isEditable && propFocus && propCount > 0;
      case "cmdEditInsert":
        return isEditable && propFocus;
      case "cmdTogglePriority":
        return isEditable && propCount > 0;
      case "cmdEditEdit":
        return isEditable && propCount == 1;
      // ppStyleRulesContext
      case "cmdEditCopyFileURI":
      case "cmdEditViewFileURI":
        return !!fileURI;
    }
    return false;
  },

  getCommand: function SRVr_GetCommand(aCommand)
  {
    switch (aCommand) {
      case "cmdEditCopy":
        return new cmdEditCopy(this.mPropsView.getSelectedRowObjects());
      case "cmdEditDelete":
        return new cmdEditDelete(this.getSelectedDec(),
                                 this.mPropsView.getSelectedRowObjects());
      case "cmdEditInsert":
        var bundle = this.mPanel.panelset.stringBundle;
        var msg = bundle.getString("styleRulePropertyName.message");
        var title = bundle.getString("styleRuleNewProperty.title");

        var property = { value: "" };
        var value = { value: "" };
        var dummy = { value: false };

        if (!gPromptService.prompt(window, title, msg, property, null,
                                   dummy)) {
          return null;
        }

        msg = bundle.getString("styleRulePropertyValue.message");
        if (!gPromptService.prompt(window, title, msg, value, null, dummy)) {
          return null;
        }

        return new cmdEditInsert(this.getSelectedDec(), property.value,
                                  value.value, "");
      case "cmdEditEdit":
        var rule = this.getSelectedDec();
        var property = this.getSelectedProp();
        var priority = rule.getPropertyPriority(property);

        var bundle = this.mPanel.panelset.stringBundle;
        var msg = bundle.getString("styleRulePropertyValue.message");
        var title = bundle.getString("styleRuleEditProperty.title");

        var value = { value: rule.getPropertyValue(property) };
        var dummy = { value: false };

        if (!gPromptService.prompt(window, title, msg, value, null, dummy)) {
          return null;
        }

        return new cmdEditEdit(rule, property, value.value, priority);
      case "cmdTogglePriority":
        return new cmdTogglePriority(this.getSelectedDec(),
                                     this.mPropsView.getSelectedRowObjects());
      case "cmdEditCopyFileURI":
        return new cmdEditCopyFileURI(this.getSelectedRule());
      case "cmdEditViewFileURI":
        return new cmdEditViewFileURI(this.getSelectedRule());
    }
    return null;
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Event Dispatching

  addObserver: function SRVr_AddObserver(aEvent, aObserver)
  {
    this.mObsMan.addObserver(aEvent, aObserver);
  },

  removeObserver: function SRVr_RemoveObserver(aEvent, aObserver)
  {
    this.mObsMan.removeObserver(aEvent, aObserver);
  },

  ////////////////////////////////////////////////////////////////////////////
  //// Uncategorized

  get DOMUtils() {
    return this.mDOMUtils;
  },

  getSelectedDec: function SRVr_GetSelectedDec()
  {
    var idx = this.mRuleTree.currentIndex;
    return this.mRuleView.selection.count == 1 ?
             this.mRuleView.getDecAt(idx) :
             null;
  },

  getSelectedProp: function SRVr_GetSelectedProp()
  {
    if (this.mPropsView.selection.count != 1) {
      return null;
    }
    var dec = this.getSelectedDec();
    // API awkwardness
    var min = {}, max = {};
    this.mPropsView.selection.getRangeAt(0, min, max);
    return dec.item(min.value);
  },

  getSelectedRule: function SRVr_GetSelectedRule()
  {
    var idx = this.mRuleTree.currentIndex;
    return this.mRuleView.selection.count == 1 ?
             this.mRuleView.getRuleAt(idx) :
             null;
  },

  onRuleSelect: function SRVr_OnRuleSelect()
  {
    var dec = this.getSelectedDec();
    this.mPropsView = new StylePropsView(dec);
    this.mPropsBoxObject.view = this.mPropsView;
    viewer.pane.panelset.updateAllCommands();
    // for non-style rules, change props tree depending on its relevance
    this.mPropsTree.disabled = !dec;
    this.mPropsTree.contextMenu = dec ? "ppStylePropsContext" : null;
  },

  onPropSelect: function SRVr_OnPropSelect()
  {
    viewer.pane.panelset.updateAllCommands();
  },

  onTreeFocus: function SRVr_OnTreeFocus(aTree)
  {
    this.mFocusedTree = aTree;
    viewer.pane.panelset.updateAllCommands();
  },

  onPopupShowing: function SRVr_OnPopupShowing(aCommandSetId)
  {
    var commandset = document.getElementById(aCommandSetId);
    for (let i = 0; i < commandset.childNodes.length; i++) {
      var command = commandset.childNodes[i];
      command.setAttribute("disabled", !viewer.isCommandEnabled(command.id));
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
//// StyleRuleView

function StyleRuleView(aObject)
{
  this.mLevel = [];
  this.mOpen = [];
  if (aObject instanceof Components.interfaces.nsIDOMCSSStyleSheet) {
    document.getElementById("olcRule").setAttribute("primary", "true");
    this.mSheetRules = [];
    for (let i = 0; i < aObject.cssRules.length; i++) {
      this.mSheetRules[i] = aObject.cssRules[i];
      this.mLevel[i] = 0;
      this.mOpen[i] = false;
    }
  }
  else {
    document.getElementById("olcRule").removeAttribute("primary");
    this.mRules = viewer.DOMUtils.getCSSStyleRules(aObject);
    if (aObject.hasAttribute("style")) {
      try {
        this.mStyleAttribute =
          new XPCNativeWrapper(aObject, "style").style;
      }
      catch (ex) {
      }
    }
  }
}

StyleRuleView.prototype = new inBaseTreeView();

StyleRuleView.prototype.mSheetRules = null;
StyleRuleView.prototype.mLevel = null;
StyleRuleView.prototype.mOpen = null;
StyleRuleView.prototype.mRules = null;
StyleRuleView.prototype.mStyleAttribute = null;

StyleRuleView.prototype.getRuleAt = function SRV_GetRuleAt(aRow)
{
  if (aRow >= 0) {
    if (this.mRules) {
      var rule = this.mRules.GetElementAt(aRow);
      try {
        return XPCU.QI(rule, "nsIDOMCSSStyleRule");
      }
      catch (ex) {
      }
    }
    else {
      return this.mSheetRules[aRow];
    }
  }
  return null;
}

StyleRuleView.prototype.getDecAt = function SRV_GetDecAt(aRow)
{
  if (aRow >= 0) {
    if (this.mRules) {
      if (this.mStyleAttribute && aRow == this.mRules.Count()) {
        return this.mStyleAttribute;
      }
      var rule = this.mRules.GetElementAt(aRow);
      try {
        return XPCU.QI(rule, "nsIDOMCSSStyleRule").style;
      }
      catch (ex) {
      }
    }
    // for CSSStyleRule, CSSFontFaceRule, CSSPageRule, and
    // ElementCSSInlineStyle
    else if ("style" in this.mSheetRules[aRow]) {
      return this.mSheetRules[aRow].style;
    }
  }
  return null;
}

StyleRuleView.prototype.getChildCount = function SRV_GetChildCount(aRow)
{
  if (aRow >= 0) {
    var rule = this.mSheetRules[aRow];
    if (rule instanceof CSSImportRule) {
      return rule.styleSheet ? rule.styleSheet.cssRules.length : 0;
    }
    if (rule instanceof CSSMediaRule ||
        rule instanceof CSSMozDocumentRule) {
      return rule.cssRules.length;
    }
  }
  return 0;
}

//////////////////////////////////////////////////////////////////////////////
//// Interface nsITreeView (Override inBaseTreeView)

StyleRuleView.prototype.__defineGetter__("rowCount", function()
{
  if (this.mRules) {
    return this.mRules.Count() + (this.mStyleAttribute ? 1 : 0);
  }
  if (this.mSheetRules) {
    return this.mSheetRules.length;
  }
  return 0;
});

StyleRuleView.prototype.getCellText = function SRV_GetCellText(aRow, aCol)
{
  if (aRow > this.rowCount) {
    return "";
  }

  // special case for the style attribute
  if (this.mStyleAttribute && aRow == this.mRules.Count()) {
    if (aCol.id == "olcRule") {
      return 'style=""';
    }

    if (aCol.id == "olcFileURL") {
      // we ought to be able to get to the URL...
      return "";
    }

    if (aCol.id == "olcLine") {
      return "";
    }
    return "";
  }

  var rule = this.getRuleAt(aRow);
  if (!rule) {
    return "";
  }

  if (aCol.id == "olcRule") {
    if (rule instanceof CSSStyleRule) {
      return rule.selectorText;
    }
    if (rule instanceof CSSFontFaceRule) {
      return "@font-face";
    }
    if (rule instanceof CSSMediaRule ||
        rule instanceof CSSMozDocumentRule) {
      // get rule text up until the block begins, and trim off whitespace
      return rule.cssText.replace(/\s*{[\s\S]*/, "");
    }
    return rule.cssText;
  }

  if (aCol.id == "olcFileURL") {
    return rule.parentStyleSheet ? rule.parentStyleSheet.href : "";
  }

  if (aCol.id == "olcLine") {
    return rule.type == CSSRule.STYLE_RULE ?
                          viewer.DOMUtils.getRuleLine(rule) :
                          "";
  }

  return "";
}

StyleRuleView.prototype.getLevel = function SRV_GetLevel(aRow)
{
  if (aRow in this.mLevel) {
    return this.mLevel[aRow];
  }
  return 0;
}

StyleRuleView.prototype.getParentIndex = function SRV_GetParentIndex(aRow)
{
  var level = this.getLevel(aRow);
  for (let i = aRow - 1; i >= 0; --i) {
    if (this.getLevel(i) < level) {
      return i;
    }
  }
  return -1;
}

StyleRuleView.prototype.hasNextSibling =
  function SRV_HasNextSibling(aRow, aAfter)
{
  var baseLevel = this.getLevel(aRow);
  var rowCount = this.rowCount; // quick access since this property is dynamic
  for (let i = aAfter + 1; i < rowCount; ++i) {
    if (this.getLevel(i) < baseLevel) {
      break;
    }
    if (this.getLevel(i) == baseLevel) {
      return true;
    }
  }
  return false;
}

StyleRuleView.prototype.isContainer = function SRV_IsContainer(aRow)
{
  if (this.mSheetRules) {
    if (this.mSheetRules[aRow] instanceof CSSImportRule ||
        this.mSheetRules[aRow] instanceof CSSMediaRule ||
        this.mSheetRules[aRow] instanceof CSSMozDocumentRule) {
      return true;
    }
  }
  return false;
}

StyleRuleView.prototype.isContainerEmpty = function SRV_IsContainerEmpty(aRow)
{
  return !this.getChildCount(aRow);
}

StyleRuleView.prototype.isContainerOpen = function SRV_IsContainerOpen(aRow)
{
  return this.mOpen[aRow];
}

StyleRuleView.prototype.toggleOpenState = function SRV_ToggleOpenState(aRow)
{
  var oldLength = this.mSheetRules.length;
  var childLevel = this.mLevel[aRow] + 1;
  if (this.mOpen[aRow]) {
    // find the number of children and other descendants
    let count = this.mSheetRules.length - aRow - 1;
    for (let i = aRow + 1, n = this.mSheetRules.length; i < n; ++i) {
      if (this.mLevel[i] < childLevel) {
        count = i - aRow - 1;
        break;
      }
    }
    this.mSheetRules.splice(aRow + 1, count);
    this.mLevel.splice(aRow + 1, count);
    this.mOpen.splice(aRow + 1, count);
  }
  else {
    var inserts = [];
    var rule = this.mSheetRules[aRow];
    if (rule instanceof CSSImportRule) {
      // @import is tricky, because its styleSheet property is allowed to be
      // null if its media-type qualifier isn't supported, among other
      // reasons.
      inserts = rule.styleSheet ? rule.styleSheet.cssRules : [];
    }
    else if (rule instanceof CSSMediaRule ||
             rule instanceof CSSMozDocumentRule) {
      inserts = rule.cssRules;
    }
    // make space for children
    var count = this.getChildCount(aRow);
    for (let i = this.rowCount - 1; i > aRow; --i) {
      this.mSheetRules[i + count] = this.mSheetRules[i];
      this.mLevel[i + count] = this.mLevel[i];
      this.mOpen[i + count] = this.mOpen[i];
    }
    // fill in children
    for (let i = 0; i < inserts.length; ++i) {
      this.mSheetRules[aRow + 1 + i] = inserts[i];
      this.mLevel[aRow + 1 + i] = childLevel;
      this.mOpen[aRow + 1 + i] = false;
    }
  }
  this.mOpen[aRow] = !this.mOpen[aRow];
  viewer.mRuleTree.treeBoxObject.rowCountChanged(aRow + 1,
    this.mSheetRules.length - oldLength);
  viewer.mRuleTree.treeBoxObject.invalidateRow(aRow);
}

//////////////////////////////////////////////////////////////////////////////
//// StylePropsView

function StylePropsView(aDec)
{
  this.mDec = aDec;
}

StylePropsView.prototype = new inBaseTreeView();

StylePropsView.prototype.__defineGetter__("rowCount", function()
{
  return this.mDec ? this.mDec.length : 0;
});

StylePropsView.prototype.getCellProperties =
  function SPV_GetCellProperties(aRow, aCol, aProperties)
{
  if (aCol.id == "olcPropPriority") {
    var prop = this.mDec.item(aRow);
    if (this.mDec.getPropertyPriority(prop) == "important") {
      if (!aProperties)
        return "important";

      aProperties.AppendElement(this.createAtom("important"));
    }
  }

  return "";
}

StylePropsView.prototype.getCellText = function SPV_GetCellText(aRow, aCol)
{
  var prop = this.mDec.item(aRow);

  if (aCol.id == "olcPropName") {
    return prop;
  }
  else if (aCol.id == "olcPropValue") {
    return this.mDec.getPropertyValue(prop)
  }

  return null;
}

/**
 * Returns a CSSProperty for the row in the tree corresponding to the
 * passed index.
 * @param aIndex
 *        index of the row in the tree
 * @return a CSSProperty
 */
StylePropsView.prototype.getRowObjectFromIndex =
  function SPV_GetRowObjectFromIndex(aIndex)
{
  var prop = this.mDec.item(aIndex);
  return new CSSProperty(prop, this.mDec.getPropertyValue(prop),
                         this.mDec.getPropertyPriority(prop));
}

/**
 * Handles inserting a CSS property
 * @param aRule
 *        the rule that will contain the new property
 * @param aProperty
 *        the name of the new property
 * @param aValue
 *        the value of the new property
 * @param aPriority
 *        the priority of the new property ("important" or "")
 */
function cmdEditInsert(aRule, aProperty, aValue, aPriority)
{
  this.rule = aRule;
  this.property = aProperty;
  this.value = aValue;
  this.priority = aPriority;
}

cmdEditInsert.prototype = new inBaseCommand(false);

cmdEditInsert.prototype.doTransaction = function Insert_DoTransaction()
{
  viewer.mPropsBoxObject.beginUpdateBatch();
  try {
    this.rule.setProperty(this.property, this.value, this.priority);
  }
  finally {
    viewer.mPropsBoxObject.endUpdateBatch();
  }
};

cmdEditInsert.prototype.undoTransaction = function Insert_UndoTransaction()
{
  this.rule.removeProperty(this.property);
  viewer.mPropsBoxObject.invalidate();
};

/**
 * Handles deleting CSS properties
 * @param aRule
 *        the rule containing the properties
 * @param aProperties
 *        an array of CSSPropertys to delete
 */
function cmdEditDelete(aRule, aProperties)
{
  this.rule = aRule;
  this.properties = aProperties;
}

cmdEditDelete.prototype = new inBaseCommand(false);

cmdEditDelete.prototype.doTransaction = function Delete_DoTransaction()
{
  viewer.mPropsBoxObject.beginUpdateBatch();
  for (let i = 0; i < this.properties.length; i++) {
    this.rule.removeProperty(this.properties[i].property);
  }
  viewer.mPropsBoxObject.endUpdateBatch();
};

cmdEditDelete.prototype.undoTransaction = function Delete_UndoTransaction()
{
  viewer.mPropsBoxObject.beginUpdateBatch();
  try {
    for (let i = 0; i < this.properties.length; i++) {
      this.rule.setProperty(this.properties[i].property,
                            this.properties[i].value,
                            this.properties[i].important ?
                              "important" :
                              "");
    }
  }
  finally {
    viewer.mPropsBoxObject.endUpdateBatch();
  }
};

/**
 * Handles editing CSS properties
 * @param aRule
 *        the rule containing the property
 * @param aProperty
 *        the property to change
 * @param aNewValue
 *        the new value for the property
 * @param aNewPriority
 *        the new priority for the property ("important" or "")
 */
function cmdEditEdit(aRule, aProperty, aNewValue, aNewPriority)
{
  this.rule = aRule;
  this.property = aProperty;
  this.oldValue = aRule.getPropertyValue(aProperty);
  this.newValue = aNewValue;
  this.oldPriority = aRule.getPropertyPriority(aProperty);
  this.newPriority = aNewPriority;
}

cmdEditEdit.prototype = new inBaseCommand(false);

cmdEditEdit.prototype.doTransaction = function Edit_DoTransaction()
{
  this.rule.setProperty(this.property, this.newValue,
                        this.newPriority);
  viewer.mPropsBoxObject.invalidate();
};

cmdEditEdit.prototype.undoTransaction = function Edit_UndoTransaction()
{
  this.rule.setProperty(this.property, this.oldValue,
                        this.oldPriority);
  viewer.mPropsBoxObject.invalidate();
};

/**
 * Handles toggling CSS !important.
 * @param aRule
 *        the rule containing the properties
 * @param aProperties
 *        an array of CSSPropertys to toggle
 */
function cmdTogglePriority(aRule, aProperties)
{
  this.rule = aRule;
  this.properties = aProperties;
}

cmdTogglePriority.prototype = new inBaseCommand(false);

cmdTogglePriority.prototype.doTransaction =
  function TogglePriority_DoTransaction()
{
  for (let i = 0; i < this.properties.length; i++) {
    // XXX bug 305761 means we can't make something not important, so
    // instead we'll delete this property and make a new one at the proper
    // priority.  This method also sucks because the property gets moved to
    // the bottom.
    var property = this.properties[i].property;
    var value = this.properties[i].value;
    var newPriority = this.rule.getPropertyPriority(property) == "" ?
                        "important" : "";
    this.rule.removeProperty(property);
    this.rule.setProperty(property, value, newPriority);
  }
  viewer.mPropsBoxObject.invalidate();
};

cmdTogglePriority.prototype.undoTransaction =
  function TogglePriority_UndoTransaction()
{
  this.doTransaction();
};

/**
 * Copy the URI for a CSS rule's parent style sheet onto the clipboard.
 * @param aRule
 *        The nsIDOMCSSRule whose parent style sheet's URI should be copied.
 */
function cmdEditCopyFileURI(aRule)
{
  this.mString = aRule && aRule.parentStyleSheet &&
                 aRule.parentStyleSheet.href;
}

cmdEditCopyFileURI.prototype = new cmdEditCopySimpleStringBase();

/**
 * Open a source view on a CSS rule's parent style sheet.  This will attempt
 * open the file at the line that the rule appears on.
 * @param aRule
 *        The source view will open on nsIDOMCSSRule aRule's parent style
 *        sheet.  If aRule is an nsIDOMCSSStyleRule, the source view will open
 *        to the line in the style sheet that aRule appears on.
 */
function cmdEditViewFileURI(aRule)
{
  this.mURI = aRule && aRule.parentStyleSheet && aRule.parentStyleSheet.href;
  if (aRule.type == CSSRule.STYLE_RULE) {
    this.mLineNumber = viewer.DOMUtils.getRuleLine(aRule);
  }
}

cmdEditViewFileURI.prototype = new cmdEditViewFileURIBase();
