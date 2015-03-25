Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");

var gClassifications = null;
var gFontLists = {};

function SendRequest(aURL, aCallback, aContext)
{
  var req = new XMLHttpRequest();
  req.open('GET', aURL, true);
  req.onreadystatechange = function (aEvt) {
    if (req.readyState == 4) {
      gDialog.ThrobberButton.hidden = true;
       if(req.status == 200) {
        aCallback(req.responseText, aContext);
       }
       else
        alert(req.status);
    }
  };
  gDialog.ThrobberButton.hidden = false;
  req.send(null);
}

function GetClassifications()
{
  SendRequest(kCLASSIFICATIONS_QUERY_URL, UpdateClassifications);
}


function Startup()
{
  GetUIElements();

  var docUrl = EditorUtils.getDocumentUrl();
  var docUrlScheme = UrlUtils.getScheme(docUrl);
  if (!docUrlScheme || docUrlScheme == "resource") {
    PromptUtils.alertWithTitle(gDialog.stringBundle.getString("MustBeSavedTitle"),
                               gDialog.stringBundle.getString("MustBeSavedMessage"),
                               null);
    window.close();
    return;
  }

  document.documentElement.getButton("accept").setAttribute("disabled", "true");

  try {
    var prose = GetPrefs().getCharPref("extension.fs.preview.prose");
    gDialog.previewTextbox.value = prose;
  }
  catch(e) {}

  GetClassifications();
}

function UpdateClassifications(aJSON)
{
  gClassifications = JSON.parse(aJSON);
  for (var i = 0; i < gClassifications.length; i++) {
    var c = gClassifications[i];
    var item = document.createElement("listitem");
    item.setAttribute("label", c.name.replace( /%20/g, " ") + " (" + c.count + ")");
    item.setAttribute("value", c.name);
    gDialog.classificationsBox.appendChild(item);
  }
}

function onClassificationSelected(aElt)
{
  if (!aElt.selectedItem)
    return;

  gDialog.preview.setAttribute("src", "");
  document.documentElement.getButton("accept").setAttribute("disabled", "true");

  var classification = aElt.selectedItem.getAttribute("value");
  if (classification in gFontLists)
    ShowFontList(classification);
  else
    SendRequest(kFONTLIST_QUERY_URL + classification, UpdateFontList, classification);
}

function UpdateFontList(aJSON, aClassification)
{
  gFontLists[aClassification] = JSON.parse(aJSON);
  ShowFontList(aClassification);
}

function ShowFontList(aClassification)
{
  // clean the font list
  var child = gDialog.fontListBox.lastElementChild;
  while (child && child.nodeName.toLowerCase() != "listcols") {
    var tmp = child.previousElementSibling;
    gDialog.fontListBox.removeChild(child);
    child = tmp;
  }
  for (var i = 0; i < gFontLists[aClassification].length; i++) {
    var f = gFontLists[aClassification][i];
    var item = document.createElement("listitem");
    item.setAttribute("label", f.family_name);
    item.setAttribute("value", i);
    item.setAttribute("classification", aClassification);
    gDialog.fontListBox.appendChild(item);
  }
}

function onFontSelected(aElt)
{
  if (!aElt.selectedItem)
    return;

  document.documentElement.getButton("accept").removeAttribute("disabled");

  var fontIndex      = aElt.selectedItem.getAttribute("value");
  var classification = aElt.selectedItem.getAttribute("classification");
  var font = gFontLists[classification][fontIndex];
  var url = kPREVIEW_URL.replace( /%id/g, font.id)
                        .replace( /%ttf/g, font.font_filename)
                        .replace( /%w/g, gDialog.previewBox.boxObject.width)
                        .replace( /%text/g, escape(gDialog.previewTextbox.value));
  gDialog.ThrobberButton.hidden = false;
  gDialog.preview.setAttribute("src", url);
}

function UpdatePreview()
{
  gTimeout = null;
  gDialog.preview.setAttribute("src", "");
  GetPrefs().setCharPref("extension.fs.preview.prose", gDialog.previewTextbox.value);
  onFontSelected(gDialog.fontListBox);
}

var gTimeout = null;

function UpdatePreviewOnResize()
{
  if (gTimeout)
    clearTimeout(gTimeout);

  gTimeout = setTimeout(UpdatePreview, 500);
}

function onAccept()
{
  var classification = gDialog.classificationsBox.selectedItem.getAttribute("value");
  var fontIndex      = gDialog.fontListBox.selectedItem.getAttribute("value");
  var font = gFontLists[classification][fontIndex];

  document.documentElement.getButton("accept").setAttribute("disabled", "true");
  var rv = {cancelled: true, value: "no" };
  window.openDialog('chrome://fs/content/addFont.xul',"_blank",
                    "chrome,modal,scrollbars=yes", rv);

  if (rv.cancelled) {
    document.documentElement.getButton("accept").removeAttribute("disabled");
    return false;
  }

  if (rv.value == "no") {
    var url = kFONTFACEKIT_URL + font.family_urlname;
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.overrideMimeType('text/plain; charset=x-user-defined');  
    req.onreadystatechange = function (aEvt) {
      if (req.readyState == 4) {
        gDialog.loadingLabel.hidden = true;
        gDialog.ThrobberButton.hidden = true;
         if(req.status == 200) {
          WriteFile(font.family_urlname, req.responseText);
         }
         else
          alert(req.status);
      }
    };
    gDialog.ThrobberButton.hidden = false;
    gDialog.loadingLabel.hidden = false;
    req.send(null);
  
    return false;
  }


  var fp = Components.classes["@mozilla.org/filepicker;1"]
             .createInstance(Components.interfaces.nsIFilePicker);
  fp.init(window, gDialog.stringBundle.getString("SelectFile"),
          Components.interfaces.nsIFilePicker.modeOpen);
  fp.appendFilter(gDialog.stringBundle.getString("Stylesheet"), "*.css");
  if (fp.show() == Components.interfaces.nsIFilePicker.returnOK) {
    AddLinkToDocument(fp.file);
    window.close();
    return true;
  }
  document.documentElement.getButton("accept").removeAttribute("disabled");
  return false;
}

function WriteFile(aFilename, aData)
{
  var fp = Components.classes["@mozilla.org/filepicker;1"]
             .createInstance(Components.interfaces.nsIFilePicker);
  fp.init(window, gDialog.stringBundle.getString("SelectDir"),
          Components.interfaces.nsIFilePicker.modeGetFolder);
  if (fp.show() == Components.interfaces.nsIFilePicker.returnOK) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"].
               getService(Components.interfaces.nsIProperties).
               get("ProfD", Components.interfaces.nsIFile);
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);
                
    var stream = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].
                 createInstance(Components.interfaces.nsIFileOutputStream);
    stream.init(file, 0x04 | 0x08 | 0x20, 0600, 0); // readwrite, create, truncate
                
    stream.write(aData, aData.length);
    if (stream instanceof Components.interfaces.nsISafeOutputStream) {
        stream.finish();
    } else {
        stream.close();
    }

    var dir = fp.file.clone();
    dir.append(aFilename);
    if (!dir.exists())
      dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
  
    UnzipPackage(file, dir);
    file.remove(false);
    dir.append("stylesheet.css");
    // guess who's messing around... Windows...
    dir.permissions = 0444;
    AddLinkToDocument(dir);
    window.close();
    return;
  }
  file.remove(false);
  document.documentElement.getButton("accept").removeAttribute("disabled");
}

function UnzipPackage(aFile, aDir)
{
  var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                    .createInstance(Components.interfaces.nsIZipReader);
  zipReader.open(aFile);
  try {
    zipReader.test(null);
  }
  catch(e)
  {
    alert(e);
    return false;
  }

  var entries = zipReader.findEntries(null);
  while (entries.hasMore())
  {
    var entryName = entries.getNext();
    _installZipEntry(zipReader, entryName, aDir);
  }
  zipReader.close();
}

function _installZipEntry(aZipReader, aZipEntry, aDestination)
{
  var file = aDestination.clone();
  var dirs = aZipEntry.split(/\//);
  var isDirectory = /\/$/.test(aZipEntry);

  var end = dirs.length;
  if (!isDirectory)
    --end;

  for (var i = 0; i < end; ++i)
  {
    file.append(dirs[i]);
    if (!file.exists())
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
  }

  if (!isDirectory)
  {
    file.append(dirs[end]);
    aZipReader.extract(aZipEntry, file);
    file.permissions = 0644;
  }
}

function AddLinkToDocument(aFile)
{
  var uri = UrlUtils.getIOService().newFileURI(aFile);
  var spec = uri.spec;
  var doc = EditorUtils.getCurrentDocument();
  var link = doc.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  link.setAttribute("href", UrlUtils.makeRelativeUrl(spec));
  EditorUtils.getCurrentEditor().insertNode(link, doc.querySelector("head"), 0);
}
