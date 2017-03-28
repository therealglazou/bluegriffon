#! /bin/sh
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is the the Mozilla build system
#
# The Initial Developer of the Original Code is
# Ben Turner <mozilla@songbirdnest.com>
#
# Portions created by the Initial Developer are Copyright (C) 2007
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

add_makefiles "
bluegriffon/Makefile
bluegriffon/app/Makefile
bluegriffon/base/Makefile
bluegriffon/branding/Makefile
bluegriffon/extensions/Makefile
bluegriffon/installer/Makefile
bluegriffon/installer/windows/Makefile
bluegriffon/sidebars/Makefile
bluegriffon/src/Makefile
bluegriffon/src/dibgutils/Makefile
bluegriffon/src/diOSIntegration.mac/Makefile
bluegriffon/themes/Makefile
bluegriffon/modules/Makefile
bluegriffon/themes/win/Makefile
bluegriffon/themes/mac/Makefile
bluegriffon/extensions/svg-edit/Makefile
bluegriffon/extensions/op1/Makefile
bluegriffon/extensions/gfd/Makefile
bluegriffon/extensions/fs/Makefile
bluegriffon/sidebars/cssproperties/Makefile
bluegriffon/sidebars/domexplorer/Makefile
bluegriffon/sidebars/scripteditor/Makefile
bluegriffon/sidebars/stylesheets/Makefile
bluegriffon/langpacks/Makefile
bluegriffon/locales/Makefile
bluegriffon/components/Makefile
"
