/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function inspectDOMDocument(aDocument, aModal)
{
  window.openDialog("chrome://inspector/content/", "_blank", 
              "chrome,all,dialog=no"+(aModal?",modal":""), aDocument);
}

function inspectDOMNode(aNode, aModal)
{
  window.openDialog("chrome://inspector/content/", "_blank", 
              "chrome,all,dialog=no"+(aModal?",modal":""), aNode);
}

function inspectObject(aObject, aModal)
{
  window.openDialog("chrome://inspector/content/object.xul", "_blank", 
              "chrome,all,dialog=no"+(aModal?",modal":""), aObject);
}
