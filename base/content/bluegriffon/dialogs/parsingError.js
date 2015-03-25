function Startup()
{
  GetUIElements();
  var message = window.arguments[0];
  var error   = window.arguments[1];
  gDialog.message.setAttribute("value", message);
  gDialog.error.textContent = error;
}