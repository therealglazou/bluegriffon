/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is FireFTP.
 *
 * Contributor(s):
 *   Mime Cuvalo <mimecuvalo@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://app/modules/urlHelper.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = ["ftpMozilla", "ftpDataSocketMozilla"];

function setTimeout(func, delay)
{
  var timer = Components.classes["@mozilla.org/timer;1"]
                        .createInstance(Components.interfaces.nsITimer);
  timer.initWithCallback(func, delay, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}

function ftpMozilla(observer) {
  this.transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
  this.proxyService     = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService  (Components.interfaces.nsIProtocolProxyService);
  this.cacheService     = Components.classes["@mozilla.org/network/cache-service;1"].getService           (Components.interfaces.nsICacheService);
  this.toUTF8           = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService       (Components.interfaces.nsIUTF8ConverterService);
  this.fromUTF8         = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService   (Components.interfaces.nsIScriptableUnicodeConverter);
  this.observer         = observer;

  this.eventQueue       = new Array();   // commands to be sent
  this.trashQueue       = new Array();   // once commands are read, throw them away here b/c we might have to recycle these if there is an error
  this.listData         = new Array();   // holds data directory data from the LIST command

  var self = this;
  var func = function() { self.keepAlive(); };
  setTimeout(func, 60000);
}

ftpMozilla.prototype = {
  // begin: variables you can set
  host                 : "",
  port                 : 21,
  security             : "",
  login                : "",
  password             : "",
  passiveMode          : true,
  initialPath          : "",             // path we go to first onload
  encoding             : "UTF-8",
  type                 : '',             // what type of FTP connection is this? '' = standard, 'fxp' = FXP, 'transfer' = just for transfers
  connNo               : 1,              // connection #
  fxpHost              : null,           // the host of an FXP connection
  timezone             : 0,              // timezone offset
  privateKey           : "",             // private key for sftp connections

  asciiFiles           : new Array(),    // set to the list of extensions we treat as ASCII files when transfering
  fileMode             : 0,              // 0 == auto, 1 == binary, 2 == ASCII
  hiddenMode           : false,          // show hidden files if true
  ipType               : "IPv4",         // right now, either IPv4 or IPv6
  keepAliveMode        : true,           // keep the connection alive with NOOP's
  networkTimeout       : 30,             // how many seconds b/f we consider the connection to be stale and dead
  proxyHost            : "",
  proxyPort            : 0,
  proxyType            : "",
  activePortMode       : false,          // in active mode, if you want to specify a range of ports
  activeLow            : 1,              // low  port
  activeHigh           : 65535,          // high port
  reconnectAttempts    : 40,             // how many times we should try reconnecting
  reconnectInterval    : 10,             // number of seconds in b/w reconnect attempts
  reconnectMode        : true,           // true if we want to attempt reconnecting
  sessionsMode         : true,           // true if we're caching directory data
  timestampsMode       : false,          // true if we try to keep timestamps in sync
  useCompression       : true,           // true if we try to do compression
  integrityMode        : true,           // true if we try to do integrity checks

  errorConnectStr      : "Unable to make a connection.  Please try again.", // set to error msg that you'd like to show for a connection error
  errorXCheckFail      : "The transfer of this file was unsuccessful and resulted in a corrupted file. It is recommended to restart this transfer.",  // an integrity check failure
  passNotShown         : "(password not shown)",                            // set to text you'd like to show in place of password
  l10nMonths           : new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"), // used in display localized months
  // end: variables you can set

  // variables used internally
  isConnected          : false,          // are we connected?
  isReady              : false,          // are we busy writing/reading the control socket?
  isReconnecting       : false,          // are we attempting a reconnect?
  legitClose           : true,           // are we the ones initiating the close or is it a network error
  reconnectsLeft       : 0,              // how many times more to try reconnecting
  networkTimeoutID     : 0,              // a counter increasing with each read and write
  transferID           : 0,              // a counter increasing with each transfer
  queueID              : 0,              // another counter increasing with each transfer

  controlTransport     : null,
  controlInstream      : null,
  controlOutstream     : null,

  pipeTransport        : null,           // SFTP stuff
  ipcBuffer            : null,
  isKilling            : false,
  readPoller           : 0,

  doingCmdBatch        : false,

  dataSocket           : null,
  activeCurrentPort    : -1,             // if user specified a range of ports, this is the current port we're using

  featMLSD             : false,          // is the MLSD command available?
  featMDTM             : false,          // is the MDTM command available?
  featXMD5             : false,          // is the XMD5 command available?
  featXSHA1            : false,          // is the XSHA1 command available?
  featXCheck           : null,           // are the XMD5 or XSHA1 commands available; if so, which one to use?
  featModeZ            : false,          // is the MODE Z command available?

  welcomeMessage       : "",             // hello world
  fullBuffer           : "",             // full response of control socket
  connectedHost        : "",             // name of the host we connect to plus username
  localRefreshLater    : '',
  remoteRefreshLater   : '',
  waitToRefresh        : false,
  transferMode         : "",             // either "A" or "I"
  securityMode         : "",             // either "P" or "C" or ""
  compressMode         : "S",            // either "S" or "Z"
  currentWorkingDir    : "",             // directory that we're currently, uh, working with
  version              : "1.0.7",  // version of this class - used to avoid collisions in cache
  remoteMonths         : "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",         // used in parsing months from list data

  setSecurity : function(type) {
    ftpMozilla.prototype.security = type;

    if (type == "sftp") {
      for (func in this.sftp) {
        eval("ftpMozilla.prototype." + func + " = ftpMozilla.prototype.sftp." + func);
      }
    } else {
      for (func in this.ftp) {
        eval("ftpMozilla.prototype." + func + " = ftpMozilla.prototype.ftp."  + func);
      }
    }
  },

  onDisconnect : function(sslException) {
    if (!this.isConnected) {                                                     // no route to host
      if (!sslException && this.observer) {
        this.observer.onAppendLog(this.errorConnectStr, 'error', "error");
      }
    }

    this.isConnected = false;

    if (this.dataSocket) {
      this.dataSocket.kill();
      this.dataSocket = null;
    }

    if (this.observer) {
      this.observer.onDisconnected(!this.legitClose && this.reconnectMode && this.reconnectsLeft > 0);
      this.observer.onIsReadyChange(true);
    }

    if (!this.legitClose && this.reconnectMode) {                                // try reconnecting
      this.transferMode = "";
      this.securityMode = "";
      this.compressMode = "S";

      if (this.reconnectsLeft < 1) {
        this.isReconnecting = false;
        if (this.eventQueue.length && this.eventQueue[0].cmd == "welcome") {
          this.eventQueue.shift();
        }
      } else {
        this.isReconnecting = true;

        if (this.observer) {
          this.observer.onReconnecting();
        }

        var self = this;
        var func = function() { self.reconnect(); };
        setTimeout(func, this.reconnectInterval * 1000);
      }
    } else {
      this.legitClose = true;
      this.cleanup();
    }

    if (this.security == "sftp") {
      this.kill();
    }
  },

  disconnect : function() {
    this.legitClose = true;                                                      // this close() is ok, don't try to reconnect
    this.cleanup();

    if (!(!this.isConnected && this.eventQueue.length && this.eventQueue[0].cmd == "welcome")) {
      try {
        this.controlOutstream.write((this.security == "sftp" ? "quit" : "QUIT") + "\r\n", 6);
        if (this.observer) {
          this.observer.onAppendLog("" + (this.security == "sftp" ? "quit" : "QUIT"), 'output', "info");
        }
      } catch(ex) { }
    }

    if (this.dataSocket) {
      this.dataSocket.kill();
      this.dataSocket = null;
    }

    this.kill();

    if (this.security == "sftp") {
      this.onDisconnect();
    }
  },

  reconnect : function()  {                                                      // ahhhh! our precious connection has been lost,
    if (!this.isReconnecting) {                                                  // must...get it...back...our...precious
      return;
    }

    --this.reconnectsLeft;

    this.connect(true);
  },

  abort : function(forceKill) {
    this.isReconnecting     = false;

    if (this.dataSocket) {
      this.dataSocket.progressEventSink.bytesTotal = 0;                          // stop uploads
      this.dataSocket.dataListener.bytesTotal      = 0;                          // stop downloads
    }

    this.cleanup(true);

    if (!this.isConnected) {
      return;
    }

    if (forceKill && this.security != "sftp") {
      try {
        this.controlOutstream.write("ABOR\r\n", 6);
      } catch(ex) { }
    }

    //XXX this.writeControl("ABOR");                                             // ABOR does not seem to stop the connection in most cases
    if (this.dataSocket) {                                                       // so this is a more direct approach
      this.dataSocket.kill();
      this.dataSocket = null;
    } else {
      this.isReady = true;
    }

    this.addEventQueue("aborted");

    if (this.observer) {
      this.observer.onAbort();
    }
  },

  cancel : function(forceKill) {                                                 // cancel current transfer
    if (this.security == "sftp") {                                               // can't currently do this with sftp
      return;
    }

    if (this.dataSocket) {
      this.dataSocket.progressEventSink.bytesTotal = 0;                          // stop uploads
      this.dataSocket.dataListener.bytesTotal      = 0;                          // stop downloads
    }

    this.trashQueue = new Array();

    if (forceKill && this.security != "sftp") {
      try {
        if (this.isConnected) {
          this.controlOutstream.write("ABOR\r\n", 6);
        }
      } catch(ex) { }
    }

    //XXX this.writeControl("ABOR");                                             // ABOR does not seem to stop the connection in most cases
    var dId;
    if (this.dataSocket && this.isConnected) {                                   // so this is a more direct approach
      this.dataSocket.kill();
      dId = this.dataSocket.id;
      this.dataSocket = null;
    }

    for (var x = 0; x < this.eventQueue.length; ++x) {
      if (this.eventQueue[x].cmd == "transferEnd" && dId == this.eventQueue[x].callback.id) {
        this.eventQueue.splice(0, x + 1);
        break;
      }
    }

    if (this.isConnected) {
      this.unshiftEventQueue("aborted");
    }
  },

  checkTimeout : function(id, cmd) {
    if (this.isConnected && this.networkTimeoutID == id && this.eventQueue.length && this.eventQueue[0].cmd.indexOf(cmd) != -1) {
      this.resetConnection();
    }
  },

  resetConnection : function() {
    this.legitClose = false;                                                   // still stuck on a command so, try to restart the connection the hard way

    try {
      this.controlOutstream.write((this.security == "sftp" ? "quit" : "QUIT") + "\r\n", 6);
      if (this.observer) {
        this.observer.onAppendLog("" + (this.security == "sftp" ? "quit" : "QUIT"), 'output', "info");
      }
    } catch(ex) { }

    if (this.dataSocket) {
      this.dataSocket.kill();
      this.dataSocket = null;
    }

    this.kill();

    if (this.security == "sftp") {
      this.isConnected = false;
    }
  },

  cleanup : function(isAbort) {
    this.eventQueue         = new Array();
    this.trashQueue         = new Array();
    this.transferMode       = "";
    this.securityMode       = "";
    this.compressMode       = "S";
    this.currentWorkingDir  = "";
    this.localRefreshLater  = "";
    this.remoteRefreshLater = "";
    this.waitToRefresh      = false;
    this.fxpHost            = null;
    this.isReady            = false;

    if (!isAbort) {
      this.featMLSD         = false;
      this.featMDTM         = false;
      this.featXMD5         = false;
      this.featXSHA1        = false;
      this.featXCheck       = null;
      this.featModeZ        = false;
    }

    ++this.networkTimeoutID;
    ++this.transferID;
  },

  kill : function() {
    try {
      this.controlInstream.close();
    } catch(ex) {
      if (this.observer && this.security != "sftp") {
        this.observer.onDebug(ex);
      }
    }

    try {
      this.controlOutstream.close();
    } catch(ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }

    if (this.security == "sftp") {
      this.sftpKill();
    }
  },

  sftpKill : function() {
    this.isKilling  = true;

    this.eventQueue = [];

    clearInterval(this.readPoller);

    try {
      this.pipeTransport.cancel(-1);
    } catch(ex) { }

    try {
      this.ipcBuffer.shutdown();
    } catch(ex) { }

    try {
      this.pipeTransport.closeStdin();
    } catch(ex) { }

    try {
      if (this.getPlatform() == "windows") {
        var killPath;

        var firefoxInstallPath = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                       .get("CurProcD", Components.interfaces.nsILocalFile);
        killPath = firefoxInstallPath.path.substring(0, 2) + "/windows/system32/taskkill.exe /IM psftp.exe";
        this.ipcService.exec(killPath);
      } else {
        var killPath = "/usr/bin/killall -9 psftp";
        this.ipcService.exec(killPath);
      }
    } catch (ex) { }

    try {
      this.pipeTransport.join();
    } catch(ex) { }

    try {
      this.pipeTransport.terminate();
    } catch(ex) { }

    this.isKilling = false;
  },

  addEventQueue : function(cmd, parameter, callback, callback2) {                // this just creates a new queue item
    this.eventQueue.push(   { cmd: cmd, parameter: parameter || '', callback: callback || '', callback2: callback2 || '' });
  },

  unshiftEventQueue : function(cmd, parameter, callback, callback2) {            // ditto
    this.eventQueue.unshift({ cmd: cmd, parameter: parameter || '', callback: callback || '', callback2: callback2 || '' });
  },

  beginCmdBatch : function() {
    this.doingCmdBatch = true;
  },

  writeControlWrapper : function() {
    if (!this.doingCmdBatch) {
      this.writeControl();
    }
  },

  endCmdBatch : function() {
    this.doingCmdBatch = false;
    this.writeControl();
  },

  writeControl : function(cmd) {
    try {
      if (!this.isReady || (!cmd && !this.eventQueue.length)) {
        return;
      }

      var parameter;
      var callback;
      var callback2;

      if (!cmd) {
        cmd        = this.eventQueue[0].cmd;
        parameter  = this.eventQueue[0].parameter;
        callback   = this.eventQueue[0].callback;
        callback2  = this.eventQueue[0].callback2;
      }

      if (cmd == "sftpcache") {
        cmd       = parameter;
        parameter = "";
        callback  = "sftpcache";
      }

      if (cmd == "custom") {
        cmd       = parameter;
        parameter = "";
      }

      while (cmd == "aborted" || cmd == "goodbye"                                // these are sort of dummy values
         ||  cmd == "transferBegin" || cmd == "transferEnd"
         || (cmd == "TYPE" && this.transferMode      == parameter)               // or if we ignore TYPE if it's unnecessary
         || (cmd == "PROT" && this.securityMode      == parameter)               // or if we ignore PROT if it's unnecessary
         || (cmd == "MODE" && this.compressMode      == parameter)               // or if we ignore MODE if it's unnecessary
         || (cmd == "CWD"  && this.currentWorkingDir == parameter                // or if we ignore CWD  if it's unnecessary
            && this.type != 'transfer')
         || (cmd == "cd"   && this.currentWorkingDir == parameter)) {

        if ((cmd == "TYPE" && this.transferMode      == parameter)
         || (cmd == "PROT" && this.securityMode      == parameter)
         || (cmd == "MODE" && this.compressMode      == parameter)
         || (cmd == "CWD"  && this.currentWorkingDir == parameter)
         || (cmd == "cd"   && this.currentWorkingDir == parameter)) {
          this.trashQueue.push(this.eventQueue[0]);
        }

        this.eventQueue.shift();

        if (this.eventQueue.length) {
          cmd        = this.eventQueue[0].cmd;
          parameter  = this.eventQueue[0].parameter;
          callback   = this.eventQueue[0].callback;
          callback2  = this.eventQueue[0].callback2;
        } else {
          return;
        }
      }

      this.isReady          = false;

      if (this.observer) {
        this.observer.onIsReadyChange(false);
      }

      if (!this.passiveMode && cmd == "PASV") {                                  // active mode
        cmd                      = this.ipType == "IPv4" ? "PORT" : "EPRT";
        var security             = this.security && this.securityMode == "P";
        var proxy                = { proxyType: this.proxyType, proxyHost: this.proxyHost, proxyPort: this.proxyPort };
        var currentPort          = this.activeCurrentPort == -1 ? this.activeLow : this.activeCurrentPort + 2;

        if (currentPort < this.activeLow || currentPort > this.activeHigh) {
          currentPort = this.activeLow;
        }

        this.activeCurrentPort   = currentPort;

        var qId;
        for (var x = 0; x < this.eventQueue.length; ++x) {
          if (this.eventQueue[x].cmd == "transferEnd") {
            qId = this.eventQueue[x].callback.id;
            break;
          }
        }

        this.dataSocket          = new ftpDataSocketMozilla(this.host, this.port, security, proxy, "", this.activePortMode ? currentPort : -1,
                                                            this.compressMode == "Z", qId, this.observer, this.getCert(), this.fileMode == 2);

        var activeInfo           = {};
        activeInfo.cmd           = this.eventQueue[1].cmd;
        activeInfo.ipType        = this.ipType;

        if (this.eventQueue[1].cmd        == "RETR") {
          activeInfo.localPath    = this.eventQueue[1].callback;
          activeInfo.totalBytes   = callback;
        } else if (this.eventQueue[1].cmd == "REST") {
          activeInfo.localPath    = this.eventQueue[2].callback;
          activeInfo.totalBytes   = callback;
          activeInfo.partialBytes = this.eventQueue[1].parameter;
        } else if (this.eventQueue[1].cmd == "STOR") {
          activeInfo.localPath    = this.eventQueue[1].callback;
        } else if (this.eventQueue[1].cmd == "APPE") {
          activeInfo.localPath    = this.eventQueue[1].callback.localPath;
          activeInfo.partialBytes = this.eventQueue[1].callback.remoteSize;
        }

        parameter = this.dataSocket.createServerSocket(activeInfo);
      }

      if (cmd == "PASV" && this.passiveMode && this.ipType != "IPv4") {
        cmd = "EPSV";
      }

      if (cmd == "LIST") {                                                       // don't include path in list command - breaks too many things
        parameter = this.hiddenMode && !this.featMLSD ? "-al" : "";

        if (this.featMLSD) {
          cmd = "MLSD";
        }
      }

      if (cmd == "ls") {
        parameter = "";
      }

      if (this.security == "sftp" && parameter && cmd != "chmod" && cmd != "mv" && cmd != "get" && cmd != "reget" && cmd != "put" && cmd != "reput") {
        parameter = '"' + this.escapeSftp(parameter) + '"';
      }

      var outputData = cmd + (parameter ? (' ' + parameter) : '') + "\r\n";      // le original bug fix! - thanks to devin

      try {
        outputData   = this.fromUTF8.ConvertFromUnicode(outputData) + this.fromUTF8.Finish();
      } catch (ex) {
        if (this.observer) {
          this.observer.onDebug(ex);
        }
      }

      this.controlOutstream.write(outputData, outputData.length);                // write!

      if (cmd != "get" && cmd != "reget" && cmd != "put" && cmd != "reput") {
        ++this.networkTimeoutID;                                                   // this checks for timeout
        var self           = this;
        var currentTimeout = this.networkTimeoutID;
        var func           = function() { self.checkTimeout(currentTimeout, cmd); };
        setTimeout(func, this.networkTimeout * 1000);
      }

      if ((cmd == "RETR" || cmd == "STOR" || cmd == "APPE") && callback2 != 'fxp') {
        ++this.transferID;
        var currentId    = this.transferID;
        var func         = function() { self.checkDataTimeout(cmd == "RETR", currentId, 0); };
        setTimeout(func, this.networkTimeout * 1000);
      }

      outputData = cmd + (parameter ? (' ' + parameter) : '');                   // write it out to the log

      if (callback == "sftpcache") {
        callback = null;
      } else if (cmd != "PASS") {
        if (this.observer) {
          this.observer.onAppendLog(""      + outputData,        'output', "info");
        }
      } else {
        if (this.observer) {
          this.observer.onAppendLog("PASS " + this.passNotShown, 'output', "info");
        }
      }

    } catch(ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
        this.observer.onError(this.errorConnectStr);
      }
    }
  },

  refresh : function() {
    if (this.waitToRefresh) {
      var self = this;
      var func = function() { self.refresh(); };
      setTimeout(func, 1000);
      return;
    } else if (this.eventQueue.length) {
      return;
    }

    if (this.localRefreshLater) {
      var dir                 = new String(this.localRefreshLater);
      this.localRefreshLater  = "";

      if (this.observer) {
        this.observer.onShouldRefresh(true, false, dir);
      }
    }

    if (this.remoteRefreshLater) {
      var dir                 = new String(this.remoteRefreshLater);
      this.remoteRefreshLater = "";

      if (this.observer) {
        this.observer.onShouldRefresh(false, true, dir);
      }
    }
  },

  parseListData : function(data, path) {
    /* Unix style:                     drwxr-xr-x  1 user01 ftp  512    Jan 29 23:32 prog
     * Alternate Unix style:           drwxr-xr-x  1 user01 ftp  512    Jan 29 1997  prog
     * Alternate Unix style:           drwxr-xr-x  1 1      1    512    Jan 29 23:32 prog
     * SunOS style:                    drwxr-xr-x+ 1 1      1    512    Jan 29 23:32 prog
     * A symbolic link in Unix style:  lrwxr-xr-x  1 user01 ftp  512    Jan 29 23:32 prog -> prog2000
     * AIX style:                      drwxr-xr-x  1 user01 ftp  512    05 Nov 2003  prog
     * Novell style:                   drwxr-xr-x  1 user01      512    Jan 29 23:32 prog
     * Weird style:                    drwxr-xr-x  1 user5424867        Jan 29 23:32 prog, where 5424867 is the size
     * Weird style 2:                  drwxr-xr-x  1 user01 anon5424867 Jan 11 12:48 prog, where 5424867 is the size
     * MS-DOS style:                   01-29-97 11:32PM <DIR> prog
     * OS/2 style:                     0           DIR 01-29-97  23:32  PROG
     * OS/2 style:                     2243        RA  04-05-103 00:22  PJL
     * OS/2 style:                     60              11-18-104 06:54  chkdsk.log
     *
     * MLSD style: type=file;size=6106;modify=20070223082414;UNIX.mode=0644;UNIX.uid=32257;UNIX.gid=32259;unique=808g154c727; prog
     *             type=dir;sizd=4096;modify=20070218021044;UNIX.mode=0755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     *             type=file;size=4096;modify=20070218021044;UNIX.mode=07755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     *             type=OS.unix=slink:/blah;size=4096;modify=20070218021044;UNIX.mode=0755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     */

    try {
      data = this.toUTF8.convertStringToUTF8(data, this.encoding, 1);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }

    if (this.observer) {
      this.observer.onDebug(data.replace(/</g, '&lt;').replace(/>/g, '&gt;'), "DEBUG");
    }

    var items   = data.indexOf("\r\n") != -1 ? data.split("\r\n") : data.split("\n");
    items       = items.filter(this.removeBlanks);
    var curDate = new Date();

    if (items.length) {                                                          // some ftp servers send 'count <number>' or 'total <number>' first
      if (items[0].indexOf("count") == 0 || items[0].indexOf("total") == 0 || items[0].indexOf("Listing directory") == 0 || (!this.featMLSD && items[0].split(" ").filter(this.removeBlanks).length == 2)) {
        items.shift();                                                           // could be in german or croatian or what have you
      }
    }

    for (var x = 0; x < items.length; ++x) {
      if (!items[x]) {                                                           // some servers put in blank lines b/w entries, aw, for cryin' out loud
        items.splice(x, 1);
        --x;
        continue;
      }

      items[x] = items[x].replace(/^\s+/, "");                                   // @*$% - some servers put blanks in front, do trimming on front

      var temp = items[x];                                                       // account for collisions:  drwxr-xr-x1017 user01

      if (!this.featMLSD) {
        if (!parseInt(items[x].charAt(0)) && items[x].charAt(0) != '0' && items[x].charAt(10) == '+') {     // drwxr-xr-x+ - get rid of the plus sign
          items[x] = this.setCharAt(items[x], 10, ' ');
        }

        if (!parseInt(items[x].charAt(0)) && items[x].charAt(0) != '0' && items[x].charAt(10) != ' ') {     // this is mimicked below if weird style
          items[x] = items[x].substring(0, 10) + ' ' + items[x].substring(10, items[x].length);
        }

        items[x]   = items[x].split(" ").filter(this.removeBlanks);
      }

      if (this.featMLSD) {                                                       // MLSD-standard style
        var newItem    = { permissions : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : "0",
                           date        : "",
                           leafName    : "",
                           isDir       : false,
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return this.symlink != "" },
                           symlink     : "",
                           path        : "" };

        var pathname     = items[x].split("; ");
        newItem.leafName = '';
        for (var y = 1; y < pathname.length; ++y) {
          newItem.leafName += (y == 1 ? '' : '; ') + pathname[y];
        }
        newItem.path     = this.constructPath(path, newItem.leafName);

        items[x] = pathname[0];
        items[x] = items[x].split(";");
        var skip = false;

        for (var y = 0; y < items[x].length; ++y) {
          if (!items[x][y]) {
            continue;
          }

          var fact = items[x][y].split('=');
          if (fact.length < 2 || !fact[0] || !fact[1]) {
            continue;
          }

          var factName = fact[0].toLowerCase();
          var factVal  = fact[1];

          switch (factName) {
            case "type":
              if (factVal == "pdir" || factVal == "cdir") {
                skip = true;
              } else if (factVal == "dir") {
                newItem.isDir = true;
                newItem.permissions = this.setCharAt(newItem.permissions, 0, 'd');
              } else if (items[x][y].substring(5).indexOf("OS.unix=slink:") == 0) {
                newItem.symlink = items[x][y].substring(19);
                newItem.permissions = this.setCharAt(newItem.permissions, 0, 'l');
              } else if (factVal != "file") {
                skip = true;
              }
              break;
            case "size":
            case "sizd":
              newItem.fileSize = factVal;
              break;
            case "modify":
              var dateString = factVal.substr(0, 4) + " " + factVal.substr(4,  2) + " " + factVal.substr(6,  2) + " "
                             + factVal.substr(8, 2) + ":" + factVal.substr(10, 2) + ":" + factVal.substr(12, 2) + " GMT";
              var zeDate = new Date(dateString);
              zeDate.setMinutes(zeDate.getMinutes() + this.timezone);
              var timeOrYear = new Date() - zeDate > 15600000000 ? zeDate.getFullYear()    // roughly 6 months
                             : this.zeroPadTime(zeDate.getHours()) + ":" + this.zeroPadTime(zeDate.getMinutes());
              newItem.date = this.l10nMonths[zeDate.getMonth()] + ' ' + zeDate.getDate() + ' ' + timeOrYear;
              newItem.lastModifiedTime = zeDate.getTime();
              break;
            case "unix.mode":
              var offset = factVal.length == 5 ? 1 : 0;
              var sticky = this.zeroPad(parseInt(factVal[0 + offset]).toString(2));
              var owner  = this.zeroPad(parseInt(factVal[1 + offset]).toString(2));
              var group  = this.zeroPad(parseInt(factVal[2 + offset]).toString(2));
              var pub    = this.zeroPad(parseInt(factVal[3 + offset]).toString(2));
              newItem.permissions = this.setCharAt(newItem.permissions, 1, owner[0]  == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 2, owner[1]  == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 3, sticky[0] == '1' ? (owner[2] == '1' ? 's' : 'S')
                                                                                            : (owner[2] == '1' ? 'x' : '-'));
              newItem.permissions = this.setCharAt(newItem.permissions, 4, group[0]  == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 5, group[1]  == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 6, sticky[1] == '1' ? (group[2] == '1' ? 's' : 'S')
                                                                                            : (group[2] == '1' ? 'x' : '-'));
              newItem.permissions = this.setCharAt(newItem.permissions, 7, pub[0]    == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 8, pub[1]    == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 9, sticky[2] == '1' ? (pub[2]   == '1' ? 't' : 'T')
                                                                                            : (pub[2]   == '1' ? 'x' : '-'));
              break;
            case "unix.uid":
              newItem.user = factVal;
              break;
            case "unix.gid":
              newItem.group = factVal;
              break;
            default:
              break;
          }

          if (skip) {
            break;
          }
        }

        if (skip) {
          items.splice(x, 1);
          --x;
          continue;
        }

        items[x] = newItem;
      } else if (!parseInt(items[x][0].charAt(0)) && items[x][0].charAt(0) != '0')  {   // unix style - so much simpler with you guys
        var offset = 0;

        if (items[x][3].search(this.remoteMonths) != -1 && items[x][5].search(this.remoteMonths) == -1) {
          var weird = temp;                                                      // added to support weird servers

          if (weird.charAt(10) != ' ') {                                         // same as above code
            weird = weird.substring(0, 10) + ' ' + weird.substring(10, weird.length);
          }

          var weirdIndex = 0;

          for (var y = 0; y < items[x][2].length; ++y) {
            if (parseInt(items[x][2].charAt(y))) {
              weirdIndex = weird.indexOf(items[x][2]) + y;
              break;
            }
          }

          weird    = weird.substring(0, weirdIndex) + ' ' + weird.substring(weirdIndex, weird.length);

          items[x] = weird.split(" ").filter(this.removeBlanks);
        }

        if (items[x][4].search(this.remoteMonths) != -1 && !parseInt(items[x][3].charAt(0))) {
          var weird = temp;                                                      // added to support 'weird 2' servers, oy vey

          if (weird.charAt(10) != ' ') {                                         // same as above code
            weird = weird.substring(0, 10) + ' ' + weird.substring(10, weird.length);
          }

          var weirdIndex = 0;

          for (var y = 0; y < items[x][3].length; ++y) {
            if (parseInt(items[x][3].charAt(y))) {
              weirdIndex = weird.indexOf(items[x][3]) + y;
              break;
            }
          }

          weird    = weird.substring(0, weirdIndex) + ' ' + weird.substring(weirdIndex, weird.length);

          items[x] = weird.split(" ").filter(this.removeBlanks);
        }

        if (items[x][4].search(this.remoteMonths) != -1) {                       // added to support novell servers
          offset   = 1;
        }

        var index = 0;
        for (var y = 0; y < 7 - offset; ++y) {
          index = temp.indexOf(items[x][y], index) + items[x][y].length + 1;
        }

        var name    = temp.substring(temp.indexOf(items[x][7 - offset], index) + items[x][7 - offset].length + 1, temp.length);
        name        = name.substring(name.search(/[^\s]/));
        var symlink = "";

        if (items[x][0].charAt(0) == 'l') {
          symlink = name;

          if (this.security != "sftp") {
            name    = name.substring(0, name.indexOf("->") - 1);
            symlink = symlink.substring(symlink.indexOf("->") + 3);
          }
        }

        name             = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        var remotepath   = this.constructPath(path, name);
        var month;

        var rawDate    = items[x][6 - offset];

        if (items[x][6].search(this.remoteMonths) != -1) {                       // added to support aix servers
          month        = this.remoteMonths.search(items[x][6 - offset]) / 4;
          rawDate      = items[x][5 - offset];
        } else {
          month        = this.remoteMonths.search(items[x][5 - offset]) / 4;
        }

        var timeOrYear;
        var curDate    = new Date();
        var currentYr  = curDate.getMonth() < month ? curDate.getFullYear() - 1 : curDate.getFullYear();
        var rawYear    = items[x][7 - offset].indexOf(':') != -1 ? currentYr            : parseInt(items[x][7 - offset]);
        var rawTime    = items[x][7 - offset].indexOf(':') != -1 ? items[x][7 - offset] : "00:00";

        rawTime        = rawTime.split(":");

        for (var y = 0; y < rawTime.length; ++y) {
          rawTime[y]   = parseInt(rawTime[y], 10);
        }

        var parsedDate = new Date(rawYear, month, rawDate, rawTime[0], rawTime[1]);  // month-day-year format
        parsedDate.setMinutes(parsedDate.getMinutes() + this.timezone);

        if (new Date() - parsedDate > 15600000000) {                             // roughly 6 months
          timeOrYear   = parsedDate.getFullYear();
        } else {
          timeOrYear   = this.zeroPadTime(parsedDate.getHours()) + ":" + this.zeroPadTime(parsedDate.getMinutes());
        }

        month          = this.l10nMonths[parsedDate.getMonth()];
        items[x]       = { permissions : items[x][0],
                           hardLink    : items[x][1],
                           user        : items[x][2],
                           group       : (offset ? "" : items[x][3]),
                           fileSize    : items[x][4 - offset],
                           date        : month + ' ' + parsedDate.getDate() + ' ' + timeOrYear,
                           leafName    : name,
                           isDir       : items[x][0].charAt(0) == 'd',
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return this.symlink != "" },
                           symlink     : symlink,
                           path        : remotepath };

      } else if (items[x][0].indexOf('-') == -1) {                               // os/2 style
        var offset = 0;

        if (items[x][2].indexOf(':') != -1) {                                    // if "DIR" and "A" are missing
          offset   = 1;
        }

        var rawDate    = items[x][2 - offset].split("-");
        var rawTime    = items[x][3 - offset];
        var timeOrYear = rawTime;
        rawTime        = rawTime.split(":");

        for (var y = 0; y < rawDate.length; ++y) {
          rawDate[y]   = parseInt(rawDate[y], 10);                               // leading zeros are treated as octal so pass 10 as base argument
        }

        for (var y = 0; y < rawTime.length; ++y) {
          rawTime[y]   = parseInt(rawTime[y], 10);
        }

        rawDate[2]     = rawDate[2] + 1900;                                      // ah, that's better
        var parsedDate = new Date(rawDate[2], rawDate[0] - 1, rawDate[1], rawTime[0], rawTime[1]);  // month-day-year format
        parsedDate.setMinutes(parsedDate.getMinutes() + this.timezone);

        if (new Date() - parsedDate > 15600000000) {                             // roughly 6 months
          timeOrYear   = parsedDate.getFullYear();
        } else {
          timeOrYear   = this.zeroPadTime(parsedDate.getHours()) + ":" + this.zeroPadTime(parsedDate.getMinutes());
        }

        var month      = this.l10nMonths[parsedDate.getMonth()];
        var name       = temp.substring(temp.indexOf(items[x][3 - offset]) + items[x][3 - offset].length + 1, temp.length);
        name           = name.substring(name.search(/[^\s]/));
        name           = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        items[x]       = { permissions : items[x][1] == "DIR" ? "d---------" : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : items[x][0],
                           date        : month + ' ' + parsedDate.getDate() + ' ' + timeOrYear,
                           leafName    : name,
                           isDir       : items[x][1] == "DIR",
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return false },
                           symlink     : "",
                           path        : this.constructPath(path, name) };

      } else {                                                                   // ms-dos style
        var rawDate    = items[x][0].split("-");
        var amPm       = items[x][1].substring(5, 7);                            // grab PM or AM
        var rawTime    = items[x][1].substring(0, 5);                            // get rid of PM, AM
        var timeOrYear = rawTime;
        rawTime        = rawTime.split(":");

        for (var y = 0; y < rawDate.length; ++y) {
          rawDate[y]   = parseInt(rawDate[y], 10);
        }

        for (var y = 0; y < rawTime.length; ++y) {
          rawTime[y]   = parseInt(rawTime[y], 10);
        }

        rawTime[0] = rawTime[0] == 12 && amPm == "AM" ? 0 : (rawTime[0] < 12 && amPm == "PM" ? rawTime[0] + 12 : rawTime[0]);

        if (rawDate[2] < 70) {                                                   // assuming you didn't have some files left over from 1904
          rawDate[2]   = rawDate[2] + 2000;                                      // ah, that's better
        } else {
          rawDate[2]   = rawDate[2] + 1900;
        }

        var parsedDate = new Date(rawDate[2], rawDate[0] - 1, rawDate[1], rawTime[0], rawTime[1]);  // month-day-year format
        parsedDate.setMinutes(parsedDate.getMinutes() + this.timezone);

        if (new Date() - parsedDate > 15600000000) {                             // roughly 6 months
          timeOrYear   = parsedDate.getFullYear();
        } else {
          timeOrYear   = this.zeroPadTime(parsedDate.getHours()) + ":" + this.zeroPadTime(parsedDate.getMinutes());
        }

        var month      = this.l10nMonths[parsedDate.getMonth()];
        var name       = temp.substring(temp.indexOf(items[x][2], temp.indexOf(items[x][1]) + items[x][1].length + 1)
                         + items[x][2].length + 1, temp.length);
        name           = name.substring(name.search(/[^\s]/));
        name           = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        items[x]       = { permissions : items[x][2] == "<DIR>" ? "d---------" : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : items[x][2] == "<DIR>" ? '0' : items[x][2],
                           date        : month + ' ' + parsedDate.getDate() + ' ' + timeOrYear,
                           leafName    : name,
                           isDir       : items[x][2] == "<DIR>",
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return false },
                           symlink     : "",
                           path        : this.constructPath(path, name) };
      }

      if (!items[x].lastModifiedTime) {
        var dateTemp  = items[x].date;                                             // this helps with sorting by date
        var dateMonth = dateTemp.substring(0, 3);
        var dateIndex = this.l10nMonths.indexOf(dateMonth);
        dateTemp      = this.remoteMonths.substr(dateIndex * 4, 3) + dateTemp.substring(3);

        if (items[x].date.indexOf(':') != -1) {
          dateTemp = dateTemp + ' ' + (curDate.getFullYear() - (curDate.getMonth() < dateIndex ? 1 : 0));
        }

        items[x].lastModifiedTime = Date.parse(dateTemp);
      }

      items[x].fileSize = parseInt(items[x].fileSize);

      items[x].parent = { path: items[x].path.substring(0, items[x].path.lastIndexOf('/') ? items[x].path.lastIndexOf('/') : 1) };
    }

    var directories = new Array();                                               // sort directories to the top
    var files       = new Array();

    for (var x = 0; x < items.length; ++x) {
      if (!this.hiddenMode && items[x].leafName.charAt(0) == ".") {              // don't show hidden files
        continue;
      }

      items[x].isHidden = items[x].leafName.charAt(0) == ".";

      items[x].leafName = items[x].leafName.replace(/[\\|\/]/g, '');             // scrub out / or \, a security vulnerability if file tries to do ..\..\blah.txt
      items[x].path     = this.constructPath(path, items[x].leafName);           // thanks to Tan Chew Keong for the heads-up

      if (items[x].leafName == "." || items[x].leafName == "..") {               // get rid of "." or "..", this can screw up things on recursive deletions
        continue;
      }

      if (items[x].isDirectory()) {
        directories.push(items[x]);
      } else {
        files.push(items[x]);
      }
    }

    items = directories.concat(files);

    if (this.sessionsMode) {
      try {                                                                      // put in cache
        var cacheSession = this.cacheService.createSession("fireftp", 1, true);
        var cacheDesc    = cacheSession.openCacheEntry((this.security == "sftp" ? "s" : "") + "ftp://" + this.version + this.connectedHost + path,
                                                       Components.interfaces.nsICache.ACCESS_WRITE, false);
        var cacheOut     = cacheDesc.openOutputStream(0);
        var cacheData    = items.toSource();
        cacheOut.write(cacheData, cacheData.length);
        cacheOut.close();
        cacheDesc.close();
      } catch (ex) {
        if (this.observer) {
          this.observer.onDebug(ex);
        }
      }
    }

    return items;
  },

  cacheHit : function(path, callback) {
    try {                                                                      // check the cache first
      var cacheSession   = this.cacheService.createSession("fireftp", 1, true);
      var cacheDesc      = cacheSession.openCacheEntry((this.security == "sftp" ? "s" : "") + "ftp://" + this.version + this.connectedHost + path,
                                                       Components.interfaces.nsICache.ACCESS_READ, false);

      if (cacheDesc.dataSize) {
        var cacheIn       = cacheDesc.openInputStream(0);
        var cacheInstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
        cacheInstream.setInputStream(cacheIn);
        this.listData     = cacheInstream.readBytes(cacheInstream.available());
        this.listData     = eval(this.listData);
        cacheInstream.close();
        cacheDesc.close();

        if (this.observer) {
          this.observer.onDebug(this.listData.toSource().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/, {/g, ',\n{')
                                             .replace(/isDirectory:\(function \(\) {return this.isDir;}\), isSymlink:\(function \(\) {return this.symlink != "";}\), /g, ''),
                                             "DEBUG-CACHE");
        }

        if (typeof callback == "string") {
          eval(callback);                                                      // send off list data to whoever wanted it
        } else {
          callback();
        }

        return true;
      }

      cacheDesc.close();
    } catch (ex) { }

    return false;
  },

  removeCacheEntry : function(path) {
    try {
      var cacheSession = this.cacheService.createSession("fireftp", 1, true);
      var cacheDesc    = cacheSession.openCacheEntry((this.security == "sftp" ? "s" : "") + "ftp://" + this.version + this.connectedHost + path,
                                                     Components.interfaces.nsICache.ACCESS_WRITE, false);
      cacheDesc.doom();
      cacheDesc.close();
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }
  },

  detectAscii : function(path) {                                                 // detect an ascii file - returns "A" or "I"
    if (this.fileMode == 1) {                                                    // binary
      return "I";
    }

    if (this.fileMode == 2) {                                                    // ASCII
      return "A";
    }

    path = path.substring(path.lastIndexOf('.') + 1);                            // manually detect

    for (var x = 0; x < this.asciiFiles.length; ++x) {
      if (this.asciiFiles[x].toLowerCase() == path.toLowerCase()) {
        return "A";
      }
    }

    return "I";
  },

  constructPath : function(parent, leafName) {
    return parent + (parent.charAt(parent.length - 1) != '/' ? '/' : '') + leafName;
  },

  removeBlanks : function(element, index, array) {
    return element;
  },

  zeroPad : function(str) {
    return str.length == 3 ? str : (str.length == 2 ? '0' + str : '00' + str);
  },

  zeroPadTime : function(num) {
    num = num.toString();
    return num.length == 2 ? num : '0' + num;
  },

  setCharAt : function(str, index, ch) {                                         // how annoying
    return str.substr(0, index) + ch + str.substr(index + 1);
  },

  setEncoding : function(encoding) {
    try {
      this.fromUTF8.charset = encoding;
      this.encoding         = encoding;
    } catch (ex) {
      this.fromUTF8.charset = "UTF-8";
      this.encoding         = "UTF-8";
    }
  },

  binaryToHex : function(input) {                                                // borrowed from nsUpdateService.js
    var result = "";

    for (var i = 0; i < input.length; ++i) {
      var hex = input.charCodeAt(i).toString(16);

      if (hex.length == 1) {
        hex = "0" + hex;
      }

      result += hex;
    }

    return result;
  },

  escapeSftp : function(str) {                                                   // thanks to Tan Chew Keong for the heads-up
    return str.replace(/"/g, '""');
  }
};

ftpMozilla.prototype.ftp = {
  connect : function(reconnect) {
    if (!reconnect) {                                                            // this is not a reconnection attempt
      this.isReconnecting = false;
      this.reconnectsLeft = parseInt(this.reconnectAttempts);

      if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
        this.reconnectsLeft = 1;
      }
    }

    if (!this.eventQueue.length || this.eventQueue[0].cmd != "welcome") {
      this.unshiftEventQueue("welcome", "", "");                                 // wait for welcome message first
    }

    ++this.networkTimeoutID;                                                     // just in case we have timeouts from previous connection
    ++this.transferID;

    try {                                                                        // create a control socket
      var proxyInfo = null;
      var self      = this;

      if (this.proxyType != "") {                                                // use a proxy
        proxyInfo = this.proxyService.newProxyInfo(this.proxyType, this.proxyHost, this.proxyPort, 0, 30, null);
      }

      if (this.security == "ssl") {                                              // thanks to Scott Bentley. he's a good man, Jeffrey. and thorough.
        this.controlTransport = this.transportService.createTransport(["ssl"],      1, this.host, parseInt(this.port), proxyInfo);
      } else if (!this.security) {
        this.controlTransport = this.transportService.createTransport(null,         0, this.host, parseInt(this.port), proxyInfo);
      } else {
        this.controlTransport = this.transportService.createTransport(["starttls"], 1, this.host, parseInt(this.port), proxyInfo);
      }

      if (this.observer && this.observer.securityCallbacks) {
        this.observer.securityCallbacks.connection = this;
        this.controlTransport.securityCallbacks    = this.observer.securityCallbacks;
      }

      this.controlOutstream = this.controlTransport.openOutputStream(0, 0, 0);
      var controlStream     = this.controlTransport.openInputStream(0, 0, 0);
      this.controlInstream  = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      this.controlInstream.init(controlStream);

      var dataListener = {                                                       // async data listener for the control socket
        data            : "",

        onStartRequest  : function(request, context) { },

        onStopRequest   : function(request, context, status) {
          self.onDisconnect();
        },

        onDataAvailable : function(request, context, inputStream, offset, count) {
          this.data = self.controlInstream.read(count);                          // read data
          self.readControl(this.data);
        }
      };

      var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
      pump.init(controlStream, -1, -1, 0, 0, false);
      pump.asyncRead(dataListener, null);

    } catch(ex) {
      this.onDisconnect();
    }
  },

  getCert : function() {
    try {
      if (this.security) {
        return this.controlTransport.securityInfo.QueryInterface(Components.interfaces.nsISSLStatusProvider)
                                    .SSLStatus.QueryInterface(Components.interfaces.nsISSLStatus)
                                    .serverCert;
      }
    } catch(ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }

    return null;
  },

  checkDataTimeout : function(download, id, bytes) {
    if (this.isConnected && this.transferID == id && this.dataSocket) {
      if ((download && bytes == this.dataSocket.dataListener.bytesDownloaded)
      || (!download && bytes == this.dataSocket.progressEventSink.bytesUploaded)) {
        this.resetConnection();
        return;
      }

      var self      = this;
      var nextBytes = download ? self.dataSocket.dataListener.bytesDownloaded : self.dataSocket.progressEventSink.bytesUploaded;
      var func = function() { self.checkDataTimeout(download, id, nextBytes); };
      setTimeout(func, this.networkTimeout * 1000);
    }
  },

  keepAlive : function() {
    if (this.isConnected && this.keepAliveMode && this.eventQueue.length == 0) {
      this.addEventQueue("NOOP");
      this.writeControl();
    }

    var self = this;
    var func = function() { self.keepAlive(); };
    setTimeout(func, 60000);
  },

  readControl : function(buffer) {
    try {
      buffer = this.toUTF8.convertStringToUTF8(buffer, this.encoding, 1);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }

    if ((buffer == "2" && !this.isConnected) || buffer == "\r\n" || buffer == "\n") {
      return;
    }

    var lastLineOfBuffer = buffer.indexOf("\r\n") != -1 ? buffer.split("\r\n") : buffer.split("\n");
    lastLineOfBuffer     = lastLineOfBuffer.filter(this.removeBlanks);

    if (buffer != "2") {                                                         // "2"s are self-generated fake messages
      for (var x = 0; x < lastLineOfBuffer.length; ++x) {                        // add response to log
        var message   = lastLineOfBuffer[x].charAt(lastLineOfBuffer[x].length - 1) == '\r'
                      ? lastLineOfBuffer[x].substring(0, lastLineOfBuffer[x].length - 1) : lastLineOfBuffer[x];
        var errorBlah = lastLineOfBuffer[x].charAt(0) == '4' || lastLineOfBuffer[x].charAt(0) == '5';
        if (!errorBlah) {
          if (this.observer) {
            this.observer.onAppendLog(message, 'input', "info");
          }
        }
      }

      ++this.networkTimeoutID;
    }

    lastLineOfBuffer = lastLineOfBuffer[lastLineOfBuffer.length - 1];            // we are only interested in what the last line says
    var returnCode;

    if ((lastLineOfBuffer.length > 3 && lastLineOfBuffer.charAt(3) == '-') || lastLineOfBuffer.charAt(0) == ' ') {
      if (this.eventQueue[0].cmd == "USER" || this.eventQueue[0].cmd == "PASS") {
        this.welcomeMessage += buffer;                                           // see if the message is finished or not
      }

      this.fullBuffer += buffer;

      return;
    } else {
      buffer          = this.fullBuffer + buffer;
      this.fullBuffer = '';
      returnCode = parseInt(lastLineOfBuffer.charAt(0));                         // looks at first number of number code
    }

    var cmd;  var parameter;    var callback;   var callback2;

    if (this.eventQueue.length) {
      cmd        = this.eventQueue[0].cmd;
      parameter  = this.eventQueue[0].parameter;
      callback   = this.eventQueue[0].callback;
      callback2  = this.eventQueue[0].callback2;

      if (cmd != "LIST"  && cmd != "RETR"  && cmd != "STOR"  && cmd != "APPE"    // used if we have a loss in connection
       && cmd != "LIST2" && cmd != "RETR2" && cmd != "STOR2" && cmd != "APPE2") {
        var throwAway = this.eventQueue.shift();

        if (throwAway.cmd != "USER"    && throwAway.cmd != "PASS"    && throwAway.cmd != "PWD"     && throwAway.cmd != "FEAT"
         && throwAway.cmd != "welcome" && throwAway.cmd != "goodbye" && throwAway.cmd != "aborted" && throwAway.cmd != "NOOP"
         && throwAway.cmd != "REST"    && throwAway.cmd != "SIZE"    && throwAway.cmd != "PBSZ"    && throwAway.cmd != "AUTH" && throwAway.cmd != "PROT") {
          this.trashQueue.push(throwAway);
        }
      }
    } else {
      cmd = "default";                                                           // an unexpected reply - perhaps a 421 timeout message
    }

    switch (cmd) {
      case "welcome":
        this.welcomeMessage = buffer;

        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onConnectionRefused();
          }

          if (this.type == 'transfer') {
            this.type = 'bad';
          }

          this.cleanup();

          break;
        }

        this.isConnected       = true;                                           // good to go

        if (this.observer) {
          this.observer.onConnected();
        }

        this.isReconnecting    = false;
        this.reconnectsLeft    = parseInt(this.reconnectAttempts);               // setup reconnection settings

        if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
          this.reconnectsLeft = 1;
        }

        this.unshiftEventQueue(  "USER", this.login, "");

        if (this.security) {
          this.unshiftEventQueue("PBSZ", "0",   "");
        }

        if (this.security == "authtls") {
          this.unshiftEventQueue("AUTH", "TLS", "");
        } else if (this.security == "authssl") {
          this.unshiftEventQueue("AUTH", "SSL", "");
        }
        break;

      case "AUTH":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }

          this.isConnected = false;

          this.kill();

          return;
        } else {
          var si = this.controlTransport.securityInfo;
          si.QueryInterface(Components.interfaces.nsISSLSocketControl);
          si.StartTLS();
        }
        break;

      case "PBSZ":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }

          this.isConnected = false;

          this.kill();
          return;
        }
        break;

      case "PROT":
        if (buffer.substring(0, 3) == "534" && parameter == "P") {
          if (this.observer) {
            this.observer.onAppendLog(buffer, 'error', "error");
          }

          this.unshiftEventQueue("PROT", "C", "");
          break;
        }

        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }
        } else {
          this.securityMode = parameter;
        }
        break;

      case "USER":
      case "PASS":
        if (returnCode == 2) {
          if (this.legitClose) {
            if (this.observer) {
              this.observer.onWelcomed();
            }
          }

          var newConnectedHost = this.login + "@" + this.host;

          if (this.observer) {
            this.observer.onLoginAccepted(newConnectedHost != this.connectedHost);
          }

          if (newConnectedHost != this.connectedHost) {
            this.legitClose = true;
          }

          this.connectedHost = newConnectedHost;                                 // switching to a different host or different login

          if (!this.legitClose) {
            this.recoverFromDisaster();                                          // recover from previous disaster
            break;
          }

          this.legitClose   = false;

          this.unshiftEventQueue("PWD",  "", "");
          this.unshiftEventQueue("FEAT", "", "");
        } else if (cmd == "USER" && returnCode == 3) {
          this.unshiftEventQueue("PASS", this.password, "");
        } else {
          if (this.observer && this.type == 'transfer') {
            this.observer.onLoginDenied();
          }

          this.cleanup();                                                        // login failed, cleanup variables

          if (this.observer && this.type != 'transfer' && this.type != 'bad') {
            this.observer.onError(buffer);
          }

          this.isConnected = false;

          this.kill();

          if (this.type == 'transfer') {
            this.type = 'bad';
          }

          if (this.observer && this.type != 'transfer' && this.type != 'bad') {
            var self = this;
            var func = function() { self.observer.onLoginDenied(); };
            setTimeout(func, 0);
          }

          return;
        }
        break;

      case "PASV":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, this.eventQueue[(this.eventQueue[0].cmd == "REST" ? 1 : 0)].parameter));
          }

          if (this.observer && this.eventQueue[0].cmd != "LIST") {
            for (var x = 0; x < this.eventQueue.length; ++x) {
              if (this.eventQueue[x].cmd == "transferEnd") {
                this.observer.onTransferFail(this.eventQueue[x].callback, buffer);
                break;
              }
            }
          }

          if (this.eventQueue[0].cmd == "LIST") {
            this.eventQueue.shift();
          } else {
            while (this.eventQueue.length) {
              if (this.eventQueue[0].cmd == "transferEnd") {
                this.eventQueue.shift();
                break;
              }

              this.eventQueue.shift();
            }
          }

          break;
        }

        if (this.passiveMode) {
          var dataHost;
          var dataPort;

          if (callback2 == 'fxp') {
            callback(buffer.substring(buffer.indexOf("(") + 1, buffer.indexOf(")")));
            return;
          }

          if (this.ipType == "IPv4") {
            buffer           = buffer.substring(buffer.indexOf("(") + 1, buffer.indexOf(")"));
            var re           = /,/g;
            buffer           = buffer.replace(re, ".");                          // parsing the port to transfer to
            var lastDotIndex = buffer.lastIndexOf(".");
            dataPort         = parseInt(buffer.substring(lastDotIndex + 1));
            dataPort        += 256 * parseInt(buffer.substring(buffer.lastIndexOf(".", lastDotIndex - 1) + 1, lastDotIndex));
            dataHost         = buffer.substring(0, buffer.lastIndexOf(".", lastDotIndex - 1));
          } else {
            buffer           = buffer.substring(buffer.indexOf("(|||") + 4, buffer.indexOf("|)"));
            dataPort         = parseInt(buffer);
            dataHost         = this.host;
          }

          var isSecure       = this.security && this.securityMode == "P";
          var proxy          = { proxyType: this.proxyType, proxyHost: this.proxyHost, proxyPort: this.proxyPort };

          var qId;
          for (var x = 0; x < this.eventQueue.length; ++x) {
            if (this.eventQueue[x].cmd == "transferEnd") {
              qId = this.eventQueue[x].callback.id;
              break;
            }
          }

          this.dataSocket          = new ftpDataSocketMozilla(this.host, this.port, isSecure, proxy, dataHost, dataPort,
                                                              this.compressMode == "Z", qId, this.observer, this.getCert(), this.fileMode == 2);

          if (this.eventQueue[0].cmd        == "LIST") {                         // do what's appropriate
            this.dataSocket.connect();
          } else if (this.eventQueue[0].cmd == "RETR") {
            this.dataSocket.connect(false, this.eventQueue[0].callback,           callback);
          } else if (this.eventQueue[0].cmd == "REST") {
            this.dataSocket.connect(false, this.eventQueue[1].callback,           callback, this.eventQueue[0].parameter);
          } else if (this.eventQueue[0].cmd == "STOR") {
            this.dataSocket.connect(true,  this.eventQueue[0].callback,           0,        0);
          } else if (this.eventQueue[0].cmd == "APPE") {
            this.dataSocket.connect(true,  this.eventQueue[0].callback.localPath, 0,        this.eventQueue[0].callback.remoteSize);
          }
        }
        break;

      case "PORT":                                                               // only used with FXP
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, this.eventQueue[(this.eventQueue[0].cmd == "REST" ? 1 : 0)].parameter));
          }

          break;
        }

        break;

      case "APPE":
      case "LIST":
      case "RETR":
      case "STOR":
        this.eventQueue[0].cmd = cmd + "2";

        if (callback2 == 'fxp') {
          if (returnCode == 2) {
            ++this.transferID;
            this.eventQueue.shift();
            if (this.eventQueue.length && this.eventQueue[0].cmd == "transferEnd") {
              this.eventQueue.shift();
            }
            this.trashQueue = new Array();                                       // clear the trash array, completed an 'atomic' set of operations

            if (callback == 'dest' && (!this.fxpHost.eventQueue.length || (this.fxpHost.eventQueue[0].callback2 != 'fxp' && this.fxpHost.eventQueue[0].callback2 != 'fxpList'))) {
              this.disconnect();
            }
            break;
          }

          if (this.fxpHost) {
            this.fxpHost.isReady = true;
            this.fxpHost.writeControlWrapper();
          }
          return;
        }

        if (this.dataSocket.emptyFile) {                                         // XXX empty files are (still) special cases
          this.dataSocket.kill(true);
          this.dataSocket = null;
        }

        if (returnCode == 2) {
          if (this.dataSocket.finished) {
            ++this.transferID;
            this.eventQueue.shift();
            if (this.eventQueue.length && this.eventQueue[0].cmd == "transferEnd") {
              this.eventQueue.shift();
            }
            this.trashQueue = new Array();                                       // clear the trash array, completed an 'atomic' set of operations

            if (cmd == "LIST") {
              this.listData = this.parseListData(this.dataSocket.listData, parameter);

              if (typeof callback == "string") {
                eval(callback);                                                  // send off list data to whoever wanted it
              } else {
                callback();
              }
            }

            if (callback2) {                                                     // for transfers
              if (typeof callback2 == "string") {
                eval(callback2);
              } else {
                callback2();
              }
            }

            this.dataSocket = null;

            break;
          } else {
            var self = this;
            var func = function() { self.readControl("2"); };
            setTimeout(func, 500);                                               // give data stream some time to finish up
            return;
          }
        }

        if (returnCode != 1) {
          if (this.observer) {
            this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          }

          this.eventQueue.shift();
          while (this.eventQueue.length && (this.eventQueue[0].cmd == "MDTM" || this.eventQueue[0].cmd == "XMD5" || this.eventQueue[0].cmd == "XSHA1" || this.eventQueue[0].cmd == "transferEnd")) {
            if (this.eventQueue[0].cmd == "transferEnd" && this.observer) {
              this.observer.onTransferFail(this.eventQueue[0].callback, buffer);
            }

            this.eventQueue.shift();
          }
          this.trashQueue = new Array();

          if (this.dataSocket) {
            this.dataSocket.kill();
            this.dataSocket = null;
          }

          break;
        }
        return;

      case "APPE2":
      case "RETR2":
      case "STOR2":
      case "LIST2":
        if (callback2 == 'fxp') {
          if (returnCode != 2) {
            if (this.observer) {
              this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
            }
          }

          ++this.transferID;
          this.eventQueue.shift();
          if (this.eventQueue.length && this.eventQueue[0].cmd == "transferEnd") {
            this.eventQueue.shift();
          }
          this.trashQueue = new Array();                                         // clear the trash array, completed an 'atomic' set of operations

          if (callback == 'dest' && (!this.fxpHost.eventQueue.length || (this.fxpHost.eventQueue[0].callback2 != 'fxp' && this.fxpHost.eventQueue[0].callback2 != 'fxpList'))) {
            this.disconnect();
          }
          break;
        }

        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          }

          this.eventQueue.shift();
          while (this.eventQueue.length && (this.eventQueue[0].cmd == "MDTM" || this.eventQueue[0].cmd == "XMD5" || this.eventQueue[0].cmd == "XSHA1" || this.eventQueue[0].cmd == "transferEnd")) {
            if (this.eventQueue[0].cmd == "transferEnd" && this.observer) {
              this.observer.onTransferFail(this.eventQueue[0].callback, buffer);
            }

            this.eventQueue.shift();
          }
          this.trashQueue = new Array();

          if (this.dataSocket) {
            this.dataSocket.kill();
            this.dataSocket = null;
          }
          break;
        }

        if (!this.dataSocket || this.dataSocket.finished) {
          ++this.transferID;
          this.eventQueue.shift();
          if (this.eventQueue.length && this.eventQueue[0].cmd == "transferEnd") {
            this.eventQueue.shift();
          }
          this.trashQueue = new Array();                                         // clear the trash array, completed an 'atomic' set of operations
        }

        if (cmd == "LIST2" && this.dataSocket.finished) {
          this.listData = this.parseListData(this.dataSocket.listData, parameter);
          this.dataSocket = null;

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        } else if ((!this.dataSocket || this.dataSocket.finished) && callback2) { // for transfers
          this.dataSocket = null;
          if (typeof callback2 == "string") {
            eval(callback2);
          } else {
            callback2();
          }
        } else if (this.dataSocket && !this.dataSocket.finished) {
          var self = this;
          var func = function() { self.readControl("2"); };
          setTimeout(func, 500);                                                 // give data stream some time to finish up
          return;
        } else if (this.dataSocket && this.dataSocket.finished) {
          this.dataSocket = null;
        }
        break;

      case "SIZE":
        if (returnCode == 2) {                                                   // used with APPE commands to see where to pick up from
          var size = buffer.split(" ").filter(this.removeBlanks);
          size     = parseInt(size[1]);

          for (var x = 0; x < this.eventQueue.length; ++x) {
            if (callback == this.eventQueue[x].cmd) {
              if (callback == "STOR") {
                this.eventQueue[x].cmd      = "APPE";
                this.eventQueue[x].callback = { localPath: this.eventQueue[x].callback,           remoteSize: size };
              } else if (callback == "APPE") {
                this.eventQueue[x].callback = { localPath: this.eventQueue[x].callback.localPath, remoteSize: size };
              } else if (callback == "PASV") {
                this.eventQueue[x].callback = size;
              }

              break;
            }
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          if (callback != "PASV") {
            for (var x = 0; x < this.eventQueue.length; ++x) {
              if (this.eventQueue[x].cmd == "APPE") {
                this.eventQueue[x].cmd      = "STOR";
                this.eventQueue[x].callback = this.eventQueue[x].callback.localPath;
                break;
              }
            }
          }

          if (this.observer) {
            this.observer.onAppendLog(buffer, 'error', "error");
          }
        }
        break;

      case "XMD5":
      case "XSHA1":
        if (returnCode == 2) {
          var zeHash = buffer.split(" ").filter(this.removeBlanks);
          zeHash     = zeHash[1].replace(/\n|\r/g, "").toLowerCase();

          if (typeof callback == "function") {
            callback(zeHash);
            break;
          }

          try {
            var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(callback);
            var cryptoHash = cmd == "XMD5" ? Components.interfaces.nsICryptoHash.MD5 : Components.interfaces.nsICryptoHash.SHA1;
            var fstream    = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            fstream.init(file, 1, 0, false);
            var gHashComp  = Components.classes["@mozilla.org/security/hash;1"].createInstance(Components.interfaces.nsICryptoHash);
            gHashComp.init(cryptoHash);
            gHashComp.updateFromStream(fstream, -1);
            var ourHash    = this.binaryToHex(gHashComp.finish(false)).toLowerCase();
            fstream.close();

            if (ourHash != zeHash) {
              if (this.observer) {
                this.observer.onError("'" + callback + "' - " + this.errorXCheckFail);

                for (var x = 0; x < this.eventQueue.length; ++x) {
                  if (this.eventQueue[x].cmd == "transferEnd") {
                    this.observer.onTransferFail(this.eventQueue[x].callback, "checksum");
                    break;
                  }
                }
              }
            }
          } catch (ex) {
            if (this.observer) {
              this.observer.onDebug(ex);
            }
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          if (this.observer) {
            this.observer.onAppendLog(buffer, 'error', "error");
          }
        }
        break;

      case "MDTM":
        if (returnCode == 2) {
          var zeDate = buffer.split(" ").filter(this.removeBlanks);
          zeDate     = zeDate[1];
          try {
            var fileHandler = UrlUtils.getFileProtocolHandler();
            var file = fileHandler.getFileFromURLSpec(callback).QueryInterface(Components.interfaces.nsILocalFile);
            file.lastModifiedTime = Date.parse(zeDate.substr(0, 4) + " " + zeDate.substr(4,  2) + " " + zeDate.substr(6,  2) + " "
                                             + zeDate.substr(8, 2) + ":" + zeDate.substr(10, 2) + ":" + zeDate.substr(12, 2) + " GMT");
          } catch (ex) {
            if (this.observer) {
              this.observer.onDebug(ex);
            }
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          if (this.observer) {
            this.observer.onAppendLog(buffer, 'error', "error");
          }
        }
        break;

      case "RNFR":
      case "REST":
        if (returnCode != 3) {
          if (cmd == "RNFR") {
            this.eventQueue = new Array();
            this.trashQueue = new Array();
          }

          if (this.observer) {
            this.observer.onError(buffer);                                       // should still be able to go on without this, just not with resuming
          }

          break;
        }
        break;

      case "MKD":
      case "SITE CHMOD":
      case "RNTO":
      case "DELE":
      case "RMD":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          }
        } else {
          if (cmd == "RMD") {                                                    // clear out of cache if it's a remove directory
            this.removeCacheEntry(this.constructPath(this.currentWorkingDir, parameter));
          }

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        }

        this.trashQueue = new Array();
        break;

      case "CWD":
        if (returnCode != 2) {                                                   // if it's not a directory
          if (callback && typeof callback == "function") {
            callback(false);
          } else if (this.type == 'transfer') {
            this.observer.onDebug(buffer);
            this.unshiftEventQueue(cmd, parameter, callback, callback2);

            var self = this;
            var func = function() { self.nextCommand(); };
            setTimeout(func, 500);                                               // give main connection time to create the directory
            return;
          } else if (this.observer) {
            this.observer.onDirNotFound(buffer);

            if (this.observer) {
              this.observer.onError(buffer);
            }
          }
        } else {
          this.currentWorkingDir = parameter;

          if (this.observer) {                                                   // else navigate to the directory
            this.observer.onChangeDir(parameter, typeof callback == "boolean" ? callback : "");
          }

          if (callback && typeof callback == "function") {
            callback(true);
          }
        }
        break;

      case "PWD":                                                                // gotta check for chrooted directories
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }
        } else {
          buffer = buffer.substring(buffer.indexOf("\"") + 1, buffer.lastIndexOf("\""));              // if buffer is not '/' we're chrooted
          this.currentWorkingDir = buffer;

          if (this.observer) {
            this.observer.onChangeDir(buffer != '/' && this.initialPath == '' ? buffer : '', false, buffer != '/' || this.initialPath != '');
          }

          if (this.type == 'fxp') {
            this.list(this.initialPath ? this.initialPath : this.currentWorkingDir);
          }
        }

        this.trashQueue = new Array();
        break;

      case "FEAT":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onAppendLog(buffer, 'error', "error");
          }
        } else {
          // XXX glazou: following line is wrong because some servers use both \r\n and \n
          //buffer = buffer.indexOf("\r\n") != -1 ? buffer.split("\r\n") : buffer.split("\n");
          buffer = buffer.replace(/\\r\\n/g, "\n").split("\n");

          for (var x = 0; x < buffer.length; ++x) {
            if (buffer[x] && buffer[x][0] == ' ') {
              var feat = buffer[x].trim().toUpperCase();
              if (feat == "MDTM") {
                this.featMDTM   = true;
              } else if (feat == "MLSD") {
                this.featMLSD   = true;
              } else if (feat.indexOf("MODE Z") == 0) {
                this.featModeZ  = true;
              } else if (feat.indexOf("XSHA1") == 0) {
                this.featXCheck = "XSHA1";
                this.featXSHA1  = true;
              } else if (feat.indexOf("XMD5") == 0 && !this.featXCheck) {
                this.featXCheck = "XMD5";
              }

              if (feat.indexOf("XMD5") == 0) {
                this.featXMD5  = true;
              }
            }
          }
        }
        break;

      case "aborted":
        break;

      case "TYPE":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }
        } else {
          this.transferMode = parameter;
        }
        break;
      case "MODE":
        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }
        } else {
          this.compressMode = parameter;
        }
        break;
      case "goodbye":                                                            // you say yes, i say no, you stay stop...
      case "NOOP":
      default:
        if (buffer.substring(0, 3) != "421" && returnCode != 2) {
          if (this.observer) {
            this.observer.onError(buffer);
          }
        }
        break;
    }

    this.nextCommand();
  },

  nextCommand : function() {
    this.isReady = true;

    if (this.observer) {
      this.observer.onIsReadyChange(true);
    }

    if (this.eventQueue.length && this.eventQueue[0].cmd != "welcome") {         // start the next command
      this.writeControl();
    } else {
      this.refresh();
    }
  },

  changeWorkingDirectory : function(path, callback) {
    this.addEventQueue("CWD", path, callback);
    this.writeControlWrapper();
  },

  makeDirectory : function(path, callback) {
    this.addEventQueue("CWD", path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("MKD", path.substring(path.lastIndexOf('/') + 1), callback);
    this.writeControlWrapper();
  },

  makeBlankFile : function(path, callback) {
    this.addEventQueue("CWD", path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);

    try {
      var count = 0;
      let tmpFile = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsILocalFile);
      tmpFile.append(count + '-blankFile');
      while (tmpFile.exists()) {
        ++count;
        tmpFile.leafName = count + '-blankFile';
      }
      var foutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      foutstream.init(tmpFile, 0x04 | 0x08 | 0x20, 0644, 0);
      foutstream.write("", 0);
      foutstream.close();

      this.upload(tmpFile.path, path, false, 0, 0, callback, true);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }
  },

  remove : function(isDirectory, path, callback) {
    if (isDirectory) {
      this.unshiftEventQueue("RMD",    path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("CWD",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
      this.unshiftEventQueue("CWD",    path.replace(/[^\/]+/g , ".."), true);

      var self         = this;
      var listCallback = function() { self.removeRecursive(path); };
      this.list(path, listCallback, true, true);
    } else {
      this.unshiftEventQueue("DELE",   path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("CWD",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    }

    this.writeControlWrapper();
  },

  removeRecursive : function(parent) {                                           // delete subdirectories and files
    var files = this.listData;

    for (var x = 0; x < files.length; ++x) {
      var remotePath = this.constructPath(parent, files[x].leafName);

      if (files[x].isDirectory()) {                                              // delete a subdirectory recursively
        this.unshiftEventQueue("RMD",  remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("CWD",  parent, true);
        this.removeRecursiveHelper(remotePath);
      } else {                                                                   // delete a file
        this.unshiftEventQueue("DELE", remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("CWD",  parent, true);
      }
    }
  },

  removeRecursiveHelper : function(remotePath) {
    var self           = this;
    var listCallback   = function() { self.removeRecursive(remotePath); };
    this.list(remotePath, listCallback, true, true);
  },

  rename : function(oldName, newName, callback, isDir) {
    if (isDir) {
      this.removeCacheEntry(oldName);
    }

    this.addEventQueue("RNFR", oldName);                                         // rename the file
    this.addEventQueue("RNTO", newName, callback);
    this.writeControlWrapper();
  },

  changePermissions : function(permissions, path, callback) {
    this.addEventQueue("CWD",        path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("SITE CHMOD", permissions + ' ' + path.substring(path.lastIndexOf('/') + 1), callback);
    this.writeControlWrapper();
  },

  custom : function(cmd) {
    this.addEventQueue(cmd);
    this.writeControlWrapper();
  },

  list : function(path, callback, skipCache, recursive, fxp) {
    if (!skipCache && this.sessionsMode) {
      if (this.cacheHit(path, callback)) {
        return;
      }
    }

    var callback2 = fxp ? 'fxpList' : '';

    if (recursive) {
      this.unshiftEventQueue(  "LIST", path, callback, callback2);
      this.unshiftEventQueue(  "PASV",   "", "",       callback2);
      this.unshiftEventQueue(  "CWD",  path, "",       callback2);

      if (this.security) {
        this.unshiftEventQueue("PROT",  "P", "",       callback2);
      }

      this.unshiftEventQueue(  "MODE",  this.useCompression && this.featModeZ ? "Z" : "S", null, callback2);
      this.unshiftEventQueue(  "TYPE",  "A", "",       callback2);
    } else {
      this.addEventQueue(      "TYPE",  "A", "",       callback2);
      this.addEventQueue(      "MODE",  this.useCompression && this.featModeZ ? "Z" : "S", null, callback2);

      if (this.security) {
        this.addEventQueue(    "PROT",  "P", "",       callback2);
      }

      this.addEventQueue(      "CWD",  path, "",       callback2);
      this.addEventQueue(      "PASV",   "", "",       callback2);
      this.addEventQueue(      "LIST", path, callback, callback2);
    }

    this.writeControlWrapper();
  },

  download : function(remotePath, localPath, remoteSize, resume, localSize, isSymlink, callback, disableMDTM) {
    ++this.queueID;
    var id = this.connNo + "-" + this.queueID;

    this.addEventQueue("transferBegin", "", { id: id });

    this.addEventQueue(  "CWD",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    var ascii    = this.detectAscii(remotePath);

    this.addEventQueue(  "TYPE", ascii);

    this.addEventQueue(  "MODE", this.useCompression && this.featModeZ ? "Z" : "S");

    if (isSymlink) {
      this.addEventQueue("SIZE", leafName, "PASV");  // need to do a size check
    }

    if (this.security) {
      this.addEventQueue("PROT", "P");
    }

    this.addEventQueue(  "PASV", "", remoteSize, remoteSize);

    if (resume && ascii != 'A') {
      this.addEventQueue("REST", localSize);
    }

    this.addEventQueue(  "RETR", leafName, localPath, callback);

    if (this.integrityMode && this.featXCheck && ascii != 'A') {
      this.addEventQueue(this.featXCheck, '"' + leafName + '"', localPath);
    }

    if (this.timestampsMode && this.featMDTM && !disableMDTM) {
      this.addEventQueue("MDTM", leafName, localPath);
    }

    this.addEventQueue("transferEnd", "", { localPath: localPath, remotePath: remotePath, size: remoteSize, transport: 'ftp', type: 'download', ascii: ascii, id: id });

    this.writeControlWrapper();
  },

  upload : function(localPath, remotePath, resume, localSize, remoteSize, callback, disableMDTM) {
    ++this.queueID;
    var id = this.connNo + "-" + this.queueID;

    this.addEventQueue("transferBegin", "", { id: id });

    this.addEventQueue(  "CWD",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    var ascii    = this.detectAscii(remotePath);

    this.addEventQueue(  "TYPE", ascii);

    this.addEventQueue(  "MODE", this.useCompression && this.featModeZ && ascii != 'A' ? "Z" : "S");  // XXX can't do compression with ascii mode in upload currently

    if (resume && ascii != 'A') {
      this.addEventQueue("SIZE", leafName, "APPE");                              // need to do a size check
    }

    if (this.security) {
      this.addEventQueue("PROT", "P");
    }

    this.addEventQueue(  "PASV", null, null, localSize);

    if (resume && ascii != 'A') {
      this.addEventQueue("APPE", leafName, { localPath: localPath, remoteSize: remoteSize }, callback);
    } else {
      this.addEventQueue("STOR", leafName,   localPath, callback);
    }

    if (this.integrityMode && this.featXCheck && ascii != 'A') {
      this.addEventQueue(this.featXCheck, '"' + leafName + '"', localPath);
    }

    if (this.timestampsMode && this.featMDTM && !disableMDTM) {
      this.addEventQueue("MDTM", leafName, localPath);
    }

    this.addEventQueue("transferEnd", "", { localPath: localPath, remotePath: remotePath, size: localSize, transport: 'ftp', type: 'upload', ascii: ascii, id: id });

    this.writeControlWrapper();

    return id;
  },

  fxp : function(hostPath, destPath, resume, destSize, hostSize) {
    ++this.fxpHost.queueID;
    var id = this.fxpHost.connNo + "-" + this.fxpHost.queueID;

    var leafName = hostPath.substring(hostPath.lastIndexOf('/') + 1);

    var self = this;
    var func = function(hostPort) { self.fxpCallback(hostPort, destPath, resume, destSize, id); };

    this.fxpHost.addEventQueue("transferBegin", "", { id: id }, 'fxp');

    this.fxpHost.addEventQueue(  "CWD",  hostPath.substring(0, hostPath.lastIndexOf('/') ? hostPath.lastIndexOf('/') : 1), true, 'fxp');

    var ascii = this.detectAscii(hostPath);

    this.fxpHost.addEventQueue(  "TYPE", ascii, null, 'fxp');

    this.fxpHost.addEventQueue(  "MODE", this.useCompression && this.fxpHost.featModeZ && this.featModeZ ? "Z" : "S", null, 'fxp');

    if (resume && ascii != 'A') {
      this.fxpHost.addEventQueue("REST", destSize, null, 'fxp');
    }

    this.fxpHost.addEventQueue(  "PASV", "", func, 'fxp');

    this.fxpHost.addEventQueue(  "RETR", leafName, 'host', 'fxp');

    this.fxpHost.addEventQueue("transferEnd", "",  { localPath: hostPath, remotePath: destPath, size: hostSize, transport: 'fxp', type: 'fxp', ascii: ascii, id: id }, 'fxp');

    this.fxpHost.writeControlWrapper();
  },

  fxpCallback : function(hostPort, destPath, resume, destSize, id) {
    var leafName = destPath.substring(destPath.lastIndexOf('/') + 1);

    this.fxpHost.addEventQueue("transferBegin", "", { id: id }, 'fxp');

    this.addEventQueue(   "CWD",  destPath.substring(0, destPath.lastIndexOf('/') ? destPath.lastIndexOf('/') : 1), true, 'fxp');

    this.addEventQueue(   "TYPE", this.detectAscii(leafName), null, 'fxp');

    this.addEventQueue(   "MODE", this.useCompression && this.fxpHost.featModeZ && this.featModeZ ? "Z" : "S", null, 'fxp');

    if (resume) {
      this.addEventQueue( "REST", destSize, null, 'fxp');
    }

    this.addEventQueue(   "PORT", hostPort, null, 'fxp');

    this.addEventQueue(   "STOR", leafName, 'dest', 'fxp');

    this.fxpHost.addEventQueue("transferEnd", "",  { transport: 'fxp', type: 'fxp', id: id }, 'fxp');

    this.writeControlWrapper();
  },

  isListing : function() {                                                       // check queue to see if we're listing
    for (var x = 0; x < this.eventQueue.length; ++x) {
      if (this.eventQueue[x].cmd.indexOf("LIST") != -1) {
        return true;
      }
    }

    return false;
  },

  recoverFromDisaster : function() {                                             // after connection lost, try to restart queue
    if (this.eventQueue.length && this.eventQueue[0].cmd == "goodbye") {
      this.eventQueue.shift();
    }

    if (this.eventQueue.cmd) {
      this.eventQueue = new Array(this.eventQueue);
    }

    while (this.eventQueue.length && (this.eventQueue[0].callback2 == "fxp" || this.eventQueue[0].callback2 == "fxpList")) {
      this.eventQueue.shift();
    }

    if (this.eventQueue.length && (this.eventQueue[0].cmd == "LIST" || this.eventQueue[0].cmd == "LIST2"
                               ||  this.eventQueue[0].cmd == "RETR" || this.eventQueue[0].cmd == "RETR2"
                               ||  this.eventQueue[0].cmd == "REST" || this.eventQueue[0].cmd == "APPE"
                               ||  this.eventQueue[0].cmd == "STOR" || this.eventQueue[0].cmd == "STOR2"
                               ||  this.eventQueue[0].cmd == "PASV" || this.eventQueue[0].cmd == "APPE2"
                               ||  this.eventQueue[0].cmd == "SIZE")) {
      var cmd       = this.eventQueue[0].cmd;
      var parameter = this.eventQueue[0].parameter;
      if (cmd == "LIST2" || cmd == "RETR2" || cmd == "STOR2" || cmd == "APPE2") {
        this.eventQueue[0].cmd = this.eventQueue[0].cmd.substring(0, 4);
      }

      cmd = this.eventQueue[0].cmd;

      if (cmd == "REST") {                                                       // set up resuming for these poor interrupted transfers
        try {
          var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
          file.initWithPath(this.eventQueue[1].callback);

          if (file.fileSize) {
            this.eventQueue[0].parameter = file.fileSize;
          }
        } catch (ex) {
          if (this.observer) {
            this.observer.onDebug(ex);
          }
        }
      } else if (cmd == "RETR") {
        try {
          var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
          file.initWithPath(this.eventQueue[0].callback);

          if (file.fileSize) {
            this.unshiftEventQueue("REST", file.fileSize, "");
          }
        } catch (ex) {
          if (this.observer) {
            this.observer.onDebug(ex);
          }
        }
      }

      for (var x = this.trashQueue.length - 1; x >= 0; --x) {                    // take cmds out of the trash and put them back in the eventQueue
        if (this.trashQueue[x].cmd == "TYPE" && (cmd == "STOR" || cmd == "APPE")) {   // more resuming fun - this time for the stor/appe commandds
          this.unshiftEventQueue("SIZE", parameter, cmd);
        }

        this.eventQueue.unshift(this.trashQueue[x]);
      }
    } else if (this.eventQueue.length && this.eventQueue[0].cmd == "RNTO" && this.trashQueue[this.trashQueue.length - 1].cmd == "RNFR") {
      this.unshiftEventQueue("RNFR", this.trashQueue[this.trashQueue.length - 1].parameter);
    }

    if (this.currentWorkingDir) {
      this.unshiftEventQueue("CWD", this.currentWorkingDir, true);
      this.currentWorkingDir = "";
    }

    this.trashQueue = new Array();
  }
};

function ftpDataSocketMozilla(controlHost, controlPort, security, proxy, host, port, compress, id, observer, cert, asciiMode) {
  this.transportService  = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
  this.proxyService      = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService  (Components.interfaces.nsIProtocolProxyService);
  this.dnsService        = Components.classes["@mozilla.org/network/dns-service;1"].getService             (Components.interfaces.nsIDNSService);
  this.eventTarget       = Components.classes["@mozilla.org/thread-manager;1"].getService                  ().currentThread;
  this.security          = security || false;
  this.host              = (security ? controlHost : (host || ""));
  this.port              = port     || -1;
  this.proxyType         = proxy ? proxy.proxyType : "";
  this.proxyHost         = proxy ? proxy.proxyHost : "";
  this.proxyPort         = proxy ? proxy.proxyPort : -1;
  this.useCompression    = compress;
  this.dataListener      = new dataListener();
  this.progressEventSink = new progressEventSink();
  this.id                = id;
  this.observer          = observer;
  this.asciiMode         = asciiMode;

  if (security) {
    try {
      this.certOverride = Components.classes["@mozilla.org/security/certoverride;1"].getService(Components.interfaces.nsICertOverrideService);
      var hashAlg = {};  var fingerprint = {};  var overrideBits = {};  var isTemporary = {};
      var ok = this.certOverride.getValidityOverride(controlHost, controlPort, hashAlg, fingerprint, overrideBits, isTemporary);

      this.certOverride.rememberValidityOverride(this.host, port, cert, overrideBits.value, true);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }
  }
}

ftpDataSocketMozilla.prototype = {
  dataTransport : null,
  dataInstream  : null,
  dataOutstream : null,
  fileInstream  : null,
  serverSocket  : null,

  listData      : "",
  finished      : true,

  emptyFile     : false,                                                                    // XXX empty files are (still) special cases

  connect : function(write, localPath, fileTotalBytes, filePartialBytes, activeTransport) {
    try {
      if (activeTransport) {
        this.dataTransport = activeTransport;
      } else {
        var proxyInfo = this.proxyType == "" ? null : this.proxyService.newProxyInfo(this.proxyType, this.proxyHost, this.proxyPort, 0, 30, null);

        if (this.security) {
          this.dataTransport = this.transportService.createTransport(["ssl"], 1, this.host, this.port, proxyInfo);
        } else {
          this.dataTransport = this.transportService.createTransport(null,    0, this.host, this.port, proxyInfo);
        }
      }

      this.finished = false;

      if (write)  {                                                                         // upload
        this.dataOutstream  = this.dataTransport.openOutputStream(0, 0, -1);
        var file;

        try {
          file              = UrlUtils.newLocalFile(localPath);
          this.fileInstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance();
          this.fileInstream.QueryInterface(Components.interfaces.nsIFileInputStream);
          this.fileInstream.init(file, 0x01, 0644, 0);
          this.fileInstream.QueryInterface(Components.interfaces.nsISeekableStream);
          this.fileInstream.seek(0, filePartialBytes);                                      // append or not to append
        } catch (ex) {
          if (this.observer) {
            this.observer.onDebug(ex);
          }

          if (this.observer) {
            this.observer.onError(gStrbundle.getFormattedString("failedUpload", [localPath]));
          }

          this.kill();
          return;
        }

        var binaryOutstream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
        binaryOutstream.setOutputStream(this.dataOutstream);

        this.dataInstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
        this.dataInstream.setInputStream(this.fileInstream);

        this.progressEventSink.parent        = this;
        this.progressEventSink.localPath     = localPath;
        this.progressEventSink.sendPrevSent  = 0;
        this.progressEventSink.timeStart     = new Date();
        this.progressEventSink.bytesTotal    = file.fileSize;
        this.progressEventSink.bytesUploaded = this.useCompression ? 0 : filePartialBytes;
        this.progressEventSink.bytesPartial  = filePartialBytes;
        this.progressEventSink.dataInstream  = this.dataInstream;
        this.progressEventSink.dataOutstream = binaryOutstream;
        this.progressEventSink.fileInstream  = this.fileInstream;
        this.progressEventSink.asciiMode     = this.asciiMode;
        this.emptyFile                       = !file.fileSize;

        this.dataTransport.setEventSink(this.progressEventSink, this.eventTarget);

        if (this.useCompression && file.fileSize) {                                         // never as elegant as downloading :(
          this.progressEventSink.compressStream = true;

          var streamConverter = Components.classes["@mozilla.org/streamconv;1?from=uncompressed&to=deflate"].createInstance(Components.interfaces.nsIStreamConverter);
          streamConverter.asyncConvertData("uncompressed", "deflate", this.progressEventSink, null);

          var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
          pump.init(this.dataInstream, -1, -1, 0, 0, false);
          pump.asyncRead(streamConverter, null);
        } else {
          var dataBuffer = this.dataInstream.readBytes(this.dataInstream.available() < 4096 ? this.dataInstream.available() : 4096);

          var diff = dataBuffer.length;

          if (this.asciiMode) {
            dataBuffer = dataBuffer.replace(/(^|[^\r])\n/g, "$1\r\n");
          }

          this.progressEventSink.bytesTotal += dataBuffer.length - diff;

          this.progressEventSink.dataOutstream.writeBytes(dataBuffer, dataBuffer.length);
        }
      } else {                                                                              // download
        this.listData                     = "";
        var dataStream                    = this.dataTransport.openInputStream(0, 0, 0);

        var streamConverter;
        this.dataInstream                 = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
        if (this.useCompression) {
          streamConverter = Components.classes["@mozilla.org/streamconv;1?from=deflate&to=uncompressed"].createInstance(Components.interfaces.nsIStreamConverter);
          streamConverter.asyncConvertData("deflate", "uncompressed", this.dataListener, null);
        } else {
          this.dataInstream.setInputStream(dataStream);
        }

        this.dataListener.parent          = this;
        this.dataListener.localPath       = localPath;
        this.dataListener.dataInstream    = this.dataInstream;
        this.dataListener.data            = "";
        this.dataListener.file            = "";
        this.dataListener.fileOutstream   = "";
        this.dataListener.binaryOutstream = "";
        this.dataListener.bytesTotal      = fileTotalBytes   || 0;
        this.dataListener.bytesDownloaded = filePartialBytes || 0;
        this.dataListener.bytesPartial    = filePartialBytes || 0;
        this.dataListener.timeStart       = new Date();
        this.dataListener.dataBuffer      = "";
        this.dataListener.isNotList       = localPath != null;
        this.dataListener.useCompression  = this.useCompression;
        this.dataListener.asciiMode       = this.asciiMode;

        var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
        pump.init(dataStream, -1, -1, 0, 0, false);
        pump.asyncRead(this.useCompression ? streamConverter : this.dataListener, null);
      }

    } catch(ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }

      if (this.observer) {
        this.observer.onError(gStrbundle.getString("errorDataConn"));
      }

      return;
    }
  },

  createServerSocket : function(activeInfo) {
    try {
      var ipAddress      = this.dnsService.resolve(this.dnsService.myHostName, false).getNextAddrAsString();
      var re             = /\x2e/g;
      this.serverSocket  = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);

      var self = this;
      var serverListener = {
        onSocketAccepted : function(serv, transport) {
          if (activeInfo.cmd == "LIST") {
            self.connect(false, null,                  0,                    0,                       transport);
          } else if (activeInfo.cmd == "RETR") {
            self.connect(false, activeInfo.localPath, activeInfo.totalBytes, 0,                       transport);
          } else if (activeInfo.cmd == "REST") {
            self.connect(false, activeInfo.localPath, activeInfo.totalBytes, activeInfo.partialBytes, transport);
          } else if (activeInfo.cmd == "STOR") {
            self.connect(true,  activeInfo.localPath, 0,                     0,                       transport);
          } else if (activeInfo.cmd == "APPE") {
            self.connect(true,  activeInfo.localPath, 0,                     activeInfo.partialBytes, transport);
          }
        },

        onStopListening : function(serv, status) { }
      };

      this.serverSocket.init(this.port, false, -1);
      this.serverSocket.asyncListen(serverListener);

      if (activeInfo.ipType == "IPv4" && ipAddress.indexOf(':') == -1) {
        return ipAddress.replace(re, ",") + "," + parseInt(this.serverSocket.port / 256) + "," + this.serverSocket.port % 256;
      } else {
        return (ipAddress.indexOf(':') != -1 ? "|2|" : "|1|") + ipAddress + "|" + this.serverSocket.port + "|";
      }
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }

      if (this.observer) {
        this.observer.onError(gStrbundle.getString("errorDataConn"));
      }

      return null;
    }
  },

  kill : function(override) {
    this.progressEventSink.bytesTotal = 0;                                                  // stop uploads
    this.dataListener.bytesTotal      = 0;                                                  // stop downloads

    try {
      if (this.dataInstream && this.dataInstream.close) {
        this.dataInstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override) && this.dataOutstream && this.dataOutstream.flush) {
        this.dataOutstream.flush();
      }

      if ((!this.emptyFile || override) && this.dataOutstream && this.dataOutstream.close) {
        this.dataOutstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override) && this.fileInstream && this.fileInstream.close) {
        this.fileInstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override)) {                                                  // XXX empty files are (still) special cases
        if (this.dataTransport && this.dataTransport.close) {
          this.dataTransport.close("Finished");
        }
      }
    } catch(ex) { }

    try {
      if (this.dataListener.binaryOutstream && this.dataListener.binaryOutstream.close) {
        this.dataListener.binaryOutstream.close();
      }
    } catch(ex) { }

    try {
      if (this.dataListener.fileOutstream && this.dataListener.fileOutstream.close) {
        this.dataListener.fileOutstream.close();
      }
    } catch(ex) { }

    try {
      if (this.serverSocket && this.serverSocket.close) {
        this.serverSocket.close();
      }
    } catch(ex) { }

    this.progressEventSink.parent     = null;                                               // stop memory leakage!
    this.dataListener.parent          = null;                                               // stop memory leakage!

    this.finished  = true;

    if (this.security) {
      try {
        this.certOverride.clearValidityOverride(this.host, this.port);
      } catch (ex) {
        if (this.observer) {
          this.observer.onDebug(ex);
        }
      }
    }
  }
};

function dataListener() { }

dataListener.prototype = {
  parent           : null,
  localPath        : "",
  dataInstream     : "",
  data             : "",
  file             : "",
  fileOutstream    : "",
  binaryOutstream  : "",
  bytesTotal       : 0,
  bytesDownloaded  : 0,
  bytesPartial     : 0,
  timeStart        : new Date(),
  dataBuffer       : "",
  isNotList        : false,
  useCompression   : false,
  asciiMode        : false,

  onStartRequest : function(request, context) {
    if (this.isNotList) {
      this.timeStart = new Date();

      try {
        this.file          = UrlUtils.newLocalFile(this.localPath);
        this.fileOutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

        if (this.bytesPartial) {
          this.fileOutstream.init(this.file, 0x04 | 0x10, 0644, 0);
        } else {
          this.fileOutstream.init(this.file, 0x04 | 0x08 | 0x20, 0644, 0);
        }

        this.binaryOutstream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
        this.binaryOutstream.setOutputStream(this.fileOutstream);
      } catch (ex) {
        this.failure(ex);
      }
    }
  },

  onStopRequest : function(request, context, status) {
    if (!this.isNotList && this.parent) {
      this.parent.listData = this.data;
    }

    if (this.parent) {
      this.parent.kill();
    }
  },

  onDataAvailable : function(request, context, inputStream, offset, count) {
    if (this.useCompression) {
      this.dataInstream.setInputStream(inputStream);
    }

    if (this.isNotList) {
      try {
        this.dataBuffer = this.dataInstream.readBytes(count);

        var length = this.dataBuffer.length;

        if (this.asciiMode && this.getPlatform() != "windows") {
          this.dataBuffer = this.dataBuffer.replace(/\r\n/g, '\n');
        }

        this.binaryOutstream.writeBytes(this.dataBuffer, this.dataBuffer.length)
        this.bytesDownloaded += length;
      } catch (ex) {
        this.failure(ex);
      }
    } else {
      this.data += this.dataInstream.readBytes(count);
    }
  },

  failure : function(ex) {
    if (this.parent.observer) {
      this.parent.observer.onDebug(ex);
    }

    if (this.parent.observer) {
      this.parent.observer.onError(gStrbundle.getFormattedString("failedSave", [this.localPath]));
    }

    this.parent.kill();
  },

  getPlatform : function() {
    var platform = navigator.platform.toLowerCase();

    if (platform.indexOf('linux') != -1) {
      return 'linux';
    }

    if (platform.indexOf('mac') != -1) {
      return 'mac';
    }

    return 'windows';
  }
};

function progressEventSink() { }

progressEventSink.prototype = {
  parent         : null,
  localPath      : "",
  bytesTotal     : 0,
  sendPrevSent   : 0,
  bytesUploaded  : 0,
  timeStart      : new Date(),
  bytesPartial   : 0,
  dataOutstream  : null,
  fileInstream   : null,
  compressFirst  : true,
  compressStream : false,
  compressTotal  : 0,
  compressDone   : false,
  compressBuffer : "",
  asciiMode      : false,

  onStartRequest  : function(request, context) { },
  onStopRequest   : function(request, context, status) {
    this.compressDone = true;
  },

  onDataAvailable : function(request, context, inputStream, offset, count) {
    try {
      var dataInstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
      dataInstream.setInputStream(inputStream);
      this.compressTotal  += count;
      this.compressBuffer += dataInstream.readBytes(count);

      if (this.compressFirst) {
        this.compressFirst = false;
        this.dataOutstream.writeBytes(this.compressBuffer, this.compressBuffer.length);
        this.compressBuffer = "";
      }
    } catch (ex) {
      this.failure(ex);
    }
  },

  onTransportStatus : function (transport, status, progress, progressMax) {
    this.bytesUploaded += progress - this.sendPrevSent;
    this.sendPrevSent   = progress;

    if ((!this.compressStream && this.bytesUploaded == this.bytesTotal)
      || (this.compressStream && this.compressDone && this.bytesUploaded == this.compressTotal)) {  // finished writing
      this.parent.kill();                                                                           // can't rely on this.fileInstream.available() - corrupts uploads
      return;
    }

    if (this.compressStream) {
      this.dataOutstream.writeBytes(this.compressBuffer, this.compressBuffer.length);
      this.compressBuffer = "";
    } else {
      var dataBuffer = this.dataInstream.readBytes(this.dataInstream.available() < 4096 ? this.dataInstream.available() : 4096);

      var diff = dataBuffer.length;

      if (this.asciiMode) {
        dataBuffer = dataBuffer.replace(/(^|[^\r])\n/g, "$1\r\n");
      }

      this.bytesTotal += dataBuffer.length - diff;

      this.dataOutstream.writeBytes(dataBuffer, dataBuffer.length);
    }
  },

  failure : function(ex) {
    if (this.parent.observer) {
      this.parent.observer.onDebug(ex);
    }

    if (this.parent.observer) {
      this.parent.observer.onError(gStrbundle.getFormattedString("failedUpload", [this.localPath]));
    }

    this.parent.kill();
  }
};

ftpMozilla.prototype.sftp = {
  connect : function(reconnect) {
    if (!reconnect) {                                                            // this is not a reconnection attempt
      this.isReconnecting = false;
      this.reconnectsLeft = parseInt(this.reconnectAttempts);

      if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
        this.reconnectsLeft = 1;
      }
    }

    if (!this.eventQueue.length || this.eventQueue[0].cmd != "welcome") {
      this.unshiftEventQueue("welcome", "", "");                                 // wait for welcome message first
    }

    ++this.networkTimeoutID;                                                     // just in case we have timeouts from previous connection
    ++this.transferID;

    try {
      var exec = this.getExec();

      if (!exec || !exec.exists()) {
        this.onDisconnect();
        return;
      }

      this.ipcService    = Components.classes["@mozilla.org/process/ipc-service;1"].getService(Components.interfaces.nsIIPCService);
      this.pipeTransport = Components.classes["@mozilla.org/process/pipe-transport;1"].createInstance(Components.interfaces.nsIPipeTransport);
      this.ipcBuffer     = Components.classes["@mozilla.org/process/ipc-buffer;1"].createInstance(Components.interfaces.nsIIPCBuffer);

      this.ipcBuffer.open(65536, true);

      var command = exec.path.replace(/\x5c/g, "/");
      var args    = [];

      if (this.password) {
        args.push("-pw");
        args.push(this.password);
      }

      args.push("-P");
      args.push(this.port);

      if (this.useCompression) {
        args.push("-C");
      }

      if (this.privatekey) {
        args.push("-i");
        args.push(this.privatekey.replace(/\x5c/g, "/"));
      }

      args.push((this.login ? this.login + "@" : "") + this.host);

      this.pipeTransport.init(command, args, args.length, [], 0, 0, "", true, true, this.ipcBuffer);

      this.controlOutstream = this.pipeTransport.openOutputStream(0, 0, 0);

      var self = this;
      var dataListener;
      var func = function() {
        if (!self.pipeTransport.isAttached()) {
          self.onDisconnect();
        }

        if (dataListener.data) {
          if (dataListener.data.indexOf('\npsftp>') == -1 && dataListener.data.indexOf('\nStore key in cache') == -1
           && dataListener.data.indexOf('\nUpdate cached key') == -1
           && dataListener.data.indexOf('\nAccess denied') == -1
           && dataListener.data.indexOf('Fatal: Network error:') == -1
           && dataListener.data.indexOf('ssh_init:') != 0) {
            return;
          }

          var buf = dataListener.data;
          dataListener.data = "";
          self.readControl(buf);
        }
      };
      this.readPoller = setInterval(func, 100);

      dataListener = {
        data            : "",

        onStartRequest  : function(request, context) { },

        onStopRequest   : function(request, context, status) { },

        onDataAvailable : function(request, context, inputStream, offset, count) {
          var controlInstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
          controlInstream.init(inputStream);
          this.data += controlInstream.read(count);
        }
      };

      this.pipeTransport.asyncRead(dataListener, null, 0, 0, 0);

    } catch(ex) {
      this.onDisconnect();
    }
  },

  keepAlive : function() {
    // do nothing
  },

  readControl : function(buffer) {
    if (this.isKilling) {
      return;
    }

    try {
      buffer = this.toUTF8.convertStringToUTF8(buffer, this.encoding, 1);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }

    if ((buffer == "2" && !this.isConnected) || buffer == "\r\n" || buffer == "\n") {
      return;
    }

    buffer         = buffer.replace(/\r\npsftp> /, '');
    buffer         = buffer.replace(/\npsftp> /,   '');
    var origBuffer = buffer;
    buffer         = buffer.indexOf("\r\n") != -1 ? buffer.split("\r\n") : buffer.split("\n");
    buffer         = buffer.filter(this.removeBlanks);

    if (origBuffer != "2" && origBuffer.indexOf('Store key in cache') == -1      // "2"s are self-generated fake messages
     && origBuffer.indexOf('\nUpdate cached key') == -1
     && origBuffer.indexOf('Fatal: Network error:') == -1
     && origBuffer.indexOf('\nAccess denied') == -1
     && origBuffer.indexOf('ssh_init:') != 0) {
      for (var x = 0; x < buffer.length; ++x) {                                  // add response to log
        var message   = buffer[x].charAt(buffer[x].length - 1) == '\r'
                      ? buffer[x].substring(0, buffer[x].length - 1) : buffer[x];
        if (this.observer) {
          this.observer.onAppendLog(message, 'input', "info");
        }

        if (message.indexOf('Listing directory') != -1) {
          break;
        }
      }

      ++this.networkTimeoutID;
    }

    var cmd;  var parameter;    var callback;   var callback2;

    if (this.eventQueue.length) {
      cmd        = this.eventQueue[0].cmd;
      parameter  = this.eventQueue[0].parameter;
      callback   = this.eventQueue[0].callback;
      callback2  = this.eventQueue[0].callback2;

      if (cmd != "ls" && cmd != "get" && cmd != "reget" && cmd != "put" && cmd != "reput") {   // used if we have a loss in connection
        var throwAway = this.eventQueue.shift();

        if (throwAway.cmd != "welcome" && throwAway.cmd != "goodbye" && throwAway.cmd != "aborted" && throwAway.cmd != "sftpcache") {
          this.trashQueue.push(throwAway);
        }
      }
    } else {
      cmd = "default";                                                           // an unexpected reply - perhaps a 421 timeout message
    }

    switch (cmd) {
      case "welcome":
      case "sftpcache":
        if (origBuffer.indexOf('Fatal: Network error:') != -1 || origBuffer.indexOf('ssh_init:') == 0) {
          this.legitClose = true;
          this.onDisconnect();
          return;
        }

        if (origBuffer.indexOf('Store key in cache') != -1 || origBuffer.indexOf('\nUpdate cached key') != -1) {
          if (this.observer) {
            var answer = this.observer.onSftpCache(origBuffer);

            if (answer) {
              this.unshiftEventQueue("sftpcache", answer, "");
            } else {
              this.legitClose = true;
              this.onDisconnect();
              return;
            }

            break;
          }
        }

        this.isConnected       = true;                                           // good to go

        if (this.observer) {
          this.observer.onConnected();
        }

        this.isReconnecting    = false;
        this.reconnectsLeft    = parseInt(this.reconnectAttempts);               // setup reconnection settings

        if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
          this.reconnectsLeft = 1;
        }

        var newConnectedHost = this.login + "@" + this.host;

        if (this.observer) {
          this.observer.onLoginAccepted(newConnectedHost != this.connectedHost);
        }

        if (newConnectedHost != this.connectedHost) {
          this.legitClose = true;
        }

        this.connectedHost = newConnectedHost;                                   // switching to a different host or different login

        if (!this.legitClose) {
          this.recoverFromDisaster();                                            // recover from previous disaster
          break;
        }

        this.legitClose   = false;

        origBuffer = origBuffer.substring(origBuffer.indexOf("Remote working directory is") + 28);  // if buffer is not '/' we're chrooted
        this.currentWorkingDir = origBuffer;

        if (this.observer) {
          this.observer.onChangeDir(origBuffer != '/' && this.initialPath == '' ? origBuffer : '', false, origBuffer != '/' || this.initialPath != '');
        }

        this.trashQueue = new Array();

        break;

      case "ls":
      case "get":
      case "reget":
      case "put":
      case "reput":
        ++this.transferID;
        this.eventQueue.shift();
        if (this.eventQueue.length && this.eventQueue[0].cmd == "transferEnd") {
          this.eventQueue.shift();
        }
        this.trashQueue = new Array();                                       // clear the trash array, completed an 'atomic' set of operations

        if (cmd == "ls") {
          this.listData = this.parseListData(origBuffer, parameter);

          if (typeof callback == "string") {
            eval(callback);                                                  // send off list data to whoever wanted it
          } else {
            callback();
          }
        }

        if (callback2) {                                                     // for transfers
          if (typeof callback2 == "string") {
            eval(callback2);
          } else {
            callback2();
          }
        }

        break;

      case "mkdir":
      case "rm":
      case "rmdir":
        if (origBuffer.indexOf(': OK') != origBuffer.length - 4) {
          if (this.observer) {
            this.observer.onError(origBuffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          }
        } else {
          if (cmd == "rmdir") {                                                  // clear out of cache if it's a remove directory
            this.removeCacheEntry(this.constructPath(this.currentWorkingDir, parameter));
          }

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        }

        this.trashQueue = new Array();
        break;

      case "mv":
        if (origBuffer.indexOf(': no such file or directory') != -1) {
          if (this.observer) {
            this.observer.onError(origBuffer + ": " + parameter);
          }
        } else {
          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        }

        this.trashQueue = new Array();
        break;

      case "chmod":
        if (typeof callback == "string") {
          eval(callback);                                                        // send off list data to whoever wanted it
        } else {
          callback();
        }

        this.trashQueue = new Array();
        break;

      case "cd":
        if (origBuffer.indexOf('Remote directory is now') == -1) {               // if it's not a directory
          if (callback && typeof callback == "function") {
            callback(false);
          } else if (this.observer) {
            this.observer.onDirNotFound(origBuffer);

            if (this.observer) {
              this.observer.onError(origBuffer);
            }
          }
        } else {
          this.currentWorkingDir = parameter;

          if (this.observer) {                                                   // else navigate to the directory
            this.observer.onChangeDir(parameter, typeof callback == "boolean" ? callback : "");
          }

          if (callback && typeof callback == "function") {
            callback(true);
          }
        }
        break;

      case "aborted":
      case "custom":
        break;

      case "goodbye":                                                            // you say yes, i say no, you stay stop...
      default:
        if (origBuffer.indexOf('Access denied') != -1) {
          if (this.observer && this.type == 'transfer') {
            this.observer.onLoginDenied();
          }

          this.cleanup();                                                        // login failed, cleanup variables

          if (this.observer && this.type != 'transfer' && this.type != 'bad') {
            this.observer.onError(origBuffer);
          }

          this.isConnected = false;

          this.kill();

          if (this.type == 'transfer') {
            this.type = 'bad';
          }

          if (this.observer && this.type != 'transfer' && this.type != 'bad') {
            var self = this;
            var func = function() { self.observer.onLoginDenied(); };
            setTimeout(func, 0);
          }

          return;
        } else if (this.observer) {
          this.observer.onError(origBuffer);
        }
        break;
    }

    this.isReady = true;

    if (this.observer) {
      this.observer.onIsReadyChange(true);
    }

    if (this.eventQueue.length && this.eventQueue[0].cmd != "welcome") {         // start the next command
      this.writeControl();
    } else {
      this.refresh();
    }
  },

  changeWorkingDirectory : function(path, callback) {
    this.addEventQueue("cd", path, callback);
    this.writeControlWrapper();
  },

  makeDirectory : function(path, callback) {
    this.addEventQueue("cd",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("mkdir", path.substring(path.lastIndexOf('/') + 1), callback);
    this.writeControlWrapper();
  },

  makeBlankFile : function(path, callback) {
    this.addEventQueue("cd", path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);

    try {
      var count = 0;
      let tmpFile = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsILocalFile);
      tmpFile.append(count + '-blankFile');
      while (tmpFile.exists()) {
        ++count;
        tmpFile.leafName = count + '-blankFile';
      }
      var foutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      foutstream.init(tmpFile, 0x04 | 0x08 | 0x20, 0644, 0);
      foutstream.write("", 0);
      foutstream.close();

      this.upload(tmpFile.path, path, false, 0, 0, callback, true);
    } catch (ex) {
      if (this.observer) {
        this.observer.onDebug(ex);
      }
    }
  },

  remove : function(isDirectory, path, callback) {
    if (isDirectory) {
      this.unshiftEventQueue("rmdir", path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("cd",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);

      var self         = this;
      var listCallback = function() { self.removeRecursive(path); };
      this.list(path, listCallback, true, true);
    } else {
      this.unshiftEventQueue("rm",    path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("cd",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    }

    this.writeControlWrapper();
  },

  removeRecursive : function(parent) {                                           // delete subdirectories and files
    var files = this.listData;

    for (var x = 0; x < files.length; ++x) {
      var remotePath = this.constructPath(parent, files[x].leafName);

      if (files[x].isDirectory()) {                                              // delete a subdirectory recursively
        this.unshiftEventQueue("rmdir",  remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("cd",     parent, true);
        this.removeRecursiveHelper(remotePath);
      } else {                                                                   // delete a file
        this.unshiftEventQueue("rm",     remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("cd",     parent, true);
      }
    }
  },

  removeRecursiveHelper : function(remotePath) {
    var self           = this;
    var listCallback   = function() { self.removeRecursive(remotePath); };
    this.list(remotePath, listCallback, true, true);
  },

  rename : function(oldName, newName, callback, isDir) {
    if (isDir) {
      this.removeCacheEntry(oldName);
    }

    oldName = oldName.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

    this.addEventQueue("mv", '"' + this.escapeSftp(oldName) + '" "' + this.escapeSftp(newName) + '"', callback);                 // rename the file
    this.writeControlWrapper();
  },

  changePermissions : function(permissions, path, callback) {
    path = path.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

    this.addEventQueue("cd",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("chmod", permissions + ' "' + this.escapeSftp(path.substring(path.lastIndexOf('/') + 1)) + '"', callback);
    this.writeControlWrapper();
  },

  custom : function(cmd) {
    this.addEventQueue("custom", cmd);
    this.writeControlWrapper();
  },

  list : function(path, callback, skipCache, recursive, fxp) {
    if (!skipCache && this.sessionsMode) {
      if (this.cacheHit(path, callback)) {
        return;
      }
    }

    if (recursive) {
      this.unshiftEventQueue(  "ls", path, callback, '');
      this.unshiftEventQueue(  "cd", path, "",       '');
    } else {
      this.addEventQueue(      "cd", path, "",       '');
      this.addEventQueue(      "ls", path, callback, '');
    }

    this.writeControlWrapper();
  },

  download : function(remotePath, localPath, remoteSize, resume, localSize, isSymlink, callback) {
    ++this.queueID;
    var id = this.connNo + "-" + this.queueID;

    this.addEventQueue("transferBegin", "", { id: id });

    this.addEventQueue(  "cd",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    this.addEventQueue(resume ? "reget" : "get", '"' + this.escapeSftp(leafName) + '" "' + this.escapeSftp(localPath.replace(/\x5c/g, "/")) + '"', localPath, callback);

    this.addEventQueue("transferEnd", "", { localPath: localPath, remotePath: remotePath, size: remoteSize, transport: 'sftp', type: 'download', ascii: "I", id: id });

    this.writeControlWrapper();
  },

  upload : function(localPath, remotePath, resume, localSize, remoteSize, callback, disableMDTM) {
    ++this.queueID;
    var id = this.connNo + "-" + this.queueID;

    this.addEventQueue("transferBegin", "", { id: id });

    this.addEventQueue(  "cd",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    this.addEventQueue(resume ? "reput" : "put", '"' + this.escapeSftp(localPath.replace(/\x5c/g, "/")) + '" "' + this.escapeSftp(leafName) + '"', localPath, callback);

    this.addEventQueue("transferEnd", "", { localPath: localPath, remotePath: remotePath, size: localSize, transport: 'sftp', type: 'upload', ascii: "I", id: id });

    this.writeControlWrapper();

    return id;
  },

  isListing : function() {                                                       // check queue to see if we're listing
    for (var x = 0; x < this.eventQueue.length; ++x) {
      if (this.eventQueue[x].cmd.indexOf("ls") != -1) {
        return true;
      }
    }

    return false;
  },

  recoverFromDisaster : function() {                                             // after connection lost, try to restart queue
    if (this.eventQueue.length && this.eventQueue[0].cmd == "goodbye") {
      this.eventQueue.shift();
    }

    if (this.eventQueue.cmd) {
      this.eventQueue = new Array(this.eventQueue);
    }

    if (this.eventQueue.length && (this.eventQueue[0].cmd == "ls"
                               ||  this.eventQueue[0].cmd == "get"
                               ||  this.eventQueue[0].cmd == "reget"
                               ||  this.eventQueue[0].cmd == "put"
                               ||  this.eventQueue[0].cmd == "reput")) {
      var cmd       = this.eventQueue[0].cmd;
      var parameter = this.eventQueue[0].parameter;

      cmd = this.eventQueue[0].cmd;

      if (cmd == "put") {                                                        // set up resuming for these poor interrupted transfers
        this.eventQueue[0].cmd = "reput";
      } else if (cmd == "get") {
        this.eventQueue[0].cmd = "reget";
      }
    }

    if (this.currentWorkingDir) {
      this.unshiftEventQueue("cd", this.currentWorkingDir, true);
      this.currentWorkingDir = "";
    }

    this.trashQueue = new Array();
  },

  getExec : function() {
    if (this.getPlatform() == "windows") {
      var exec = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                           .get("ProfD", Components.interfaces.nsILocalFile);
      exec.append("extensions");
      exec.append("{a7c6cf7f-112c-4500-a7ea-39801a327e5f}");
      exec.append("platform");
      exec.append("WINNT_x86-msvc");
      exec.append("psftp.exe");

      return exec;
    } else if (this.getPlatform() == "linux") {
      var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath("/usr/bin/psftp");

      return file;
    } else if (this.getPlatform() == "mac") {
      var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath("/opt/local/var/macports/software/putty");

      if (!file.exists()) {
        return file;
      }

      var subdirs = [];

      var entries = file.directoryEntries;                                       // find highest version number
      while (entries.hasMoreElements()) {
        subdirs.push(entries.getNext().QueryInterface(Components.interfaces.nsILocalFile));
      }

      subdirs.sort(compareName);
      subdirs.reverse();

      if (!subdirs.length) {
        return file;
      }

      file.append(subdirs[0].leafName);
      file.append("opt");
      file.append("local");
      file.append("bin");
      file.append("psftp");

      return file;
    }
  },

  getPlatform : function() {
    var platform = navigator.platform.toLowerCase();

    if (platform.indexOf('linux') != -1) {
      return 'linux';
    }

    if (platform.indexOf('mac') != -1) {
      return 'mac';
    }

    return 'windows';
  }
};
