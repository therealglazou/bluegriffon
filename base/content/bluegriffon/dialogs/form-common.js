var gNameAndIds = [];

function InitDialog()
{
  var hasNameAttr = gDialog.mainGrid.querySelector("row[attribute='name']");
  if (hasNameAttr) {
    hasNameAttr.lastElementChild.addEventListener("input", CheckNameAttribute, false);

    var eltsWithId = EditorUtils.getCurrentDocument().querySelectorAll("*[id]");
    for (var i = 0; i < eltsWithId.length; i++)
      gNameAndIds.push(eltsWithId[i].id);

    var node = EditorUtils.getSelectionContainer().node;
    while (node && node.nodeName.toLowerCase() != "form")
      node = node.parentNode;
  
    if (node) {
      var eltsWithName = node.querySelectorAll("button[name],fieldset[name],input[name],keygen[name],output[name],select[name],textarea[name]");
      for (var i = 0; i < eltsWithName.length; i++)
        gNameAndIds.push(eltsWithName[i].getAttribute("name"));
    }
  }

  if (!gNode) {
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
    return;
  }

  var rows = gDialog.mainGrid.querySelectorAll("row");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var attr = row.getAttribute("attribute");
    var child = row.firstElementChild.nextElementSibling;
    switch (child.nodeName.toLowerCase()) {
      case "checkbox":
        child.checked = gNode.hasAttribute(attr);
        break;
      case "textbox":
      case "menulist":
        child.value = gNode.hasAttribute(attr) ?
                          gNode.getAttribute(attr) :
                          "";
        break;
      case "hbox":
        {
          var c = child.firstElementChild;
          var value = gNode.hasAttribute(attr) ?
                          gNode.getAttribute(attr) :
                          "";
          while (c) {
            if (c.getAttribute("value") == value)
              c.setAttribute("checked", "true");
            else
              c.removeAttribute("checked");
            c = c.nextElementSibling;
          }
        }
        break;
      default: break; // should never happen
    }
  }
}

function ApplyAttributes()
{
  var rows = gDialog.mainGrid.querySelectorAll("row");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var attr = row.getAttribute("attribute");
    if (!row.collapsed) {
      var child = row.firstElementChild.nextElementSibling;
      switch (child.nodeName.toLowerCase()) {
        case "checkbox":
          if (child.checked)
            gEditor.setAttribute(gNode, attr, attr);
          else
            gEditor.removeAttribute(gNode, attr);
          break;
        case "textbox":
        case "menulist":
          if (child.value)
            gEditor.setAttribute(gNode, attr, child.value);
          else
            gEditor.removeAttribute(gNode, attr);
          break;
        case "hbox":
          {
            var c = child.firstElementChild;
            while (c) {
              if (c.hasAttribute("checked")) {
                gEditor.setAttribute(gNode, attr, c.getAttribute("value"));
                break;
              }
              c = c.nextElementSibling;
            }
            if (!c)
              gEditor.removeAttribute(gNode, attr);
          }
          break;
        default: break; // should never happen
      }
    }
  }
}

function ToggleMultibuttons(aElt)
{
  if (!aElt.checked)
    return;
  var buttons = aElt.parentNode.querySelectorAll(".multibutton");
  for (var i = 0; i < buttons.length; i++) {
    var b = buttons[i];
    if (b != aElt)
      b.removeAttribute("checked");
  }
}

function CheckNameAttribute(aEvent)
{
  var target = aEvent.target;
  if (target.value && gNameAndIds.indexOf(target.value) == -1)
    document.documentElement.getButton("accept").removeAttribute("disabled");
  else if (!gNode || target.value != gNode.getAttribute("name"))
    document.documentElement.getButton("accept").setAttribute("disabled", "true");
  else
    document.documentElement.getButton("accept").removeAttribute("disabled");
}
