RegisterIniter(AllSectionIniter);

function AddTreeItem(aElt)
{
  var treechildren = aElt.querySelector("treechildren")
  if (!treechildren) {
    treechildren = document.createElement("treechildren");
    aElt.appendChild(treechildren);
  }
  var treeitem = document.createElement("treeitem");
  var treerow = document.createElement("treerow");
  treeitem.appendChild(treerow);
  treechildren.appendChild(treeitem);
  return treeitem;
}

function AllSectionIniter(aElt, aRuleset)
{
  var treechildren = gDialog.allTree.querySelector("treechildren");
  if (treechildren)
    gDialog.allTree.removeChild(treechildren);

  if (aRuleset && aRuleset.length) {
    var properties = [];
    for (var i = 0; i < aRuleset.length; i++) {
      var rule = aRuleset[i].rule;
      for (var j = 0; j < rule.style.length; j++) {
        var property   = rule.style.item(j);
        if (properties.indexOf(property) == -1)
          properties.push(property);
      }
    }

    for (var i = 0; i < properties.length; i++) {
      var property   = properties[i];
      var value      = CssInspector.getCascadedValue(aRuleset, property);

      var item = AddTreeItem(gDialog.allTree);
	    var cell1 = document.createElement("treecell");
	    cell1.setAttribute("label", property);
	    var cell2 = document.createElement("treecell");
	    cell2.setAttribute("label", value);
	    item.firstChild.appendChild(cell1);
	    item.firstChild.appendChild(cell2);
    }
  }
}

var gEditing = -1;
var gEditingColumn = null;
var gFormerProperty = null;

function onAllTreeModified(aEvent)
{
  var target = aEvent.target;
  if (target != gDialog.allTree) {
    return;
  }

  var attrChange = aEvent.attrChange;
  var attrName = aEvent.attrName;
  var newValue = aEvent.newValue;

  var stylesToApply = [];

  if (attrName == "editing") {
    if (attrChange == 2) { // start editing
      var tree = gDialog.allTree;
      var contentView = tree.contentView;
      var view = tree.view;
      gEditing = view.selection.currentIndex;
      gEditingColumn = tree._editingColumn;
      if (gEditingColumn == gDialog.allTree.columns[0])
        gFormerProperty = gDialog.allTree.view.getCellText(gEditing, gDialog.allTree.columns[0]);
    }
    else if (attrChange == 3 && gEditing >= 0) { // end editing
      var aName     = gDialog.allTree.view.getCellText(gEditing, gDialog.allTree.columns[0]);
      var aValue    = gDialog.allTree.view.getCellText(gEditing, gDialog.allTree.columns[1]);
      if (gEditingColumn == gDialog.allTree.columns[1]) {
        if (gFormerProperty && aName.toLowerCase() != gFormerProperty.toLowerCase()) {
          stylesToApply.push( { property: gFormerProperty, value: ""});
          gFormerProperty = null;
        }
        stylesToApply.push( { property: aName, value: aValue});
        ApplyStyles(stylesToApply);
        gEditing = -1;
        gEditingColumn = null;
      }
      else if (gEditingColumn == gDialog.allTree.columns[0]) {
        gEditingColumn = gDialog.allTree.columns[1];
        setTimeout(function(){gDialog.allTree.startEditing(gEditing, gDialog.allTree.columns[1])}, 100);
      }
    }
  }
}

function UpdateAllButtons()
{
  var tree = gDialog.allTree;
  var contentView = tree.contentView;
  var view = tree.view;
  if (!view || !view.selection || !view.selection.count) { // no selection...
    gDialog.MinusCSSButton.disabled = true;
    gDialog.ConfigCSSButton.disabled = true;
    return;
  }

  var index = view.selection.currentIndex;
  gDialog.MinusCSSButton.disabled = false;
  gDialog.ConfigCSSButton.disabled = false;
}

function DeleteCSS()
{
  var tree = gDialog.allTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var stylesToApply = [];
  for (var i = 0; i < view.selection.getRangeCount(); i++) {
    var min = {value: -1};
    var max = {value: -1};
    view.selection.getRangeAt(i, min, max);
    for (var j = min.value; j<= max.value; j++) {
      var item = gDialog.allTree.contentView.getItemAtIndex(j);
      var property = gDialog.allTree.view.getCellText(j, gDialog.allTree.columns[0]);
      stylesToApply.push( { property: property, value: ""});
    }
  }

  ApplyStyles(stylesToApply);
}

function AddCSS()
{
  var treeitem = AddTreeItem(gDialog.allTree);
  var treecellName = document.createElement("treecell");
  var treecellValue = document.createElement("treecell");
  treecellName.setAttribute("label",  "");
  treecellValue.setAttribute("label", "");
  treeitem.firstChild.appendChild(treecellName);
  treeitem.firstChild.appendChild(treecellValue);
  var index = gDialog.allTree.contentView.getIndexOfItem(treeitem);
  gDialog.allTree.view.selection.select(index);
  gDialog.allTree.startEditing(index, gDialog.allTree.columns[0]);
}

function ModifyCSS()
{
  var tree = gDialog.allTree;
  var contentView = tree.contentView;
  var view = tree.view;
  var index = view.selection.currentIndex;
  gDialog.allTree.startEditing(index, gDialog.allTree.columns[1]);
}
