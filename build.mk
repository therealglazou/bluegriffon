# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

################################################
# Parallel build on Windows with GNU make check

default::
ifeq (,$(findstring pymake,$(MAKE)))
ifeq ($(HOST_OS_ARCH),WINNT)
ifneq (1,$(NUMBER_OF_PROCESSORS))
	@echo $(if $(findstring -j,$(value MAKEFLAGS)), \
$(error You are using GNU make to build Firefox with -jN on Windows. \
This will randomly deadlock. To compile a parallel build on Windows \
run "python -OO build/pymake/make.py -f client.mk build". \
See https://developer.mozilla.org/en/pymake for more details.))
endif
endif
endif

installer:
	@$(MAKE) -C bluegriffon/installer installer

package:
	@$(MAKE) -C bluegriffon/installer

package-compare:
	@$(MAKE) -C bluegriffon/installer package-compare

stage-package:
	@$(MAKE) -C bluegriffon/installer stage-package

install::
	@$(MAKE) -C bluegriffon/installer install

clean::
	@$(MAKE) -C bluegriffon/installer clean

distclean::
	@$(MAKE) -C bluegriffon/installer distclean

source-package::
	@$(MAKE) -C bluegriffon/installer source-package

upload::
	@$(MAKE) -C bluegriffon/installer upload

source-upload::
	@$(MAKE) -C bluegriffon/installer source-upload

hg-bundle::
	@$(MAKE) -C bluegriffon/installer hg-bundle

l10n-check::
	@$(MAKE) -C bluegriffon/locales l10n-check

ifdef ENABLE_TESTS
# Implemented in testing/testsuite-targets.mk

mochitest-bluegriffon-chrome:
	$(RUN_MOCHITEST) --bluegriffon-chrome
	$(CHECK_TEST_ERROR)

mochitest:: mochitest-bluegriffon-chrome

.PHONY: mochitest-bluegriffon-chrome

mochitest-metro-chrome:
	$(RUN_MOCHITEST) --metro-immersive --bluegriffon-chrome
	$(CHECK_TEST_ERROR)


endif
