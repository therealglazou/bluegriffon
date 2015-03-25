Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/l10nHelper.jsm");

var EXPORTED_SYMBOLS = ["FileChangeUtils"];

var FileChangeUtils = {

  kCSSRule: Components.interfaces.nsIDOMCSSRule,

  mFileInfo: {},
  mLinkedFiles: {},

  lookForChanges: function() {
    this.mLinkedFiles = {};
    var enumerator = Services.wm.getEnumerator( "bluegriffon" );
    while ( enumerator.hasMoreElements() )
    {
      var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
      this.lookForChangesForWindow(win);
    }

    // at this point, we have all references external files inside mLinkedFiles
    var showAlert = true;
    try {
      showAlert = Services.prefs.getBoolPref("bluegriffon.files.alert-on-update");
    }
    catch(e){}
    for (var i in this.mLinkedFiles) {
      if (this.mFileInfo[i]) {
        if (this.mLinkedFiles[i].lastMod > this.mFileInfo[i]) {
          ////////////////////////
          // this file was updated
          ////////////////////////
          if (showAlert) {
            var rv = { value: false };
            var titleWindow   = L10NUtils.getString("AFileWasChanged");
            var checkboxLabel = L10NUtils.getString("DontAskForFileChangesAgain");
            var message       = L10NUtils.getBundle()
                                         .formatStringFromName("ReloadFile",
                                                               [i.substr(i.lastIndexOf("/") + 1)],
                                                               1);
            Services.prompt.alertCheck(null,
                                       titleWindow,
                                       message,
                                       checkboxLabel,
                                       rv);
            showAlert = !rv.value;
            Services.prefs.setBoolPref("bluegriffon.files.alert-on-update", showAlert);
          }
          for (var n = 0; n < this.mLinkedFiles[i].nodes.length; n++) {
            var node = this.mLinkedFiles[i].nodes[n];
            if (node instanceof Components.interfaces.nsIDOMElement) { // it's an element node
              if (node.nodeName.toLowerCase() == "link") {
                var href = node.getAttribute("href");
                node.setAttribute("href", "");
                node.setAttribute("href", href);
              }
              else { // img, audio, video
                var srcAttr = node.getAttribute("src");
                var src = node.src;

                try {
                  // Remove the image URL from image cache so it loads fresh
                  //  (if we don't do this, loads after the first will always use image cache
                  //   and we won't see image edit changes or be able to get actual width and height)
                  
                  var IOService = UrlUtils.getIOService();
                  if (IOService)
                  {
                    if (UrlUtils.getScheme(src))
                    {
                      var uri = IOService.newURI(src, null, null);
                      if (uri)
                      {
                        var imgCacheService = Components.classes["@mozilla.org/image/cache;1"].getService();
                        var imgCache = imgCacheService.QueryInterface(Components.interfaces.imgICache);
              
                        // This returns error if image wasn't in the cache; ignore that
                        imgCache.removeEntry(uri);
                      }
                    }
                  }
                }
                catch(e) {}

                node.setAttribute("src", "");
                node.setAttribute("src", srcAttr);
              }
            }
            else { // it's a style rule
              var parentStyleSheet = node.parentStyleSheet;
              while (!parentStyleSheet.ownerNode) {
                parentStyleSheet = parentStyleSheet.ownerRule.parentStyleSheet;
              }
              var node = parentStyleSheet.ownerNode;
              if (node.nodeName.toLowerCase() == "style") {
                var prose = node.textContent;
                node.textContent = "";
                node.textContent = prose;
              }
              else { // link
                var href = node.getAttribute("href");
                node.setAttribute("href", "");
                node.setAttribute("href", href);
              }
            }
          }
        }
      }
    }

    // update saved timestamps
    this.mFileInfo = {};
    for (var i in this.mLinkedFiles) {
      this.mFileInfo[i] = this.mLinkedFiles[i].lastMod;
    }
  },

  lookForChangesForWindow: function(aWindow)
  {
    if (!aWindow) // sanity check
      return;

    var tabeditor = aWindow.document.getElementById("tabeditor");
    var decks = tabeditor.mTabpanels.childNodes;
    for (var i = 0; i < decks.length; i++) {
      this.lookForChangesForEditor(decks[i].lastChild);
    }
  },

  _enumerateStyleSheet: function(aSheet, aCallback)
  {
    if (aCallback(aSheet))
      return;
    var rules = aSheet.cssRules;
    for (var j = 0; j < rules.length; j++)
    {
      var rule = rules.item(j);
      switch (rule.type)
      {
        case FileChangeUtils.kCSSRule.IMPORT_RULE:
          this._enumerateStyleSheet(rule.styleSheet, aCallback);
          break;
        case FileChangeUtils.kCSSRule.MEDIA_RULE:
          this._enumerateStyleSheet(rule, aCallback);
          break;
        default:
          break;
      }

    }
  },

  enumerateStyleSheets: function(aDocument, aCallback)
  {
    var stylesheetsList = aDocument.styleSheets;
    for (var i = 0; i < stylesheetsList.length; i++)
    {
      var sheet = stylesheetsList.item(i);
      this._enumerateStyleSheet(sheet, aCallback);
    }
  },

  lookForChangesForEditor: function(aElt)
  {
    if (!aElt) // sanity check
      return;

    var innerEditor = aElt.getEditor(aElt.contentWindow);
    var doc = innerEditor.document;
    // first, find nodes with external references
    var nodes = doc.querySelectorAll("link[rel*='stylesheet'][href], img[src], audio[src], video[src]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var src = "";
      switch (node.nodeName.toLowerCase()) {
        case "link": src = node.href; break;
        case "audio":
        case "video":
        case "img":  src = node.src; break;

        default: break; // should never happen
      }
      if (src && src.substr(0, 7) == "file://") {
        this.addLinkedFile(src, node);
      }
    }

    // now, let's deal with the complex case: imported stylesheets...
    var _self = this;
    function enumerateImportedSheets(aSheet)
    {
      var cssRules = aSheet.cssRules;
      for (var i = 0; i < cssRules.length; i++)
      {
        var rule = cssRules.item(i);
        if (rule.type == FileChangeUtils.kCSSRule.IMPORT_RULE)
        {
          var src = rule.styleSheet.href;
          if (src && src.substr(0, 7) == "file://") {
            _self.addLinkedFile(src, rule);
          }
        }
      }
      return false;
    }
  
    this.enumerateStyleSheets(doc, enumerateImportedSheets);
  },

  addLinkedFile: function(aSrc, aNode)
  {
    if (aSrc in this.mLinkedFiles) {
      this.mLinkedFiles[aSrc].nodes.push(aNode);
    }
    else {
      var file = UrlUtils.newLocalFile(aSrc);
      var lastMod = 0;
      if (file && file.exists()) {
        lastMod = file.lastModifiedTime;
      }
      this.mLinkedFiles[aSrc] = { lastMod: lastMod,
                                  nodes:   [aNode] };
    }
  },

  notifyFileModifiedByBlueGriffon: function(aSpec)
  {
    if (!aSpec) // early way out
      return;
    if (aSpec in this.mFileInfo)
      delete this.mFileInfo[aSpec];
  }
};
