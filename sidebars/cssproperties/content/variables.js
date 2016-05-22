Components.utils.import("resource://gre/modules/Services.jsm");

RegisterIniter(VariablesSectionIniter);

function VariablesSectionIniter(aElt, aRuleset)
{
  var treechildren = gDialog.variablesTree.querySelector("treechildren");
  if (treechildren)
    gDialog.variablesTree.removeChild(treechildren);

  var gcs = aElt.ownerDocument
                .defaultView
                .getComputedStyle(aElt, "");

  var variablesArray = [];
  for (var i = 0; i < gcs.length; i++) {
    var p = gcs.item(i);
    if (p.startsWith("--")) {
      variablesArray.push({
                            property: p.substr(2),
                            value: gcs.getPropertyValue(p)
                          });
    }
  }

  if (variablesArray.length) {
    for (var i = 0; i < variablesArray.length; i++) {

      var property   = variablesArray[i].property;
      var value      = variablesArray[i].value;

      var v = CssInspector.getCascadedValue(aRuleset, "--" + property);
      var fromabove = (value != v);

      var item = AddTreeItem(gDialog.variablesTree);
	    var cell1 = document.createElement("treecell");
      cell1.setAttribute("label", fromabove ? property.toUpperCase() : property);
	    var cell2 = document.createElement("treecell");
	    cell2.setAttribute("label", value);
	    item.firstChild.appendChild(cell1);
	    item.firstChild.appendChild(cell2);
    }
  }
}

var gVariableEditing = -1;
var gVariableEditingColumn = null;
var gVariableFormerProperty = null;

function onVariablesTreeModified(aEvent)
{
  var target = aEvent.target;
  if (target != gDialog.variablesTree) {
    return;
  }

  var attrChange = aEvent.attrChange;
  var attrName = aEvent.attrName;
  var newValue = aEvent.newValue;

  var stylesToApply = [];

  if (attrName == "editing") {
    if (attrChange == 2) { // start editing
      var tree = gDialog.variablesTree;
      var contentView = tree.contentView;
      var view = tree.view;
      gVariableEditing = view.selection.currentIndex;
      gVariableEditingColumn = tree._editingColumn;
      if (gVariableEditingColumn == gDialog.variablesTree.columns[0])
        gVariableFormerProperty = gDialog.variablesTree
                                         .view
                                         .getCellText(gVariableEditing, gDialog.variablesTree.columns[0])
                                         .toLowerCase();
    }
    else if (attrChange == 3 && gVariableEditing >= 0) { // end editing
      var aName = gDialog.variablesTree.view.getCellText(gVariableEditing, gDialog.variablesTree.columns[0]);
      while (aName.startsWith("-"))
        aName = aName.substr(1);
      var aValue = gDialog.variablesTree.view.getCellText(gVariableEditing, gDialog.variablesTree.columns[1]);
      if (gVariableEditingColumn == gDialog.variablesTree.columns[1]) {
        if (gVariableFormerProperty && aName.toLowerCase() != gVariableFormerProperty.toLowerCase()) {
          stylesToApply.push( { property: "--" + gVariableFormerProperty, value: ""});
          gVariableFormerProperty = null;
        }
        stylesToApply.push( { property: "--" + aName, value: aValue});
        ApplyStyles(stylesToApply);
        gVariableEditing = -1;
        gVariableEditingColumn = null;
      }
      else if (gVariableEditingColumn == gDialog.variablesTree.columns[0]) {
        gVariableEditingColumn = gDialog.variablesTree.columns[1];
        setTimeout(function(){gDialog.variablesTree.startEditing(gVariableEditing, gDialog.variablesTree.columns[1])}, 100);
      }
    }
  }
}

function UpdateVariableButtons()
{
  var tree = gDialog.variablesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusVariableButton.disabled = true;
    gDialog.ConfigVariableButton.disabled = true;
    return;
  }

  var index = view.selection.currentIndex;
  gDialog.MinusVariableButton.disabled = false;
  gDialog.ConfigVariableButton.disabled = false;
}

function DeleteVariable()
{
  var tree = gDialog.variablesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var stylesToApply = [];
  for (var i = 0; i < view.selection.getRangeCount(); i++) {
    var min = {value: -1};
    var max = {value: -1};
    view.selection.getRangeAt(i, min, max);
    for (var j = min.value; j<= max.value; j++) {
      var item = gDialog.variablesTree.contentView.getItemAtIndex(j);
      var property = gDialog.variablesTree.view.getCellText(j, gDialog.variablesTree.columns[0]);
      stylesToApply.push( { property: "--" + property, value: ""});
    }
  }

  ApplyStyles(stylesToApply);
}

function AddVariable()
{
  var treeitem = AddTreeItem(gDialog.variablesTree);
  var treecellName = document.createElement("treecell");
  var treecellValue = document.createElement("treecell");
  treecellName.setAttribute("label",  "");
  treecellValue.setAttribute("label", "");
  treeitem.firstChild.appendChild(treecellName);
  treeitem.firstChild.appendChild(treecellValue);
  var index = gDialog.variablesTree.contentView.getIndexOfItem(treeitem);
  gDialog.variablesTree.view.selection.select(index);
  gDialog.variablesTree.startEditing(index, gDialog.variablesTree.columns[0]);
}

function ModifyVariable()
{
  var tree = gDialog.variablesTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  gDialog.variablesTree.startEditing(index, gDialog.variablesTree.columns[1]);
}
