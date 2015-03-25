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
 * Portions created by the Initial Developer are Copyright (C) 2006
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

var Bezier = {
  init: function() {
    gDialog.p1_point.addEventListener("mousedown", Bezier.onMouseDown, false);
    gDialog.p1_point.addEventListener("mousemove", Bezier.onMouseMove, false);
    gDialog.p1_point.addEventListener("mouseup",   Bezier.onMouseUp, false);
    gDialog.p2_point.addEventListener("mousedown", Bezier.onMouseDown, false);
    gDialog.p2_point.addEventListener("mousemove", Bezier.onMouseMove, false);
    gDialog.p2_point.addEventListener("mouseup",   Bezier.onMouseUp, false);
  },

  mOriginalX: 0,
  mOriginalY: 0,
  mBoxX: 0,
  mBoxY: 0,
  mMoving: false,

  mScaleFactor: 1,

  onMouseDown: function(aEvent)
  {
    var target = aEvent.target;
    this.mMoving = true;
    this.mOriginalX = aEvent.clientX;
    this.mOriginalY = aEvent.clientY;
    this.mBoxX = parseInt(target.getAttribute("left"));
    this.mBoxY = parseInt(target.getAttribute("top"));
    target.setCapture(true);
    target.className = "grabbing";
  },

  onMouseMove: function(aEvent)
  {
    if (!this.mMoving)
      return;
    Bezier.toggleBezier();
    var x = this.mBoxX + aEvent.clientX - this.mOriginalX;
    var y = this.mBoxY + aEvent.clientY - this.mOriginalY;
    x = Math.max(46, Math.min(146, x));
    y = Math.max(6, Math.min(106, y));
    aEvent.target.setAttribute("left", x);
    aEvent.target.setAttribute("top",  y);
    var curve = gDialog.curve.getAttribute("d").split(" ");
    switch (aEvent.target.id) {
      case "p2_point":
        gDialog.p2_path.setAttribute("d",
          "M " + (x-46) + "," + (y-6) + " 100,0");
        curve[4] = (x-46) + "," + (y-6);
        gDialog.p2_x.value = (x == 146) ? "1" : "0." + (x-46);
        gDialog.p2_y.value = (y == 6) ? 1 : "0." + (106-y);
        break;
      case "p1_point":
        gDialog.p1_path.setAttribute("d",
          "M 0,100 " + (x-46) + "," + (y-6) );
        curve[3] = (x-46) + "," + (y-6);
        gDialog.p1_x.value = (x == 146) ? "1" : "0." + (x-46);
        gDialog.p1_y.value = (y == 6) ? 1 : "0." + (106-y);
        break;
      default: break; // should never happen
    }
    gDialog.curve.setAttribute('d', curve.join(" "));
  },

  onMouseUp: function(aEvent)
  {
    aEvent.target.releaseCapture();
    this.mMoving = false;
    aEvent.target.className = "";
  },

  mOriginatingItem: null,

  initWithBezier: function(aString, e)
  {
    aString = aString.trim();
    if (e) {
      this.mOriginatingItem = e;
      var c = gDialog.bezierMultibuttons.firstElementChild;
      while (c) {
        if (c.getAttribute("value") == aString)
          c.setAttribute("checked", "true");
        else
          c.removeAttribute("checked");
        c = c.nextElementSibling;
      }
    }
    switch (aString) {
      case "linear":      aString = "cubic-bezier(0,0,1,1)"; break;
      case "ease":        aString = "cubic-bezier(0.25,0.1,0.25,1)"; break;
      case "ease-in":     aString = "cubic-bezier(0.42,0,1,1)"; break;
      case "ease-out":    aString = "cubic-bezier(0,0,0.58,1)"; break;
      case "ease-in-out": aString = "cubic-bezier(0.42,0,0.58,1)"; break;
      default: break;
    }

    var R = (/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    var r = R.exec(aString);
    var p1_x, p2_x, p1_y, p2_y;
    if (!r) {
      p1_x = 1;
      p1_y = 1;
      p2_x = 0;
      p2_y = 0;
    }
    else {
      p1_x = parseFloat(r[1]);
      p1_y = 1 - parseFloat(r[2]);
      p2_x = parseFloat(r[3]);
      p2_y = 1 - parseFloat(r[4]);
    }

    this.updateAll(p1_x, p1_y, p2_x, p2_y, true);
  },

  updateAll: function (p1_x, p1_y, p2_x, p2_y, aUpdateTextboxes)
  {
    if (aUpdateTextboxes) {
      gDialog.p1_x.value = p1_x;
      gDialog.p1_y.value = 1 - p1_y;
      gDialog.p2_x.value = p2_x;
      gDialog.p2_y.value = 1 - p2_y;
    }
    var p1 = Math.floor(p1_x * 100) + "," + Math.floor(p1_y * 100);
    var p2 = Math.floor(p2_x * 100) + "," + Math.floor(p2_y * 100);
    gDialog.p2_path.setAttribute("d", "M " + p2 + " 100,0");
    gDialog.p1_path.setAttribute("d", "M 0,100 " + p1);
    gDialog.curve.setAttribute("d", "M 0,100 C " + p1 + " "+ p2 + " 100,0");
    gDialog.p1_point.setAttribute("left", 46 + Math.floor(p1_x * 100));
    gDialog.p1_point.setAttribute("top",   6 + Math.floor(p1_y * 100));
    gDialog.p2_point.setAttribute("left", 46 + Math.floor(p2_x * 100));
    gDialog.p2_point.setAttribute("top",   6 + Math.floor(p2_y * 100));
  },

  onAccept: function()
  {
    if (!this.mOriginatingItem)
      return;
    var c = gDialog.bezierMultibuttons.firstElementChild;
    while (c) {
      if (c.hasAttribute("checked")) {
        this.mOriginatingItem.value = c.getAttribute("value");
        gDialog.bezierPanel.hidePopup();
        ReapplyTransitions();
        return;
      }
      c = c.nextElementSibling;
    }

    var s = "cubic-bezier(" + gDialog.p1_x.value + "," + gDialog.p1_y. value + ","
                            + gDialog.p2_x.value + "," + gDialog.p2_y. value + ")";
    this.mOriginatingItem.value = s;
    gDialog.bezierPanel.hidePopup();
    ReapplyTransitions();
  },

  onBezierChanged: function(aElt) {
    var v = parseFloat(aElt.value);
    if (!v)
      aElt.value = 0;
    if (v < 0)
      aElt.value = 0;
    if (v > 1)
      aElt.value = 1;

    this.toggleBezier();

    this.updateAll(parseFloat(gDialog.p1_x.value),
                   1 - parseFloat(gDialog.p1_y.value),
                   parseFloat(gDialog.p2_x.value),
                   1 - parseFloat(gDialog.p2_y.value),
                   false);
  },

  toggleBezier: function (aElt)
  {
    var c = gDialog.bezierMultibuttons.firstElementChild;
    while (c)
    {
      if (c != aElt)
        c.removeAttribute("checked")
      c = c.nextElementSibling;
    }
  }
};

