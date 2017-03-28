Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/reflect.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/l10nHelper.jsm");

var bespinEditor = null;
var gSource = {value: ""};

function _InstallBespin(aValue)
{
  var theme = null;
  try {
    theme = GetPrefs().getCharPref("bluegriffon.source.theme");
  }
  catch(e) {}

  gDialog.bespinIframe.addEventListener("load", function() {InstallBespin(gDialog.bespinIframe, theme, aValue);}, true);
  gDialog.bespinIframe.setAttribute("src", "resource://gre/res/scripteditor.html");
}

function Startup()
{
  if ("arguments" in window)
    gSource = window.arguments[0];

  var src = window.arguments[1];
  if (src)
    window.document.documentElement.setAttribute("title", "BlueGriffon - " + src.substr(src.lastIndexOf("/") + 1));
  GetUIElements();

  _InstallBespin(gSource.value);
}

function CommitChanges()
{
  gSource.cancelled = false;
  var bespinEditor = gDialog.bespinIframe.contentWindow.wrappedJSObject.gEditor;
  gSource.value = bespinEditor.getValue();
  window.close();
}

function SourceChangeCallback()
{
  var sourceEditor = gDialog.bespinIframe.contentWindow.wrappedJSObject.gEditor;
  var value = sourceEditor.getValue();

  if (sourceEditor.lastErrorLine) {
    var lineInfo = sourceEditor.lineInfo(sourceEditor.lastErrorLine - 1);
    var markerClass = lineInfo.markerClass ? lineInfo.markerClass : "";
    var markerClassArray = markerClass.split(" ");
    markerClassArray.splice(markerClassArray.indexOf("error"), 1);
    sourceEditor.setMarker(sourceEditor.lastErrorLine - 1, null, markerClassArray.join(" "));
    sourceEditor.lastErrorLine = 0;
  }

  try {
    Reflect.parse(value);
  }
  catch(e) {
    var line = e.lineNumber;

    lineInfo = sourceEditor.lineInfo(line - 1);
    markerClass = lineInfo.markerClass ? lineInfo.markerClass : "";
    markerClassArray = markerClass.split(" ");
    if (-1 == markerClassArray.indexOf("error"))
      markerClassArray.push("error");
    sourceEditor.setMarker(line - 1, null, markerClassArray.join(" "));
    sourceEditor.lastErrorLine = line;

    var visible = sourceEditor.visibleLines();
    if (line-1 >= visible.to || line-1 < visible.from)
      sourceEditor.setCursor(line - 1, ch);
  }
}

function InstallBespin(aIframe, aTheme, aValue)
{
  aIframe.contentWindow.wrappedJSObject.installCodeMirror(BespinKeyPressCallback,
                                          SourceChangeCallback,
                                          aTheme,
                                          aValue);
}

function onBespinFocus(aIframe)
{
  aIframe.focus();
}

function onBespinLineBlur(aElt)
{
  aElt.value = "";
}

function onBespinLineKeypress(aEvent, aElt)
{
  var bespinEditor = gDialog.bespinIframe.contentWindow.wrappedJSObject.gEditor;

  if (aEvent.keyCode == 13) {
    var line = aElt.value;
    bespinEditor.setCursor(parseInt(line) - 1, 0);
    onBespinLineBlur(aElt);
    onBespinFocus(bespinEditor);
  }
  if (aEvent.keyCode == 13 ||
      (aEvent.keyCode == 27 && !aEvent.which)) { // ESC key
    gDialog.bespinToolbox1.hidden = true;
    gDialog.bespinToolbox2.hidden = true;
    bespinEditor.lastNeedle = null;
    bespinEditor.focus();
  }
}

function ToggleBespinFindCaseSensitivity()
{
  var bespinIframe = gDialog.bespinIframe;
  BespinFind(bespinIframe.getUserData("findLastDirection"), true);
}

function BespinFind(aForward, aInitial)
{
  var sourceIframe = gDialog.bespinIframe;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
  sourceIframe.setUserData("findLastDirection", aForward, null);
  var query = gDialog.bespinFindTextbox.value;
  var isCaseSensitive = !gDialog.bespinFindCaseSensitive.checked;

  var found = sourceIframe.contentWindow.wrappedJSObject.findNeedle(aForward, aInitial, query, isCaseSensitive);

  if (!found) {
    //gDialog.bespinFindCaseSensitive.hidden = true;
    gDialog.bespinFindPrevious.hidden = true;
    gDialog.bespinFindNext.hidden = true;
    gDialog.bespinFindTextbox.className = "notfound";
    gDialog.bespinToolbox2.hidden = true;
    return false;
  }

  gDialog.bespinFindCaseSensitive.hidden = false;
  gDialog.bespinFindPrevious.hidden = false;
  gDialog.bespinFindNext.hidden = false;
  gDialog.bespinFindTextbox.className = "";
  gDialog.bespinToolbox2.hidden = false;
  return true;
}

function onBespinFindClear(aEvent, aElt)
{
  if (!aElt.value) {
    aElt.className = "";
    gDialog.bespinFindCaseSensitive.hidden = true;
    gDialog.bespinFindPrevious.hidden = true;
    gDialog.bespinFindNext.hidden = true;
    gDialog.bespinToolbox2.hidden = true;
  }
}

function onBespinFindKeypress(aEvent)
{
  if (aEvent.keyCode == 27 && !aEvent.which) { // ESC key
    gDialog.bespinToolbox1.hidden = true;
    gDialog.bespinToolbox2.hidden = true;
    var sourceIframe = gDialog.bespinIframe;
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    sourceEditor.focus();
  }
}

function BespinKeyPressCallback(aEvent)
{
#ifdef XP_MACOSX
  if (aEvent.metaKey &&
      !aEvent.ctrlKey &&
      !aEvent.altKey) {
#else
  if (!aEvent.metaKey &&
      aEvent.ctrlKey &&
      !aEvent.altKey) {
#endif
    switch (aEvent.which) {
      case 102: // meta-f
      case 114: // meta-r
        aEvent.preventDefault();
        WysiwygShowFindBar();
        break;
      case 103:
        aEvent.preventDefault();
        if (!gDialog.bespinToolbox1.hidden) {
          BespinFind(true, false);
          gDialog.bespinFindTextbox.focus();
        }
        break;
      case 108: // meta-l
        aEvent.preventDefault();
        gDialog.bespinToolbox1.hidden = false;
        gDialog.bespinLineTextbox.focus();
        break;
      /*case 99: // meta-c XXX Workaround for Copy horked in Bespin0.9+Gecko2
      case 120: // meta-x XXX
        {
          aEvent.preventDefault();
          var sourceEditor = EditorUtils.getCurrentSourceEditor();
          var selection = sourceEditor.selectedText;
          var clipboardSvc = Components.classes["@mozilla.org/widget/clipboard;1"].
                             getService(Components.interfaces.nsIClipboard);
          var xferable = Components.classes["@mozilla.org/widget/transferable;1"].
                         createInstance(Components.interfaces.nsITransferable);
          xferable.addDataFlavor("text/unicode");
          var s = Components.classes["@mozilla.org/supports-string;1"].
                  createInstance(Components.interfaces.nsISupportsString);
          s.data = selection;
          xferable.setTransferData("text/unicode", s, selection.length * 2);
          clipboardSvc.setData(xferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
        }
        if (aEvent.which == 120)
          sourceEditor.selectedText = "";
        break;*/
      default:
        break;
    }
  }
}

function BespinReplace()
{
  var sourceIframe = gDialog.bespinIframe;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
  if (sourceEditor.lastNeedle && sourceEditor.lastNeedle.from() && sourceEditor.lastNeedle.to()) {
    var end = sourceEditor.lastNeedle.to();
    sourceEditor.lastNeedle.replace(gDialog.bespinReplaceTextbox.value);
    sourceEditor.setCursor(end);
    //sourceEditor.focus();
  }
}

function BespinReplaceAndFind()
{
  BespinReplace();
  BespinFind(true, false);
}

function BespinReplaceAll()
{
  var occurences = 0;
  var sourceIframe = gDialog.bespinIframe;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
  sourceEditor.setCursor(0,0);
  var query = gDialog.bespinFindTextbox.value;
  var isCaseSensitive = gDialog.bespinFindCaseSensitive.checked;

  var found = sourceIframe.contentWindow.wrappedJSObject.findNeedle(true, true, query, isCaseSensitive);

  if (found) {
    while (sourceEditor.lastNeedle &&
           sourceEditor.lastNeedle.from() &&
           sourceEditor.lastNeedle.to()) {
      occurences++;
      var end = sourceEditor.lastNeedle.to();
      sourceEditor.lastNeedle.replace(gDialog.bespinReplaceTextbox.value);
      sourceEditor.setCursor(end);
  
      BespinFind(true, false);
      var from = sourceEditor.getCursor(true);
      if (end.line > from.line || (from.line == end.line && from.ch < end.ch))
        break;
    }
  }

  var title = L10NUtils.getString("ReplaceAll");
  var msg = L10NUtils.getString("ReplacedPart1") +
            " " +
            occurences +
            " " +
            L10NUtils.getString("ReplacedPart2");
  Services.prompt.alert(null, title, msg);
}

function WysiwygShowFindBar()
{
  gDialog.bespinToolbox1.hidden = false;

  var sourceIframe = gDialog.bespinIframe;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
  var text = sourceEditor.getSelection();
  if (text) {
    gDialog.bespinFindTextbox.value = text;
    BespinFind(true, true);
  }
  gDialog.bespinFindTextbox.focus();
}

function CloseFindBar()
{
  gDialog.bespinToolbox1.hidden = true;
  gDialog.bespinToolbox2.hidden = true;
  var sourceIframe = gDialog.bespinIframe;
  var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
  sourceEditor.focus();
}
