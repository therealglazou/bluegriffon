/* FLOAT */

#floatLeftButton {
  list-style-image: url("chrome://cssproperties/skin/position/left-float.png");
}

#floatNoneButton {
  list-style-image: url("chrome://cssproperties/skin/position/none-float.png");
}

#floatRightButton {
  list-style-image: url("chrome://cssproperties/skin/position/right-float.png");
}

#floatLeftButton .toolbarbutton-text,
#floatNoneButton .toolbarbutton-text,
#floatRightButton .toolbarbutton-text {
  display: none;
}

#floatLeftButton:not([checked]) .toolbarbutton-icon,
#floatNoneButton:not([checked]) .toolbarbutton-icon,
#floatRightButton:not([checked]) .toolbarbutton-icon {
  filter: grayscale(100%) contrast(600%);
}
