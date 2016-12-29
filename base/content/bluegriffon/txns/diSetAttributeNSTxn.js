function diSetAttributeNSTxn(aNode, aAttribute, aNamespace, aNewData)
{
  this.mNode = aNode;
  this.mOldData = "";
  this.mNewData = aNewData;
  this.mWasAttributeSet = false;
  this.mAttribute = aAttribute;
  this.mNamespace = aNamespace;
}

diSetAttributeNSTxn.prototype = {

  getNode:       function() { return this.mNode; },
  getOldData:    function() { return this.mOldData; },
  getNewData:    function() { return this.mNewData; },
  getAttribute:  function() { return this.mAttribute; },
  getNamespace:  function() { return this.mNamespace; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diISetAttributeNSTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mWasAttributeSet = this.mNode.hasAttributeNS(this.mNamespace, this.mAttribute);
    this.mNode.setAttributeNS(this.mNamespace, this.mAttribute, this.mNewData);
  },

  undoTransaction: function()
  {
    if (this.mWasAttributeSet)
      this.mNode.setAttributeNS(this.mNamespace, this.mAttribute, this.mOldData);
    else
      this.mNode.removeAttributeNS(this.mNamespace, this.mAttribute);
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
