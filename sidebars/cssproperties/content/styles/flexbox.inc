/* FLEXBOX */

#startBoxAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexStart.png");
}

#centerBoxAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexCenter.png");
}

#endBoxAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexEnd.png");
}

#baselineBoxAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexBaseline.png");
}

#stretchBoxAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexStretch.png");
}


#startSelfAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexStart.png");
}

#centerSelfAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexCenter.png");
}

#endSelfAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexEnd.png");
}

#baselineSelfAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexBaseline.png");
}

#stretchSelfAlignButton {
  list-style-image: url("chrome://cssproperties/skin/flexbox/alignItemsFlexStretch.png");
}


#startBoxAlignButton .toolbarbutton-text,
#centerBoxAlignButton .toolbarbutton-text,
#endBoxAlignButton .toolbarbutton-text,
#baselineBoxAlignButton .toolbarbutton-text,
#stretchBoxAlignButton .toolbarbutton-text,
#startSelfAlignButton .toolbarbutton-text,
#centerSelfAlignButton .toolbarbutton-text,
#endSelfAlignButton .toolbarbutton-text,
#baselineSelfAlignButton .toolbarbutton-text,
#stretchSelfAlignButton .toolbarbutton-text {
  display: none;
}

#startBoxAlignButton:not([checked]) .toolbarbutton-icon,
#centerBoxAlignButton:not([checked]) .toolbarbutton-icon,
#endBoxAlignButton:not([checked]) .toolbarbutton-icon,
#baselineBoxAlignButton:not([checked]) .toolbarbutton-icon,
#stretchBoxAlignButton:not([checked]) .toolbarbutton-icon,
#startSelfAlignButton:not([checked]) .toolbarbutton-icon,
#centerSelfAlignButton:not([checked]) .toolbarbutton-icon,
#endSelfAlignButton:not([checked]) .toolbarbutton-icon,
#baselineSelfAlignButton:not([checked]) .toolbarbutton-icon,
#stretchSelfAlignButton:not([checked]) .toolbarbutton-icon {
  filter: grayscale(100%) contrast(600%);
}
