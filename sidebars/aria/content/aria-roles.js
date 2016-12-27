const kWAI_ARIA_11_ROLES = {
  "alert": {
    "sup": "section",
    "sub": "alertdialog"
  },
  "alertdialog": {
    "sup": "alert dialog"
  },
  "application": {
    "sup": "structure",
    "properties": "aria-activedescendant"
  },
  "article": {
    "sup": "document",
    "properties": "aria-posinset aria-setsize"
  },
  "banner": {
    "sup": "landmark"
  },
  "button": {
    "sup": "command",
    "properties": "aria-expanded aria-pressed"
  },
  "cell": {
    "sup": "section",
    "sub": "columnheader gridcell rowheader",
    "context": "row",
    "properties": "aria-colindex aria-colspan aria-rowindex aria-rowspan"
  },
  "checkbox": {
    "sup": "input",
    "sub": "menuitemcheckbox switch",
    "required": "aria-checked",
    "properties": "aria-readonly"
  },
  "columnheader": {
    "sup": "cell gridcell sectionhead",
    "context": "row",
    "properties": "aria-sort"
  },
  "combobox": {
    "sup": "select",
    "owns": CheckComboboxOwns, // XXX FUNCTION
    "required": "aria-controls aria-expanded",
    "properties": "aria-autocomplete aria-readonly aria-required"
  },
  "command": {
    "abstract": true,
    "sup": "widget",
    "sub": "button link menuitem"
  },
  "complementary": {
    "sup": "landmark"
  },
  "composite": {
    "abstract": true,
    "sup": "widget",
    "sub": "grid select spinbutton tablist",
    "properties": "aria-activedescendant"
  },
  "contentinfo": {
    "sup": "landmark"
  },
  "definition": {
    "sup": "section"
  },
  "dialog": {
    "sup": "window",
    "sub": "alertdialog"
  },
  "directory": {
    "sup": "list"
  },
  "document": {
    "sup": "structure",
    "sub": "article",
    "properties": "aria-expanded"
  },
  "feed": {
    "sup": "list",
    "owns": "article"
  },
  "figure": {
    "sup": "section"
  },
  "form": {
    "sup": "landmark"
  },
  "grid": {
    "sup": "composite table",
    "sub": "treegrid",
    "owns": "rowgroup",
    "properties": "aria-level aria-multiselectable aria-readonly"
  },
  "gridcell": {
    "sup": "cell widget",
    "sub": "columnheader rowheader",
    "context": "row",
    "properties": "aria-readonly aria-required aria-selected"
  },
  "group": {
    "sup": "section",
    "sub": "row select toolbar",
    "properties": "aria-activedescendant"
  },
  "heading": {
    "sup": "sectionhead",
    "properties": "aria-level"
  },
  "img": {
    "sup": "section",
    "sub": "doc-cover"
  },
  "input": {
    "abstract": true,
    "sup": "widget",
    "sub": "checkbox option radio slider spinbutton textbox"
  },
  "landmark": {
    "sup": "section",
    "sub": "banner complementary contentinfo doc-acknowledgements doc-afterword doc-appendix doc-bibliography doc-chapter doc-conclusion doc-credits doc-epilogue doc-errata doc-glossary doc-introduction doc-part doc-preface doc-prologue form main navigation region search"
  },
  "link": {
    "sup": "command",
    "sub": "doc-backlink doc-biblioref doc-glossref doc-noteref",
    "properties": "aria-expanded"
  },
  "list": {
    "sup": "section",
    "sub": "directory feed",
    "owns": "group listitem"
  },
  "listbox": {
    "sup": "select",
    "owns": "option",
    "properties": "aria-multiselectable aria-readonly aria-required"
  },
  "listitem": {
    "sup": "section",
    "sub": "doc-biblioentry doc-endnote treeitem",
    "context": "group list",
    "properties": "aria-level aria-posinset aria-setsize"
  },
  "log": {
    "sup": "section"
  },
  "main": {
    "sup": "landmark"
  },
  "marquee": {
    "sup": "section"
  },
  "math": {
    "sup": "section"
  },
  "menu": {
    "sup": "select",
    "sub": "menubar",
    "owns": "group menuitem menuitemcheckbox menuitemradio"
  },
  "menubar": {
    "sup": "menu",
    "owns": "group menuitem menuitemcheckbox menuitemradio"
  },
  "menuitem": {
    "sup": "command",
    "sub": "menuitemcheckbox",
    "context": "group menu menubar",
    "properties": "aria-posinset aria-setsize"
  },
  "menuitemcheckbox": {
    "sup": "checkbox menuitem",
    "sub": "menuitemradio",
    "context": "menu menubar"
  },
  "menuitemradio": {
    "sup": "menuitemcheckbo radio",
    "context": "group menu menubar"
  },
  "navigation": {
    "sup": "landmark",
    "sub": "doc-index doc-pagelist doc-toc"
  },
  "none": {
    "sup": "section",
    "sub": "doc-pullquote"
  },
  "note": {
    "sup": "section",
    "sub": "doc-notice doc-tip"
  },
  "option": {
    "sup": "input",
    "sub": "treeitem",
    "context": "listbox",
    "required": "aria-selected",
    "properties": "aria-checked aria-posinset aria-setsize"
  },
  "presentation": {
    "sup": "structure"
  },
  "progressbar": {
    "sup": "range",
  },
  "radio": {
    "sup": "input",
    "sub": "menuitemradio",
    "required": "aria-checked",
    "properties": "aria-posinset aria-setsize"
  },
  "radiogroup": {
    "sup": "select",
    "owns": "radio",
    "properties": "aria-readonly aria-required"
  },
  "range": {
    "abstract": true,
    "sup": "widget",
    "sub": "progressbar scrollbar slider spinbutton",
    "properties": "aria-valuemax aria-valuemin aria-valuenow aria-valuetext"
  },
  "region": {
    "sup": "landmark"
  },
  "roletype": {
    "abstract": true,
    "sub": "structure widget window",
    "properties": "aria-atomic aria-busy aria-controls aria-current aria-describedby aria-details aria-disabled aria-dropeffect aria-errormessage aria-flowto aria-grabbed aria-haspopup aria-hidden aria-invalid aria-keyshortcuts aria-label aria-labelledby aria-live aria-owns aria-relevant aria-roledescription"
  },
  "row": {
    "sup": "group widget",
    "context": "grid rowgroup table treegrid",
    "owns": "cell columnheader gridcell rowheader"
  },
  "rowgroup": {
    "sup": "structure",
    "context": "grid table treegrid",
    "owns": "row"
  },
  "rowheader": {
    "sup": "cell gridcell sectionhead",
    "context": "row",
    "properties": "aria-sort"
  },
  "scrollbar": {
    "sup": "range",
    "properties": "aria-controls aria-orientation aria-valuemax aria-valuemin aria-valuenow"
  },
  "search": {
    "sup": "landmark"
  },
  "searchbox": {
    "sup": "textbox"
  },
  "section": {
    "abstract": true,
    "sup": "structure",
    "sub": "alert cell definition doc-abstract doc-colophon doc-credit doc-dedication doc-epigraph doc-example doc-footnote doc-foreword doc-qna figure group img landmark list listitem log marquee math note status table tabpanel term tooltip",
    "properties": "aria-expanded"
  },
  "sectionhead": {
    "abstract": true,
    "sup": "structure",
    "sub": "columnheader doc-subtitle heading rowheader tab",
    "properties": "aria-expanded"
  },
  "select": {
    "abstract": true,
    "sup": "composite group",
    "sub": "combobox listbox menu radiogroup tree",
    "properties": "aria-orientation"
  },
  "separator": {
    "sup": "structure widget",
    "sub": "doc-pagebreak",
    "required": "aria-valuemax aria-valuemin aria-valuenow",
    "properties": "aria-orientation aria-valuetext"
  },
  "slider": {
    "sup": "input range",
    "required": "aria-valuemax aria-valuemin aria-valuenow",
    "properties": "aria-orientation aria-readonly"
  },
  "spinbutton": {
    "sup": "composite input range",
    "required": "aria-valuemax aria-valuemin aria-valuenow",
    "properties": "aria-required aria-readonly"
  },
  "spinbutton": {
    "sup": "section",
    "sub": "progressbar timer"
  },
  "status": {
    "sup": "section",
    "sub": "progressbar timer"
  },
  "structure": {
    "abstract": true,
    "sup": "roletype",
    "sub": "application document presentation rowgroup section sectionhead separator"
  },
  "switch": {
    "sup": "checkbox",
    "required": "aria-checked"
  },
  "tab": {
    "sup": "sectionhead widget",
    "context": "tablist",
    "properties": "aria-posinset aria-selected aria-setsize"
  },
  "table": {
    "sup": "section",
    "sub": "grid",
    "owns": "row rowgroup",
    "properties": "aria-colcount aria-rowcount"
  },
  "tablist": {
    "sup": "composite",
    "owns": "tab",
    "properties": "aria-level aria-multiselectable aria-orientation"
  },
  "tabpanel": {
    "sup": "section"
  },
  "term": {
    "sup": "section"
  },
  "textbox": {
    "sup": "input",
    "sub": "searchbox",
    "properties": "aria-activedescendant aria-autocomplete aria-multiline aria-placeholder aria-readonly aria-required"
  },
  "timer": {
    "sup": "status"
  },
  "toolbar": {
    "sup": "group",
    "properties": "aria-orientation"
  },
  "tooltip": {
    "sup": "section"
  },
  "tree": {
    "sup": "select",
    "sub": "treegrid",
    "owns": "group treeitem",
    "properties": "aria-multiselectable aria-required"
  },
  "treegrid": {
    "sup": "grid tree",
    "owns": "row rowgroup"
  },
  "treeitem": {
    "sup": "listitem",
    "context": "group tree"
  },
  "widget": {
    "abstract": true,
    "sup": "roletype",
    "sub": "command composite gridcell input range row separator tab"
  },
  "window": {
    "abstract": true,
    "sup": "roletype",
    "sub": "dialog",
    "properties": "aria-expanded aria-modal"
  },

  // DPUB-ARIA-1.0

  "doc-abstract": {
    "sup": "section"
  },
  "doc-acknowledgements": {
    "sup": "landmark"
  },
  "doc-afterword": {
    "sip": "landmark"
  },
  "doc-appendix": {
    "sip": "landmark"
  },
  "doc-backlink": {
    "sup": "link"
  },
  "doc-biblioentry": {
    "sup": "listitem",
    "context": "doc-bibliography"
  },
  "doc-bibliography": {
    "sup": "landmark",
    "owns": "doc-biblioentry"
  },
  "doc-biblioref": {
    "sup": "link"
  },
  "doc-chapter": {
    "sup": "landmark"
  },
  "doc-colophon": {
    "sup": "section"
  },
  "doc-conclusion": {
    "sup": "landmark"
  },
  "doc-cover": {
    "sup": "img"
  },
  "doc-credit": {
    "sup": "section"
  },
  "doc-credits": {
    "sup": "landmark"
  },
  "doc-dedication": {
    "sup": "section"
  },
  "doc-endnote": {
    "sup": "listitem",
    "context": "doc-endnotes"
  },
  "doc-epigraph": {
    "sup": "section"
  },
  "doc-epilogue": {
    "sup": "landmark"
  },
  "doc-errata": {
    "sup": "landmark"
  },
  "doc-example": {
    "sup": "section"
  },
  "doc-footnote": {
    "sup": "section"
  },
  "doc-foreword": {
    "sup": "section"
  },
  "doc-glossary": {
    "sup": "landmark",
    "owns": "term,definition"
  },
  "doc-glossref": {
    "sup": "link"
  },
  "doc-index": {
    "sup": "navigation"
  },
  "doc-introduction": {
    "sup": "landmark"
  },
  "doc-noteref": {
    "sup": "link"
  },
  "doc-notice": {
    "sup": "note"
  },
  "doc-pagebreak": {
    "sup": "separator"
  },
  "doc-pagelist": {
    "sup": "navigation"
  },
  "doc-part": {
    "sup": "landmark"
  },
  "doc-preface": {
    "sup": "landmark"
  },
  "doc-prologue": {
    "sup": "landmark"
  },
  "doc-pullquote": {
    "sup": "none"
  },
  "doc-qna": {
    "sup": "section"
  },
  "doc-subtitle": {
    "sup": "sectionhead"
  },
  "doc-tip": {
    "sup": "note"
  },
  "doc-toc": {
    "sup": "navigation"
  }
};

function CheckComboboxOwns(aNode)
{
  var textbox = aNode.querySelector("[role='textbox']");
  if (textbox) {
    if (aNode.getAttribute("aria-expanded") == "true") {
      var innerWidget = aNode.querySelector("[role='listbox'], [role='tree'], [role='grid'], [role='dialog']");
      if (innerWidget)
        return "";
      return gBundle.getString("missingListboxTreeGridDialog");
    }
    return "";
  }
  
  return gBundle.getString("missingTextbox");
}
