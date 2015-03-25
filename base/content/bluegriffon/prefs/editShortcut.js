
var gSelector = "";
var gLabel = "";
var gModifiers = "";
var gKbdkey = "";
var gShortcut = "";
var gRv = null;

function Startup()
{
  GetUIElements();
  gLabel     = window.arguments[0];
  gSelector  = window.arguments[1];
  gModifiers = window.arguments[2];
  gKbdkey    = window.arguments[3];
  gShortcut  = window.arguments[4];
  gRv        = window.arguments[5];

  if (!gShortcut)
    gDialog.deleteShortcutButton.disabled = true;
  gDialog.labelLabel.setAttribute("value", gLabel);
  gDialog.shortcutTextbox.value = gShortcut;
  gDialog.shortcutTextbox.focus();
}

function onTextEntered(aEvent)
{
  aEvent.preventDefault();
  var key = "";
  var shiftKey = aEvent.shiftKey;
  var ctrlKey  = aEvent.ctrlKey;
  var altKey   = aEvent.altKey;
  var metaKey  = aEvent.metaKey;

  var str = "";

  if (shiftKey)
#ifdef XP_MACOSX
    str="⇧";
#else
    str += "shift-";
#endif

  if (ctrlKey)
#ifdef XP_MACOSX
    str += "⌃";
#else
    str += "ctrl-";
#endif

  if (altKey)
#ifdef XP_MACOSX
    str += "⌥";
#else
    str += "alt";
#endif

  if (metaKey)
#ifdef XP_UNIX
#ifdef XP_MACOSX
    str += "⌘";
#else
    str += "meta-";
#endif
#else
    str += "windows-"
#endif

  if (aEvent.which) {
    if (aEvent.which == 13)
#ifdef XP_MACOSX
      key = "↩";
#else
      key = "VK_ENTER";
#endif
    else
      key = String.fromCharCode(aEvent.which);
  }
  else {
    // non visible key code
    switch (aEvent.keyCode)
    {
      case KeyEvent.DOM_VK_F1: key="VK_F1"; break;
      case KeyEvent.DOM_VK_F2: key="VK_F2"; break;
      case KeyEvent.DOM_VK_F3: key="VK_F3"; break;
      case KeyEvent.DOM_VK_F4: key="VK_F4"; break;
      case KeyEvent.DOM_VK_F5: key="VK_F5"; break;
      case KeyEvent.DOM_VK_F6: key="VK_F6"; break;
      case KeyEvent.DOM_VK_F7: key="VK_F7"; break;
      case KeyEvent.DOM_VK_F8: key="VK_F8"; break;
      case KeyEvent.DOM_VK_F9: key="VK_F9"; break;
      case KeyEvent.DOM_VK_F10: key="VK_F10"; break;
      case KeyEvent.DOM_VK_F11: key="VK_F11"; break;
      case KeyEvent.DOM_VK_F12: key="VK_F12"; break;
      case KeyEvent.DOM_VK_F13: key="VK_F13"; break;
      case KeyEvent.DOM_VK_F14: key="VK_F14"; break;
      case KeyEvent.DOM_VK_F15: key="VK_F15"; break;
      case KeyEvent.DOM_VK_F16: key="VK_F16"; break;
      case KeyEvent.DOM_VK_F17: key="VK_F17"; break;
      case KeyEvent.DOM_VK_F18: key="VK_F18"; break;
      case KeyEvent.DOM_VK_F19: key="VK_F19"; break;
      case KeyEvent.DOM_VK_F20: key="VK_F20"; break;
      case KeyEvent.DOM_VK_UP: key="VK_UP"; break;
      case KeyEvent.DOM_VK_DOWN: key="VK_DOWN"; break;
      case KeyEvent.DOM_VK_LEFT: key="VK_LEFT"; break;
      case KeyEvent.DOM_VK_RIGHT: key="VK_RIGHT"; break;
      case KeyEvent.DOM_VK_PAGE_UP: key="VK_PAGE_UP"; break;
      case KeyEvent.DOM_VK_PAGE_DOWN: key="VK_PAGE_DOWN"; break;
      case KeyEvent.DOM_VK_ENTER: key="VK_ENTER"; break;
      case KeyEvent.DOM_VK_RETURN: key="VK_RETURN"; break;
      case KeyEvent.DOM_VK_TAB: key="VK_TAB"; break;
      case KeyEvent.DOM_VK_BACK: key="VK_BACK"; break;
      case KeyEvent.DOM_VK_DELETE: key="VK_DELETE"; break;
      case KeyEvent.DOM_VK_HOME: key="VK_HOME"; break;
      case KeyEvent.DOM_VK_END: key="VK_END"; break;
      case KeyEvent.DOM_VK_ESCAPE: key="VK_ESCAPE"; break;
      case KeyEvent.DOM_VK_INSERT: key="VK_INSERT"; break;
      default: return;
    }
  }
  gDialog.shortcutTextbox.value = str + key.replace( /VK_/ , "").toUpperCase();
  gRv.shiftKey = shiftKey;
  gRv.ctrlKey = ctrlKey;
  gRv.altKey = altKey;
  gRv.metaKey = metaKey;
  gRv.key = key.toUpperCase();
  gRv.shortcut = gDialog.shortcutTextbox.value;
}

function onCancel()
{
  gRv.cancelled = true;
  window.close();
}

function onDelete()
{
  gRv.deleted = true;
  window.close();
}

function onApply()
{
  window.close();
}
