# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

installer:
	@$(MAKE) -C bluegriffon/installer installer

package:
	@$(MAKE) -C bluegriffon/installer

package-compare:
	@$(MAKE) -C bluegriffon/installer package-compare

stage-package:
	@$(MAKE) -C bluegriffon/installer stage-package

sdk:
	@$(MAKE) -C bluegriffon/installer make-sdk

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
