function diInnerHtmlChangedTxn(aContext, aNode, aData)
{
  this.mContext = aContext;
  this.mNode = aNode;
  this.mOldData = null;
  this.mNewData = aData;
}

diInnerHtmlChangedTxn.prototype = {

  getNode:          function() { return this.mNode; },
  getOldData:       function() { return this.mOldData; },
  getNewData:       function() { return this.mNewData; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diIInnerHtmlChangedTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mOldData = this.mNode.innerHTML;
    this.mNode.innerHTML = this.mNewData;
  },

  undoTransaction: function()
  {
    this.mNode.innerHTML = this.mOldData;
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
