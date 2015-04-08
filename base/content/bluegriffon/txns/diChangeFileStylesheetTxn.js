Components.utils.import("resource://app/modules/cssInspector.jsm");

function diChangeFileStylesheetTxn(aHref, aRule, aProperty, aValue, aPriority)
{
  this.mHref = aHref;
  this.mRule = aRule;
  this.mProperty = aProperty;
  this.mNewValue = aValue;
  this.mNewPriority = aPriority;
  this.mOldValue = "";
  this.mOldPriority = "";
}

diChangeFileStylesheetTxn.prototype = {

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diIChangeFileStylesheetTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mOldValue    = this.mRule.style.getPropertyValue(this.mProperty);
    this.mOldPriority = this.mRule.style.getPropertyPriority(this.mProperty);
    if (this.mNewValue)
      this.mRule.style.setProperty(this.mProperty, this.mNewValue, this.mNewPriority);
    else
      this.mRule.style.removeProperty(this.mProperty);
    CssInspector.serializeFileStyleSheet(this.mRule.parentStyleSheet, this.mHref);
  },

  undoTransaction: function()
  {
    if (this.mOldValue)
      this.mRule.style.setProperty(this.mProperty, this.mOldValue, this.mOldPriority);
    else
      this.mRule.style.removeProperty(this.mProperty);
    CssInspector.serializeFileStyleSheet(this.mRule.parentStyleSheet, this.mHref);
  },

  redoTransaction: function()
  {
    this.doTransaction();
  },

  isTransient: false,

  merge: function(aTransaction)
  {
    return true;
  }
};
