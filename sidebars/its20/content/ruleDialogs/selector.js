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
 * The Original Code is ITS 2.0 Panel for BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SAS.
 * Portions created by the Initial Developer are Copyright (C) 2013
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
 *     on behalf of DFKI
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

function InitSelectorGroupbox(aQueryLanguage, aRule, aDoc)
{
  switch (aQueryLanguage) {
    case "css":  
      gDialog.cssSelectorLabel.hidden = false;
      gDialog.xpathSelectorLabel.hidden = true;
      gDialog.prefixHbox.setAttribute("hidden", "true");
      break;
    case "xpath":
      gDialog.cssSelectorLabel.hidden = true;
      gDialog.xpathSelectorLabel.hidden = false;
      gDialog.prefixLabel.setAttribute("value", GetPrefixForHTMLNamespace(aRule ? aRule : aDoc.documentElement) || "html");
      break;

    default: break; // should never happen
  }
  onSelectorPresent();
}

function MagicButton(node, aQueryLanguage, doc)
{
  var selector = "";

  switch (aQueryLanguage) {
    case "css":
      while (node && node.localName.toLowerCase() != "html") {
        if (node.id) {
          selector = "#" + node.id + selector;
          break;
        }
        else {
          var count = 0;
          var sameNameCountBefore = 0, sameNameCountAfter = 0;
          var sibling = node.previousElementSibling;
          while (sibling) {
            count++;
            if (sibling.localName == node.localName
                && sibling.namespaceURI == node.namespaceURI)
              sameNameCountBefore++;
            sibling = sibling.previousElementSibling;
          }
          var sibling = node.nextElementSibling;
          while (sibling) {
            if (sibling.localName == node.localName
                && sibling.namespaceURI == node.namespaceURI)
              sameNameCountAfter++;
            sibling = sibling.nextElementSibling;
          }

          selector = node.nodeName.toLowerCase()
                     + (sameNameCountBefore + sameNameCountAfter
                        ? ":nth-child(" + (count+1) + ")"
                        : "")
                     + selector;
        }
  
        node = node.parentNode;
        if (node && node.localName.toLowerCase() != "html")
          selector = " > " + selector;
      }
      break;
    case "xpath":
	    {
        var prefix = GetPrefixForHTMLNamespace(node ? node : doc.documentElement);
        if (!prefix) {
          prefix = "html";
          doc.documentElement.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:html", "http://www.w3.org/1999/xhtml");
        }
        while (node && node.nodeType == Node.ELEMENT_NODE) {
          if (node.id) {
            selector = prefix + ":" + node.nodeName.toLowerCase()
                       + "[@id='" + node.id + "']"
                       + selector;
            break;
          }
          else {
            var sameNameCountBefore = 0, sameNameCountAfter = 0;
            var sibling = node.previousElementSibling;
            while (sibling) {
              if (sibling.localName == node.localName
                  && sibling.namespaceURI == node.namespaceURI)
                sameNameCountBefore++;
              sibling = sibling.previousElementSibling;
            }
            var sibling = node.nextElementSibling;
            while (sibling) {
              if (sibling.localName == node.localName
                  && sibling.namespaceURI == node.namespaceURI)
                sameNameCountAfter++;
              sibling = sibling.nextElementSibling;
            }
  
            selector = prefix + ":" + node.nodeName.toLowerCase()
                       + (sameNameCountBefore + sameNameCountAfter
                          ? "[" + (sameNameCountBefore+1) + "]"
                          : "")
                       + selector;
          }
    
          node = node.parentNode;
          if (node
              && node.nodeType == Node.ELEMENT_NODE)
            selector = "/" + selector;
        }
        selector = "//" + selector;
	    }
      break;
    default: break;
  }
  gDialog.selectorTextbox.value = selector;
  onSelectorPresent();
}

function GetPrefixForHTMLNamespace(aElt)
{
  var rv = "";
  for (var i = 0; i < aElt.attributes.length; i++) {
    var a = aElt.attributes[i];
    if (a.namespaceURI == "http://www.w3.org/2000/xmlns/"
        && a.nodeValue == "http://www.w3.org/1999/xhtml")
      return a.localName;
  }
  if (!rv && aElt.parentNode.nodeType == Node.ELEMENT_NODE)
    rv = GetPrefixForHTMLNamespace(aElt.parentNode)
  return rv; 
}

function onSelectorPresent()
{
  if (gDialog.selectorTextbox.value)
    document.documentElement.getButton("accept").removeAttribute("disabled");
  else
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
}
