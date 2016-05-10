/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* ObserverManager -----------------------------------------------
*  Manages observer and event dispatching for an object.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

////////////////////////////////////////////////////////////////////////////
//// class ObserverManager

function ObserverManager(aTarget)
{
  this.mTarget = aTarget;
  this.mObservers = {};
}

ObserverManager.prototype = 
{
  addObserver: function(aEventName, aObserver)
  {
    var list;
    if (!(aEventName in this.mObservers)) {
      list = [];
      this.mObservers[aEventName] = list;
    } else
      list = this.mObservers[aEventName];
      
    
    list.push(aObserver);
  },

  removeObserver: function(aEventName, aObserver)
  {
    if (aEventName in this.mObservers) {
      var list = this.mObservers[aEventName];
      for (var i = 0; i < list.length; ++i) {
        if (list[i] == aObserver) {
          list.splice(i, 1);
          return;
        }
      }
    }
  },

  dispatchEvent: function(aEventName, aEventData)
  {
    if (aEventName in this.mObservers) {
      if (!("target" in aEventData))
        aEventData.target = this.mTarget;
      aEventData.type = aEventName;
      
      var list = this.mObservers[aEventName];
      for (var i = 0; i < list.length; ++i)
        list[i].onEvent(aEventData);
    }
  }

};
