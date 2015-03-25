var gRv = null;
function Startup()
{
  
  GetUIElements();
  gRv = window.arguments[0];

  if (!EditorUtils.getCurrentEditor())
    document.documentElement.getButton("extra1").setAttribute("disabled", "true");

  InitDialog();

  onDoctypeToggle(gDialog.languageRadiogroup);

#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif

  var w = EditorUtils.getCurrentEditorWindow();
  w.NotifierUtils.addNotifierCallback("documentCreated", DocumentCreated, this);
}

function Shutdown()
{
  var w = EditorUtils.getCurrentEditorWindow();
  w.NotifierUtils.removeNotifierCallback("documentCreated", DocumentCreated, this);
}

function InitDialog()
{
  var strings = gDialog.bundle.strings;
  var charsets = [];
  while (strings.hasMoreElements())
  {
    var s = strings.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
    var key = s.key.replace( /\.title/g , "");
    var value = s.value;
    if (key.substr(0, 7) != "chardet")
      charsets.push( { key: key, value: value } );
  }

  function compareCharsets(a, b)
  {
    if (a.value > b.value)
      return 1;
    if (a.value < b.value)
      return -1;
    return 0;
  }
  charsets.sort(compareCharsets);
  for (var i = 0; i < charsets.length; i++)
  {
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", charsets[i].value);
    menuitem.setAttribute("value", charsets[i].key);
    gDialog.charsetMenupopup.appendChild(menuitem);
  }
  gDialog.charsetMenulist.value = "utf-8";

  gDialog.polyglotCheckbox.checked = GetPrefs().getBoolPref("bluegriffon.defaults.html5.polyglot");

  switch (GetPrefs().getCharPref("bluegriffon.defaults.doctype")) {
    case "kHTML5":
      gDialog.languageRadiogroup.value = "HTML5";
      break;
    case "kXHTML5":
      gDialog.languageRadiogroup.value = "XHTML5";
      break;
    case "kXHTML11":
      gDialog.languageRadiogroup.value = "XHTML11";
      break;
    case "kHTML_STRICT":
      gDialog.languageRadiogroup.value = "HTML";
      gDialog.doctypeRadiogroup.value = "STRICT";
      break;
    case "kHTML_TRANSITIONAL":
      gDialog.languageRadiogroup.value = "HTML";
      gDialog.doctypeRadiogroup.value = "TRANSITIONAL";
      break;
    case "kXHTML_STRICT":
      gDialog.languageRadiogroup.value = "XHTML";
      gDialog.doctypeRadiogroup.value = "STRICT";
      break;
    case "kXHTML_TRANSITIONAL":
      gDialog.languageRadiogroup.value = "XHTML";
      gDialog.doctypeRadiogroup.value = "TRANSITIONAL";
      break;
  }
  onDoctypeToggle(gDialog.languageRadiogroup);
}

function onAccept()
{
  document.persist("languageRadiogroup", "value");
  document.persist("doctypeRadiogroup", "value");
  //document.persist("whereRadiogroup", "value");

  if ((gDialog.languageRadiogroup.value == "HTML5" || gDialog.languageRadiogroup.value == "XHTML5")
      && gDialog.polyglotCheckbox.checked)
    gRv.value = "kPOLYGLOT";
  else {
    gRv.value = "k" +
                gDialog.languageRadiogroup.value;
    if (gRv.value != "kHTML5" && gRv.value != "kXHTML5" && gRv.value != "kXHTML11")
      gRv.value += "_" + gDialog.doctypeRadiogroup.value;
  }

  GetPrefs().setCharPref("bluegriffon.defaults.doctype", gRv.value);
  GetPrefs().setBoolPref("bluegriffon.defaults.html5.polyglot", gDialog.polyglotCheckbox.checked);

  var w = EditorUtils.getCurrentEditorWindow();
  w.OpenFile(w[gRv.value], true);

  return false;
}

function onDoctypeToggle(aElt)
{
  var value = aElt.value;
  var noTransitional = (value == "HTML5" || value == "XHTML5" || value == "XHTML11");
  SetEnabledElementAndControl(gDialog.transitionalRadio, !noTransitional);
  SetEnabledElementAndControl(gDialog.strictRadio, !noTransitional);
  if (value == "XHTML5")
    gDialog.charsetMenulist.value = "utf-8";
  SetEnabledElement(gDialog.charsetMenulist, (value != "XHTML5" &&
                                              (value != "HTML5" || !gDialog.polyglotCheckbox.checked)));
  SetEnabledElement(gDialog.polyglotCheckbox, (value == "HTML5" || value == "XHTML5"));
}

function SelectLanguage(aElt)
{
  var retValue = { lang: "" };
  window.openDialog("chrome://bluegriffon/content/dialogs/languages.xul","_blank",
                    "chrome,modal,dialog=no,titlebar,centerscreen", null, retValue);
  gDialog.pageLanguage.value = retValue.lang;
}

function DocumentCreated()
{
  if (gDialog.pageLanguage.value)
    EditorUtils.getCurrentDocument().documentElement.
      setAttribute("lang", gDialog.pageLanguage.value);

  if (gDialog.directionRadio.value)
    EditorUtils.getCurrentDocument().documentElement.
      setAttribute("dir", gDialog.directionRadio.value);

  /* character set */
  var meta = EditorUtils.getCurrentDocument().querySelector('meta[http-equiv="content-type"]');
  if (meta) {
    meta.parentNode.removeChild(meta);
  }
  meta = EditorUtils.getCurrentDocument().createElement("meta");
  meta.setAttribute("http-equiv", "content-type");
  EditorUtils.insertMetaElement(meta,
                                EditorUtils.getCurrentDocumentMimeType() + "; charset="
                                  + gDialog.charsetMenulist.value,
                                true, true);
  EditorUtils.getCurrentEditor().documentCharacterSet = gDialog.charsetMenulist.value;
  window.close();
}

function SimilarToCurrent()
{
  var editor = EditorUtils.getCurrentEditor();
  var doc    = editor.document;
  var root   = doc.documentElement; 

  var doctype = doc.doctype;
  var systemId = doctype ? doctype.systemId : null;
  var type = {doctype: null, strict: false };

  switch (systemId) {
    case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
    case "http://www.w3.org/TR/REC-html40/strict.dtd":
      type = {doctype: "HTML", strict: true };
      break;
    case "http://www.w3.org/TR/html4/loose.dtd":
    case "http://www.w3.org/TR/REC-html40/loose.dtd":
      type = {doctype: "HTML", strict: false };
      break;
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
      type = {doctype: "XHTML", strict: false };
      break;
    case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
      break;
    case null:
      if (doc.compatMode == "CSS1Compat")
        type = {doctype: "XHTML5", strict: false };
      else
        type = {doctype: "HTML", strict: false };
      break;
    case "":
      type = {doctype:
                (root.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml")
                ? "XHTML5"
                : "HTML5",
              strict: false };
      break;
    default: break; // should never happen...
  }
  
  gDialog.languageRadiogroup.value = type.doctype;
  gDialog.doctypeRadiogroup.value = type.strict ? "STRICT" : "TRANSITIONAL";
  onDoctypeToggle(gDialog.languageRadiogroup);

  gDialog.pageLanguage.value = root.hasAttribute("lang")
                               ? root.getAttribute("lang")
                               : "";
  gDialog.directionRadio.value = root.hasAttribute("dir")
                                 ? root.getAttribute("dir")
                                 : "";
  gDialog.charsetMenulist.value = editor.documentCharacterSet.toLowerCase();
  onAccept();
}
