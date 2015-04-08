Components.utils.import("resource://app/modules/editorHelper.jsm");

var gNode = null;
var gEditor = null;
var gLegend = null;

function Startup()
{
  gNode = window.arguments[0];
  gEditor = EditorUtils.getCurrentEditor();
  GetUIElements();

  InitDialog();
}

function ToggleLegend(aElt)
{
  gDialog.legendContent.disabled = !aElt.checked;
}


function onAccept()
{
  gEditor.beginTransaction();

  var doc = EditorUtils.getCurrentDocument();
  if (!gNode) {
    gNode = doc.createElement("fieldset");
    if (gDialog.insertLegendCheckbox.checked) {
      var legend =  doc.createElement("legend");
      legend.textContent = gDialog.legendContent.value;
      gNode.appendChild(legend);
    }
    gEditor.insertElementAtSelection(gNode, true);
  }
  else if (gLegend) {
    if (gDialog.insertLegendCheckbox.checked) {
      if (gLegend.textContent != gDialog.legendContent.value) {
        // update legend
        var legend =  doc.createElement("legend");
        legend.textContent = gDialog.legendContent.value;
        gEditor.insertNode(legend, gNode, 0);
        gEditor.deleteNode(gLegend);
        gLegend = legend;
      }
    }
    else {
      // remove legend
        gEditor.deleteNode(gLegend);
        gLegend = null;
    }
  }
  else if (gDialog.insertLegendCheckbox.checked) {
    var legend =  doc.createElement("legend");
    legend.textContent = gDialog.legendContent.value;
    gEditor.insertNode(legend, gNode, 0);
    gLegend = legend;
  }

  ApplyAttributes();

  gEditor.endTransaction();
}
