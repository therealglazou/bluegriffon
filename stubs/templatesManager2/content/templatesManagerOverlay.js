
if (typeof com == "undefined") com = {};
if (typeof com.bluegriffon == "undefined") com.bluegriffon = {};

com.bluegriffon.templatesManager = {
  open: function()
  {
    window.openDialog("chrome://templatesmanager/content/templatesManager.xul","_blank",
                      "chrome,modal,titlebar,resizable=yes, dialog=no");
  }

};
