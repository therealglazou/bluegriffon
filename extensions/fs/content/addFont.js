var gRv;
function Startup()
{
  gRv = window.arguments[0];
  GetUIElements();
}

function onAccept()
{
  gRv.cancelled = false;
  gRv.value = gDialog.choice.value;
  return true;
}