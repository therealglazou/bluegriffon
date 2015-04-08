Components.utils.import("resource://app/modules/editorHelper.jsm");

var OPQUAST_CRITERIA = [

  {
    label: "ConformingDTDSyntax",
    checker: function(aDoc) {
      var doctype = aDoc.doctype;
      var systemId = doctype ? doctype.systemId : null;
      var type = {doctype: null, strict: false };
      var root = aDoc.documentElement;
    
      switch (systemId) {
        case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
        case "http://www.w3.org/TR/html4/loose.dtd":
        case "http://www.w3.org/TR/REC-html40/strict.dtd":
        case "http://www.w3.org/TR/REC-html40/loose.dtd":
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
        case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
        case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd": // XHTML 1.1
          return true;

        case "":
          if (root.getAttribute("xmlns")) { // XHTML 5
            return (root.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
          }
          return true; // HTML 5

        default: return false;
      }
    }
  },

  {
    label: "NoWrongSyntaxOrNonConformingHierarchy",
    checker: function(aDoc, aSource) {
      if (aSource)
        return -1;
      var elts = aDoc.querySelectorAll("*");
      for (var i = 0; i < elts.length; i++) {
        var e = elts[i];
        var p = e.parentNode;
        if (p && p.nodeType == Node.ELEMENT_NODE) {
          if (aDoc.defaultView.getComputedStyle(e, "").getPropertyValue("display") == "block"
              && aDoc.defaultView.getComputedStyle(p, "").getPropertyValue("display") == "inline")
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "OneTitleInHead",
    checker: function(aDoc) {
      return (aDoc.querySelectorAll("html > head > title").length == 1);
    }
  },

  {
    label: "NoEmptyTitle",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("html > head > title");
      for (var i = 0; i < elts.length; i++) {
        if (elts[i].textContent.trim() == "")
          return false;
      }
      return true;
    }
  },

  {
    label: "NoMetaRefresh",
    checker: function(aDoc) {
      var meta = aDoc.querySelector("html > head > meta[hhtp-equiv='refresh']");
      return !meta;
    }
  },

  {
    label: "HTMLElementHasLangAttribute",
    checker: function(aDoc) {
      return (aDoc.documentElement.hasAttribute("lang"));
    }
  },

  {
    label: "HTMLElementHasValidLangAttribute",
    checker: function(aDoc) {
      var lang = aDoc.documentElement.getAttribute("lang");
      if (!lang)
        return false;

      switch (lang) {
        case "en-GB-oed":
        case "i-ami":
        case "i-bnn":
        case "i-default":
        case "i-enochian":
        case "i-hak":
        case "i-klingon":
        case "i-lux":
        case "i-mingo":
        case "i-navajo":
        case "i-pwn":
        case "i-tao":
        case "i-tay":
        case "i-tsu":
        case "sgn-BE-FR":
        case "sgn-BE-NL":
        case "sgn-CH-DE":
        case "art-lojban":
        case "cel-gaulish":
        case "no-book":
        case "no-nyn":
        case "zh-guoyu":
        case "zh-hakka":
        case "zh-min":
        case "zh-min-nan":
        case "zh-xiang":
          return true;
        default: break;
      }
      const ALPHA = "[a-zA-Z]";
      const DIGIT = "[0-9]";
      const ALPHANUM = "[0-9a-zA-Z]";
      const singleton = "[0-9a-wy-zA-WY-Z]";
      const extlang = ALPHA + "{3}";
      const language = ALPHA + "{2}(\\-" + extlang + ")?|" + ALPHA + "{4}|" + ALPHA + "{5,8}";
      const script = ALPHA + "{4}";
      const region = "(" + ALPHA + "{2}" + "|" + DIGIT + "{3})";
      const variant = "(" + ALPHA + "{5,8}|" + DIGIT + ALPHA + "{3})";
      const extension = singleton + "(\\-" + ALPHANUM + "{2,8}){1,}"
      const privateuse = "x" + "(\\-" + ALPHANUM + "{1,8}){1,}"
      const langtag = "^(" + language
                      + "(\\-" + script + ")?"
                      + "(\\-" + region + ")?"
                      + "(\\-" + variant + ")*"
                      + "(\\-" + extension + ")*"
                      + "(\\-" + privateuse + ")?)|" + privateuse
                      + "$";
      return (lang.match(new RegExp(langtag, "")) != null);
    }
  },

  {
    label: "NoInvalidDir",
    checker: function(aDoc) {
      var e = aDoc.querySelector("*[dir]:not([dir='']):not([dir='ltr']):not([dir='rtl'])");
      return (null == e);
    }
  },

  {
    label: "TitleForFrames",
    checker: function(aDoc) {
      return !aDoc.querySelector("frame:not([title])");
    }
  },

  {
    label: "NoEmptyTitleForFrames",
    checker: function(aDoc) {
      return !aDoc.querySelector("frame[title='']");
    }
  },

  {
    label: "TitleForIFrames",
    checker: function(aDoc) {
      return !aDoc.querySelector("iframe:not([title])");
    }
  },

  {
    label: "NoEmptyTitleForIFrames",
    checker: function(aDoc) {
      return !aDoc.querySelector("iframe[title='']");
    }
  },

  {
    label: "AtLeastOneH1InBody",
    checker: function(aDoc) {
      return (aDoc.querySelector("html > body  h1") != null);
    }
  },

  {
    label: "NoEmptyH1",
    checker: function(aDoc) {
      return !aDoc.querySelector("h1:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyH2",
    checker: function(aDoc) {
      return !aDoc.querySelector("h2:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyH3",
    checker: function(aDoc) {
      return !aDoc.querySelector("h3:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyH4",
    checker: function(aDoc) {
      return !aDoc.querySelector("h4:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyH5",
    checker: function(aDoc) {
      return !aDoc.querySelector("h5:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyH6",
    checker: function(aDoc) {
      return !aDoc.querySelector("h6:-moz-only-whitespace");
    }
  },

  {
    label: "H2Order",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("h1,h2,h3,h4,h5,h6");
      if (elts.length && elts[0].nodeName.toLowerCase() == "h2")
        return false;
      return true;
    }
  },

  {
    label: "H3Order",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (var i = 0; i < elts.length; i++) {
        if (elts[i].nodeName.toLowerCase() == "h3") {
          if (0 == i)
            return false;
          if (elts[i - 1].nodeName.toLowerCase() == "h3")
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "H4Order",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (var i = 0; i < elts.length; i++) {
        if (elts[i].nodeName.toLowerCase() == "h4") {
          if (0 == i)
            return false;
          if (elts[i - 1].nodeName.toLowerCase() == "h1"
              || elts[i - 1].nodeName.toLowerCase() == "h2")
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "H5Order",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (var i = 0; i < elts.length; i++) {
        if (elts[i].nodeName.toLowerCase() == "h5") {
          if (0 == i)
            return false;
          if (elts[i - 1].nodeName.toLowerCase() == "h1"
              || elts[i - 1].nodeName.toLowerCase() == "h2"
              || elts[i - 1].nodeName.toLowerCase() == "h3")
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "H6Order",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (var i = 0; i < elts.length; i++) {
        if (elts[i].nodeName.toLowerCase() == "h6") {
          if (0 == i)
            return false;
          if (elts[i - 1].nodeName.toLowerCase() == "h1"
              || elts[i - 1].nodeName.toLowerCase() == "h2"
              || elts[i - 1].nodeName.toLowerCase() == "h3"
              || elts[i - 1].nodeName.toLowerCase() == "h4")
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "DTAsFirstChildOfDL",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("dl");
      for (var i = 0; i < elts.length; i++) {
        var dl = elts[i];
        if (dl.firstElementChild
            && dl.firstElementChild.nodeName.toLowerCase() != "dt")
          return false;
      }
      return true;
    }
  },

  {
    label: "NoEmptyLI",
    checker: function(aDoc) {
      return !aDoc.querySelector("li:-moz-only-whitespace");
    }
  },

  {
    label: "NoAlignAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[align]");
    }
  },

  {
    label: "NoXmpElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("xmp");
    }
  },

  {
    label: "NoEmptyP",
    checker: function(aDoc) {
      return !aDoc.querySelector("p:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyAExceptAnchors",
    checker: function(aDoc) {
      return !aDoc.querySelector("a[href]:-moz-only-whitespace");
    }
  },

  {
    label: "NoEmptyButton",
    checker: function(aDoc) {
      return !aDoc.querySelector("button:-moz-only-whitespace");
    }
  },

  {
    label: "NoVlinkAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[vlink]");
    }
  },

  {
    label: "NoTextAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[text]");
    }
  },

  {
    label: "NoLinkAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[link]");
    }
  },

  {
    label: "noImgWithoutAlt",
    checker: function(aDoc) {
      return !aDoc.querySelector("img:not([alt])");
    }
  },

  {
    label: "noAreaWithoutAlt",
    checker: function(aDoc) {
      return !aDoc.querySelector("area:not([alt])");
    }
  },

  {
    label: "noAppletWithoutAlt",
    checker: function(aDoc) {
      return !aDoc.querySelector("applet:not([alt])");
    }
  },

  {
    label: "noImageInputWithoutAlt",
    checker: function(aDoc) {
      return !aDoc.querySelector("input[type='image']:not([alt])");
    }
  },

  {
    label: "noEmptyAltForImageLoneChildOfAnchorOrButton",
    checker: function(aDoc) {
      return !aDoc.querySelector("a > img:-moz-first-node:-moz-last-node[alt=''],button > img:-moz-first-node:-moz-last-node[alt='']");
    }
  },

  {
    label: "noEmptyAltForInputImage",
    checker: function(aDoc) {
      return !aDoc.querySelector("input[type='image'][alt=''],input[type='image']:not([alt])");
    }
  },

  {
    label: "noEmptyAltForAreaWithHref",
    checker: function(aDoc) {
      return !aDoc.querySelector("area[href][alt=''],area[href]:not([alt])");
    }
  },

  {
    label: "noAltSimilarToTextContent",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("a[href] img[alt]");
      for (var i = 0; i < elts.length; i++) {
        var e = elts[i];
        var anchor = e;
        while (anchor && anchor.nodeName.toLowerCase() != "a")
          anchor = anchor.parentNode;
        if (anchor.textContent.trim() == e.getAttribute("alt").trim())
          return false;
      }
      return true;
    }
  },

  {
    label: "noBorderAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[border]");
    }
  },

  {
    label: "noSimilarAltForAreasWithDifferentHref",
    checker: function(aDoc) {
      var elts = aDoc.querySelectorAll("map area");
      for (var i = 0; i < elts.length; i++) {
        var area = elts[i];
        var map = area;
        while (map.nodeName.toLowerCase() != "map")
          map = map.parentNode;
        var areasOfMap = map.querySelectorAll("area");
        for (var j = 0; i < areasOfMap.length; j++) {
          var otherArea = areasOfMap[j];
          if (otherArea != area) {
            if (otherArea.getAttribute("alt") == area.getAttribute("alt")
                && otherArea.getAttribute("href") != area.getAttribute("href"))
              return false;
          }
        }
      }
      return true;
    }
  },

  {
    label: "LongdescIsURI",
    checker: function(aDoc) {
      var imgs = aDoc.querySelectorAll("img[longdesc]");
      for (var i = 0; i < imgs.length; i++) {
        var longdesc = imgs[i].getAttribute("longdesc");
        try {
          var uri = Components.classes['@mozilla.org/network/standard-url;1']
                              .createInstance(Components.interfaces.nsIURL);
          uri.spec = longdesc;
        }
        catch(e) { return false; }
      }
      return true;
    }
  },

  {
    label: "noBackgroundAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[background]");
    }
  },

  {
    label: "noBgsoundElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("bgsound");
    }
  },

  {
    label: "TablesWithAtLeastOneTHHaveACaption",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table");
      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              hasTh = (grandgrandchild.nodeName.toLowerCase() == "th");
              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }
        if (hasTh
            && tables[i].firstElementChild
            && tables[i].firstElementChild.nodeName.toLowerCase() != "caption")
          return false;
      }
      return true;
    }
  },

  {
    label: "CaptionIsDifferentFromSummaryAttribute",
    checker: function(aDoc) {
      var captions = aDoc.querySelectorAll("table > caption");
      for (var i = 0; i < captions.length; i++) {
        var caption = captions[i];
        var captionText = caption.textContent.trim();
        var summary = caption.parentNode.hasAttribute("summary")
                      ? caption.parentNode.getAttribute("summary")
                      : null;
        if (captionText == summary)
          return false;
      }
      return true;
    }
  },

  {
    label: "noEmptyCaption",
    checker: function(aDoc) {
      return !aDoc.querySelector("table > caption:-moz-only-whitespace");
    }
  },

  {
    label: "noCaptionInATableWithOnlyTDs",
    checker: function (aDoc) {
      var tables = aDoc.querySelectorAll("table");
      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              hasTh = (grandgrandchild.nodeName.toLowerCase() == "th");
              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }
        if (!hasTh
            && tables[i].firstElementChild
            && tables[i].firstElementChild.nodeName.toLowerCase() == "caption")
          return false;
      }
      return true;
    }
  },

  {
    label: "noAlinkAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[alink]");
    }
  },

  {
    label: "noSummaryAttributeSimilarToCaption",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table[summary]");
      for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        if (table.firstElementChild
            && table.firstElementChild.nodeName.toLowerCase() == "caption"
            && table.getAttribute("summary").trim() ==
                table.firstElementChild.textContent.trim())
          return false;
      }
      return true;
    }
  },

  {
    label: "noEmptySummaryIfTableHasTHOrCaption",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table[summary]");
      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              hasTh = (grandgrandchild.nodeName.toLowerCase() == "th");
              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }
        if ((hasTh
             || (tables[i].firstElementChild
                && tables[i].firstElementChild.nodeName.toLowerCase() == "caption"))
            && tables[i].getAttribute("summary").trim() == "")
          return false;
      }
      return true;
    }
  },

  {
    label: "noSummaryAttributeIfOnlyTDs",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table[summary]");
      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              hasTh = (grandgrandchild.nodeName.toLowerCase() == "th");
              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }
        if (!hasTh)
          return false;
      }
      return true;
    }
  },

  {
    label: "noStrikeElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("strike");
    }
  },

  {
    label: "noListingElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("listing");
    }
  },

  {
    label: "AtLeastOneTHIfCaptionOrSummary",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table");
      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              hasTh = (grandgrandchild.nodeName.toLowerCase() == "th");
              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }
        if (!hasTh
            && ((tables[i].hasAttribute("summary")
                 && tables[i].getAttribute("summary").trim() != "")
                || (tables[i].firstElementChild
                    && tables[i].firstElementChild.nodeName.toLowerCase() == "caption")))
          return false;
      }
      return true;
    }
  },

  {
    label: "AllNonEmptyTHHaveScopeOrId",
    checker: function(aDoc) {
      var ths = aDoc.querySelectorAll("th");
      for (var i = 0; i < ths.length; i++) {
        var th = ths[i];
        if (th.textContent.trim() != "" || th.firstElementChild) {
          if (!th.hasAttribute("scope") && !th.hasAttribute("id"))
          return false;
        }
      }
      return true;
    }
  },

  {
    label: "ScopeAttributeIsRowOrCol",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[scope]:not([scope='row']):not([scope='col'])");
    }
  },

  {
    label: "noBgcolorAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("*[bgcolor]");
    }
  },

  {
    label: "noTTElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("tt");
    }
  },

  {
    label: "TDHaveHeadersAttributeIfTHHasId",
    checker: function(aDoc, aSource) {
      if (aSource)
        return -1;
      var inRows = aDoc.querySelectorAll("th[id] ~ td:not([headers])");
      if (inRows && inRows.length)
        return false;

      var inColumns = aDoc.querySelectorAll("tr:first-child > th[id]");
      for (var i = 0; i < inColumns.length; i++) {
        var th = inColumns[i];
        var row = {value: -1}, col = {value: -1};
        EditorUtils.getCurrentEditor()
                   .getCellIndexes(th, row, col);
        var tableRows = {value: -1}, tableCols = {value: -1};
        EditorUtils.getCurrentEditor()
                   .getTableSize(th.parentNode.parentNode.parentNode,
                                 tableRows, tableCols);
        for (var j = 1; j < tablesRows.value; j++) {
          var cell = EditorUtils.getCurrentEditor()
                                .getCellAt(th.parentNode.parentNode.parentNode,
                                           j, col.value);
          if (!cell.hasAttribute("headers"))
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "noPlaintextElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("plaintext");
    }
  },

  {
    label: "noHeadersAttributeThatIsNotATHId",
    checker: function(aDoc) {
      var tables = aDoc.querySelectorAll("table");
      var thIDs = [], tdHeaders = [];

      for (var i = 0; i < tables.length; i++) {
        var child = tables[i].firstElementChild;
        var hasTh = false;
        while (!hasTh && child) {
          var grandchild = child.firstElementChild;
          while (!hasTh && grandchild) {
            var grandgrandchild = grandchild.firstElementChild;
            while (!hasTh && grandgrandchild) {
              if (grandgrandchild.nodeName.toLowerCase() == "th"
                  && grandgrandchild.hasAttribute("id"))
                thIDs.push(grandgrandchild.id);
              else if (grandgrandchild.nodeName.toLowerCase() == "td"
                       && grandgrandchild.hasAttribute("headers"))
                tdHeaders.push(grandgrandchild.getsAttribute("headers"));

              grandgrandchild = grandgrandchild.nextElementSibling;
            }
            grandchild = grandchild.nextElementSibling;
          }
          child = child.nextElementSibling;
        }

        for (var k = 0; k < tdHeaders.length; k++) {
          if (thIDs.indexOf(tdHeaders[k]) == -1)
            return false;
        }
      }
      return true;
    }
  },

  {
    label: "AllFormsHaveAButton",
    checker: function(aDoc) {
      var forms = aDoc.querySelectorAll("form");
      for (var i = 0; i < forms.length; i++) {
        var elts = forms[i].querySelector("button[type='submit'],button[type='button'],input[type='submit'],input[type='image'],input[type='button']");
        if (!elts || !elts.length)
          return false;
      }
      return true;
    }
  },

  {
    label: "SubmitButtonsHaveNonEmptyValue",
    checker: function(aDoc) {
      return !aDoc.querySelector("input[type='submit'][value=''],input[type='submit']:not([value])");
    }
  },

  {
    label: "noMarqueeElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("marquee");
    }
  },

  {
    label:"FieldsetHasALegend",
    checker: function(aDoc) {
      var fieldsets = aDoc.querySelectorAll("fieldset");
      for (var i = 0; i < fieldsets.length; i++) {
        var child = fieldsets[i].firstElementChild;
        var found = false;
        while (!found && child) {
          found = (child.nodeName.toLowerCase() == "legend");
          child = child.nextElementSibling;
        }
        if (!found)
          return false;
      }
      return true;
    }
  },

  {
    label: "FieldsetsAreInForms",
    checker: function(aDoc) {
      var fieldsetsInForms = aDoc.querySelectorAll("form fieldset");
      var fieldsets        = aDoc.querySelectorAll("fieldset");
      return  (fieldsets.length == fieldsetsInForms.length);
    }
  },

  {
    label:"noEmptyLegendElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("legend:-moz-only-whitespace");
    }
  },

  {
    label: "LabelElementHasForAttribute",
    checker: function(aDoc) {
      return !aDoc.querySelector("label:not([for])");
    }
  },

  {
    label: "noEmptyForAttributeOnLabel",
    checker: function(aDoc) {
      return !aDoc.querySelector("label[for='']");
    }
  },

  {
    label: "ForAttributeMatchesAnIdInSameForm",
    checker: function(aDoc) {
      var labels = aDoc.querySelectorAll("form label[for]");
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        var form = label;
        while (form && form.nodeName.toLowerCase() != "form")
          form = form.parentNode;
        if (!form.querySelector("#" + label.getAttribute("for")))
          return false;
      }
      return true;
    }
  },

  {
    label: "OptgroupElementHasALabel",
    checker: function(aDoc) {
      return !aDoc.querySelector("optgroup:not([label])");
    }
  },

  {
    label: "NoSimilarLabelInOptgroupsOfSameSelect",
    checker: function(aDoc) {
      var optgroups = aDoc.querySelectorAll("optgroup[label]");
      for (var i = 0; i < optgroups.length; i++) {
        var optgroup = optgroups[i];
        var select = optgroup;
        while (select && select.nodeName.toLowerCase() != "select")
          select = select.parentNode;
        if (select.querySelectorAll("optgroup[label='" + optgroup.getAttribute("label") + "']") != 1)
          return false;
      }
      return true;
    }
  },

  {
    label: "noEmptyLabelAttributeOnOptgroup",
    checker: function(aDoc) {
      return !aDoc.querySelector("optgroup[label='']");
    }
  },
  
  {
    label: "noBasefontElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("basefont");
    }
  },
  
  {
    label: "noBlinkElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("blink");
    }
  },
  
  {
    label: "noCenterElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("center");
    }
  },
  
  {
    label: "noFontElement",
    checker: function(aDoc) {
      return !aDoc.querySelector("font");
    }
  }
];
