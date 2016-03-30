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

function OnBespinFocus(aIframe)
{
  aIframe.focus();
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
    if (line >= visible.to || line < visible.from)
      sourceEditor.setCursor(line - 1, 0);
  }
}

function InstallBespin(aIframe, aTheme, aValue)
{
  aIframe.contentWindow.installCodeMirror(BespinKeyPressCallback,
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
  var selPoint = bespinIframe.getUserData("selPoint");
  //bespinEditor = gDialog.bespinIframe.contentWindow.gEditor.setCursor(selPoint);
  BespinFind(bespinIframe.getUserData("findLastDirection"), true);
}

function BespinFind(aForward, aInitial)
{
    var sourceIframe = gDialog.bespinIframe;
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    sourceIframe.setUserData("findLastDirection", aForward, null);
    var query = gDialog.bespinFindTextbox.value;
    var isCaseSensitive = gDialog.bespinFindCaseSensitive.checked;
    var found = false;
    if (aInitial || !sourceEditor.lastNeedle) {
      var selection = sourceEditor.getCursor(true);
      sourceEditor.lastNeedle = sourceEditor.getSearchCursor(query, { line: selection.line, ch: selection.ch }, isCaseSensitive);
      found = sourceEditor.lastNeedle.findNext();
    }
    else {
      if (aForward) {
        found = sourceEditor.lastNeedle.findNext();
      }
      else {
        found = sourceEditor.lastNeedle.findPrevious();
      }
    }

    if (!found) { // maybe we hit the document's limits
      if (aForward) {
        sourceEditor.lastNeedle = sourceEditor.getSearchCursor(query, { line: 0, ch: 0 }, isCaseSensitive);
        found = sourceEditor.lastNeedle.findNext();
      }
      else {
        var line = sourceEditor.lineCount() - 1;
        var lineProse = sourceEditor.getLine(line);
        sourceEditor.lastNeedle = sourceEditor.getSearchCursor(query, { line: line, ch: lineProse.length -1 }, isCaseSensitive);
        found = sourceEditor.lastNeedle.findPrevious();
      }
    }

    if (!found) {
      //gDialog.bespinFindCaseSensitive.hidden = true;
      gDialog.bespinFindPrevious.hidden = true;
      gDialog.bespinFindNext.hidden = true;
      gDialog.bespinFindTextbox.className = "notfound";
      gDialog.bespinToolbox2.hidden = true;
      return false;
    }

    sourceEditor.setSelection(sourceEditor.lastNeedle.from(), sourceEditor.lastNeedle.to());
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
      case 103: // meta-g
        aEvent.preventDefault();
        FindNext();
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
          var bespinEditor = EditorUtils.getCurrentSourceEditor();
          var selection = bespinEditor.selectedText;
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
          bespinEditor.selectedText = "";
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

  var query = gDialog.bespinFindTextbox.value;
  var isCaseSensitive = gDialog.bespinFindCaseSensitive.checked;
  sourceEditor.lastNeedle = sourceEditor.getSearchCursor(query, { line: 0, ch: 0 }, isCaseSensitive);

  while (sourceEditor.lastNeedle.findNext()) {
    occurences++;
    sourceEditor.lastNeedle.replace(gDialog.bespinReplaceTextbox.value);
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
