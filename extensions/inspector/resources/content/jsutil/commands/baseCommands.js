/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* Base Commands --------------------------------------------------------------
*   Transactions which can be used to implement common commands.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
*   (Other files may be necessary, depending on which base commands are used.)
*****************************************************************************/

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

//////////////////////////////////////////////////////////////////////////////
//// Global Constants

const kClipboardHelperClassID = "@mozilla.org/widget/clipboardhelper;1";

//////////////////////////////////////////////////////////////////////////////
//// Transactions

/**
 * Base implementation of an nsITransaction.
 * @param aIsTransient [optional]
 *        Override the isTransient field.  The default is true.
 */
function inBaseCommand(aIsTransient)
{
  if (aIsTransient !== undefined) {
    this.isTransient = aIsTransient;
  }
}

inBaseCommand.prototype = {
  isTransient: true,

  merge: function BaseCommand_Merge()
  {
    return false;
  },

  QueryInterface:
    XPCOMUtils.generateQI([Components.interfaces.nsITransaction]),

  doTransaction: function BaseCommand_DoTransaction() {},
  undoTransaction: function BaseCommand_UndoTransaction() {},

  redoTransaction: function BaseCommand_RedoTransaction()
  {
    this.doTransaction();
  }
};

/**
 * Open the object "mini" viewer (object.xul) on a given object.  The mObject
 * field should be overridden to contain the object to be inspected.
 *
 * Primitives are uninteresting and attempts to inspect them will fail.
 * Consumers should take this into account when determining whether the
 * corresponding command should be enabled.  For convenience,
 * cmdEditInspectInNewWindowBase.isInspectable is provided.
 */
function cmdEditInspectInNewWindowBase()
{
  this.mObject = null;
}

cmdEditInspectInNewWindowBase.isInspectable =
  function InspectInNewWindowBase_IsInspectable(aValue)
{
  var type = typeof aValue;
  return (type == "object" && aValue !== null) || type == "function";
};

cmdEditInspectInNewWindowBase.prototype = new inBaseCommand();

cmdEditInspectInNewWindowBase.prototype.doTransaction =
  function InspectInNewWindowBase_DoTransaction()
{
  if (cmdEditInspectInNewWindowBase.isInspectable(this.mObject)) {
    inspectObject(this.mObject);
  }
};

/**
 * Copy a string to the clipboard.  The mString field should be overridden to
 * contain the string to be copied.
 */
function cmdEditCopySimpleStringBase()
{
  this.mString = null;
}

cmdEditCopySimpleStringBase.prototype = new inBaseCommand();

cmdEditCopySimpleStringBase.prototype.doTransaction =
  function CopySimpleStringBase_DoTransaction()
{
  if (this.mString) {
    var helper = XPCU.getService(kClipboardHelperClassID,
                                 "nsIClipboardHelper");
    helper.copyString(this.mString);
  }
};

/**
 * An nsITransaction to copy items to the panelset clipboard.
 * @param aObjects
 *        an array of objects that define a clipboard flavor, a delimiter, and
 *        toString().
 */
function cmdEditCopy(aObjects)
{
  this.mObjects = aObjects;
}

cmdEditCopy.prototype = new inBaseCommand();

cmdEditCopy.prototype.doTransaction = function Utils_Copy_DoTransaction()
{
  if (this.mObjects.length == 1) {
    viewer.pane.panelset.setClipboardData(this.mObjects[0],
                                          this.mObjects[0].flavor,
                                          this.mObjects.toString());
  }
  else {
    var joinedObjects = this.mObjects.join(this.mObjects[0].delimiter);
    viewer.pane.panelset.setClipboardData(this.mObjects,
                                          this.mObjects[0].flavor + "s",
                                          joinedObjects);
  }
}

/**
 * Open a source view on a file.  The mURI field should be overridden to
 * contain the URI of the file on which to open the source view.  The
 * mLineNumber field may optionally be set to contain the line number at which
 * the source view should be opened.
 */
function cmdEditViewFileURIBase()
{
  this.mURI = null;
  this.mLineNumber = 0;
}

cmdEditViewFileURIBase.prototype = new inBaseCommand();

cmdEditViewFileURIBase.prototype.doTransaction =
  function ViewFileURIBase_DoTransaction()
{
  if (this.mURI) {
    // 1.9.0 toolkit doesn't have this method
    if ("viewSource" in gViewSourceUtils) {
      gViewSourceUtils.viewSource(this.mURI, null, null, this.mLineNumber);
    }
    else {
      openDialog("chrome://global/content/viewSource.xul",
                 "_blank",
                 "all,dialog=no",
                 this.mURI, null, null, this.mLineNumber, null);
    }
  }
};
