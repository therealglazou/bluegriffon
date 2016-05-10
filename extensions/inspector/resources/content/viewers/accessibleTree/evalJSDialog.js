/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
var gAcc = window.arguments[0];
var gTreeView = window.arguments[1];

var gInputArea = null;
var gOutputArea = null;

var Cc = Components.classes;
var Ci = Components.interfaces;

function load()
{
  gInputArea = document.getElementById("JSInputArea");
  gOutputArea = document.getElementById("JSOutputArea");
}

function closeDialog()
{
  gTreeView.clearSearch();
}
 
function execute()
{
  if (!gAcc)
    return;

  for (var idx = 0; idx < gAccInterfaces.length; idx++) {
    if (gAcc instanceof gAccInterfaces[idx])
      gAcc.QueryInterface(gAccInterfaces[idx]);
  }

  gOutputArea.value = "";

  var expr = gInputArea.value;
  try {
    var f = Function("accessible", "tree", expr);
    var result = f(gAcc, gTreeView);
  } catch (ex) {
      output(ex);
  }
}

var gAccInterfaces =
[
  Ci.nsIAccessible,
  Ci.nsIAccessibleDocument,
  Ci.nsIAccessibleEditableText,
  Ci.nsIAccessibleHyperLink,
  Ci.nsIAccessibleHyperText,
  Ci.nsIAccessibleImage,
  Ci.nsIAccessibleSelectable,
  Ci.nsIAccessibleTable,
  Ci.nsIAccessibleTableCell,
  Ci.nsIAccessibleText,
  Ci.nsIAccessibleValue
];

// Used for compatibility with Gecko versions prior to Gecko13.
if ("nsIAccessNode" in Ci)
  gAccInterfaces.push(Ci.nsIAccessNode);

function output(aValue)
{
  gOutputArea.value += aValue;
}

function outputTextAttrs(aAccessible, aOffset)
{
  if (aAccessible instanceof Ci.nsIAccessibleText) {
    var startOffsetObj = {}, endOffsetObj = {};
    var attrs = aAccessible.getTextAttributes(false, aOffset,
                                              startOffsetObj, endOffsetObj);
    if (attrs) {
      var str = "Start offset: " + startOffsetObj.value;
      str += ", end offset: " + endOffsetObj.value + "\nText attributes:\n";

      var enumerator = attrs.enumerate();
      while (enumerator.hasMoreElements()) {
        var prop = enumerator.getNext().QueryInterface(Ci.nsIPropertyElement);
        str += "\t" + prop.key + ": " + prop.value + ";\n";
      }

      output(str);
    }
  }
}
