/* WRITING-MODE */

#horizontaltbwritingmodeButton {
  list-style-image: url("chrome://cssproperties/skin/general/horizontal-tb.png");
}

#verticallrwritingmodeButton {
  list-style-image: url("chrome://cssproperties/skin/general/vertical-lr.png");
}

#verticalrlwritingmodeButton {
  list-style-image: url("chrome://cssproperties/skin/general/vertical-rl.png");
}

#horizontaltbwritingmodeButton .toolbarbutton-text,
#verticallrwritingmodeButton .toolbarbutton-text,
#verticalrlwritingmodeButton .toolbarbutton-text {
  display: none;
}

#horizontaltbwritingmodeButton:not([checked]) .toolbarbutton-icon,
#verticallrwritingmodeButton:not([checked]) .toolbarbutton-icon,
#verticalrlwritingmodeButton:not([checked]) .toolbarbutton-icon {
  filter: grayscale(100%) contrast(600%);
}
