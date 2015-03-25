RegisterIniter(TransitionsSectionIniter);

function TransitionsSectionIniter(aElt, aRuleset)
{
  deleteAllChildren(gDialog.transitionsRichlistbox);
  var mtp = CssInspector.getCascadedValue(aRuleset, "-moz-transition-property");
  var mtpArray = [];
  if (mtp) {
    mtpArray = mtp.split(",");
    for (var i = 0; i < mtpArray.length; i++) {
      var item = document.createElement("richlistitem");
      var v = mtpArray[i].trim();
      switch (v) {
        case "all":
        case "none":
          item.className = v + "Transition";
          gDialog.transitionsRichlistbox.appendChild(item)
          break;
        default:
          item.className = "propertyTransition";
          gDialog.transitionsRichlistbox.appendChild(item);
          item.propertyValue = v;
          break;
      }
    }
  }
  var mtde = CssInspector.getCascadedValue(aRuleset, "-moz-transition-delay") || "0s";
  var mtdeArray = mtde.split(",");
  while (mtdeArray.length < mtpArray.length)
    mtdeArray = mtdeArray.concat(mtdeArray);
  for (var i = 0 ; i < mtpArray.length; i++) {
    var item = gDialog.transitionsRichlistbox.getItemAtIndex(i);
    item.delayValue = parseFloat(mtdeArray[i]);
  }

  var mtdu = CssInspector.getCascadedValue(aRuleset, "-moz-transition-duration") || "0s";
  var mtduArray = mtdu.split(",");
  while (mtduArray.length < mtpArray.length)
    mtduArray = mtduArray.concat(mtduArray);
  for (var i = 0 ; i < mtpArray.length; i++) {
    var item = gDialog.transitionsRichlistbox.getItemAtIndex(i);
    item.durationValue = parseFloat(mtduArray[i]);
  }

  var mttf = CssInspector.getCascadedValue(aRuleset, "-moz-transition-timing-function") || "ease";
  var mttfArray = mttf.match( /linear|ease-in-out|ease-in|ease-out|ease|cubic-bezier\([^\)]*\)/g ) || [];
  while (mttfArray.length < mtpArray.length)
    mttfArray = mttfArray.concat(mttfArray);
  for (var i = 0 ; i < mtpArray.length; i++) {
    var item = gDialog.transitionsRichlistbox.getItemAtIndex(i);
    item.functionValue = mttfArray[i];
  }

  if (!(aElt instanceof Components.interfaces.nsIDOMCSSStyleSheet) ||
      (aElt.parentStyleSheet &&
       (!aElt.parentStyleSheet.href ||
        aElt.parentStyleSheet.href.substr(0, 7) == "file://")))
    UpdateTransitionUI();
}

function OnTransitionSelect(aElt)
{
  var item = aElt.selectedItem;
  SetEnabledElement(gDialog.removeTransitionButton, (item != null));    
}

function AddTransition(aEvent)
{
  var type = aEvent.originalTarget.value;
  var item = document.createElement("richlistitem");
  item.className = type + "Transition";
  gDialog.transitionsRichlistbox.appendChild(item);
  UpdateTransitionUI();
  if (type != "property")
    ReapplyTransitions();
}

function DeleteTransition()
{
  var item = gDialog.transitionsRichlistbox.selectedItem;
  if (!item) return; // sanity check
  item.parentNode.removeChild(item);
  UpdateTransitionUI();
  ReapplyTransitions();
}

function ReapplyTransitions()
{
  var items = gDialog.transitionsRichlistbox.querySelectorAll("richlistitem");
  var properties = [];
  var durations  = [];
  var functions  = [];
  var delays     = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.propertyValue) {
      properties.push( item.propertyValue );
      durations.push( item.durationValue + "s" );
      functions.push( item.functionValue );
      delays.push( item.delayValue + "s");
    }
    else
      return;
  }
  ApplyStyles( [
                 {
                   property: "-moz-transition-property",
                   value: properties.join(", ")
                 },
                 {
                   property: "-moz-transition-duration",
                   value: durations.join(", ")
                 },
                 {
                   property: "-moz-transition-timing-function",
                   value: functions.join(", ")
                 },
                 {
                   property: "-moz-transition-delay",
                   value: delays.join(", ")
                 }
               ] );
}

function UpdateTransitionUI()
{
  var isEmpty = (gDialog.transitionsRichlistbox.itemCount == 0);
  var isNoneOrAll = !isEmpty &&
                    (gDialog.transitionsRichlistbox.getItemAtIndex(0).className == "noneTransition" ||
                     gDialog.transitionsRichlistbox.getItemAtIndex(0).className == "allTransition");
  SetEnabledElement(gDialog.addTransitionButton, !isNoneOrAll);
  SetEnabledElement(gDialog.removeTransitionButton, false);
  
  SetEnabledElement(gDialog.onePropertyTransitionMenuitem, isEmpty || !isNoneOrAll);
  SetEnabledElement(gDialog.noneTransitionMenuitem, isEmpty);
  SetEnabledElement(gDialog.allTransitionMenuitem, isEmpty);
}

function OpenPanelIfBezier(e)
{
  var v = e.value.trim();
  gDialog.bezierPanel.openPopupAtScreen(e.boxObject.screenX,
                                        e.boxObject.screenY,
                                        false);
  Bezier.initWithBezier(v, e);
  setTimeout(function() {
    gDialog.p1_x.focus(); }, 100);
}
