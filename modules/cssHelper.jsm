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
 * Portions created by the Initial Developer are Copyright (C) 2006
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

Components.utils.import("resource://app/modules/editorHelper.jsm");
Components.utils.import("resource://app/modules/cssInspector.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = ["CssUtils"];

var CssUtils = {
  kCSSRule: Components.interfaces.nsIDOMCSSRule,
  
  getStyleSheets: function(aDoc)
  {
    return aDoc.styleSheets;
  },

  _enumerateStyleSheet: function(aSheet, aCallback)
  {
    if (aCallback(aSheet))
      return;
    var rules = aSheet.cssRules;
    for (var j = 0; j < rules.length; j++)
    {
      var rule = rules.item(j);
      switch (rule.type)
      {
        case CssUtils.kCSSRule.IMPORT_RULE:
          this._enumerateStyleSheet(rule.styleSheet, aCallback);
          break;
        case CssUtils.kCSSRule.MEDIA_RULE:
          this._enumerateStyleSheet(rule, aCallback);
          break;
        default:
          break;
      }

    }
  },

  enumerateStyleSheets: function(aDocument, aCallback)
  {
    var stylesheetsList = aDocument.styleSheets;
    for (var i = 0; i < stylesheetsList.length; i++)
    {
      var sheet = stylesheetsList.item(i);
      this._enumerateStyleSheet(sheet, aCallback);
    }
  },

  getComputedStyle: function(aElt)
  {
    return aElt.ownerDocument.defaultView.getComputedStyle(aElt, "");
  },

  getComputedValue: function(aElt, aProperty)
  {
    return this.getComputedStyle(aElt).getPropertyValue(aProperty);
  },

  findClassesInSelector: function(aSelector)
  {
    return aSelector.match( /\.-?([_a-z]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))([_a-z0-9-]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))*/gi );
  },

  findIdsInSelector: function(aSelector)
  {
    return aSelector.match( /#-?([_a-z]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))([_a-z0-9-]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))*/gi );
  },

  getCssHintsFromDocument: function(aDocument, aDetector)
  {
    var classList = [];
  
    function enumerateClass(aSheet)
    {
      var cssRules = aSheet.cssRules;
      for (var i = 0; i < cssRules.length; i++)
      {
        var rule = cssRules.item(i);
        if (rule.type == CssUtils.kCSSRule.STYLE_RULE)
        {
          var selectorText = rule.selectorText;
          var matches = aDetector(selectorText);
          if (matches)
            for (var j = 0; j < matches.length; j++) {
              var m = matches[j].substr(1);
              if (classList.indexOf(m) == -1)
                classList.push(m);
            }
        }
      }
      return false;
    }
  
    CssUtils.enumerateStyleSheets(aDocument, enumerateClass);

    return classList;
  },

  getAllClassesForDocument: function(aDocument)
  {
    return this.getCssHintsFromDocument(aDocument, this.findClassesInSelector);
  },

  getAllIdsForDocument: function(aDocument)
  {
    return this.getCssHintsFromDocument(aDocument, this.findIdsInSelector);
  },

  getAllLocalRulesForSelector: function(aDocument, aSelector)
  {
    var ruleList = [];
  
    function enumerateRules(aSheet)
    {
      if (aSheet.ownerNode instanceof Components.interfaces.nsIDOMHTMLStyleElement)
      {
        var cssRules = aSheet.cssRules;
        for (var i = 0; i < cssRules.length; i++)
        {
          var rule = cssRules.item(i);
          if (rule.type == CssUtils.kCSSRule.STYLE_RULE)
          {
            var selectorText = rule.selectorText;
            if (selectorText == aSelector)
              ruleList.push({rule:rule, index:i});
          }
        }
        return false;
      }
      return true;
    }
  
    CssUtils.enumerateStyleSheets(aDocument, enumerateRules);

    return ruleList;
  },

  deleteAllLocalRulesForSelector: function(aEditor, aDocument, aSelector, aDeclarations)
  {
    var ruleList = this.getAllLocalRulesForSelector(aDocument, aSelector);
    var l = ruleList.length;
    for (var i = 0; i < l; i++)
    {
      var rule = ruleList[i].rule;
      var parentRule = rule.parentRule;
      var parentStyleSheet = rule.parentStyleSheet;
      if (rule.type == CssUtils.kCSSRule.STYLE_RULE && !parentRule)
      {
        if (aDeclarations)
        {
          for (var j = 0; j < aDeclarations.length; j++)
            rule.style.removeProperty(aDeclarations[j].property);
          if (!rule.style.length)
            parentStyleSheet.deleteRule(ruleList[i].index);
        }
        else
          parentStyleSheet.deleteRule(ruleList[i].index);
      }
      this.reserializeEmbeddedStylesheet(parentStyleSheet, aEditor, aDocument);
    }
  },

  getStyleSheetForScreen: function(aDocument, aEditor)
  {
    var styleElements = aDocument.getElementsByTagName("style");
    var stylesheet = null;
    if (styleElements.length)
    {
      // try to find a stylesheet for the correct media
      for (var i = 0; !stylesheet && i < styleElements.length; i++)
      {
        var styleElement = styleElements[i];
        if (styleElement.hasAttribute("media"))
        {
          var mediaAttr = styleElement.getAttribute("media");
          if (mediaAttr.indexOf("screen") != -1||
              mediaAttr.indexOf("all") != -1)
            stylesheet = styleElement.sheet;
        }
        else
          stylesheet = styleElement.sheet;
      }
    }
    if (!stylesheet)
    {
      var styleElement = aDocument.createElement("style");
      styleElement.setAttribute("type", "text/css");
      var textNode = aDocument.createTextNode("<!--\n/* created by BlueGriffon */\n-->\n");
      styleElement.appendChild(textNode);
      var head = aDocument.getElementsByTagName("head")[0];
      if (aEditor)
        aEditor.insertNode(styleElement, head, head.childNodes.length);
      else
        head.appendChild(styleElement);
      stylesheet = styleElement.sheet;
    }
    return stylesheet;
  },

  addRuleForSelector: function(aEditor, aDocument, aSelector, aDeclarations)
  {
    this.deleteAllLocalRulesForSelector(aEditor, aDocument, aSelector, aDeclarations);
    var ruleList = this.getAllLocalRulesForSelector(aDocument, aSelector);

    var stylesheet;
    if (!ruleList || !ruleList.length)
    {
      stylesheet = this.getStyleSheetForScreen(aDocument, aEditor);
      var str = aSelector + " {";
      for (var j = 0; j < aDeclarations.length; j++)
      {
        var property = aDeclarations[j].property;
        var value = aDeclarations[j].value;
        if (value) {
          var priority = aDeclarations[j].priority;
          str += "\n  " + property + ": " +
                 value +
                 (priority ? " !important;" : ";");
        }
      }
      str += "\n}\n";
      stylesheet.insertRule(str, stylesheet.cssRules.length)
    }
    else {
      var rule = ruleList[ruleList.length -1].rule;
      stylesheet = rule.parentStyleSheet;
      for (var j = 0; j < aDeclarations.length; j++)
      {
          var property = aDeclarations[j].property;
          var value = aDeclarations[j].value;
          if (value) {
            var priority = aDeclarations[j].priority ? " !important" : "";
    
            rule.style.setProperty(property,
                                   value,
                                   priority);
          }
      }
    }

    this.reserializeEmbeddedStylesheet(stylesheet, aEditor, aDocument);
  },

  reserializeEmbeddedStylesheet: function(aSheet, editor, aDocument)
  {
    var cssRules = aSheet.cssRules;
    var str = "";
    for (var i = 0; i < cssRules.length; i++)
    {
      var rule = cssRules[i];
      switch (rule.type)
      {
        case CssUtils.kCSSRule.STYLE_RULE:
          str += (i ? "\n" : "") + rule.selectorText + " {\n " +
                 rule.style.cssText.replace( /;/g , ";\n");
          str += "}\n";
          break;
        default:
          str += (i ? "\n" : "") + rule.cssText;
          break;
      }
    }
    var styleElt = aSheet.ownerNode;
    var child = styleElt.firstChild;
    while (child)
    {
      var tmp = child.nextSibling;
      if (editor)
        editor.deleteNode(child);
      else
        styleElt.removeChild(child);
      child = tmp;
    }
    var cssParser = new CSSParser(str);
    if (str) {
      var parsedSheet = cssParser.parse(str, false, false);
      str = parsedSheet.cssText();
    }

    var textNode;
    textNode = styleElt.ownerDocument.createTextNode("\n" + str);
    if (editor)
      editor.insertNode(textNode, styleElt, 0);
    else
      styleElt.appendChild(textNode);
  },

  getUseCSSPref: function()
  {
    try {
      var useCSS = Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getIntPref("bluegriffon.css.policy");
      return useCSS;
    }
    catch(e) { }

    return 0;
  }
};

