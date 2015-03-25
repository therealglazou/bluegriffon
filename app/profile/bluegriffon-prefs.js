#filter substitution

pref("toolkit.defaultChromeURI", "chrome://bluegriffon/content/xul/bluegriffon.xul");
pref("browser.chromeURL", "chrome://bluegriffon/content/xul/bluegriffon.xul");
pref("browser.hiddenWindowChromeURL", "chrome://bluegriffon/content/xul/hiddenWindow.xul");
pref("toolkit.singletonWindowType", "bluegriffon");
pref("bluegriffon.singletonWindowType", "bluegriffon");

// mandatory for XULrunner apps
// see https://developer.mozilla.org/en/XUL/prefwindow
pref("browser.preferences.instantApply", true);

#ifdef XP_MACOSX
pref("toolbar.customization.usesheet", true); // true for Mac
#else
pref("toolbar.customization.usesheet", false); // false otherwise
#endif

/* debugging prefs */
pref("browser.dom.window.dump.enabled", false);
pref("javascript.options.showInConsole", false);
pref("javascript.options.strict", false);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);

pref("general.useragent.extra.mybrowser", "@MOZ_APP_NAME@/@MOZ_APP_VERSION@");
pref("intl.locale.matchOS", true);
pref("intl.accept_charsets", "iso-8859-1,*,utf-8");
pref("browser.display.use_document_fonts", 1);

pref("extensions.update.autoUpdateDefault", false);
pref("extensions.update.enabled", false);
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.update.interval", 86400);  // Check for updates to Extensions and 
                                            // Themes every week
// Non-symmetric (not shared by extensions) extension-specific [update] preferences
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.dss.enabled", false);          // Dynamic Skin Switching                                               
pref("extensions.dss.switchPending", false);    // Non-dynamic switch pending after next
                                                // restart.
pref("extensions.closeOnEscape", true);
pref("extensions.ui.lastCategory", "addons://list/extension");
pref("extensions.shownSelectionUI", false);
pref("extensions.showMismatchUI", false);
pref("extensions.logging.enabled", true);

// browser preferences
pref("image.animation_mode", "none");
pref("bluegriffon.display.use_system_colors", true);
pref("bluegriffon.display.foreground_color", "#000000");
pref("bluegriffon.display.background_color", "#ffffff");
pref("bluegriffon.display.active_color", "#ee0000");
pref("bluegriffon.display.anchor_color", "#0000ee");
pref("bluegriffon.display.visited_color", "#551a8b");
pref("bluegriffon.display.underline_links", true);
pref("bluegriffon.returnKey.createsParagraph", true);
pref("bluegriffon.spellCheck.enabled", true);
pref("bluegriffon.spellCheck.suggestions", 10);

pref("bluegriffon.display.comments", true);
pref("bluegriffon.display.php", true);
pref("bluegriffon.display.pi", true);

// document preferences
pref("bluegriffon.author", "");

// table preferences
pref("bluegriffon.defaults.table.halign", "");
pref("bluegriffon.defaults.table.valign", "");
pref("bluegriffon.defaults.table.border", "1");
pref("bluegriffon.defaults.table.rows", "2");
pref("bluegriffon.defaults.table.cols", "2");
pref("bluegriffon.defaults.table.width", "100");
pref("bluegriffon.defaults.table.width_unit", "percentage");
pref("bluegriffon.defaults.table.text_wrap", "");
pref("bluegriffon.defaults.table.cell_spacing", "2");
pref("bluegriffon.defaults.table.cell_padding", "2");

// file extension preferences
pref("bluegriffon.defaults.extension.application-xhtml+xml", "xhtml");
pref("bluegriffon.defaults.extension.text-html", "html");

// CSS policy
pref("editor.use_css", true);
pref("bluegriffon.css.policy", "manual");
pref("bluegriffon.css.prefix", "BG_");
pref("bluegriffon.css.support.gecko", true);
pref("bluegriffon.css.support.webkit", true);
pref("bluegriffon.css.support.presto", true);
pref("bluegriffon.css.support.trident", true);

pref("bluegriffon.prettyprint", true);
pref("bluegriffon.encode_entity", "html");

pref("bluegriffon.zoom.default", "1");

pref("bluegriffon.history.url_maximum", 10);
pref("bluegriffon.defaults.restorePreviousSession", true);

pref("signon.rememberSignons", true);
pref("signon.expireMasterPassword", false);
pref("signon.SignonFileName", "signons.txt");

// suppress external-load warning for standard browser schemes
pref("network.protocol-handler.warn-external.http", true);
pref("network.protocol-handler.warn-external.https", true);
pref("network.protocol-handler.warn-external.ftp", true);
pref("network.protocol-handler.expose-all", false);

// XPI
pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager");


pref("dom.storage.enabled", true);

// structurebar
pref("bluegriffon.structurebar.id.show", true);
pref("bluegriffon.structurebar.class.show", true);
pref("bluegriffon.structurebar.lang.show", false);
pref("bluegriffon.structurebar.role.show", true);

// updates
pref("bluegriffon.updates.check.enabled", true);
pref("bluegriffon.updates.frequency", "launch");

pref("html5.enable", true);
pref("bluegriffon.defaults.doctype", "kHTML5");
pref("bluegriffon.defaults.html5.polyglot", false);
pref("media.autoplay.enabled", false);

pref("bluegriffon.defaults.forceLF", false);
pref("bluegriffon.defaults.backups", true);

pref("bluegriffon.source.theme", "light");
pref("bluegriffon.source.entities", "basic");
pref("bluegriffon.source.auto-indent", true);
pref("bluegriffon.source.wrap", true);
pref("bluegriffon.source.wrap.maxColumn", 80);
pref("bluegriffon.source.wrap.exclude-languages", true);
pref("bluegriffon.source.wrap.language-exclusions", "");

pref("bluegriffon.tabs.position", "center");

pref("bluegriffon.osx.dock-integration", true);
pref("extensions.getAddons.cache.enabled", false);

// +------------------------------------+
// | Disabled for now, too late for 1.4 |
// +------------------------------------+
//
// pref("app.update.enabled", true);
// pref("app.update.auto", true);
// pref("app.update.mode", 2);
// pref("app.update.silent", false);
// pref("app.update.url", "http://bluegriffon.org/update.php/%PRODUCT%/%VERSION%/%BUILD_TARGET%/update.xml");
// pref("app.update.url.manual", "http://bluegriffon.org/pages/Download");
// pref("app.update.url.details", "http://bluegriffon.org/pages/Download");
// pref("app.update.interval", 86400);
// pref("app.update.nagTimer.download", 86400);
// pref("app.update.nagTimer.restart", 1800);
// pref("app.update.timer", 600000);
// pref("app.update.showInstalledUI", false);
// pref("app.update.incompatible.mode", 0);
// pref("app.update.log", false);

pref("bluegriffon.css.colors.names.enabled", true);
pref("bluegriffon.css.colors.type", "hex");

pref("tipoftheday.openAtStartup", true);

// make links absolute when copied
pref("clipboard.absoluteLinks", true);

pref("extensions.venkman.enableChromeFilter", false);

// Print header customization
// Use the following codes:
// &T - Title
// &U - Document URL
// &D - Date/Time
// &P - Page Number
// &PT - Page Number "of" Page total
// Set each header to a string containing zero or one of these codes
// and the code will be replaced in that string by the corresponding data
pref("print.print_headerleft", "&T");
pref("print.print_headercenter", "");
pref("print.print_headerright", "&U");
pref("print.print_footerleft", "&PT");
pref("print.print_footercenter", "");
pref("print.print_footerright", "&D");
pref("print.show_print_progress", true);

// When this is set to false each window has its own PrintSettings
// and a change in one window does not affect the others
pref("print.use_global_printsettings", true);

// Save the Printings after each print job
pref("print.save_print_settings", true);

pref("print.whileInPrintPreview", true);

// Cache old Presentation when going into Print Preview
pref("print.always_cache_old_pres", false);

// Enables you to specify the amount of the paper that is to be treated
// as unwriteable.  The print_edge_XXX and print_margin_XXX preferences
// are treated as offsets that are added to this pref.
// Default is "-1", which means "use the system default".  (If there is
// no system default, then the -1 is treated as if it were 0.)
// This is used by both Printing and Print Preview.
// Units are in 1/100ths of an inch.
pref("print.print_unwriteable_margin_top",    -1);
pref("print.print_unwriteable_margin_left",   -1);
pref("print.print_unwriteable_margin_right",  -1);
pref("print.print_unwriteable_margin_bottom", -1);

// Enables you to specify the gap from the edge of the paper's 
// unwriteable area to the margin.
// This is used by both Printing and Print Preview
// Units are in 1/100ths of an inch.
pref("print.print_edge_top", 0);
pref("print.print_edge_left", 0);
pref("print.print_edge_right", 0);
pref("print.print_edge_bottom", 0);

pref("layout.css.flexbox.enabled", true);
