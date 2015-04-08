Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");

const kMANIFEST_URL = "http://bluegriffon.org/pings/families.xml"

var gTemplates = null;
var gFamilies = {};
var gSearchStylesheet = null;
var gScrollTimeout;

function Startup()
{
  GetUIElements();

  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++)
  {
    var sheet = sheets.item(i);
    if ("chrome://templatesmanager/skin/search.css" == sheet.href)
    {
      gSearchStylesheet = sheet;
      break;
    }
  }

  AddPersonalTemplatesCount();

  var req = new XMLHttpRequest();
  req.open('GET', kMANIFEST_URL + "?time=" + Date.parse(new Date()), true);
  req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;  
  req.onload = function() {
    gDialog.throbber.setAttribute("hidden", "true");
    gTemplates = req.responseXML;
    ShowFamilies();
  }
  req.onerror = function() {
    gDialog.throbber.setAttribute("hidden", "true");
    PromptUtils.alertWithTitle(
           gDialog.templatesManagerBundle.getString("loadManifest"),
           gDialog.templatesManagerBundle.getString("errorLoadingManifest"),
           window);
  }
  gDialog.throbber.removeAttribute("hidden");
  req.send(null);
}

function ShowFamilies()
{
  var families = gTemplates.querySelectorAll("family");
  for (var i = 0; i < families.length; i++) {
    var family = families[i].getAttribute("name");
    var count  = families[i].getAttribute("count");
    var href   = families[i].getAttribute("href");
    gFamilies[family] = {count: count, href: href};
  }

  for (var i in gFamilies) {
    var item = document.createElement("listitem");
    item.setAttribute("family", i);
    var cell1 = document.createElement("listcell");
    cell1.setAttribute("label", i);
    var cell2 = document.createElement("listcell");
    cell2.setAttribute("label", gFamilies[i].count);
    item.appendChild(cell1);
    item.appendChild(cell2);
    gDialog.templateFamiliesListbox.appendChild(item);
  }
}

function ShowTemplatesForFamily(aListbox)
{
  HidePreview();
  ClearSearchBox();
  if (aListbox.selectedCount && aListbox.selectedItem) {

    var child = gDialog.templatesDescription.firstChild;
    while (child) {
      var tmp = child.nextSibling;
      gDialog.templatesDescription.removeChild(child);
      child = tmp;
    }

    if (0 == aListbox.selectedIndex) {
      AddPersonalTemplates();
      return;
    }

    var family = aListbox.selectedItem.getAttribute("family");

    if (gFamilies[family].doc) {
      _ShowTemplatesForFamily(gFamilies[family].doc);
    }
    else {
      var req = new XMLHttpRequest();
      req.open('GET', gFamilies[family].href + "?time=" + Date.parse(new Date()), true);
      req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;  
      req.onload = function() {
        gDialog.throbber.setAttribute("hidden", "true");
        gFamilies[family].doc = req.responseXML;
        _ShowTemplatesForFamily(req.responseXML);
      }
      req.onerror = function() {
        gDialog.throbber.setAttribute("hidden", "true");
        PromptUtils.alertWithTitle(
               gDialog.templatesManagerBundle.getString("loadManifest"),
               gDialog.templatesManagerBundle.getString("errorLoadingManifest"),
               window);
      }
      gDialog.throbber.removeAttribute("hidden");
      req.send(null);
    }
  }
}

function _ShowTemplatesForFamily(doc)
{
  gDialog.visitWebsiteButton.removeAttribute("disabled");

  gDialog.visitWebsiteButton.setAttribute("url",
    doc.documentElement.getAttribute("info"));

  var author = doc.documentElement.getAttribute("name");

  var template = doc.documentElement.firstElementChild;
  while(template) {
    var name = template.getAttribute("shortName");
    var license = GetTemplateInfo(template, "license");
    var download = GetTemplateInfo(template, "package");
    var thumbnail = GetTemplateInfo(template, "thumbnail");
    var description = GetTemplateInfo(template, "description");
    var preview = GetTemplateInfo(template, "preview");
    var demo = GetTemplateInfo(template, "demo");

    var docTemplate = document.createElement("docTemplate");
    docTemplate.setAttribute("name", name);
    docTemplate.setAttribute("author", author);
    docTemplate.setAttribute("license", license);
    docTemplate.setAttribute("download", download);
    docTemplate.setAttribute("thumbnail", thumbnail);
    docTemplate.setAttribute("description", description);
    docTemplate.setAttribute("demo", demo);
    docTemplate.setAttribute("preview", preview);

    docTemplate.setAttribute("LCname", name.toLowerCase());
    docTemplate.setAttribute("LCauthor", author.toLowerCase());
    docTemplate.setAttribute("LClicense", license.toLowerCase());
    docTemplate.setAttribute("LCdescription", description.toLowerCase());

    gDialog.templatesDescription.appendChild(docTemplate);

    template = template.nextElementSibling;
  }

  _ShowImagesInViewport();
}

function GetTemplateInfo(aTemplate, aTag)
{
  var node = aTemplate.querySelector(aTag);
  return (node ? node.textContent : "");
}

function ShowPreview(aTemplate)
{
  if (aTemplate.getAttribute("preview")) {
    gDialog.infoBox.className = "previewMode";
    gDialog.previewBox.setAttribute("src", aTemplate.getAttribute("preview"));
    gDialog.backButton.removeAttribute("disabled");
  }
}

function HidePreview()
{
  gDialog.infoBox.className = "";
  gDialog.backButton.setAttribute("disabled", "true");
  gDialog.previewBox.setAttribute("src", "about:blank");
}

function ShowDemo(aTemplate)
{
  if (aTemplate.getAttribute("demo")) {
    loadExternalURL(aTemplate.getAttribute("demo"));
  }
}

function SelectTemplate(aTemplate)
{
	var bundle = document.getElementById("addonRequiredBundle");
	Services.prompt.alert(window,
	                      bundle.getString("FeatureRequiresAnAddOn"),
	                      bundle.getString("VisitBlueGriffonCom"));
	loadExternalURL("http://www.bluegriffon.com/index.php?pages/One-click-Templates");
}

// If you read this, it's probably because you're trying to enable the missing
// features of this add-on... Don't waste your time, the code is was removed, eh.

function CheckEmptyness(aElt)
{
  if (aElt.value)
  {
    aElt.setAttribute("searching", "true");
    ClobberStylesheet(gSearchStylesheet);
    AddSearchRules(aElt.value.toLowerCase(), gSearchStylesheet);

    gSearchStylesheet.disabled = false;
  }
  else if (aElt.hasAttribute("searching"))
  {
    aElt.removeAttribute("searching");
    gSearchStylesheet.disabled = true;
  }
}

function ClearSearchBox()
{
  if (!gDialog.searchBox.value)
    return;
  gDialog.searchBox.value = "";
  CheckEmptyness(gDialog.searchBox);
  ShowImagesInViewport();
}

function ClobberStylesheet(aSheet)
{
  var rules = aSheet.cssRules;
  for (var i = rules.length -1 ; i >= 0; i--)
    aSheet.deleteRule(i);
}

function AddSearchRules(aStr, aSheet)
{
  var attrs = [ "LCname",
                "LCauthor",
                "LClicense",
                "LCdescription"
              ];
  aSheet.insertRule("docTemplate { display: none; }", 0);
  for (var i = 0; i < attrs.length; i++)
  {
    aSheet.insertRule(
                       "docTemplate[" + attrs[i] + "*='" + aStr + "'] { display: -moz-box; }",
                       i + 1
                     );
  }
  ShowImagesInViewport();
}

function VisitWebsite()
{
  loadExternalURL(gDialog.visitWebsiteButton.getAttribute("url"));
}

function ShowImagesInViewport()
{
  if (gScrollTimeout)
    clearTimeout(gScrollTimeout);
  gScrollTimeout = setTimeout(_ShowImagesInViewport, 250);
}

function _ShowImagesInViewport()
{
  gScrollTimeout = null;
  var scrollTop =    gDialog.templatesBox.scrollTop;
  var viewportHeight = gDialog.templatesBox.boxObject.height;

  var templates = gDialog.templatesBox.querySelectorAll("docTemplate");
  for (var i = 0; i < templates.length; i++) {
    var t = templates[i];
    if (document.defaultView.getComputedStyle(t, "").getPropertyValue("display") == "none")
      continue;
    var thumb = t.getChild("templateThumbnail");
    var ytop = thumb.boxObject.y;
    var ybottom = ytop + thumb.boxObject.height;
    if ((ybottom >= scrollTop && ybottom <= scrollTop + viewportHeight)
        || (ytop >= scrollTop && ytop <= scrollTop + viewportHeight)) {
      thumb.setAttribute("image", thumb.getAttribute("url"));
    }
  }
}

function AddPersonalTemplates()
{
  var dbConn = GetDBConn();
  if (!dbConn) {
    gDialog.visitWebsiteButton.setAttribute("disabled", "true");
    return;
  }

  var statement = dbConn.createStatement("SELECT * FROM 'templates'");
  var disposable = [];
  var total = 0;

  while (statement.executeStep()) {
    total++;
    var id          = statement.getInt32(0);
    var name        = statement.getString(1);
    var url         = statement.getString(2);
    var description = statement.getString(3);
    var license     = statement.getString(4);
    var thumbnail   = statement.getString(5);
    var preview     = statement.getString(6);
    var demo        = "";

    var docTemplate = document.createElement("docTemplate");
    docTemplate.setAttribute("name", name);
    docTemplate.setAttribute("author", "");
    docTemplate.setAttribute("license", license);
    docTemplate.setAttribute("download", url);
    docTemplate.setAttribute("thumbnail", thumbnail);
    docTemplate.setAttribute("description", description);
    docTemplate.setAttribute("demo", demo);
    docTemplate.setAttribute("preview", preview);

    docTemplate.setAttribute("LCname", name.toLowerCase());
    docTemplate.setAttribute("LCauthor", "");
    docTemplate.setAttribute("LClicense", license.toLowerCase());
    docTemplate.setAttribute("LCdescription", description.toLowerCase());

    var file = UrlUtils.newLocalFile(url);
    if (file.exists()) 
      gDialog.templatesDescription.appendChild(docTemplate);
    else {
      var title = gDialog.templatesManagerBundle.getString("DealWithTemplateNotFound")
                    .replace( /\%s/ , name);
      var rv = ConfirmWithTitle(gDialog.templatesManagerBundle.getString("TemplateNotFound"),
                                title,
                                gDialog.templatesManagerBundle.getString("Delete"),
                                gDialog.templatesManagerBundle.getString("PreserveButHide"),
                                gDialog.templatesManagerBundle.getString("PreserveAndShow"));
      switch (rv) {
        case 0: disposable.push(id); break; // delete
        case 1: break;                        // preserve but hide
        case 2:
          gDialog.templatesDescription.appendChild(docTemplate);
          break;                              // preserve but show
        default: break;
      }
    }

  }

  statement.finalize();
  dbConn.close();
  
  for (var i = 0; i < disposable.length; i++) {
    dbConn = GetDBConn();
    dbConn.executeSimpleSQL("DELETE FROM 'templates' WHERE id=" + disposable[i]);
    dbConn.close();
  }
  gDialog.personalTemplatesCountListcell.setAttribute("label", total - disposable.length);

  gDialog.visitWebsiteButton.setAttribute("disabled", "true");
  _ShowImagesInViewport();
}

function AddPersonalTemplatesCount()
{
  var mDBConn = GetDBConn();    
  if (!mDBConn) {
    gDialog.personalTemplatesCountListcell.setAttribute("label", "0");
    return;
  }

  var statement = mDBConn.createStatement("SELECT count(*) from templates");
  
  if (statement.executeStep()) {
    var value = statement.getInt32(0);
    gDialog.personalTemplatesCountListcell.setAttribute("label", value);
  }
  statement.finalize();
  mDBConn.close();

}

function GetDBFile()
{
  var spec = "";
  try
  {
    spec = Services.prefs.getCharPref("extension.oneClickTemplates.templatesDir");
  }
  catch(e) { }
  
  if (!spec)
    return null;

  var file = UrlUtils.newLocalFile(spec);;
  return file;
}

function GetDBConn()
{
  var file = GetDBFile();
  if (!file)
    return null;
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                          .getService(Components.interfaces.mozIStorageService);
  return storageService.openDatabase(file);
}

function ConfirmWithTitle(aTitle, aMsg, aOkBtnText, aCancelBtnText, aExtraButtonText)
{
  const nsIPromptService = Components.interfaces.nsIPromptService;

  var promptService =  Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                         .getService(nsIPromptService);

  if (promptService)
  {
    var okFlag = aOkBtnText ? nsIPromptService.BUTTON_TITLE_IS_STRING
                            : nsIPromptService.BUTTON_TITLE_OK;
    var cancelFlag = aCancelBtnText ? nsIPromptService.BUTTON_TITLE_IS_STRING
                                    : nsIPromptService.BUTTON_TITLE_CANCEL;
    var extraFlag = aExtraButtonText ? nsIPromptService.BUTTON_TITLE_IS_STRING : 0;
    return promptService.confirmEx(window,
                                   aTitle,
                                   aMsg,
                                   (okFlag * nsIPromptService.BUTTON_POS_0) +
                                     (cancelFlag * nsIPromptService.BUTTON_POS_1) +
                                     (extraFlag  * nsIPromptService.BUTTON_POS_2) +
                                     nsIPromptService.BUTTON_POS_0_DEFAULT,
                                   aOkBtnText,
                                   aCancelBtnText,
                                   aExtraButtonText,
                                   null,
                                   {value:0});
  }
  return -1;
}
