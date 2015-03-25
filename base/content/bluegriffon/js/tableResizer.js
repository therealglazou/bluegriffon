/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var TableResizer = {
  
    mResizerType: null,
    mIsMoving: false,
    mBar: null,
    mMin: 0,
    mMax: 0,
    mBefore: null,
    mAfter: null,
    mStartX: 0,
    mStartY: 0,

    mInfo1: null,
    mInfo2: null,

    MouseDown: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      if (aTarget) {
	      switch(aTarget.localName.toLowerCase()) {
	        case "tbody":
	          {
	            this.mStartY = aClientY;
	            var doc = EditorUtils.getCurrentDocument();
	            this.mBefore = doc.elementFromPoint(aClientX, aClientY - 5);
	            this.mMin = this.mBefore.getBoundingClientRect().top;
	            var div = doc.createElement("div");
	            div.setAttribute("_moz_anonclass", "tableRowResizer");
	            div.style.top = (aClientY + doc.documentElement.scrollTop - 2) + "px";
	            var tbr = this.mBefore.parentNode.parentNode.parentNode.getBoundingClientRect();
	            div.style.left = (tbr.left + doc.documentElement.scrollLeft) + "px";
	            div.style.width = (tbr.right - tbr.left) + "px";
	            EditorUtils.getCurrentEditor().rootElement.appendChild(div);
	            this.mBar = div;
	
	            this.mInfo1 = doc.createElement("div");
	            this.mInfo1.setAttribute("_moz_anonclass", "tableResizerInfo");
	            this.mInfo1.style.top = (aClientY + doc.documentElement.scrollTop - 22) + "px";
	            this.mInfo1.style.left = (aClientX + doc.documentElement.scrollLeft + 10) + "px";
	            var hBefore = this.parsedGetComputedStyle(this.mBefore, "height");
	            this.mInfo1.textContent = Math.floor(hBefore) + "px";
	            EditorUtils.getCurrentEditor().rootElement.appendChild(this.mInfo1);
	
	            aTarget.setCapture(true);
	            this.mResizerType = "tbody";
	            this.mIsMoving = true;
	
	            return true;
	          }
	        break;
	        case "tr":
	          {
	            this.mStartX = aClientX;
	            var doc = EditorUtils.getCurrentDocument();
	            this.mBefore = doc.elementFromPoint(aClientX - 5, aClientY);
	            this.mAfter  = doc.elementFromPoint(aClientX + 5, aClientY);
	            this.mMin = this.mBefore.getBoundingClientRect().left;
	            this.mMax = this.mAfter.getBoundingClientRect().right;
	            var div = doc.createElement("div");
	            div.setAttribute("_moz_anonclass", "tableColResizer");
	            div.style.left = (aClientX + doc.documentElement.scrollLeft - 2) + "px";
	            var tbr = this.mBefore.parentNode.parentNode.parentNode.getBoundingClientRect();
	            div.style.top = (tbr.top + doc.documentElement.scrollTop) + "px";
	            div.style.height = (tbr.bottom - tbr.top) + "px";
	            EditorUtils.getCurrentEditor().rootElement.appendChild(div);
	            this.mBar = div;
	
	            this.mInfo1 = doc.createElement("div");
	            this.mInfo2 = doc.createElement("div");
	            this.mInfo1.setAttribute("_moz_anonclass", "tableResizerInfo");
	            this.mInfo2.setAttribute("_moz_anonclass", "tableResizerInfo");
	            this.mInfo1.style.right = (doc.documentElement.clientWidth - aClientX - doc.documentElement.scrollLeft + 8) + "px";
	            this.mInfo2.style.left = (aClientX + doc.documentElement.scrollLeft + 8) + "px";
	            this.mInfo1.style.top = (aClientY + doc.documentElement.scrollTop + 10) + "px";
	            this.mInfo2.style.top = (aClientY + doc.documentElement.scrollTop + 10) + "px";
	            var hBefore = this.parsedGetComputedStyle(this.mBefore, "width");
	            var hAfter  = this.parsedGetComputedStyle(this.mAfter, "width");
	            this.mInfo1.textContent = Math.floor(hBefore) + "px\n"
	                         + Math.floor(100 * 10 * (hBefore)
	                                      / this.parsedGetComputedStyle(this.mBefore.parentNode.parentNode.parentNode, "width")) / 10 + "%"
	    
	            this.mInfo2.textContent = Math.floor(hAfter) + "px\n"
	                         + Math.floor(100 * 10 * (hAfter)
	                                      / this.parsedGetComputedStyle(this.mAfter.parentNode.parentNode.parentNode, "width")) / 10 + "%"
	
	            EditorUtils.getCurrentEditor().rootElement.appendChild(this.mInfo1);
	            EditorUtils.getCurrentEditor().rootElement.appendChild(this.mInfo2);
	
	
	            aTarget.setCapture(true);
	            this.mResizerType = "tr";
	            this.mIsMoving = true;
	
	            return true;
	          }
	          break;
	        default: break;
	      }
      }
      return false;
    },

    parsedGetComputedStyle: function(aElt, aProperty)
    {
      return parseFloat(aElt.ownerDocument.defaultView.getComputedStyle(aElt, "").getPropertyValue(aProperty));
    },

    setHeight: function(aEditor, aElt, aValue) {
      aEditor.removeAttribute(aElt, "height");
      var txn = new diStyleAttrChangeTxn(aElt, "height", aValue, "");
      aEditor.transactionManager.doTransaction(txn);
      aEditor.incrementModificationCount(1);  
    },

    setWidth: function(aEditor, aElt, aValue) {
      aEditor.removeAttribute(aElt, "width");
      var txn = new diStyleAttrChangeTxn(aElt, "width", aValue, "");
      aEditor.transactionManager.doTransaction(txn);
      aEditor.incrementModificationCount(1);  
    },

    MouseUp: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      if (!this.mIsMoving)
        return false;
      this.mIsMoving = false;
      this.mBar.ownerDocument.releaseCapture()
      this.mBar.parentNode.removeChild(this.mBar);
      this.mInfo1.parentNode.removeChild(this.mInfo1);
      this.mBar = null;
      this.mInfo1 = null;

      if (this.mResizerType == "tbody") {
        var doc = EditorUtils.getCurrentDocument();
        var hBefore = this.parsedGetComputedStyle(this.mBefore, "height");
    
        var editor = EditorUtils.getCurrentEditor();
        editor.beginTransaction();
  
        this.setHeight(editor, this.mBefore.parentNode, "");
        var child = this.mBefore.parentNode.firstElementChild;
        while (child) {
          this.setHeight(editor, child, "");
          child = child.nextElementSibling;
        }
  
        var delta = aClientY - this.mStartY;
        this.setHeight(editor, this.mBefore, (hBefore + delta) + "px");

        editor.removeAttribute(this.mBefore.parentNode.parentNode.parentNode, "height");
        var txn = new diStyleAttrChangeTxn(this.mBefore.parentNode.parentNode.parentNode, "height", "", "");
        EditorUtils.getCurrentEditor().transactionManager.doTransaction(txn);
        EditorUtils.getCurrentEditor().incrementModificationCount(1);  

        editor.endTransaction();
      }
      else if (this.mResizerType == "tr") {
        this.mInfo2.parentNode.removeChild(this.mInfo2);
        this.mInfo2 = null;

        var doc = EditorUtils.getCurrentDocument();
        var hBefore = this.parsedGetComputedStyle(this.mBefore, "width");
        var hAfter  = this.parsedGetComputedStyle(this.mAfter, "width");
    
        var editor = EditorUtils.getCurrentEditor();
        editor.beginTransaction();

        // TODO clear width in the two columns
        editor instanceof Components.interfaces.nsITableEditor;
        var beforeRowIndex = {}, beforeColIndex = {};
        var afterRowIndex = {}, afterColIndex = {};
        var tableRowCount = {}, tableColCount = {};
        editor.getCellIndexes(this.mBefore, beforeRowIndex, beforeColIndex);
        editor.getCellIndexes(this.mAfter,  afterRowIndex,  afterColIndex);
        var table = this.mBefore.parentNode.parentNode.parentNode;
        editor.getTableSize(table, tableRowCount, tableColCount);

        for (var i = 0; i < tableRowCount.value; i++) {
          var c = editor.getCellAt(table, i, beforeColIndex.value);
          this.setWidth(editor, c, "");
          c = editor.getCellAt(table, i, afterColIndex.value);
          this.setWidth(editor, c, "");
        }
  
        var delta = aClientX - this.mStartX;
        this.setWidth(editor, this.mBefore, (hBefore + delta) + "px");
        var realWidth = this.parsedGetComputedStyle(this.mBefore, "width");
        if ((hBefore + delta) < realWidth) {
          delta = realWidth - hBefore;
        }
        this.setWidth(editor, this.mAfter,  (hAfter - delta) + "px");
        realWidth = this.parsedGetComputedStyle(this.mAfter, "width");
        if ((hAfter - delta) < realWidth) {
          delta = hAfter - realWidth;
          this.setWidth(editor, this.mBefore, (hBefore + delta) + "px");
        }

        if (aIsShiftKey) {
          var tbw = this.parsedGetComputedStyle(table, "width");
          var newBeforeWidth = (100 * (parseFloat(this.mBefore.style.width)
                                       + this.parsedGetComputedStyle(this.mBefore, "border-left-width")
                                       + this.parsedGetComputedStyle(this.mBefore, "border-right-width")
                                       + this.parsedGetComputedStyle(this.mBefore, "padding-right")
                                       + this.parsedGetComputedStyle(this.mBefore, "padding-left")
                                       + this.parsedGetComputedStyle(this.mBefore, "border-spacing")) / tbw) + "%";
          var newAfterWidth = (100 * (parseFloat(this.mAfter.style.width)
                                       + this.parsedGetComputedStyle(this.mAfter, "border-left-width")
                                       + this.parsedGetComputedStyle(this.mAfter, "border-right-width")
                                       + this.parsedGetComputedStyle(this.mAfter, "padding-right")
                                       + this.parsedGetComputedStyle(this.mAfter, "padding-left")
                                       + this.parsedGetComputedStyle(this.mAfter, "border-spacing")) / tbw) + "%";
          this.setWidth(editor, this.mBefore, newBeforeWidth);
          this.setWidth(editor, this.mAfter, newAfterWidth);
        }

        editor.endTransaction();
      }

      var node = EditorUtils.getSelectionContainer().node;
      NotifierUtils.notify("selection", node, false);
      return true;
    },

    MouseMove: function(aClientX, aClientY, aTarget, aIsShiftKey) {
      if (!this.mIsMoving)
        return false;
      var doc = EditorUtils.getCurrentDocument();
      if (this.mResizerType == "tbody") {
        var realClientY = Math.max(this.mMin, aClientY);

        this.mInfo1.style.top = (realClientY + doc.documentElement.scrollTop - 22) + "px";
        this.mInfo1.style.left = (aClientX + doc.documentElement.scrollLeft + 10) + "px";

        var hBefore = this.parsedGetComputedStyle(this.mBefore, "height");
        this.mInfo1.textContent = Math.floor(hBefore + realClientY - this.mStartY) + "px";

        this.mBar.style.top = (realClientY + doc.documentElement.scrollTop - 2) + "px";
      }
      else if (this.mResizerType == "tr") {
        var realClientX = Math.min(this.mMax, Math.max(this.mMin, aClientX));

        this.mInfo1.style.right = (doc.documentElement.clientWidth - realClientX - doc.documentElement.scrollLeft + 8) + "px";
        this.mInfo2.style.left = (realClientX + doc.documentElement.scrollLeft + 8) + "px";
        this.mInfo1.style.top = (aClientY + doc.documentElement.scrollTop + 10) + "px";
        this.mInfo2.style.top = (aClientY + doc.documentElement.scrollTop + 10) + "px";

        var hBefore = this.parsedGetComputedStyle(this.mBefore, "width");
        var hAfter  = this.parsedGetComputedStyle(this.mAfter, "width");
        this.mInfo1.textContent = Math.floor(hBefore + realClientX - this.mStartX) + "px\n"
                     + Math.floor(100 * 10 * (hBefore + realClientX - this.mStartX)
                                  / this.parsedGetComputedStyle(this.mBefore.parentNode.parentNode.parentNode, "width")) / 10 + "%"

        this.mInfo2.textContent = Math.floor(hAfter - realClientX + this.mStartX) + "px\n"
                     + Math.floor(100 * 10 * (hAfter - realClientX + this.mStartX)
                                  / this.parsedGetComputedStyle(this.mAfter.parentNode.parentNode.parentNode, "width")) / 10 + "%"

        this.mBar.style.left = (realClientX + doc.documentElement.scrollLeft - 2) + "px";
      }
      return true;
    }
};
