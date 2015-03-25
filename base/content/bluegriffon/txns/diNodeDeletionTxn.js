/********************** diNodeDeletionTxn **********************/

function diNodeDeletionTxn(aNode)
{
  this.mNode = aNode;
  this.mParent = aNode.parentNode;
  this.mNextSibling = aNode.nextSibling;
}

diNodeDeletionTxn.prototype = {

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
    this.mParent.removeChild(this.mNode);
  },

  undoTransaction: function()
  {
    this.mParent.insertBefore(this.mNode, this.mNextSibling);
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
