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
 * The Original Code is diMacIntegration code.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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
#define MOZILLA_INTERNAL_API 1

#include "mozilla/ModuleUtils.h"
#include "nsIClassInfoImpl.h"
#include "nsIServiceManager.h"
#include "diOSIntegration.h"
#include "diOSIntegrationCIID.h"
#include "nsXPIDLString.h"

namespace mozilla
{
// Factory defined in mozilla::, defines mozilla::diOSIntegrationConstructor
NS_GENERIC_FACTORY_CONSTRUCTOR(diOSIntegration)
}

NS_DEFINE_NAMED_CID(DI_OS_INTEGRATION_CID);

static const mozilla::Module::CIDEntry kCIDs[] = {
  { &kDI_OS_INTEGRATION_CID, false, nullptr, mozilla::diOSIntegrationConstructor },
  { NULL }
};

static const mozilla::Module::ContractIDEntry kContracts[] = {
  { DI_OS_INTEGRATION_CONTRACTID, &kDI_OS_INTEGRATION_CID },
  { NULL }
};

static const mozilla::Module::CategoryEntry kPermissionsCategories[] = {
  { XPCOM_DIRECTORY_PROVIDER_CATEGORY, "bg-osutils", DI_OS_INTEGRATION_CONTRACTID },
  { NULL }
};

static const mozilla::Module kModule = {
  mozilla::Module::kVersion,
  kCIDs,
  kContracts
};

NSMODULE_DEFN(diosintegration) = &kModule;
