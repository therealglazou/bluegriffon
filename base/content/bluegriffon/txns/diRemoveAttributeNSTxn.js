function diRemoveAttributeNSTxn(aNode, aAttribute, aNamespace)
{
  this.mNode = aNode;
  this.mOldData = "";
  this.mIsAttributeSet = false;
  this.mAttribute = aAttribute;
  this.mNamespace = aNamespace;
}

diRemoveAttributeNSTxn.prototype = {

  getNode:       function() { return this.mNode; },
  getOldData:    function() { return this.mOldData; },
  getAttribute:  function() { return this.mAttribute; },
  getNamespace:  function() { return this.mNamespace; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diIRemoveAttributeNSTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mIsAttributeSet = this.mNode.hasAttributeNS(this.mNamespace, this.mAttribute);
    if (this.mIsAttributeSet) {
      this.mOldData = this.mNode.getAttributeNS(this.mNamespace, this.mAttribute);
      this.mNode.removeAttributeNS(this.mNamespace, this.mAttribute);
    }
  },

  undoTransaction: function()
  {
    if (this.mIsAttributeSet)
      this.mNode.setAttributeNS(this.mNamespace, this.mAttribute, this.mOldData);
  },

  redoTransaction: function()
  {
    this.doTransaction();
  },

  isTransient: false,

  merge: function(aTransaction)
  {
    return false;
  }
};
