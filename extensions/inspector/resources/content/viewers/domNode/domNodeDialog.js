/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var dialog;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", DomNodeDialog_initialize, false);

function DomNodeDialog_initialize()
{
  dialog = new DomNodeDialog();
  dialog.initialize();
}

///////////////////////////////////////////////////////////////////////////////
//// class DomNodeDialog

function DomNodeDialog()
{
  this.mData  = window.arguments[0];
  this.mTitle = window.arguments[1];
  this.mDoc   = window.arguments[2];

  this.nodeName  = document.getElementById("tx_nodeName");
  this.nodeValue = document.getElementById("tx_nodeValue");
  this.namespace = document.getElementById("tx_namespace");
  this.menulist  = document.getElementById("ml_namespace");
}

DomNodeDialog.prototype =
{
 /**
  * This function initializes the content of the dialog.
  */
  initialize: function initialize()
  {
    document.title = this.mTitle;
    var defaultNS  = document.getElementById("mi_namespace");
    var customNS   = document.getElementById("mi_custom");
    var accept     = document.documentElement.getButton("accept");

    accept.disabled        = this.mData.name == null;
    this.nodeName.value    = this.mData.name || "";
    this.nodeName.disabled = this.mData.name != null;
    this.nodeValue.value   = this.mData.value || "";
    this.menulist.disabled = !this.enableNamespaces();
    defaultNS.value        = this.mDoc.documentElement.namespaceURI;
    customNS.value         = this.mData.namespaceURI;
    this.menulist.value    = this.mData.namespaceURI || "";

    this.toggleNamespace();
  },

 /**
  * The function that is called on accept.  Sets data.
  */
  accept: function accept()
  {
    this.mData.name         = this.nodeName.value;
    this.mData.value        = this.nodeValue.value;
    this.mData.namespaceURI = this.namespace.value;
    this.mData.accepted     = true;
    return true;
  },

 /**
  * toggleNamespace toggles the namespace textbox based on the namespace menu.
  */
  toggleNamespace: function toggleNamespace()
  {
    dialog.namespace.disabled = dialog.menulist.selectedItem.id != "mi_custom";
    dialog.namespace.value    = dialog.menulist.value;
  },

 /**
  * enableNamespaces determines if the document accepts namespaces or not
  *
  * @return True if the document can have namespaced attributes, false
  *           otherwise.
  */
  enableNamespaces: function enableNamespaces()
  {
    return this.mDoc.contentType != "text/html";
  },

 /**
  * toggleAccept enables/disables the Accept button when there is/isn't an
  *   attribute name.
  */
  toggleAccept: function toggleAccept()
  {
    document.documentElement.getButton("accept").disabled = 
      dialog.nodeName.value == "";
  }
};
