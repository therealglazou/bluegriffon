Components.utils.import("resource://app/modules/editorHelper.jsm");

var HTML5Helper = {
  
  mHTML5_ELEMENTS: [
    {tag: 'a',          label: "namedAnchor", block: false, empty: false, command: 'insertNamedAnchor' },
    {tag: 'a',          label: "a",           block: false, empty: false, command: 'insertLink' },
    {tag: 'abbr',       label: "abbr",        block: false, empty: false, command: null },
    {tag: 'area',       label: "area",        block: false, empty: true,  command: null },
    {tag: 'article',    label: "article",     block: true,  empty: false, command: null },
    {tag: 'aside',      label: "aside",       block: true,  empty: false, command: null },
    {tag: 'audio',      label: "audio",       block: true,  empty: false, command: 'insertAudio' },
    {tag: 'b',          label: "b",           block: false, empty: false, command: null },
    {tag: 'bdi',        label: "bdi",         block: false, empty: false, command: null },
    {tag: 'bdo',        label: "bdo",         block: false, empty: false, command: null },
    {tag: 'blockquote', label: "blockquote",  block: true,  empty: false, command: null },
    {tag: 'br',         label: "br",          block: false, empty: true,  command: null },
    {tag: 'button',     label: "button",      block: false, empty: false, command: 'insertButton' },
    {tag: 'canvas',     label: "canvas",      block: false, empty: false, command: null },
    {tag: 'cite',       label: "cite",        block: false, empty: false, command: null },
    {tag: 'code',       label: "code",        block: false, empty: false, command: null },
    {tag: 'datalist',   label: "datalist",    block: false, empty: false, command: 'insertDatalist' },
    {tag: 'dd',         label: "dd",          block: true,  empty: false, command: null },
    {tag: 'del',        label: "del",         block: false, empty: false, command: null },
    {tag: 'details',    label: "details",     block: true,  empty: false, command: null },
    {tag: 'dfn',        label: "dfn",         block: false, empty: false, command: null },
    {tag: 'div',        label: "div",         block: true,  empty: false, command: null },
    {tag: 'dl',         label: "dl",          block: true,  empty: false, command: null },
    {tag: 'dt',         label: "dt",          block: true,  empty: false, command: null },
    {tag: 'em',         label: "em",          block: false, empty: false, command: null },
    {tag: 'embed',      label: "embed",       block: false, empty: true,  command: null },
    {tag: 'fieldset',   label: "fieldset",    block: false, empty: false, command: 'insertFieldset' },
    {tag: 'figcaption', label: "figcaption",  block: true,  empty: false, command: null },
    {tag: 'figure',     label: "figure",      block: true,  empty: false, command: null },
    {tag: 'footer',     label: "footer",      block: true,  empty: false, command: null },
    {tag: 'form',       label: "form",        block: true,  empty: false, command: 'insertForm' },
    {tag: 'h1',         label: "h1",          block: true,  empty: false, command: null },
    {tag: 'h2',         label: "h2",          block: true,  empty: false, command: null },
    {tag: 'h3',         label: "h3",          block: true,  empty: false, command: null },
    {tag: 'h4',         label: "h4",          block: true,  empty: false, command: null },
    {tag: 'h5',         label: "h5",          block: true,  empty: false, command: null },
    {tag: 'h6',         label: "h6",          block: true,  empty: false, command: null },
    {tag: 'header',     label: "header",      block: true,  empty: false, command: null },
    {tag: 'hgroup',     label: "hgroup",      block: true,  empty: false, command: null },
    {tag: 'hr',         label: "hr",          block: false, empty: true,  command: null },
    {tag: 'i',          label: "i",           block: false, empty: false, command: null },
    {tag: 'iframe',     label: "iframe",      block: true,  empty: true,  command: null },
    {tag: 'img',        label: "img",         block: false, empty: true,  command: 'insertImage' },
    {tag: 'input',      label: "input",       block: false, empty: true,  command: 'insertInput' },
    {tag: 'ins',        label: "ins",         block: false, empty: false, command: null },
    {tag: 'kbd',        label: "kbd",         block: false, empty: false, command: null },
    {tag: 'keygen',     label: "keygen",      block: false, empty: true,  command: 'insertKeygen' },
    {tag: 'label',      label: "label",       block: true,  empty: false, command: 'insertLabel' },
    {tag: 'legend',     label: "legend",      block: true,  empty: false, command: null },
    {tag: 'li',         label: "li",          block: true,  empty: false, command: null },
    {tag: 'map',        label: "map",         block: true,  empty: false, command: null },
    {tag: 'mark',       label: "mark",        block: false, empty: false, command: null },
    {tag: 'menu',       label: "menu",        block: true,  empty: false, command: null },
    {tag: 'meter',      label: "meter",       block: false, empty: false, command: 'insertMeter' },
    {tag: 'nav',        label: "nav",         block: true,  empty: false, command: null },
    {tag: 'noscript',   label: "noscript",    block: true,  empty: false, command: null },
    {tag: 'object',     label: "object",      block: true,  empty: false, command: null },
    {tag: 'ol',         label: "ol",          block: true,  empty: false, command: null },
    {tag: 'optgroup',   label: "optgroup",    block: true,  empty: false, command: null },
    {tag: 'option',     label: "option",      block: true,  empty: false, command: null },
    {tag: 'p',          label: "p",           block: true,  empty: false, command: null },
    {tag: 'param',      label: "param",       block: false, empty: true,  command: null },
    {tag: 'pre',        label: "pre",         block: true,  empty: false, command: null },
    {tag: 'progress',   label: "progress",    block: false, empty: true,  command: 'insertProgress' },
    {tag: 'q',          label: "q",           block: false, empty: false, command: null },
    {tag: 'rp',         label: "rp",          block: false, empty: false, command: null },
    {tag: 'rt',         label: "rt",          block: false, empty: false, command: null },
    {tag: 's',          label: "s",           block: false, empty: false, command: null },
    {tag: 'samp',       label: "samp",        block: false, empty: false, command: null },
    {tag: 'section',    label: "section",     block: true,  empty: false, command: null },
    {tag: 'select',     label: "select",      block: false, empty: false, command: 'insertSelect' },
    {tag: 'small',      label: "small",       block: false, empty: false, command: null },
    {tag: 'source',     label: "source",      block: false, empty: true,  command: null },
    {tag: 'span',       label: "span",        block: false, empty: false, command: null },
    {tag: 'strong',     label: "strong",      block: false, empty: false, command: null },
    {tag: 'style',      label: "style",       block: true,  empty: false, command: null },
    {tag: 'sub',        label: "sub",         block: false, empty: false, command: null },
    {tag: 'summary',    label: "summary",     block: true,  empty: false, command: null },
    {tag: 'sup',        label: "sup",         block: false, empty: false, command: null },
    {tag: 'table',      label: "table",       block: true,  empty: false, command: 'insertTable' },
    {tag: 'textarea',   label: "textarea",    block: false, empty: false, command: 'insertTextarea' },
    {tag: 'time',       label: "time",        block: false, empty: false, command: null },
    {tag: 'track',      label: "track",       block: false, empty: true,  command: null },
    {tag: 'ul',         label: "ul",          block: true,  empty: false, command: null },
    {tag: 'var',        label: "var",         block: false, empty: false, command: null },
    {tag: 'video',      label: "video",       block: false, empty: false, command: 'insertVideo' },
    {tag: 'wbr',        label: "wbr",         block: false, empty: true,  command: null }
  ],

  mOTHER_HTML5_ELEMENTS: [
    {tag: 'html',       label: "html",        block: true, empty: false, command: null },
    {tag: 'body',       label: "body",        block: true, empty: false, command: null },
    {tag: 'head',       label: "head",        block: true, empty: false, command: null },
    {tag: 'title',      label: "title",       block: true, empty: false, command: null },
    {tag: 'meta',       label: "meta",        block: true, empty: true,  command: null },
    {tag: 'link',       label: "link",        block: true, empty: true,  command: null },
    {tag: 'style',      label: "style",       block: true, empty: false, command: null },
    {tag: 'script',     label: "script",      block: true, empty: false, command: null }
  ],

  insertVideo: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertVideo.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null, null);
  },

  insertTextarea: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertTextarea.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertTable: function()
  {
    AutoInsertTable.reset();
    gDialog.AutoInsertTableSheetPopup.openPopup(gDialog["tableButton"], "after_start", 0, 0, false);
  },

  insertSelect: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertSelect.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertProgress: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertProgress.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertMeter: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertMeter.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },
  
  insertLabel: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertLabel.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", null);
  },

  insertKeygen: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertKeygen.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertInput: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertFormInput.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", null, "hidden");
  },

  insertImage: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertImage.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null, null);
  },

  insertForm: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertForm.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", null);

  },

  insertFieldset: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertFieldset.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", null);
  },

  insertDatalist: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertDatalist.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertButton: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertButton.xul","_blank",
                      "chrome,modal,titlebar,resizable=no,dialog=yes", null);
  },

  insertAudio: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertAudio.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null, null);
  },

  insertLink: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertLink.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  insertNamedAnchor: function()
  {
    window.openDialog("chrome://bluegriffon/content/dialogs/insertAnchor.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes,dialog=yes", null);
  },

  initInsertMenu: function(aPopup)
  {
    deleteAllChildren(aPopup);
    for (var i = 0; i < this.mHTML5_ELEMENTS.length; i++) {
      var element = this.mHTML5_ELEMENTS[i];
      var label = element.label;
      try {
        var str = gDialog.bundleHTML5.getString(label);
        label = str;
      }
      catch(e) {}
      var item = document.createElement("menuitem");
      item.setAttribute("label", label);
      item.setAttribute("observes", "cmd_renderedHTMLEnabler");
      item.setAttribute("html5index", i);
      item.setAttribute("oncommand", "HTML5Helper.insertElement(this)")
      aPopup.appendChild(item);
    }
  },

  insertElement: function(aMenuitem)
  {
    var index = parseInt(aMenuitem.getAttribute("html5index"))
    var element = HTML5Helper.mHTML5_ELEMENTS[index];
    this._insertElement(element);
  },

  _insertElement: function(element) {
    if (element.command) {
      HTML5Helper[element.command]();
      return;
    }

    var editor = EditorUtils.getCurrentEditor();
    var doc = EditorUtils.getCurrentDocument();
    if (element.empty) {
      editor.beginTransaction();
      var node = doc.createElement("img");
      editor.insertElementAtSelection(node, true);
      var finalNode = doc.createElement(element.tag);
      txn = new diNodeInsertionTxn(finalNode,
                                   node.parentNode,
                                   node.nextSibling);
      editor.transactionManager.doTransaction(txn);
      editor.deleteNode(node);
      editor.endTransaction();
      editor.selectElement(finalNode);
      return;
    }

    if (element.block) {
      editor.beginTransaction();
      var node = doc.createElement("img");
      editor.insertElementAtSelection(node, true);
      var finalNode = doc.createElement(element.tag);
      var finalBr = doc.createElement("br");
      finalNode.appendChild(finalBr);
      var refNode = node;
      while (refNode.parentNode
             && refNode.parentNode.nodeName.toLowerCase() != "div"
             && refNode.parentNode.nodeName.toLowerCase() != "body"
             && refNode.parentNode.nodeName.toLowerCase() != "td"
             && refNode.parentNode.nodeName.toLowerCase() != "th")
        refNode = refNode.parentNode;
      txn = new diNodeInsertionTxn(finalNode,
                                   refNode.parentNode,
                                   refNode.nextSibling);
      editor.transactionManager.doTransaction(txn);
      editor.deleteNode(node);
      editor.endTransaction();
      editor.selection.collapse(finalNode, 0);
      return;
    }

    editor.beginTransaction();
    var node = doc.createElement("img");
    editor.insertElementAtSelection(node, true);
    var finalNode = doc.createElement(element.tag);
    var finalTextNode = doc.createTextNode("");
    finalNode.appendChild(finalTextNode);
    txn = new diNodeInsertionTxn(finalNode,
                                 node.parentNode,
                                 node.nextSibling);
    editor.transactionManager.doTransaction(txn);
    editor.deleteNode(node);
    editor.endTransaction();
    editor.selection.collapse(finalNode, 0);
  }
};







