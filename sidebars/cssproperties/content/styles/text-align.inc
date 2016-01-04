/* TEXT-ALIGN */

#lefttextalignButton {
  list-style-image: url("chrome://bluegriffon/skin/formatToolbar/align-left.png");
}

#righttextalignButton {
  list-style-image: url("chrome://bluegriffon/skin/formatToolbar/align-right.png");
}

#centertextalignButton {
  list-style-image: url("chrome://bluegriffon/skin/formatToolbar/align-center.png");
}

#justifytextalignButton {
  list-style-image: url("chrome://bluegriffon/skin/formatToolbar/align-justify.png");
}

#lefttextalignButton .toolbarbutton-text,
#righttextalignButton .toolbarbutton-text,
#centertextalignButton .toolbarbutton-text,
#justifytextalignButton .toolbarbutton-text {
  display: none;
}

#lefttextalignButton:not([checked]) .toolbarbutton-icon,
#righttextalignButton:not([checked]) .toolbarbutton-icon,
#centertextalignButton:not([checked]) .toolbarbutton-icon,
#justifytextalignButton:not([checked]) .toolbarbutton-icon {
  filter: grayscale(100%) contrast(600%);
}