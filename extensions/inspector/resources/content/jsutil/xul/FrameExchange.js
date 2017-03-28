/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* FrameExchange ----------------------------------------------
*  Utility for passing specific data to a document loaded
*  through an iframe
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

//////////// implementation ////////////////////

var FrameExchange = {
  mData: {},

  loadURL: function(aFrame, aURL, aData)
  {
    this.mData[aURL] = aData;
    aFrame.setAttribute("src", aURL);
  },

  receiveData: function(aWindow)
  {
    var id = aWindow.location.href;
    var data = this.mData[id];
    this.mData[id] = null;

    return data;
  }
};


