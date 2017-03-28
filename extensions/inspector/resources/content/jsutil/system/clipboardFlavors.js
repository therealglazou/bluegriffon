/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* Clipboard Flavors ----------------------------------------------------------
*   Flavors for copying inspected data to the clipboard.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
* chrome://inspector/content/utils.js
*****************************************************************************/

/**
 * Represents a CSS property.
 * @param aProperty
 *        the name of the property
 * @param aValue
 *        the value of the property
 * @param aImportant
 *        boolean indicating whether this is !important
 */
function CSSProperty(aProperty, aValue, aImportant)
{
  this.flavor = "inspector/css-property";
  this.delimiter = "\n";
  this.property = aProperty;
  this.value = aValue;
  this.important = aImportant == true;
}

/**
 * Returns a usable CSS string for the CSSProperty.
 * @return a string in the form "property: value;"
 */
CSSProperty.prototype.toString = function CSSProperty_ToString()
{
  return this.property + ": " + this.value + (this.important ?
                                                " !important" :
                                                "") + ";";
}

/**
 * Represents a DOM attribute.
 * @param aNode
 *        the attribute node
 */
function DOMAttribute(aNode)
{
  this.flavor = "inspector/dom-attribute";
  this.node = aNode.cloneNode(false);
  this.delimiter = " ";
}

/**
 * Returns a string representing an attribute name/value pair
 * @return a string in the form of 'name="value"'
 */
DOMAttribute.prototype.toString = function DOMA_ToString()
{
  return this.node.nodeName + '="' +
         InsUtil.unicodeToEntity(this.node.nodeValue) + '"';
};
