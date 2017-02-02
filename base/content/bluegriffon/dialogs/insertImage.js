Components.utils.import("resource://gre/modules/cssHelper.jsm");
Components.utils.import("resource://gre/modules/editorHelper.jsm");
Components.utils.import("resource://gre/modules/urlHelper.jsm");

var gNode = null;
var isAbsoluteRegexp = new RegExp('^([a-z][a-z0-9+.-]*:\/\/|\/\/)', 'i');

function Startup()
{
  gNode = window.arguments[0];
  var url = window.arguments[1];

  GetUIElements();

  InitDialog();

  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    gDialog.relativeURLCheckbox.disabled = false;
    gDialog.relativeURLCheckboxWarning.hidden = true;
  }

  if (url) {
    gDialog.imageURLTextbox.value = url;

    LoadImage();
    SetFocusToAlt();
  }

  UpdateButtons();
  //window.sizeToContent();
#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function onAccept()
{
  // general
  var url = gDialog.imageURLTextbox.value;
  var title = gDialog.titleTextbox.value;
  var altText = gDialog.alternateTextTextbox.value;
  var longdesc = gDialog.longDescTextbox.value;

  var isWysiwyg = EditorUtils.isWysiwygMode();
  var editor = EditorUtils.getCurrentEditor(); 
  if (gNode && isWysiwyg) {
    editor.beginTransaction();
    editor.setAttribute(gNode, "src", url);
    if (altText)
      editor.setAttribute(gNode, "alt", altText);
    else
      editor.removeAttribute(gNode, "alt");
    if (title)
      editor.setAttribute(gNode, "title", title);
    else
      editor.removeAttribute(gNode, "title");
    if (longdesc)
      editor.setAttribute(gNode, "longdesc", longdesc);
    else
      editor.removeAttribute(gNode, "longdesc");
    
    editor.endTransaction();
  }
  else {
    var imgElement = EditorUtils.getCurrentDocument().createElement("img");
    imgElement.setAttribute("src", url);
    imgElement.setAttribute("alt", altText);
    if (title)
      imgElement.setAttribute("title", title);
    if (longdesc)
      imgElement.setAttribute("longdesc", longdesc);
    if (isWysiwyg) 
      editor.insertElementAtSelection(imgElement, true);
    else {
      var src = style_html(imgElement.outerHTML);
      var srcEditor = EditorUtils.getCurrentSourceEditor();
      srcEditor.replaceSelection(src);
    }
  }
}


function LoadImage()
{
  var url = gDialog.imageURLTextbox.value.trim();
  gDialog.previewImage.style.backgroundImage = 'url("' +
    UrlUtils.makeAbsoluteUrl(url) + '")';
  UpdateButtons();
}

function UpdateButtons()
{
  var ok = (gDialog.imageURLTextbox.value &&
            (gDialog.emptyAltOkCheckbox.checked || gDialog.alternateTextTextbox.value));
  SetEnabledElement(document.documentElement.getButton("accept"), ok);
}

function MakeRelativeUrl()
{
  var spec = gDialog.imageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.imageURLTextbox.value = spec;
    gDialog.relativeURLCheckbox.checked = true;
  }
}

function MakeRelativeLongDescUrl()
{
  var spec = gDialog.longDescTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog.longDescTextbox.value = spec;
  }
}

function SetFocusToAlt()
{
  gDialog.alternateTextTextbox.focus();
}

function MakeAbsoluteUrl()
{
  var spec = gDialog.imageURLTextbox.value;
  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (docUrlScheme && docUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog.imageURLTextbox.value = spec;
    gDialog.relativeURLCheckbox.checked = false;
  }
}

function ToggleRelativeOrAbsolute()
{
  if (gDialog.relativeURLCheckbox.checked) {
    MakeRelativeUrl();
  }
  else {
    MakeAbsoluteUrl();
  }
}

function InitDialog()
{
  if (!gNode)
    return;

  var isAbsolute = new RegExp('^([a-z]+://)', 'i');
  var url = gNode.getAttribute("src");
  gDialog.imageURLTextbox.value = url;
  var isAbsolute = isAbsoluteRegexp.test(url);
  gDialog.relativeURLCheckbox.checked = !isAbsolute;
  LoadImage();
  gDialog.titleTextbox.value = gNode.getAttribute("title");
  gDialog.alternateTextTextbox.value = gNode.getAttribute("alt");
}

function LoadImageFromFilePicker()
{
  LoadImage();

  var url = gDialog.imageURLTextbox.value.trim();
  var isAbsolute = isAbsoluteRegexp.test(url);
  if (!gDialog.relativeURLCheckbox.disabled) {
    if (gDialog.relativeURLCheckbox.checked) {
      if (isAbsolute)
        MakeRelativeUrl();
    }
    else {
      if (!isAbsolute)
        MakeAbsoluteUrl();
    }
  }
}
