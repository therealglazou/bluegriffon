Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");

var EXPORTED_SYMBOLS = ["diFilePicker"];

function diFilePicker()
{
  
}

diFilePicker.prototype = {

  kNS_FILEPICKER: Components.interfaces.nsIFilePicker,

  mWindow: null,
  mTitle: "",
  mMode: 0,

  init: function(aWindow, aTitle, aMode)
  {
    this.mWindow = aWindow;
    this.mTitle  = aTitle;
    this.mMode   = aMode;
    this.mFilters = [];
    this.mDefaultString = "";
  },

  appendFilter: function(aTitle, aFilter)
  {
    var filterArray = aFilter.split(";");
    for (var i = 0; i < filterArray.length; i++) {
      var filter = filterArray[i].trim().replace( /\./g, "\\.").replace( /\*/g, ".");
      this.mFilters.push(filter);
    }
  },

  appendFilters: function(aMask)
  {
    if (aMask & this.kNS_FILEPICKER.filterAll)
      this.appendFilter("", "*");

    if (aMask & this.kNS_FILEPICKER.filterHTML)
      this.appendFilter("", "*.html; *.htm; *.shtml; *.xhtml");

    if (aMask & this.kNS_FILEPICKER.filterText)
      this.appendFilter("", "*.txt; *.text");

    if (aMask & this.kNS_FILEPICKER.filterImages)
      this.appendFilter("", "*.jpe; *.jpg; *.jpeg; *.gif; *.png; *.bmp; *.ico; *.svg; *.svgz; *.tif; *.tiff; *.ai; *.drw; *.pct; *.psp; *.xcf; *.psd; *.raw");

    if (aMask & this.kNS_FILEPICKER.filterXML)
      this.appendFilter("", "*.xml");

    if (aMask & this.kNS_FILEPICKER.filterAudio)
      this.appendFilter("", "*.aac; *.aif; *.flac; *.iff; *.m4a; *.m4b; *.mid; *.midi; *.mp3; *.mpa; *.mpc; *.oga; *.ogg; *.ra; *.ram; *.snd; *.wav; *.wma");

    if (aMask & this.kNS_FILEPICKER.filterVideo)
      this.appendFilter("", "*.avi; *.divx; *.flv; *.m4v; *.mkv; *.mov; *.mp4; *.mpeg; *.mpg; *.ogm; *.ogg; *.ogv; *.ogx; *.rm; *.rmvb; *.smil; *.webm; *.wmv; *.xvid");

  },

  show: function()
  {
    var rv = {value: this.kNS_FILEPICKER.returnCancel };
    this.mWindow.openDialog("chrome://epub/content/epub/filepicker.xul",
                            "_blank",
                            "chrome,all,dialog=no,modal=yes,resizable=yes",
                            rv,
                            this.mTitle,
                            this.mMode,
                            this.mFilters,
                            this.mDefaultString);
    this.file = rv.file;
    this.fileURL = rv.fileURL;
    return rv.value;
  },

  addFileToEbook: function(aFile)
  {
      var w = EditorUtils.getCurrentEditorWindow();
      var epubElt = w.document.querySelector("epub2,epub3,epub31");
      if (!epubElt) return;
      var ebook = epubElt.getUserData("ebook");
      if (!ebook) return;

      ebook.addFileToEbook(aFile, epubElt);
  },

  get defaultString()     { return this.mDefaultString; },
  set defaultString(aVal) { this.mDefaultString = aVal; }
  
};
