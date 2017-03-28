/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var dialog;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", InsertDialog_initialize, false);

function InsertDialog_initialize()
{
  dialog = new InsertDialog();
  dialog.initialize();
}

///////////////////////////////////////////////////////////////////////////////
//// class InsertDialog

function InsertDialog()
{
  this.mDoc  = window.arguments[0];
  this.mData = window.arguments[1];

  this.nodeType  = document.getElementById("ml_nodeType");
  this.tagName = document.getElementById("tx_tagName");
  this.nodeValue = document.getElementById("tx_nodeValue");
  this.namespace = document.getElementById("tx_namespace");
  this.menulist  = document.getElementById("ml_namespace");
  this.customNS  = document.getElementById("mi_custom");
}

InsertDialog.prototype =
{
 /**
  * This function initializes the content of the dialog.
  */
  initialize: function initialize()
  {
    var menulist   = this.menulist;
    var menuitems  = menulist.firstChild.childNodes;
    var defaultNS  = document.getElementById("mi_namespace");
    var accept     = document.documentElement.getButton("accept");

    menulist.disabled = !this.mData.enableNamespaces;
    defaultNS.value        = this.mDoc.documentElement.namespaceURI;

    if (this.mData.enableNamespaces) {
      let uri = this.mData.namespaceURI;
      menulist.value = uri;
      if (!menulist.selectedItem) {
        // The original node's namespace isn't one listed in the menulist.
        this.customNS.value = uri;
        menulist.selectedItem = this.customNS;
      }
    }
    this.updateNamespace();
    this.updateType();
    this.tagName.focus();
  },

 /**
  * The function that is called on accept.  Sets data.
  */
  accept: function accept()
  {
    switch (this.nodeType.value)
    {
      case "element":
      	this.mData.type     = Components.interfaces.nsIDOMNode.ELEMENT_NODE;
        this.mData.value    = this.tagName.value;
        break;
      case "text":
      	this.mData.type     = Components.interfaces.nsIDOMNode.TEXT_NODE;
        this.mData.value    = this.nodeValue.value;
        break;
    }
    this.mData.namespaceURI = this.namespace.value;
    this.mData.accepted     = true;
    return true;
  },

 /**
  * updateType changes the visibility of rows based on the node type.
  */
  updateType: function updateType()
  {
    switch (dialog.nodeType.value)
    {
      case "text":
        document.getElementById("row_text").hidden = false;
        document.getElementById("row_element").hidden = true;
        break;
      case "element":
        document.getElementById("row_text").hidden = true;
        document.getElementById("row_element").hidden = false;
        break;
    }
    dialog.toggleAccept();
  },

 /**
  * updateNamespace updates the namespace textbox based on the namespace menu.
  */
  updateNamespace: function updateNamespace()
  {
    this.namespace.disabled = dialog.menulist.selectedItem != this.customNS;
    this.namespace.value    = dialog.menulist.value;
  },

  /**
   * Change the "Custom" menuitem's value to reflect the namespace textbox's
   * value.
   *
   * This fires on input events, so if the user switches away from the
   * "Custom" menuitem and then back, the previously-entered value remains.
   */
  updateCustom: function updateCustom()
  {
    this.customNS.value = this.namespace.value;
  },

 /**
  * toggleAccept enables/disables the Accept button when there is/isn't an
  *   attribute name.
  */
  toggleAccept: function toggleAccept()
  {
    document.documentElement.getButton("accept").disabled = 
      (dialog.tagName.value == "") && (dialog.nodeType.selectedItem.value == "element");
  }
};
