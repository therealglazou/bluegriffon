RegisterIniter(ImagesSectionIniter);

function ImagesSectionIniter(aElt, aRuleset)
{
  var d = CssInspector.getCascadedValue(aRuleset, "display");
  gDialog.displayMenulist.value = d;

  var v = CssInspector.getCascadedValue(aRuleset, "image-orientation");
  CheckToggle(gDialog.fromImageImageOrientationButton,   v == "from-image");
  if (v == "from-image") {
    gDialog.imageOrientationMenulist.value = "";
    gDialog.flipImageOrientationCheckbox.checked = false;
  }
  else {
    gDialog.flipImageOrientationCheckbox.checked = (v.indexOf("flip") != -1);
    v = v.replace(/flip/g, "").trim();
    gDialog.imageOrientationMenulist.value = v;
  }
}

function ApplyImageOrientationAngle(aElement)
{
  if (aElement.id == "fromImageImageOrientationButton") {
    if (aElement.checked) {
      gDialog.imageOrientationMenulist.value = "";
      gDialog.flipImageOrientationCheckbox.checked = false;
      v = "from-image";
    }
    else {
      v = gDialog.imageOrientationMenulist.value;
      v += (v ? " " : "");
      v += (gDialog.flipImageOrientationCheckbox.checked ? "flip" : "");
    }
  }
  else {
    gDialog.fromImageImageOrientationButton.checked = false;
    v = gDialog.imageOrientationMenulist.value;
    v += (v ? " " : "");
    v += (gDialog.flipImageOrientationCheckbox.checked ? "flip" : "");
  }
  ApplyStyles( [ {
            property: "image-orientation",
            value: v
          } ]);
}
