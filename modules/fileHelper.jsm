/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://app/modules/prompterHelper.jsm");
Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/l10nHelper.jsm");
Components.utils.import("resource://app/modules/handlersManager.jsm");

var EXPORTED_SYMBOLS = ["FileUtils"];

var FileUtils = {

  kLAST_FILE_LOCATION_PREFIX: "bluegriffon.lastFileLocation.",

  kErrorBindingAborted: 2152398850,
  kErrorBindingRedirected: 2152398851,
  kFileNotFound: 2152857618,

  nsIFilePicker:Components.interfaces.nsIFilePicker,
  nsIWebBrowserPersist: Components.interfaces.nsIWebBrowserPersist,
  nsIWebProgressListener: Components.interfaces.nsIWebProgressListener,

  mFilePickerDirectory: null,
  mShowDebugOutputStateChange: false,
  mPublishData: null,
  mProgressDialog: null,

  saveSourceDocument: function(aSource, aSaveAs, aSaveCopy, aMimeType)
  {
    var editor = EditorUtils.getCurrentEditor();
    if (!aMimeType || aMimeType == "" || !editor)
      throw NS_ERROR_NOT_INITIALIZED;
  
    var editorDoc = editor.document;
    if (!editorDoc)
      throw NS_ERROR_NOT_INITIALIZED;
  
    // if we don't have the right editor type bail (we handle text and html)
    var editorType = EditorUtils.getCurrentEditorType();
    if (editorType != "html")
      throw NS_ERROR_NOT_IMPLEMENTED;
  
    var converter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
                    .getService(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = editor.documentCharacterSet;
    aSource = converter.ConvertFromUnicode(aSource);

    var urlstring = EditorUtils.getDocumentUrl();
    var mustShowFileDialog = (aSaveAs ||
                              UrlUtils.isUrlOfBlankDocument(urlstring) ||
                              (urlstring == ""));
  
    // If editing a remote URL, force SaveAs dialog
    if (!mustShowFileDialog && UrlUtils.getScheme(urlstring) != "file")
      mustShowFileDialog = true;
  
    var replacing = !aSaveAs;
    var titleChanged = false;
    var doUpdateURI = false;
    var tempLocalFile = null;
  
    if (mustShowFileDialog)
    {
      try {
        var dialogResult = this.promptForSaveLocation(false, editorType, aMimeType, urlstring);
        if (dialogResult.filepickerClick == this.nsIFilePicker.returnCancel)
          return false;
  
        replacing = (dialogResult.filepickerClick == this.nsIFilePicker.returnReplace);
        urlstring = dialogResult.resultingURIString;
        tempLocalFile = dialogResult.resultingLocalFile;
   
        // update the new URL for the webshell unless we are saving a copy
        if (!aSaveCopy)
          doUpdateURI = true;
     } catch (e) {  return false; }
    } // mustShowFileDialog
  
    var success = true;
    var ioService;
    try {
      // if somehow we didn't get a local file but we did get a uri, 
      // attempt to create the localfile if it's a "file" url
      var docURI;
      if (!tempLocalFile)
      {
        ioService = UrlUtils.getIOService();
        docURI = ioService.newURI(urlstring, editor.documentCharacterSet, null);
        
        if (docURI.schemeIs("file"))
        {
          var fileHandler = UrlUtils.getFileProtocolHandler();
          tempLocalFile = fileHandler.getFileFromURLSpec(urlstring).QueryInterface(Components.interfaces.nsILocalFile);
        }
      }
  
      var destinationLocation;
      if (tempLocalFile)
        destinationLocation = tempLocalFile;
      else
        destinationLocation = docURI;
  
      this.backupFile(destinationLocation);

      // file is nsIFile, data is a string
      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                     createInstance(Components.interfaces.nsIFileOutputStream);
      
      // use 0x02 | 0x10 to open file for appending.
      foStream.init(destinationLocation, 0x02 | 0x08 | 0x20, 0666, 0); 
      // write, create, truncate
      // In a c file operation, we have no need to set file mode with or operation,
      // directly using "r" or "w" usually.
      
      foStream.write(aSource, aSource.length);
      foStream.close();
    }
    catch (e)
    {
      success = false;
    }
  
    if (success)
    {
      try {
        if (doUpdateURI)
        {
           // If a local file, we must create a new uri from nsILocalFile
          if (tempLocalFile)
            docURI = UrlUtils.getFileProtocolHandler().newFileURI(tempLocalFile);
  
          // We need to set new document uri before notifying listeners
          EditorUtils.setDocumentURI(docURI);
        }
  
        // Update window title to show possibly different filename
        // This also covers problem that after undoing a title change,
        //   window title loses the extra [filename] part that this adds
        EditorUtils.getCurrentEditorWindow().UpdateWindowTitle();
  
        if (!aSaveCopy) {
          editor.resetModificationCount();
          EditorUtils.getCurrentSourceWindow().ResetModificationCount();
          EditorUtils.getCurrentEditorWindow().BespinChangeCallback();
        }
        // this should cause notification to listeners that document has changed
  
        // Set UI based on whether we're editing a remote or local url
        this.setSaveAndPublishUI(urlstring);
      } catch (e) {}
    }
    else
    {
      var saveDocStr = L10NUtils.getString("SaveDocument");
      var failedStr = L10NUtils.getString("SaveFileFailed");
      PromptUtils.alertWithTitle(saveDocStr, failedStr, EditorUtils.getCurrentEditorWindow());
    }
    return success;
  },

  // throws an error or returns true if user attempted save; false if user canceled save
  saveDocument: function(aSaveAs, aSaveCopy, aMimeType)
  {
    HandlersManager.hideAllHandlers();
    var editor = EditorUtils.getCurrentEditor();
    if (!aMimeType || aMimeType == "" || !editor)
      throw NS_ERROR_NOT_INITIALIZED;
  
    var editorDoc = editor.document;
    if (!editorDoc)
      throw NS_ERROR_NOT_INITIALIZED;
  
    // if we don't have the right editor type bail (we handle text and html)
    var editorType = EditorUtils.getCurrentEditorType();
    if (editorType != "html")
      throw NS_ERROR_NOT_IMPLEMENTED;
  
    var urlstring = EditorUtils.getDocumentUrl();
    var mustShowFileDialog = (aSaveAs ||
                              UrlUtils.isUrlOfBlankDocument(urlstring) ||
                              (urlstring == ""));
  
    // If editing a remote URL, force SaveAs dialog
    if (!mustShowFileDialog && UrlUtils.getScheme(urlstring) != "file")
      mustShowFileDialog = true;
  
    var replacing = !aSaveAs;
    var titleChanged = false;
    var doUpdateURI = false;
    var tempLocalFile = null;
  
    if (mustShowFileDialog)
    {
      try {
        // Prompt for title
        var userContinuing = this.promptAndSetTitleIfNone(); // not cancel
        if (!userContinuing)
          return false;

        var dialogResult = this.promptForSaveLocation(false, editorType, aMimeType, urlstring);
        if (dialogResult.filepickerClick == this.nsIFilePicker.returnCancel)
          return false;
  
        replacing = (dialogResult.filepickerClick == this.nsIFilePicker.returnReplace);
        urlstring = dialogResult.resultingURIString;
        tempLocalFile = dialogResult.resultingLocalFile;
   
        // update the new URL for the webshell unless we are saving a copy
        if (!aSaveCopy)
          doUpdateURI = true;
     } catch (e) {  return false; }
    } // mustShowFileDialog
  
    var success = true;
    var ioService;
    try {
      // if somehow we didn't get a local file but we did get a uri, 
      // attempt to create the localfile if it's a "file" url
      var docURI;
      if (!tempLocalFile)
      {
        ioService = UrlUtils.getIOService();
        docURI = ioService.newURI(urlstring, editor.documentCharacterSet, null);
        
        if (docURI.schemeIs("file"))
        {
          var fileHandler = UrlUtils.getFileProtocolHandler();
          tempLocalFile = fileHandler.getFileFromURLSpec(urlstring).QueryInterface(Components.interfaces.nsILocalFile);
        }
      }
  
      var destinationLocation;
      if (tempLocalFile)
        destinationLocation = tempLocalFile;
      else
        destinationLocation = docURI;

      this.backupFile(destinationLocation);

      var flags = EditorUtils.getSerializationFlags(EditorUtils.getCurrentDocument());
      var doctype = editorDoc.doctype;
      var systemId = doctype ? doctype.systemId : null;
      var encoder = Components.classes["@mozilla.org/layout/documentEncoder;1?type=" + aMimeType]
                     .createInstance(Components.interfaces.nsIDocumentEncoder);
      encoder.setCharset(editor.documentCharacterSet);
      encoder.init(editorDoc, aMimeType, flags.value);
      if (flags.value & Components.interfaces.nsIDocumentEncoder.OutputWrap)
        encoder.setWrapColumn(flags.maxColumnPref);
  
      // file is nsIFile, data is a string
      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                     createInstance(Components.interfaces.nsIFileOutputStream);
      
      // use 0x02 | 0x10 to open file for appending.
      foStream.init(destinationLocation, 0x02 | 0x08 | 0x20, 0666, 0); 
      encoder.encodeToStream(foStream);
      foStream.close(); // this closes foStream
    }
    catch (e)
    {
      success = false;
    }
  
    if (success)
    {
      try {
        if (doUpdateURI)
        {
           // If a local file, we must create a new uri from nsILocalFile
          if (tempLocalFile)
            docURI = UrlUtils.getFileProtocolHandler().newFileURI(tempLocalFile);
  
          // We need to set new document uri before notifying listeners
          EditorUtils.setDocumentURI(docURI);
        }
  
        // Update window title to show possibly different filename
        // This also covers problem that after undoing a title change,
        //   window title loses the extra [filename] part that this adds
        EditorUtils.getCurrentEditorWindow().UpdateWindowTitle();
  
        if (!aSaveCopy) {
          editor.resetModificationCount();
          EditorUtils.getCurrentSourceWindow().ResetModificationCount();
          EditorUtils.getCurrentEditorWindow().BespinChangeCallback();
        }
        // this should cause notification to listeners that document has changed
  
        // Set UI based on whether we're editing a remote or local url
        this.setSaveAndPublishUI(urlstring);
      } catch (e) {}
    }
    else
    {
      var saveDocStr = L10NUtils.getString("SaveDocument");
      var failedStr = L10NUtils.getString("SaveFileFailed");
      PromptUtils.alertWithTitle(saveDocStr, failedStr, EditorUtils.getCurrentEditorWindow());
    }
    return success;
  },

  backupFile: function(aFile)
  {
    var keepBackup = true;
    try {
      keepBackup = Services.prefs.getBoolPref("bluegriffon.defaults.backups");
    }
    catch(e) {}

    try { // try to create a backup
      if (keepBackup
          && aFile
          && aFile.exists()
          && aFile.isWritable()) {
        var newLeafName = aFile.clone().leafName;
        var newLeafNameArray = newLeafName.split(".");
        if (newLeafNameArray[newLeafNameArray.length - 1] != "bak")
          newLeafNameArray.push("bak");
        newLeafName = newLeafNameArray.join(".");
        aFile.copyTo(null, newLeafName);
      }
    }
    catch(e) {};
  },

  promptAndSetTitleIfNone: function()
  {
    if (EditorUtils.getDocumentTitle()) // we have a title; no need to prompt!
      return true;
  
    var result = {value:null};
    var captionStr = L10NUtils.getString("DocumentTitle");
    var msgStr = L10NUtils.getString("NeedDocTitle") + '\n' + L10NUtils.getString("DocTitleHelp");
    var confirmed = PromptUtils.prompt(EditorUtils.getCurrentEditorWindow(),
                                       captionStr, msgStr, result, null, {value:0});
    if (confirmed)
      EditorUtils.setDocumentTitle(result.value.trim());
  
    return confirmed;
  },

  promptForSaveLocation: function(aDoSaveAsText, aEditorType, aMIMEType, aDocumentURLString)
  {
    var dialogResult = {};
    dialogResult.filepickerClick = this.nsIFilePicker.returnCancel;
    dialogResult.resultingURI = "";
    dialogResult.resultingLocalFile = null;
  
    var fp = null;
    try {
      fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(this.nsIFilePicker);
    } catch (e) {}
    if (!fp) return dialogResult;
  
    // determine prompt string based on type of saving we'll do
    var promptString;
    if (aDoSaveAsText || aEditorType == "text")
      promptString = L10NUtils.getString("ExportToText");
    else
      promptString = L10NUtils.getString("SaveDocumentAs")
  
    fp.init(EditorUtils.getCurrentEditorWindow(), promptString, this.nsIFilePicker.modeSave);
  
    // Set filters according to the type of output
    if (aDoSaveAsText)
      fp.appendFilters(this.nsIFilePicker.filterText);
    else if (EditorUtils.isXHTMLDocument()) {
      if (EditorUtils.isPolyglotHtml5()) {
        fp.appendFilters(this.nsIFilePicker.filterHTML);
      }
      else
        fp.appendFilter(L10NUtils.getString("XHTMLfiles"), "*.xhtml");
    }
    else {
      aMIMEType = "text/html";
      fp.appendFilters(this.nsIFilePicker.filterHTML);
    }
    fp.appendFilters(this.nsIFilePicker.filterAll);
  
    // now let's actually set the filepicker's suggested filename
    var suggestion = this.getSuggestedFileName(aDocumentURLString, aMIMEType);
    if (suggestion) {
      if (suggestion.filename)
        fp.defaultString = suggestion.filename;
      if (suggestion.extension)
        fp.defaultExtension = suggestion.extension;
    }
  
    // set the file picker's current directory
    // assuming we have information needed (like prior saved location)
    try {
      var ioService = UrlUtils.getIOService();
      var fileHandler = UrlUtils.getFileProtocolHandler();
      
      var isLocalFile = true;
      try {
        var docURI = ioService.newURI(aDocumentURLString, 
                                      EditorUtils.getCurrentEditor().documentCharacterSet,
                                      null);
        isLocalFile = docURI.schemeIs("file");
      }
      catch (e) {}
  
      var parentLocation = null;
      if (isLocalFile)
      {
        var fileLocation = fileHandler.getFileFromURLSpec(aDocumentURLString); // this asserts if url is not local
        parentLocation = fileLocation.parent;
      }
      if (parentLocation)
      {
        // Save current filepicker's default location
        this.mFilePickerDirectory = fp.displayDirectory;
  
        fp.displayDirectory = parentLocation;
      }
      else
      {
        // Initialize to the last-used directory for the particular type (saved in prefs)
        this.setFilePickerDirectory(fp, aEditorType);
      }
    }
    catch(e) {}
  
    dialogResult.filepickerClick = fp.show();
    if (dialogResult.filepickerClick != this.nsIFilePicker.returnCancel)
    {
      // reset urlstring to new save location
      dialogResult.resultingURIString = fileHandler.getURLSpecFromFile(fp.file);
      dialogResult.resultingLocalFile = fp.file;
      this.saveFilePickerDirectory(fp, aEditorType);
    }
    else if (this.mFilePickerDirectory)
      fp.displayDirectory = this.mFilePickerDirectory; 
  
    return dialogResult;
  },

  getSuggestedFileName: function(aDocumentURLString, aMIMEType)
  {
    var extension = this.getExtensionBasedOnMimeType(aMIMEType);
    if (extension)
      extension = "." + extension;
  
    // check for existing file name we can use
    if (aDocumentURLString.length > 0 && !UrlUtils.isUrlOfBlankDocument(aDocumentURLString))
    {
      var docURI = null;
      try {
  
        var ioService = UrlUtils.getIOService();
        docURI = ioService.newURI(aDocumentURLString,
                                  EditorUtils.getCurrentEditor().documentCharacterSet,
                                  null);
        docURI = docURI.QueryInterface(Components.interfaces.nsIURL);
  
        // grab the file name
        if (docURI.fileExtension.toLowerCase() == "php")
          return { filename: decodeURI(docURI.fileName), extension: extension};

        var url = docURI.fileBaseName;
        if (url)
          return { filename: decodeURI(url+extension), extension: extension};
      } catch(e) {}
    } 
  
    // check if there is a title we can use
    var title = EditorUtils.getDocumentTitle();
    // generate a valid filename, if we can't just go with "untitled"
    return { filename: this.generateValidFilename(title, extension)
                       || L10NUtils.getString("untitled") + extension,
             extension: extension };
  },

  setFilePickerDirectory: function(filePicker, fileType)
  {
    if (filePicker)
    {
      try {
        var prefBranch = GetPrefs();
        if (prefBranch)
        {
          // Save current directory so we can reset it in SaveFilePickerDirectory
          this.mFilePickerDirectory = filePicker.displayDirectory;
  
          var location = prefBranch.getComplexValue(this.kLAST_FILE_LOCATION_PREFIX + fileType,
                                                    Components.interfaces.nsILocalFile);
          if (location)
            filePicker.displayDirectory = location;
        }
      }
      catch(e) {}
    }
  },

  saveFilePickerDirectory: function(filePicker, fileType)
  {
    if (filePicker && filePicker.file)
    {
      try {
        var prefBranch = GetPrefs();
  
        var fileDir;
        if (filePicker.file.parent)
          fileDir = filePicker.file.parent.QueryInterface(Components.interfaces.nsILocalFile);
  
        if (prefBranch)
         prefBranch.setComplexValue(this.kLAST_FILE_LOCATION_PREFIX + fileType,
                                    Components.interfaces.nsILocalFile,
                                    fileDir);
      
        var prefsService = GetPrefsService();
          prefsService.savePrefFile(null);
      } catch (e) {}
    }
  
    // Restore the directory used before SetFilePickerDirectory was called;
    // This reduces interference with Browser and other module directory defaults
    if (this.mFilePickerDirectory)
      filePicker.displayDirectory = this.mFilePickerDirectory;
  
    this.mFilePickerDirectory = null;
  },

  getExtensionBasedOnMimeType: function(aMIMEType)
  {
    if (EditorUtils.isPolyglotHtml5()) {
      aMIMEType = "text/html";
    }

    try {
      var preferred = Services.prefs.getCharPref(
                        "bluegriffon.defaults.extension."
                        + aMIMEType.replace( /\//g, "-"));
      if (preferred)
        return preferred;
    }
    catch (e) {}

    try {
      var mimeService = null;
      mimeService = Components.classes["@mozilla.org/mime;1"].getService();
      mimeService = mimeService.QueryInterface(Components.interfaces.nsIMIMEService);
  
      var fileExtension = mimeService.getPrimaryExtension(aMIMEType, null);
  
      // the MIME service likes to give back ".htm" for text/html files,
      // so do a special-case fix here.
      if (fileExtension == "htm")
        fileExtension = "html";
  
      return fileExtension;
    }
    catch (e) {}
    return "";
  },

  generateValidFilename: function(filename, extension)
  {
    if (filename) // we have a title; let's see if it's usable
    {
      // clean up the filename to make it usable and
      // then trim whitespace from beginning and end
      filename = this.validateFileName(filename).replace(/^\s+|\s+$/g, "");
      if (filename.length > 0)
        return filename + extension;
    }
    return null;
  },
  
  validateFileName: function(aFileName)
  {
    var re = /[\/]+/g;
    var n = EditorUtils.getCurrentEditorWindow().navigator;
    if (n.appVersion.indexOf("Windows") != -1) {
      re = /[\\\/\|]+/g;
      aFileName = aFileName.replace(/[\"]+/g, "'");
      aFileName = aFileName.replace(/[\*\:\?]+/g, " ");
      aFileName = aFileName.replace(/[\<]+/g, "(");
      aFileName = aFileName.replace(/[\>]+/g, ")");
    }
    else if (n.appVersion.indexOf("Macintosh") != -1)
      re = /[\:\/]+/g;
    
    return aFileName.replace(re, "_");
  },

  setSaveAndPublishUI: function(urlstring)
  {
    // Be sure enabled state of toolbar buttons are correct
    goUpdateCommand("cmd_save");
    goUpdateCommand("cmd_publish");
  }
};

