/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*****************************************************************************
* EvalExprDialog -------------------------------------------------------------
*   A dialog for entering javascript expression to evaluate and view in the JS
*   Object Viewer.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* REQUIRED IMPORTS:
* chrome://inspector/content/jsutil/xpcom/XPCU.js
*****************************************************************************/

var gViewer = window.arguments[0];
var gTarget = window.arguments[1];

/**
 * Executes the JavaScript expression entered by the user.
 */
function execute()
{
  var txf = document.getElementById("txfExprInput");
  var rad = document.getElementById("inspect-new-window");
  try {
    gViewer.doEvalExpr(txf.value, gTarget, rad.selected);
  }
  catch (ex) {
    // alert the user of an error in their expression, and don't close
    let svc = XPCU.getService("@mozilla.org/embedcomp/prompt-service;1",
                              "nsIPromptService");
    svc.alert(window, ex.name, ex.message);

    return false;
  }
  return true;
}
