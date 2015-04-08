Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/cssInspector.jsm");

var gDocUrlScheme = null;
var gElt = null;

function Startup()
{
  var docUrl = EditorUtils.getDocumentUrl();
  gDocUrlScheme = UrlUtils.getScheme(docUrl);
  
  gElt = window.arguments[0];
  GetUIElements();

  if (gElt)
    UpdateDialog();
  else
    UpdateType();
  //window.sizeToContent();
}

function CheckURL(aTextboxId, aCheckboxId)
{
  var url = gDialog[aTextboxId].value;
  if (url) {
    gDialog[aCheckboxId].disabled = !(gDocUrlScheme && gDocUrlScheme != "resource");
    gDialog[aCheckboxId].checked = !gDialog[aCheckboxId].disabled && (url == UrlUtils.makeRelativeUrl(url));
  }
  else {
    gDialog[aCheckboxId].checked = false;
    gDialog[aCheckboxId].disabled = true;
  }
}

function MakeRelativeUrl(aTextboxId, aCheckboxId)
{
  var spec = gDialog[aTextboxId].value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeRelativeUrl(spec);
    gDialog[aTextboxId].value = spec;
    gDialog[aCheckboxId].checked = true;
  }
}

function MakeAbsoluteUrl(aTextboxId, aCheckboxId)
{
  var spec = gDialog[aTextboxId].value;
  if (gDocUrlScheme && gDocUrlScheme != "resource") {
    spec = UrlUtils.makeAbsoluteUrl(spec);
    gDialog[aTextboxId].value = spec;
    gDialog[aCheckboxId].checked = false;
  }
}

function ToggleRelativeOrAbsolute(aTextboxId, aCheckboxId)
{
  if (gDialog[aCheckboxId].checked) {
    MakeRelativeUrl(aTextboxId, aCheckboxId);
  }
  else {
    MakeAbsoluteUrl(aTextboxId, aCheckboxId);
  }
}

function UpdateType()
{
  var type = gDialog.typeRadiogroup.value;
  switch (type) {
    case "embedded":
      gDialog.alternateCheckbox.checked = false;
      gDialog.alternateCheckbox.disabled = true;
      gDialog.hrefLabel.disabled = true;
      gDialog.urlTextbox.value = "";
      gDialog.urlTextbox.disabled = true;
      gDialog.urlFilepickerbutton.disabled = true;
      gDialog.relativeURLCheckbox.checked = false;
      gDialog.relativeURLCheckbox.disabled = true;
      gDialog.newFileButton.disabled = true;
      break;
    case "linked":
      gDialog.alternateCheckbox.checked = false;
      gDialog.alternateCheckbox.disabled = false;
      gDialog.hrefLabel.disabled = false;
      gDialog.urlTextbox.value = "";
      gDialog.urlTextbox.disabled = false;
      gDialog.urlFilepickerbutton.disabled = false;
      gDialog.relativeURLCheckbox.checked = false;
      gDialog.relativeURLCheckbox.disabled = false;
      gDialog.newFileButton.disabled = false;
      break;
    default: break; // should never happen
  }
}

function AddMedium()
{
  var medium = document.createElement("medium");
  gDialog.mediaGroupbox.insertBefore(medium, gDialog.mediaButtonHbox);
  window.sizeToContent();
}

function NewFile()
{
  const nsIFP = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"]
              .createInstance(nsIFP);
  fp.init(window, gDialog.bundleString.getString("NewCSSFile"), nsIFP.modeSave);
  fp.appendFilter("*.css", "*.css");
  var fpr = fp.show();
  if ((fpr == nsIFP.returnOK || fpr == nsIFP.returnReplace) &&
      fp.fileURL.spec && fp.fileURL.spec.length > 0)
  {
    var spec = fp.fileURL.spec;
    var file = fp.file;
    if (spec.length < 5 ||
        spec.substring(spec.length - 4) != ".css") {
      spec += ".css";
      var ioService =
        Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
      var fileHandler =
        ioService.getProtocolHandler("file")
                 .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
      file = fileHandler.getFileFromURLSpec(spec);
    }

    // file is nsIFile, data is a string
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                             createInstance(Components.interfaces.nsIFileOutputStream);
    
    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.
    
    // if you are sure there will never ever be any non-ascii text in data you can 
    // also call foStream.writeData directly
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                              createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foStream, "UTF-8", 0, 0);
    converter.writeString("");
    converter.close(); // this closes foStream

    gDialog.urlTextbox.value = spec;
    CheckURL('urlTextbox', 'relativeURLCheckbox');
  }
}

function onAccept()
{
  // let's dance, baby...
  var isStyleElt = (gDialog.typeRadiogroup.value == "embedded");
  var doc = EditorUtils.getCurrentDocument();
  var editor = EditorUtils.getCurrentEditor();

  var mediaString = "";
  var mediumElts = gDialog.mediaGroupbox.querySelectorAll("medium");
  for (var i = 0; i < mediumElts.length; i++) {
    var m = mediumElts[i];
    var amplifier = m.amplifier;
    var media = m.media;
    var str = "";
    if (media)
      str = (amplifier ? amplifier + " " : "") +
            media;
    var constraints = m.querySelectorAll("hbox");
    for (var j = 0; j < constraints.length; j++) {
      var c = constraints[j];
      var type = c.getAttribute("type");
      var querytype = c.getAttribute("querytype");
      switch (querytype) {
        case "enum":
        case "integer":
        case "length":
        case "resolution":
          if (c.querySelector(".value").value)
            str += (str ? " and " : "") +
                   "(" + type + ": " + c.querySelector(".value").value + ")";
          break;
        case "boolean":
          str += ((c.querySelector(".value").checked && str) ? " and " : "") +
                 (c.querySelector(".value").checked ? "(" + type + ")" : "");
          break;
        case "ratio":
          if (c.querySelector(".value1").value && c.querySelector(".value2").value)
            str += (str ? " and " : "") +
                   "(" + type + ": " + c.querySelector(".value1").value + "/" +
                                       c.querySelector(".value2").value + ")";
          break;
      }
    }

    mediaString += (mediaString ? ", " : "") + str;
  }

  if (gElt) {
    editor.beginTransaction();
    if (!isStyleElt) {
      editor.setAttribute(gElt, "rel", gDialog.alternateCheckbox.checked ?
                                "alternate stylesheet" :
                                "stylesheet");
      editor.setAttribute(gElt, "href", gDialog.urlTextbox.value);
    }
    if (gDialog.titleTextbox.value)
      editor.setAttribute(gElt, "title", gDialog.titleTextbox.value);
    else
      editor.removeAttribute(gElt, "title");

    if (mediaString)
      editor.setAttribute(gElt, "media", mediaString);
    else
      editor.removeAttribute(gElt, "media");

    editor.endTransaction();
  }
  else {
    var elt = doc.createElement(isStyleElt ? "style" : "link");
    elt.setAttribute("type", "text/css");
    if (!isStyleElt) {
      elt.setAttribute("rel", gDialog.alternateCheckbox.checked ?
                                "alternate stylesheet" :
                                "stylesheet");
      elt.setAttribute("href", gDialog.urlTextbox.value);
    }
    if (gDialog.titleTextbox.value)
      elt.setAttribute("title", gDialog.titleTextbox.value);
  
    if (mediaString)
      elt.setAttribute("media", mediaString);
  
    var head = doc.documentElement.querySelector("head");
    EditorUtils.getCurrentEditor().insertNode(elt, head, head.childNodes.length + 1);
  }
}

function UpdateDialog()
{
  var isStyleElt = (gElt.nodeName.toLowerCase() == "style");
  gDialog.typeRadiogroup.value = isStyleElt ? "embedded" : "linked";
  gDialog.typeRadiogroup.disabled = true;

  UpdateType();

  if (!isStyleElt) {
    gDialog.alternateCheckbox.checked = (gElt.getAttribute("rel") &&
                gElt.getAttribute("rel").toLowerCase() == "alternate stylesheet");
    gDialog.urlTextbox.value = gElt.getAttribute("href");
  }

  gDialog.titleTextbox.value = gElt.getAttribute("title") ? gElt.getAttribute("title") : ""; 

  var mediaString = gElt.getAttribute("media");
  mediaArray = mediaString.split(",");
  for (var i = 0; i < mediaArray.length; i++) {
    var m = mediaArray[i];
    var parsed = CssInspector.parseMediaQuery(m);
    var medium = document.createElement("medium")
    gDialog.mediaGroupbox.insertBefore(medium, gDialog.mediaButtonHbox);
    medium.amplifier = parsed.amplifier;
    medium.media = parsed.medium;

    for (var j = 0; j < parsed.constraints.length; j++) {
      var constraint = parsed.constraints[j].constraint;
      var values = parsed.constraints[j].value;
      var menuitem = medium.getChild("constraintButton").querySelector("[value='" + constraint + "']");
      var type = menuitem.getAttribute("value");
      var querytype = menuitem.getAttribute("querytype");
      if (!values && (querytype == "integer" || querytype == "boolean")) {
        // monster kung-fu grippy hack to deal with painful value-less
        // Media Queries...
        if (constraint == "color" ||
            constraint == "color-index" ||
            constraint == "monochrome")
          constraint = "min-" + constraint;
        values = ["1"];
      }
      var label = menuitem.getAttribute("label");
      medium._AddConstraint(type, querytype, label, values);
    }
  }
  window.sizeToContent();
}
