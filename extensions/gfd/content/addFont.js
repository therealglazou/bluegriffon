const kSUBSET_IDS = ["latinSubsetCheckbox", "greekSubsetCheckbox", "cyrillicSubsetCheckbox", "khmerSubsetCheckbox"];

var gRv = null;
var gFontsList = null;

function Startup()
{
  GetUIElements();

  gRv = window.arguments[0];

  function compare(a, b) {
    if (a.name > b.name)
      return 1;
    if (a.name < b.name)
      return -1;
    return 0;
  }
  gFontsList = kDIRECTORY.sort(compare);

  for (var i = 0; i < gFontsList.length; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", gFontsList[i].name);
    item.setAttribute("value", gFontsList[i].name);
    gDialog.fontFamilyMenupopup.appendChild(item);
  }

  gFontsList = {};
  for (var i = 0; i < kDIRECTORY.length; i++)
  {
    var f = kDIRECTORY[i];
    gFontsList[f.name] = {
                           subsets: f.subsets,
                           regular: f.regular,
                           bold: f.bold,
                           italic: f.italic,
                           bolditalic: f.bolditalic,
                           extra: f.extra
                         };
  }
  document.documentElement.getButton("accept").setAttribute("disabled", "true");
  //window.sizeToContent();
}

function onFontSelected(aElt)
{
  if (!aElt.value)
    return;
  document.documentElement.getButton("accept").removeAttribute("disabled");

  var family = aElt.value;

  // subsets
  var subsets = gFontsList[family].subsets.split(",");
  gDialog.latinSubsetCheckbox.checked = false;
  gDialog.greekSubsetCheckbox.checked = false;
  gDialog.cyrillicSubsetCheckbox.checked = false;
  gDialog.khmerSubsetCheckbox.checked = false;

  gDialog.latinSubsetCheckbox.disabled =    (subsets.indexOf("latin") == -1);
  gDialog.cyrillicSubsetCheckbox.disabled = (subsets.indexOf("cyrillic") == -1);
  gDialog.greekSubsetCheckbox.disabled =    (subsets.indexOf("greek") == -1);
  gDialog.khmerSubsetCheckbox.disabled =    (subsets.indexOf("khmer") == -1);

  // variants
  gDialog.regularVariant.checked = false;
  gDialog.italicVariant.checked = false;
  gDialog.boldVariant.checked = false;
  gDialog.bolditalicVariant.checked = false;

  gDialog.regularVariant.disabled = !gFontsList[family].regular;
  gDialog.italicVariant.disabled = !gFontsList[family].italic;
  gDialog.boldVariant.disabled = !gFontsList[family].bold;
  gDialog.bolditalicVariant.disabled = !gFontsList[family].bolditalic;

  // clear existing extras
  var row = gDialog.boldVariant.parentNode.nextSibling;
  while (row) {
    var tmp = row.nextSibling;
    gDialog.variantRows.removeChild(row);
    row = tmp;
  }

  // add current extras
  var extras = gFontsList[family].extra ? gFontsList[family].extra.split(",") : [];
  var row = null;
  for (var i = 0; i < extras.length; i++) {
    if (!row) {
      row = document.createElement("row");
      row.setAttribute("align", "center");
      gDialog.variantRows.appendChild(row);
    }
    var checkbox = document.createElement("checkbox");
    checkbox.setAttribute("label", extras[i]);
    checkbox.setAttribute("value", extras[i]);
    row.appendChild(checkbox);
    if ((i/2) != Math.floor(i/2))
      row = null;
  }

  // the preview...
  /*
  var doc = gDialog.previewIframe.contentDocument;
  doc.getElementById("preview").textContent = family;
  doc.getElementById("preview").style.fontFamily = family;
  var link = doc.querySelector("link");
  if (link)
    link.parentNode.removeChild(link);
  link = doc.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  link.setAttribute("href", kLOADER_URL + family.replace( / /g, "+"));
  doc.querySelector("head").appendChild(link)
  */
  gDialog.previewIframe.contentWindow.BGLoadFont(family);
  window.sizeToContent();
}

function onAccept()
{
  var family = gDialog.fontFamilyMenulist.value;
  if (family) {
    gRv.value = true;

    gRv.family = family;

    var subsetsArray = [];
    for (var i = 0; i < kSUBSET_IDS.length; i++) {
      if (gDialog[kSUBSET_IDS[i]].checked)
        subsetsArray.push(gDialog[kSUBSET_IDS[i]].getAttribute("value"));
    }
    var subsets =  subsetsArray.length ? subsetsArray.join(",") : "";

    var variantsArray = [];
    var variantsCheckboxes = gDialog.variantRows.querySelectorAll("checkbox");
    for (var i = 0; i < variantsCheckboxes.length; i++) {
      if (variantsCheckboxes[i].checked)
        variantsArray.push(variantsCheckboxes[i].getAttribute("value"));
    }

    gRv.subsets = subsets;
    gRv.variants = variantsArray.length ? variantsArray.join(",") : "";
  }

  return true;
}
