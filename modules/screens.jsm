Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = ["ScreenUtils"];

var ScreenUtils = {

  mScreenManager: null,

  alignPanelsForWindow: function(aWindow)
  {
    var doc = aWindow.document;

    var x = aWindow.screenX;
    var y = aWindow.screenY;
    var w = aWindow.outerWidth;
    var h = aWindow.outerHeight;

    var panels = doc.querySelectorAll('panel[floating="true"][open="true"]');

    // edge case, we have only one monitor and the window uses
    // the whole screen width ; move panels to the right
    if (this.screenManager.numberOfScreens == 1
        && w == aWindow.screen.availWidth) {
      for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        p.sizeTo(panels[0].boxObject.width, h / panels.length - 5);
        p.moveTo(w - p.boxObject.width, y + (h * i / panels.length));
      }
      return;
    }

    // first order the panels
    var leftPanels  = [];
    var rightPanels = [];
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      if (p.boxObject.screenX < x && p.boxObject.width <= x)
        leftPanels.push({
                         panel: p,
                         x: p.boxObject.screenX,
                         w: p.boxObject.width
                       });
      else
        rightPanels.push({
                         panel: p,
                         x: p.boxObject.screenX,
                         w: p.boxObject.width
                       });
    }

    // ********* RIGHT PANELS *********
    // sort the right panels by x order
    function compareRightPanels(a, b) {
      if (a.x < b.x)
        return -1;
      if (a.x > b.x)
        return +1;
      return 0;
    }
    rightPanels.sort(compareRightPanels);

    // aggregate the right panels
    var originX = x + w + 5;
    for (var i = 0; i < rightPanels.length; i++) {
      if (0 < i &&
          rightPanels[i].x >= rightPanels[i-1].x &&
          rightPanels[i].x <= rightPanels[i-1].x + rightPanels[i-1].w) {
        rightPanels[i].newx = rightPanels[i-1].newx;
        rightPanels[i].source = rightPanels[i-1].source;
        rightPanels[i].weight = rightPanels[i-1].weight + 1;
        rightPanels[rightPanels[i-1].source].flex++;
        rightPanels[rightPanels[i].source].maxWidth = Math.max(rightPanels[i].w, rightPanels[rightPanels[i].source].maxWidth);
      }
      else {
        if (0 < i)
          originX += rightPanels[rightPanels[i-1].source].maxWidth + 5;
        rightPanels[i].source = i;
        rightPanels[i].weight = 1;
        rightPanels[i].flex = 1;
        rightPanels[i].maxWidth = rightPanels[i].w;
        rightPanels[i].newx = originX;
      }
    }
    for (var i = 0; i < rightPanels.length; i++) {
      rightPanels[i].h = h / rightPanels[rightPanels[i].source].flex;
      rightPanels[i].y = y + rightPanels[i].h * (rightPanels[i].weight - 1);

      rightPanels[i].panel.sizeTo(rightPanels[rightPanels[i].source].maxWidth, rightPanels[i].h - 5);
    }

    // we need to reposition using a timeout because the sizeTo are still flushing
    function postRightAlignment()
    {
      var delta = 0;
      for (var i = 0; i < rightPanels.length; i++) {
        delta += ScreenUtils.CheckAvailableSpace(rightPanels[rightPanels[i].source].newx,
                                                 rightPanels[rightPanels[i].source].maxWidth);
        rightPanels[i].panel.moveTo(rightPanels[rightPanels[i].source].newx + delta, rightPanels[i].y);
      }
    }
    var timer = Components.classes["@mozilla.org/timer;1"]
                          .createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback(postRightAlignment, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    // ********* LEFT PANELS *********
    // sort the left panels by decreasing x order
    function compareLeftPanels(a, b) {
      if (a.x < b.x)
        return +1;
      if (a.x > b.x)
        return -1;
      return 0;
    }
    leftPanels.sort(compareLeftPanels);

    // aggregate the left panels
    var originX = x - 5;
    for (var i = 0; i < leftPanels.length; i++) {
      if (0 < i &&
          leftPanels[i-1].x >= leftPanels[i].x &&
          leftPanels[i-1].x <= leftPanels[i].x + leftPanels[i].w) {
        leftPanels[i].newx = leftPanels[i-1].newx;
        leftPanels[i].source = leftPanels[i-1].source;
        leftPanels[i].weight = leftPanels[i-1].weight + 1;
        leftPanels[leftPanels[i-1].source].flex++;
        leftPanels[leftPanels[i].source].maxWidth = Math.max(leftPanels[i].w, leftPanels[leftPanels[i].source].maxWidth);
      }
      else {
        if (0 < i)
          originX -= leftPanels[leftPanels[i-1].source].maxWidth + 5;
        leftPanels[i].source = i;
        leftPanels[i].weight = 1;
        leftPanels[i].flex = 1;
        leftPanels[i].maxWidth = leftPanels[i].w;
        leftPanels[i].newx = originX;
      }
    }
    for (var i = 0; i < leftPanels.length; i++) {
      leftPanels[i].h = h / leftPanels[leftPanels[i].source].flex;
      leftPanels[i].y = y + leftPanels[i].h * (leftPanels[i].weight - 1);

      leftPanels[i].panel.sizeTo(leftPanels[leftPanels[i].source].maxWidth, leftPanels[i].h - 5);
    }

    // we need to reposition using a timeout because the sizeTo are still flushing
    function postLeftAlignment()
    {
      var delta = 0;
      for (var i = 0; i < leftPanels.length; i++) {
        delta += ScreenUtils.CheckAvailableSpace(leftPanels[leftPanels[i].source].newx,
                                                 leftPanels[leftPanels[i].source].maxWidth,
                                                 true);
        leftPanels[i].panel.moveTo(leftPanels[leftPanels[i].source].newx - delta - leftPanels[leftPanels[i].source].maxWidth,
                                   leftPanels[i].y);
      }
    }
    var timer = Components.classes["@mozilla.org/timer;1"]
                          .createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback(postLeftAlignment, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
  },

  CheckAvailableSpace: function(x, w, aAtBeginningOfScreen)
  {
    var screens = this.screens;
    for (var i = 0 ; i < screens.length; i++) {
      var s = screens[i];
      if (x >= s.min
          && x < s.max) {
        if (!aAtBeginningOfScreen && s.max - x < w)
          return s.max - x;
        if (aAtBeginningOfScreen && w > x - s.min)
          return x - s.min;
      }
    }
    return 0;
  },

  get screenManager()
  {
    if (this.mScreenManager)
      return this.mScreenManager;

    this.mScreenManager = Components.classes["@mozilla.org/gfx/screenmanager;1"]
                            .getService(Components.interfaces.nsIScreenManager);
    return this.mScreenManager;
  },

  get screens()
  {
    var screen = null;
    var screens = [];
    var screenManager = this.screenManager;
    var min = 0;
    var max = 0;
    for (x = 0; x < 15000; x += 600) {
      var s = screenManager.screenForRect(x, 20, 10, 10);
      if (s != screen) {
        screen = s;
        var left = {}, top = {}, width = {}, height = {};
        screenManager.primaryScreen.GetRect(left, top, width, height);
        screens.push( { width: width.value,
                        height: height.value,
                        min: min,
                        max: min + width.value} );
        min += width.value;
      }
    }
    return screens;
  },

  get availableWidth()
  {
    var screens = this.screens;
    var w = 0;
    for (var i = 0; i < screens.length; i++)
      s += screens[i].width;
    return s;
  }
};
