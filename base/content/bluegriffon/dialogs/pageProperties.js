Components.utils.import("resource://app/modules/urlHelper.jsm");

var gAuthorElement;
var gDescriptionElement;
var gKeywordsElement;
var gAuthor = "";
var gDescription = "";
var gKeywords = "";
var gInsertNewAuthor = false;
var gInsertNewDescription = false;
var gInsertNewKeywords = false;
var gRootElement;
var gTitleWasEdited = false;
var gAuthorWasEdited = false;
var gDescriptionWasEdited = false;
var gKeywordsWasEdited = false;
var gLanguageWasEdited = false;
var gCharset = "";
var gPrefs;

function Startup()
{
  GetUIElements();

  var location = UrlUtils.getDocumentUrl();
  var lastmodString = L10NUtils.getString("Unknown");

  if (!UrlUtils.isUrlOfBlankDocument(location))
  {
    gDialog.pageLocation.setAttribute("value",
                                      UrlUtils.stripUsernamePassword(location));

    // retrieve the last-modification date and time
    var lastmod;
    try {
      lastmod = EditorUtils.getCurrentEditor().document.lastModified;
    }
    catch (e) {}
    // convert date+time into readable form
    if (Date.parse(lastmod))
    {
      try {
        const nsScriptableDateFormat_CONTRACTID = "@mozilla.org/intl/scriptabledateformat;1";
        const nsIScriptableDateFormat = Components.interfaces.nsIScriptableDateFormat;
        var dateService = Components.classes[nsScriptableDateFormat_CONTRACTID]
                            .getService(nsIScriptableDateFormat);

        var lastModDate = new Date();
        lastModDate.setTime(Date.parse(lastmod));
        lastmodString =  dateService.FormatDateTime("", 
                                      dateService.dateFormatLong,
                                      dateService.timeFormatSeconds,
                                      lastModDate.getFullYear(),
                                      lastModDate.getMonth()+1,
                                      lastModDate.getDate(),
                                      lastModDate.getHours(),
                                      lastModDate.getMinutes(),
                                      lastModDate.getSeconds());
      } catch (e) {}

    }
  }
  gDialog.pageLastModified.value = lastmodString;

  gAuthorElement = EditorUtils.getMetaElement("author");
  if (!gAuthorElement)
  {
    gAuthorElement = EditorUtils.createMetaElement("author");
    if (!gAuthorElement)
    {
      window.close();
      return;
    }
    gInsertNewAuthor = true;
  }

  gDescriptionElement = EditorUtils.getMetaElement("description");
  if (!gDescriptionElement)
  {
    gDescriptionElement = EditorUtils.createMetaElement("description");
    if (!gDescriptionElement)
      window.close();

    gInsertNewDescription = true;
  }

  gKeywordsElement = EditorUtils.getMetaElement("keywords");
  if (!gKeywordsElement)
  {
    gKeywordsElement = EditorUtils.createMetaElement("keywords");
    if (!gKeywordsElement)
      window.close();

    gInsertNewKeywords = true;
  }

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

  gRootElement = EditorUtils.getCurrentEditor().rootElement;
  InitDialog();

  SetTextboxFocus(gDialog.pageTitle);

  // SetWindowLocation();
}

function InitDialog()
{
  var doc = EditorUtils.getCurrentDocument();
  if (doc.documentElement.hasAttribute("lang"))
    gDialog.pageLanguage.value = doc.documentElement.getAttribute("lang");
  if (doc.documentElement.hasAttribute("dir"))
    gDialog.directionRadio.value = doc.documentElement.getAttribute("dir");

  gDialog.pageTitle.value = EditorUtils.getDocumentTitle();

  var gAuthor = gAuthorElement.getAttribute("content");
  gAuthor = gAuthor ? gAuthor.trim() : "";
  gDialog.pageAuthor.value = gAuthor;
  
  gDialog.pageDescription.value = gDescriptionElement.getAttribute("content");
  gDialog.pageKeywords.value    = gKeywordsElement.getAttribute("content");

  gCharset = EditorUtils.getCurrentEditor().documentCharacterSet.toLowerCase();
  gDialog.charsetMenulist.value = gCharset;
  if (doc.doctype
      && doc.doctype.publicId == ""
      && doc.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml") { // XHTML5
    SetEnabledElement(gDialog.charsetMenulist, false);
  }
}

function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();
  editor.beginTransaction();

  // general properties
  if (gTitleWasEdited) {
    EditorUtils.setDocumentTitle(gDialog.pageTitle.value.trim());
  }

  if (gAuthorWasEdited)
    EditorUtils.insertMetaElement(gAuthorElement, gDialog.pageAuthor.value.trim(),
                                  gInsertNewAuthor, false);

  if (gDescriptionWasEdited)
    EditorUtils.insertMetaElement(gDescriptionElement, gDialog.pageDescription.value.trim(),
                                  gInsertNewDescription, false);

  if (gKeywordsWasEdited)
    EditorUtils.insertMetaElement(gKeywordsElement, gDialog.pageKeywords.value.trim(),
                                  gInsertNewKeywords, false);

  if (gLanguageWasEdited)
    EditorUtils.getCurrentEditor().
      setAttribute(EditorUtils.getCurrentDocument().documentElement,
                   "lang", gDialog.pageLanguage.value);

  if (gDialog.directionRadio.value)
    EditorUtils.getCurrentDocument().documentElement.
      setAttribute("dir", gDialog.directionRadio.value);

  if (gDialog.charsetMenulist.value != gCharset) {
    EditorUtils.getCurrentEditor().documentCharacterSet = gDialog.charsetMenulist.value;
  }
  editor.endTransaction();

  return true;
}

function onCancel()
{
  return true;
}

function TextboxChanged(aId)
{
  switch(aId)
  {
    case "pageTitle":       gTitleWasEdited = true; break;
    case "pageAuthor":      gAuthorWasEdited = true; break;
    case "pageDescription": gDescriptionWasEdited = true; break;
    case "pageKeywords":    gKeywordsWasEdited = true; break;
    case "pageLanguage":    gLanguageWasEdited = true; break;
    default: break;
  }
}

function SelectLanguage(aElt)
{
  var retValue = { lang: gDialog.pageLanguage.value };
  window.openDialog("chrome://bluegriffon/content/dialogs/languages.xul","_blank",
                    "chrome,modal,dialog=yes,titlebar", null, retValue);
  if (gDialog.pageLanguage.value != retValue.lang) {
    gDialog.pageLanguage.value = retValue.lang;
    gLanguageWasEdited = true;
  }
}
