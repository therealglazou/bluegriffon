function diStyleAttrChangeTxn(aNode, aProperty, aValue, aPriority)
{
  this.mNode = aNode;
  this.mOldData = "";
  this.mProperty = aProperty;
  this.mValue = aValue;
  this.mPriority = aPriority;
}

diStyleAttrChangeTxn.prototype = {

  getNode:          function() { return this.mNode; },
  getOldData:       function() { return this.mOldData; },
  getNewData:       function() { return this.mNewData; },

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsITransaction) ||
        aIID.equals(Components.interfaces.diIStyleAttrChangeTxn) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  doTransaction: function()
  {
    this.mOldData = this.mNode.getAttribute("style");
    if (this.mValue)
      this.mNode.style.setProperty(this.mProperty,
                                   this.mValue,
                                   this.mPriority);
    else {
      this.mNode.style.removeProperty(this.mProperty);
      if (this.mNode.getAttribute("style") == "")
        this.mNode.removeAttribute("style");
    }
  },

  undoTransaction: function()
  {
    if (this.mOldData)
      this.mNode.setAttribute("style", this.mOldData);
    else
      this.mNode.removeAttribute("style");
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
