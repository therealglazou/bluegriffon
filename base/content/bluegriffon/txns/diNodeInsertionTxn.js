/********************** diNodeInsertionTxn **********************/

function diNodeInsertionTxn(aNode, aParent, aRef)
{
  this.mNode = aNode;
  this.mParent = aParent;
  this.mRef = aRef;
}

diNodeInsertionTxn.prototype = {

  getNode:    function() { return this.mNode; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diINodeInsertionTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mParent.insertBefore(this.mNode, this.mRef);
  },

  undoTransaction: function()
  {
    this.mNode.parentNode.removeChild(this.mNode);
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
