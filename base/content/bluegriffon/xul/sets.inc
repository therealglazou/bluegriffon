<broadcasterset id="broadcasterset"/>

<keyset id="mainKeySet">
  <key id="savekb"              key="&filesave.key;"         observes="cmd_save"      modifiers="accel"/>
  <key id="saveaskb"            key="&filesaveas.key;"       observes="cmd_saveAs"    modifiers="accel,shift"/>
  <key id="key_quitApplication" key="&quit.key;"                                      modifiers="accel"/>
  <key id="closetabkb"          key="&closeWindow.key;"      observes="cmd_closeTab"  modifiers="accel"/>
  <key id="openpagekb"          key="&openPage.key;"         observes="cmd_open"      modifiers="accel,shift"/>
  <key id="openfilekb"          key="&openPage.key;"         observes="cmd_openFile"  modifiers="accel"/>
  <key id="findkb"              key="&findCmd.key;"          observes="cmd_bgfind"    modifiers="accel"/>
  <key id="findagainkb"         key="&findAgainCmd.key;"     observes="cmd_bgfindagain" modifiers="accel"/>
  <key id="replacekb"           key="&replaceCmd.key;"       observes="cmd_replace"   modifiers="accel"/>

  <key id="strongkb"            key="&styleStrong.key;"      observes="cmd_strong"    modifiers="accel"/>
  <key id="emkb"                key="&styleEm.key;"          observes="cmd_em"        modifiers="accel"/>
  <key id="codekb"              key="&styleCode.key;"        observes="cmd_code"      modifiers="accel,shift"/>
  <key id="underlinekb"         key="&styleUnderline.key;"   observes="cmd_underline" modifiers="accel"/>

  <key keycode="VK_ESCAPE"      observes="cmd_structureClimb" />
  <key id="structureclimbkb"      keycode="VK_F2"              observes="cmd_structureClimb"/>
  <key id="structurefirstchildkb" keycode="VK_F2"              observes="cmd_structureFirstChild" modifiers="shift"/>
  <key id="structurenextkb"       keycode="VK_F4"              observes="cmd_structureNext"/>
  <key id="structurepreviousbkb"  keycode="VK_F4"              observes="cmd_structurePrevious" modifiers="shift"/>

  <key id="toggleviewkb"          keycode="VK_F8"              observes="cmd_toggleView"/>

#ifdef XP_MACOSX
  <key id="key_preferencesCmdMac" key="&preferencesCmdMac.commandkey;" modifiers="accel"/>
  <key id="key_hideThisAppCmdMac" key="&hideThisAppCmdMac2.commandkey;" modifiers="accel"/>
  <key id="key_hideOtherAppsCmdMac" key="&hideOtherAppsCmdMac.commandkey;" modifiers="accel,alt"/>
#endif

  <key id="printkb"               key="&printCmd.commandkey;" observes="cmd_print" modifiers="accel"/>

   <key id="key_BGundo"  key="&undoCmd.key;"  modifiers="accel" command="cmd_BGundo"/>  
   <key id="key_BGredo"  key="&redoCmd.key;"  modifiers="accel" command="cmd_BGredo"/>  
   <key id="key_BGcopy"  key="&copyCmd.key;"  modifiers="accel" command="cmd_BGcopy"/>  
   <key id="key_BGcut"   key="&cutCmd.key;"   modifiers="accel" command="cmd_BGcut"/>  
   <key id="key_BGpaste" key="&pasteCmd.key;" modifiers="accel" command="cmd_BGpaste"/>
   <key id="key_BGselectAll" key="&selectAllCmd.key;" modifiers="accel" command="cmd_BGselectAll"/>  
   <key id="key_BGdelete" key="&deleteCmd.key;" modifiers="accel" command="cmd_BGdelete"/>  
</keyset>

<!-- magic from chrome://global/content/editMenuOverlay.xul -->
<keyset id="editMenuKeys"/>

<!-- magic from chrome://global/content/editMenuOverlay.xul -->
<!--commandset id="editMenuCommands"/-->

<commandset id="webNavigationItems"
            commandupdater="true"
            events="navigation"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">
  <command id="cmd_stopLoading" disabled="true" oncommand="goDoCommand('cmd_stopLoading')"/>
  <command id="cmd_new"                         oncommand="goDoCommand('cmd_new')"/>
  <command id="cmd_newWindow"                   oncommand="goDoCommand('cmd_newWindow')"/>
  <command id="cmd_newWizard"                   oncommand="goDoCommand('cmd_newWizard')"/>

  <command id="Tasks:Inspector"   oncommand="inspectDOMDocument();"/>
  <command id="Tasks:InspectPage" oncommand="inspectDOMDocument(_content.document);"/>
</commandset>

<commandset id="commonEditorMenuItems"
            commandupdater="true"
            events="create"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">
  <command id="cmd_open"         label="&openPage.label;"    oncommand="goDoCommand('cmd_open')"/>
  <command id="cmd_openFile"     label="&openFileCmd.label;" oncommand="goDoCommand('cmd_openFile')"/>
</commandset>

<commandset id="composerMenuItems"
            commandupdater="true"
            events="create,style,mode_switch"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">

  <command id="cmd_list"             oncommand="goDoCommand('cmd_list')"/>
  <command id="cmd_table"            oncommand="goDoCommand('cmd_table')"/>
  <command id="cmd_InsertTable"      oncommand="goDoCommand('cmd_InsertTable')"/>
  <command id="cmd_image"            oncommand="goDoCommand('cmd_image')"/>
  <command id="cmd_rebuildTOC"       oncommand="goDoCommand('cmd_rebuildTOC')"/>
  <command id="cmd_anchor"           oncommand="goDoCommand('cmd_anchor')"/>
  <command id="cmd_link"             oncommand="goDoCommand('cmd_link')"/>
  <command id="cmd_hr"               oncommand="goDoCommand('cmd_hr')"/>
  <command id="cmd_css"              oncommand="goDoCommand('cmd_css')"/>
  <command id="cmd_domexplorer"      oncommand="goDoCommand('cmd_domexplorer')"/>
  <command id="cmd_commentOrPI"      oncommand="goDoCommand('cmd_commentOrPI')"/>
  <command id="cmd_video"            oncommand="goDoCommand('cmd_video')"/>
  <command id="cmd_audio"            oncommand="goDoCommand('cmd_audio')"/>
  <command id="cmd_html"             oncommand="goDoCommand('cmd_html')"/>
  <command id="cmd_form"             oncommand="goDoCommand('cmd_form')"/>
  <command id="cmd_toc"              oncommand="goDoCommand('cmd_toc')"/>

  <command id="cmd_formInputHidden"   oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'hidden')"/>
  <command id="cmd_formInputText"     oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'text')"/>
  <command id="cmd_formInputSearch"   oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'search')"/>
  <command id="cmd_formInputTel"      oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'tel')"/>
  <command id="cmd_formInputUrl"      oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'url')"/>
  <command id="cmd_formInputEmail"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'email')"/>
  <command id="cmd_formInputPassword" oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'password')"/>
  <command id="cmd_formInputDatetime" oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'datetime')"/>
  <command id="cmd_formInputDate"     oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'date')"/>
  <command id="cmd_formInputMonth"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'month')"/>
  <command id="cmd_formInputWeek"     oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'week')"/>
  <command id="cmd_formInputTime"     oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'time')"/>
  <command id="cmd_formInputDatetimelocal" oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'datetime-local')"/>
  <command id="cmd_formInputNumber"   oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'number')"/>
  <command id="cmd_formInputRange"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'range')"/>
  <command id="cmd_formInputColor"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'color')"/>
  <command id="cmd_formInputCheckbox" oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'checkbox')"/>
  <command id="cmd_formInputRadio"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'radio')"/>
  <command id="cmd_formInputFile"     oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'file')"/>
  <command id="cmd_formInputSubmit"   oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'submit')"/>
  <command id="cmd_formInputImage"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'image')"/>
  <command id="cmd_formInputReset"    oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'reset')"/>
  <command id="cmd_formInputButton"   oncommand="ComposerCommands.doCommandWithValue('cmd_formInput', 'button')"/>

  <command id="cmd_fieldset"          oncommand="goDoCommand('cmd_fieldset')"/>
  <command id="cmd_label"             oncommand="goDoCommand('cmd_label')"/>
  <command id="cmd_button"            oncommand="goDoCommand('cmd_button')"/>
  <command id="cmd_select"            oncommand="goDoCommand('cmd_select')"/>
  <command id="cmd_textarea"          oncommand="goDoCommand('cmd_textarea')"/>
  <command id="cmd_keygen"            oncommand="goDoCommand('cmd_keygen')"/>
  <command id="cmd_output"            oncommand="goDoCommand('cmd_output')"/>
  <command id="cmd_progress"          oncommand="goDoCommand('cmd_progress')"/>
  <command id="cmd_meter"             oncommand="goDoCommand('cmd_meter')"/>
  <command id="cmd_datalist"          oncommand="goDoCommand('cmd_datalist')"/>

  <command id="cmd_pageProperties"    oncommand="goDoCommand('cmd_pageProperties')"/>

  <command id="cmd_spellCheck"        oncommand="goDoCommand('cmd_spellCheck')"/>

  <command id="cmd_gotoLink"          oncommand="goDoCommand('cmd_gotoLink')"/>
  <command id="cmd_editLink"          oncommand="goDoCommand('cmd_editLink')"/>

  <command id="cmd_toggleView"        oncommand="goDoCommand('cmd_toggleView')"/>
  <command id="cmd_cleanup"           oncommand="goDoCommand('cmd_cleanup')" label="&markupCleanerCmd.label;" accesskey="&markupcleaner.accesskey;"/>
</commandset>

<commandset id="composerStyleMenuItems"
            commandupdater="true"
            events="create,select,style,mode_switch"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">
  <command id="cmd_bold"         state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_bold')"/>
  <command id="cmd_italic"       state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_italic')"/>
  <command id="cmd_underline"    state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_underline')"/>
  <command id="cmd_strong"       state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_strong')"/>
  <command id="cmd_em"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_em')"/>
  <command id="cmd_strikethrough" state="false"    oncommand="ComposerCommands.doStyleUICommand('cmd_strikethrough');"/>
  <command id="cmd_superscript"  state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_superscript');"/>
  <command id="cmd_subscript"    state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_subscript');"/>
  <command id="cmd_nobreak"      state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_nobreak');"/>

  <command id="cmd_cite"         state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_cite')"/>
  <command id="cmd_abbr"         state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_abbr')"/>
  <command id="cmd_acronym"      state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_acronym')"/>
  <command id="cmd_code"         state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_code')"/>
  <command id="cmd_samp"         state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_samp')"/>
  <command id="cmd_var"          state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_var')"/>
  <command id="cmd_tt"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_tt')"/>

  <command id="cmd_span"                           oncommand="goDoCommand('cmd_span')"/>

  <command id="cmd_paragraphState" state=""        oncommand="ComposerCommands.doStatefulCommand('cmd_paragraphState', event.target.value)"/>
  <command id="cmd_fontFace"     state=""          oncommand="ComposerCommands.doStatefulCommand('cmd_fontFace', event.target.value)"/>
  <command id="cmd_class"        state=""          oncommand="ComposerCommands.doStatefulCommand('cmd_class', event.target.value)"/>
  <command id="cmd_id"           state=""          oncommand="ComposerCommands.doStatefulCommand('cmd_id', event.target.value)"/>
  <command id="cmd_ariaRole"     state=""          oncommand="ComposerCommands.doStatefulCommand('cmd_ariaRole', event.target.value)"/>
  <command id="cmd_removeStyles"                   oncommand="goDoCommand('cmd_removeStyles')"/>
  <command id="cmd_removeLinks"                    oncommand="goDoCommand('cmd_removeLinks')"/>

  <command id="cmd_renderedHTMLEnabler"/>
  <command id="cmd_renderedSourceEnabler"/>
  <command id="cmd_renderedAllEnabler"/>
  <command id="cmd_viewModeEnabler"/>
  <command id="cmd_structureClimb"                 oncommand="goDoCommand('cmd_structureClimb')"/>
  <command id="cmd_structureFirstChild"            oncommand="goDoCommand('cmd_structureFirstChild')"/>
  <command id="cmd_structureNext"                  oncommand="goDoCommand('cmd_structureNext')"/>
  <command id="cmd_structurePrevious"              oncommand="goDoCommand('cmd_structurePrevious')"/>
  <command id="cmd_ul"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_ul')"/>
  <command id="cmd_ol"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_ol')"/>
  <command id="cmd_align"        state="left"      oncommand="ComposerCommands.doStatefulCommand('cmd_align', event.target.value)"/>

  <command id="cmd_dd"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_dd')"/>
  <command id="cmd_dt"           state="false"     oncommand="ComposerCommands.doStyleUICommand('cmd_dt')"/>

  <command id="cmd_indent"                         oncommand="goDoCommand('cmd_indent')"/>
  <command id="cmd_outdent"                        oncommand="goDoCommand('cmd_outdent')"/>
  <command id="cmd_blockquote"                     oncommand="goDoNoCSSCommand('cmd_blockquote')"/>

  <command id="cmd_bgFontColor"       state=""            oncommand="ComposerCommands.doStatefulCommand('cmd_bgFontColor', event.target.value)"/>
  <command id="cmd_bgBackgroundColor" state="transparent" oncommand="ComposerCommands.doStatefulCommand('cmd_bgBackgroundColor', event.target.value)"/>
</commandset>

<commandset id="selectionBasedCommands"
            commandupdater="true"
            events="style,create"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this);">
  <command id="cmd_selectionChanged"/>
  <command id="cmd_BGundo" label="&undoCmd.label;" 
           accesskey="&undoCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGundo')"
           disabled="true"/>
  <command id="cmd_BGredo" label="&redoCmd.label;"
           accesskey="&redoCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGredo')"
           disabled="true"/>
  <command id="cmd_BGcut" label="&cutCmd.label;"
           accesskey="&cutCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGcut')"
           disabled="true"/>
  <command id="cmd_BGcopy" label="&copyCmd.label;"
           accesskey="&copyCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGcopy')"
           disabled="true"/>
  <command id="cmd_BGpaste" label="&pasteCmd.label;"
           accesskey="&pasteCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGpaste')"
           disabled="true"/>
  <command id="cmd_BGdelete" label="&deleteCmd.label;"
           accesskey="&deleteCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGdelete')"
           disabled="true"/>
  <command id="cmd_BGselectAll" label="&selectAllCmd.label;"
           accesskey="&selectAllCmd.accesskey;"
           oncommand="goDoCommand('cmd_BGselectAll')"
           disabled="true"/>
  <command id="cmd_copyHTMLCode"
           oncommand="goDoCommand('cmd_copyHTMLCode')"
           disabled="true"/>
  <command id="cmd_BGpasteNoFormatting" label="&pasteNoFormatting.label;"
           accesskey="&pasteNoFormatting.accesskey;"
           oncommand="goDoCommand('cmd_BGpasteNoFormatting')"
           disabled="true"/>

</commandset>

<commandset id="composerSaveMenuItems"
            commandupdater="true"
            events="create,style,save"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">
  <command id="cmd_save"                                             oncommand="goDoCommand('cmd_save')"/>
  <command id="cmd_saveAs"         label="&saveAsCmd.label;"         oncommand="goDoCommand('cmd_saveAs')"/>
  <command id="cmd_closeTab"       label="&closeTabCmd.label;"       oncommand="goDoCommand('cmd_closeTab')"/>
  <command id="cmd_closeEbook"     label="&closeEbookCmd.label;"     oncommand="goDoCommand('cmd_closeEbook')"/>

  <command id="cmd_print"          label="&printCmd.label;"          oncommand="goDoCommand('cmd_print')"/>
  <command id="cmd_printSettings"  label="&printSetupCmd.label;"     oncommand="goDoCommand('cmd_printSettings')"/>

  <command id="cmd_bgfind"         label="&findCmd.label;"           accesskey="&findCmd.accesskey;"    oncommand="goDoCommand('cmd_bgfind')"/>
  <command id="cmd_bgfindagain"    label="&findAgainCmd.label;"      accesskey="&findAgainCmd.accesskey;" oncommand="goDoCommand('cmd_bgfindagain')"/>
  <command id="cmd_replace"        label="&replaceCmd.label;"        accesskey="&replaceCmd.accesskey;" oncommand="goDoCommand('cmd_replace')"/>
  <command id="cmd_browse"                                           oncommand="goDoCommand('cmd_browse')"/>
</commandset>

<commandset id="composerTableMenuItems"
            commandupdater="true"
            events="create,style,mode_switch"
            oncommandupdate="ComposerCommands.goUpdateComposerMenuItems(this)">
  <!-- Table menu -->
  <command id="cmd_SelectTable"         oncommand="goDoCommand('cmd_SelectTable')"/>
  <command id="cmd_SelectTableCaption"  oncommand="goDoCommand('cmd_SelectTableCaption')"/>
  <command id="cmd_SelectRow"           oncommand="goDoCommand('cmd_SelectRow')"/>
  <command id="cmd_SelectColumn"        oncommand="goDoCommand('cmd_SelectColumn')"/>
  <command id="cmd_SelectCell"          oncommand="goDoCommand('cmd_SelectCell')"/>
  <command id="cmd_SelectAllCells"      oncommand="goDoCommand('cmd_SelectAllCells')"/>
  <command id="cmd_InsertTableCaption"  oncommand="goDoCommand('cmd_InsertTableCaption')"/>
  <command id="cmd_InsertRowAbove"      oncommand="goDoCommand('cmd_InsertRowAbove')"/>
  <command id="cmd_InsertRowBelow"      oncommand="goDoCommand('cmd_InsertRowBelow')"/>
  <command id="cmd_InsertColumnBefore"  oncommand="goDoCommand('cmd_InsertColumnBefore')"/>
  <command id="cmd_InsertColumnAfter"   oncommand="goDoCommand('cmd_InsertColumnAfter')"/>
  <command id="cmd_InsertCellBefore"    oncommand="goDoCommand('cmd_InsertCellBefore')"/>
  <command id="cmd_InsertCellAfter"     oncommand="goDoCommand('cmd_InsertCellAfter')"/>
  <command id="cmd_DeleteTable"         oncommand="goDoCommand('cmd_DeleteTable')"/>
  <command id="cmd_DeleteTableCaption"  oncommand="goDoCommand('cmd_DeleteTableCaption')"/>
  <command id="cmd_DeleteRow"           oncommand="goDoCommand('cmd_DeleteRow')"/>
  <command id="cmd_DeleteColumn"        oncommand="goDoCommand('cmd_DeleteColumn')"/>
  <command id="cmd_DeleteCell"          oncommand="goDoCommand('cmd_DeleteCell')"/>
  <command id="cmd_DeleteCellContents"  oncommand="goDoCommand('cmd_DeleteCellContents')"/>
  <command id="cmd_NormalizeTable"      oncommand="goDoCommand('cmd_NormalizeTable')"/>
  <command id="cmd_JoinTableCells"      oncommand="goDoCommand('cmd_JoinTableCells')"/>
  <command id="cmd_SplitTableCell"      oncommand="goDoCommand('cmd_SplitTableCell')"/>
  <command id="cmd_ConvertToTable"      oncommand="goDoCommand('cmd_ConvertToTable')"/>
  <command id="cmd_ConvertClipboardToTable" oncommand="goDoCommand('cmd_ConvertClipboardToTable')"/>
  <command id="cmd_TableOrCellColor"    oncommand="goDoCommand('cmd_TableOrCellColor')"/>
  <command id="cmd_editTable"           oncommand="goDoCommand('cmd_editTable')"/>
</commandset>

<keyset id="editorKeys">
  <key id="key_newNavigator"   key="t" modifiers="accel"       observes="cmd_new"/>
  <key id="key_newWindow"      key="n" modifiers="accel"       observes="cmd_newWindow"/>
  <key id="key_newWithOptions" key="n" modifiers="accel,shift" oncommand="NewDocumentWithOptions(event);"/>
</keyset>

<stringbundleset id="languageSet">
  <stringbundle id="bundleRegions"      src="chrome://global/locale/regionNames.properties"/>
  <stringbundle id="bundleLanguages"    src="chrome://global/locale/languageNames.properties"/>
  <stringbundle id="bundlePreferences"  src="chrome://bluegriffon/locale/language.properties"/>
  <stringbundle id="bundleHTML5"        src="chrome://bluegriffon/locale/html5.properties"/>
  <stringbundle id="bundleAccepted"     src="resource://gre/res/language.properties"/>
  <stringbundle id="bundleOpenLocation" src="chrome://bluegriffon/locale/openLocation.properties"/>
</stringbundleset>

<stringbundleset id="otherBundles"/>

