/********************** diCommentOrPIChangeTxn **********************/

function diCommentOrPIChangeTxn(aNode, aNewData)
{
  this.mNode = aNode;
  this.mNewData = aNewData;
  this.mOldData = aNode.data;
}

diCommentOrPIChangeTxn.prototype = {

  getNode:    function() { return this.mNode; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mNode.data = this.mNewData;
  },

  undoTransaction: function()
  {
    this.mNode.data = this.mOldData;
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
