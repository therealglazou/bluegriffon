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
  if (aEvent.keyCode == 13) {
    var line = aElt.value;
    EditorUtils.getCurrentSourceEditor().setCursor(parseInt(line) - 1, 0);
    onBespinLineBlur(aElt);
    onBespinFocus(EditorUtils.getCurrentSourceEditorElement());
  }
  if (aEvent.keyCode == 13 ||
      (aEvent.keyCode == 27 && !aEvent.which)) { // ESC key
    gDialog.bespinToolbox1.hidden = true;
    gDialog.bespinToolbox2.hidden = true;
    EditorUtils.getCurrentSourceEditorElement().lastNeedle = null;
    EditorUtils.getCurrentSourceEditorElement().focus();
  }
}

function ToggleBespinFindCaseSensitivity()
{
  var sourceIframe = EditorUtils.getCurrentSourceEditorElement(); 
  var selPoint = sourceIframe.getUserData("selPoint");
  BespinFind(sourceIframe.getUserData("findLastDirection"));
}

function BespinFind(aForward, aInitial)
{
  if (EditorUtils.isWysiwygMode()) {
    if (!gDialog.bespinFindTextbox.value) {
      gDialog.bespinFindPrevious.hidden = true;
      gDialog.bespinFindNext.hidden = true;
      gDialog.bespinToolbox2.hidden = true;
      return false;
    }
    var findInst = EditorUtils.getCurrentEditorElement().webBrowserFind;
    findInst.searchString  = gDialog.bespinFindTextbox.value;
    findInst.matchCase     = gDialog.bespinFindCaseSensitive.checked;
    findInst.wrapFind      = true;
    findInst.findBackwards = !aForward;
    findInst.searchFrames  = true;
    findInst.entireWord    = false;

    var findInFrames = findInst.QueryInterface(Components.interfaces.nsIWebBrowserFindInFrames);
    findInFrames.rootSearchFrame = EditorUtils.getCurrentEditorElement().contentWindow;
    findInFrames.currentSearchFrame = findInFrames.rootSearchFrame;

    if (aInitial) {
      // not sure about that one, let's comment it out for the time being
      //EditorUtils.getCurrentEditor().beginningOfDocument();
    }

    var result = findInst.findNext();

    gDialog.bespinFindTextbox.focus();
    if (result) {
      gDialog.bespinFindCaseSensitive.hidden = false;
      gDialog.bespinFindPrevious.hidden = false;
      gDialog.bespinFindNext.hidden = false;
      gDialog.bespinFindTextbox.className = "";
      gDialog.bespinToolbox2.hidden = false;
      return true;
    }
    gDialog.bespinFindPrevious.hidden = true;
    gDialog.bespinFindNext.hidden = true;
    gDialog.bespinFindTextbox.className = "notfound";
    gDialog.bespinToolbox2.hidden = true;
    return false;
  }
  else {
    var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    sourceIframe.setUserData("findLastDirection", aForward, null);
    var query = gDialog.bespinFindTextbox.value;
    var isCaseSensitive = gDialog.bespinFindCaseSensitive.checked;

    var found = sourceIframe.contentWindow.wrappedJSObject.findNeedle(aForward, aInitial, query, !isCaseSensitive);

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
    if (!EditorUtils.isWysiwygMode())
      EditorUtils.getCurrentSourceEditorElement().focus();
    else {
      GetWindowContent().focus();
    }
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
      case 108: // meta-l
        aEvent.preventDefault();
        gDialog.bespinToolbox1.hidden = false;
        gDialog.bespinLineTextbox.focus();
        break;
      default:
        break;
    }
  }
}

function BespinReplace()
{
  if (!EditorUtils.isWysiwygMode()) {
    var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    if (sourceEditor.lastNeedle && sourceEditor.lastNeedle.from() && sourceEditor.lastNeedle.to()) {
      var end = sourceEditor.lastNeedle.to();
      sourceEditor.lastNeedle.replace(gDialog.bespinReplaceTextbox.value);
      sourceEditor.setCursor(end);
    }
  }
  else
    ReplaceInWysiwyg();
}

function BespinReplaceAndFind()
{
  BespinReplace();
  BespinFind(true, false);
}

function BespinReplaceAll()
{
  var occurences = 0;
  if (!EditorUtils.isWysiwygMode()) {
    var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    sourceEditor.setCursor(0,0);
    var query = gDialog.bespinFindTextbox.value;
    var isCaseSensitive = gDialog.bespinFindCaseSensitive.checked;

    sourceIframe.contentWindow.wrappedJSObject.findNeedle(true, true, query, !isCaseSensitive);

    //BespinFind(true, false);

    while (sourceEditor.lastNeedle &&
           sourceEditor.lastNeedle.from() &&
           sourceEditor.lastNeedle.to()) {
      occurences++;
      var end = sourceEditor.lastNeedle.to();
      sourceEditor.lastNeedle.replace(gDialog.bespinReplaceTextbox.value);
      sourceEditor.setCursor(end);

      BespinFind(true, false);
      var from = sourceEditor.getCursor(true);
      if (from.line == end.line && from.ch == end.ch)
        break;
    }
  }
  else {
    var found = true;
    var editor = EditorUtils.getCurrentEditor();

    var findInst = EditorUtils.getCurrentEditorElement().webBrowserFind;
    findInst.searchString  = gDialog.bespinFindTextbox.value;
    findInst.matchCase     = gDialog.bespinFindCaseSensitive.checked;
    findInst.wrapFind      = false;
    findInst.findBackwards = false;
    findInst.searchFrames  = true;
    findInst.entireWord    = false;

    var findInFrames = findInst.QueryInterface(Components.interfaces.nsIWebBrowserFindInFrames);
    findInFrames.rootSearchFrame = EditorUtils.getCurrentEditorElement().contentWindow;
    findInFrames.currentSearchFrame = findInFrames.rootSearchFrame;

    EditorUtils.getCurrentEditor().beginningOfDocument();

    var result = findInst.findNext();

    editor.beginTransaction();
    while (result) {
      occurences++;
      ReplaceInWysiwyg();
      result = findInst.findNext();
    }
    editor.endTransaction();
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
  gDialog.bespinFindTextbox.focus();
  var editor = EditorUtils.getCurrentEditor();
  if (EditorUtils.isWysiwygMode()) {
    var text = editor.outputToString("text/plain", 1).trim();
    if (text) {
      gDialog.bespinFindTextbox.value = text;
      BespinFind(true, true);
    }
  }
  else {
    var sourceIframe = EditorUtils.getCurrentSourceEditorElement();
    var sourceEditor = sourceIframe.contentWindow.wrappedJSObject.gEditor;
    var text = sourceEditor.getSelection();
    if (text) {
      gDialog.bespinFindTextbox.value = text;
      BespinFind(true, true);
    }
  }
  gDialog.bespinFindTextbox.editor.selectAll();
}

function CloseFindBar()
{
  gDialog.bespinToolbox1.hidden = true;
  gDialog.bespinToolbox2.hidden = true;
  GetWindowContent().focus();
}

function ReplaceInWysiwyg()
{
  var editor = EditorUtils.getCurrentEditor();

  // Does the current selection match the find string?
  var selection = editor.selection;

  var selStr = selection.toString();
  var specStr = gDialog.bespinFindTextbox.value;
  if (!gDialog.bespinFindCaseSensitive.checked)
  {
    selStr = selStr.toLowerCase();
    specStr = specStr.toLowerCase();
  }
  // Unfortunately, because of whitespace we can't just check
  // whether (selStr == specStr), but have to loop ourselves.
  // N chars of whitespace in specStr can match any M >= N in selStr.
  var matches = true;
  var specLen = specStr.length;
  var selLen = selStr.length;
  if (selLen < specLen)
    matches = false;
  else
  {
    var specArray = specStr.match(/\S+|\s+/g);
    var selArray = selStr.match(/\S+|\s+/g);
    if ( specArray.length != selArray.length)
      matches = false;
    else
    {
      for (var i=0; i<selArray.length; i++)
      {
        if (selArray[i] != specArray[i])
        {
          if ( /\S/.test(selArray[i][0]) || /\S/.test(specArray[i][0]) )
          {
            // not a space chunk -- match fails
            matches = false;
            break;
          }
          else if ( selArray[i].length < specArray[i].length )
          {
            // if it's a space chunk then we only care that sel be
            // at least as long as spec
            matches = false;
            break;
          }
        }
      }
    }
  }

  // If the current selection doesn't match the pattern,
  // then we want to find the next match, but not do the replace.
  // That's what most other apps seem to do.
  // So here, just return.
  if (!matches)
    return false;

  // nsPlaintextEditor::InsertText fails if the string is empty,
  // so make that a special case:
  var replStr = gDialog.bespinReplaceTextbox.value;
  if (replStr == "")
    editor.deleteSelection(0);
  else
    editor.insertText(replStr);

  return true;
}

function BespinChangeCallback()
{
  var mode = EditorUtils.getCurrentViewMode();
  if (mode == "source" ||
      (mode == "liveview" && EditorUtils.getLiveViewMode() == "source")) {
    gDialog.tabeditor.showCurrentTabAsModified(EditorUtils.isDocumentModified());    // || IsHTMLSourceChanged());

#ifdef XP_MACOSX
    gDialog.tabeditor.updateOSXCloseButton();
    UpdateBadge();
#endif
  }
}

function BespinActivityCallback()
{
  var mode = EditorUtils.getCurrentViewMode();
  if (mode == "source" ||
      (mode == "liveview" && EditorUtils.getLiveViewMode() == "source")) {
    ComposerCommands.goUpdateCommand("cmd_BGundo");
    ComposerCommands.goUpdateCommand("cmd_BGredo");
    ComposerCommands.goUpdateCommand("cmd_BGcopy");
    ComposerCommands.goUpdateCommand("cmd_BGcut");
    ComposerCommands.goUpdateCommand("cmd_BGpaste");
    ComposerCommands.goUpdateCommand("cmd_BGselectAll");
    ComposerCommands.goUpdateCommand("cmd_BGpasteNoFormatting");
    ComposerCommands.goUpdateCommand("cmd_BGdelete");
  }
}
