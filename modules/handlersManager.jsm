var EXPORTED_SYMBOLS = ["HandlersManager"];

var HandlersManager = {

  mHandlers: {},

  addHandler: function(aName, aHandler, aXulEltId, aDoc)
  {
    this.mHandlers[aName] = { handler: aHandler,
                              xulElt: aDoc.getElementById(aXulEltId) };
  },

  hideAllHandlers: function()
  {
    for (var handler in this.mHandlers) {
      var handler = this.mHandlers[handler];
      var elt = handler.xulElt;
      if (elt) {
        elt.checked = false;
        handler.handler.toggle(elt);
      }
    }
  }

};
