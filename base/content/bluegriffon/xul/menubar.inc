  <menubar id="composer-main-menubar" class="chromeclass-menubar"
           fullscreentoolbar="true">

    <menu id="fileMenu" label="&fileMenu.label;" accesskey="&fileMenu.accesskey;">
      <menupopup id="fileMenu_popup">
        <menuitem id="openPageMenuitem" accesskey="&openPage.accesskey;" key="openpagekb" command="cmd_open"/>
        <menuitem id="openFileMenuitem"                                  key="openfilekb" command="cmd_openFile"/>

        <menu id="menu_RecentFiles" accesskey="&filerecentmenu.accesskey;" label="&fileRecentMenu.label;"
              onpopupshowing="RecentPagesHandler.buildRecentPagesMenu();">
          <menupopup id="menupopup_RecentFiles"
                      oncommand="OpenFile(event.target.getAttribute('value'), true);"/>
            <!-- menuitems appended at runtime -->
        </menu>
        <menuseparator/>
        <menuitem id="saveMenuitem"   key="savekb" command="cmd_save" label="&saveCmd.label;"/>
        <menuitem id="saveAsMenuitem" key="saveaskb" command="cmd_saveAs"/>

        <menuseparator/>
        <menuitem label="&newMenu.label;" accesskey="&newMenu.accesskey;" key="key_newNavigator"
                  command="cmd_new"/>
        <menuitem label="&newOtherCmd.label;"     oncommand="NewDocumentWithOptions(event);"/>

        <menuitem label="&newWindow.label;" key="key_newWindow"
                  command="cmd_newWindow" />

        <menuseparator/>
        <menuitem label="&newWizardMenu.label;"
                  id="newWizardMenu"
                  command="cmd_newWizard"/>

        <menuseparator/>
        <menuitem id="browseMenuitem"
                  label="&browseToolbarCmd.label;" command="cmd_browse"/>

        <menuseparator/>
        <menuitem id="printSettingsMenuitem" command="cmd_printSettings"/>
        <menuitem id="printMenuitem"         command="cmd_print" key="printkb"/>

        <menuseparator/>
        <menuitem id="closeTabMenuitem" key="closetabkb" command="cmd_closeTab"/>

        <menuseparator id="menu_FileQuitSeparator"/>
        <menuitem id="menu_FileQuitItem"
                  label="&quit.label;"
                  accesskey="&quit.accesskey;"
                  key="key_quitApplication"
                  oncommand="goQuitApplication()"/>
      </menupopup>
    </menu>

    <menu id="editMenu"   label="&editMenu.label;"   accesskey="&editMenu.accesskey;">
      <menupopup id="editMenuPopup">
        <!-- magic from chrome://global/content/editMenuOverlay.xul -->
        <menuitem id="menu_BGundo" command="cmd_BGundo" key="key_BGundo"/>
        <menuitem id="menu_BGredo" command="cmd_BGredo" key="key_BGredo"/>
        <menuseparator/>
        <menuitem id="menu_BGcut"   command="cmd_BGcut"  key="key_BGcut"/>
        <menuitem id="menu_BGcopy"  command="cmd_BGcopy" key="key_BGcopy"/>
        <menuitem id="menu_BGpaste" command="cmd_BGpaste" key="key_BGpaste"/>
        <menuitem id="menu_BGpasteNoFormatting_cm" command="cmd_BGpasteNoFormatting"/>
        <menuitem id="menu_BGdelete"  command="cmd_BGdelete"/>
        <menuseparator/>
        <menu label="&select.label;">
          <menupopup>
            <menuitem label="&parentElement.label;"
                      key="structureclimbkb"
                      command="cmd_structureClimb"/>
            <menuitem label="&firstChild.label;"
                      key="structurefirstchildkb"
                      command="cmd_structureFirstChild"/>
            <menuseparator/>
            <menuitem label="&nextSibling.label;"
                      key="structurenextkb"
                      command="cmd_structureNext"/>
            <menuitem label="&previousSibling.label;"
                      key="structurepreviousbkb"
                      command="cmd_structurePrevious"/>
          </menupopup>
        </menu>
        <menuitem id="menu_BGselectAll" command="cmd_BGselectAll" key="key_BGselectAll"/>
        <menuseparator/>
        <menuitem id="menu_copyHTMLCode"
                  label="&copyHTMLCodeCmd.label;"
                  accesskey="&copyHTMLCodeCmd.accesskey;"
                  command="cmd_copyHTMLCode"/>
        <menuseparator/>
        <menuitem id="menu_gotoLink"
                  label="&gotoLink.label;"
                  accesskey="&gotoLink.accesskey;"
                  command="cmd_gotoLink"/>
        <menuitem id="menu_editLink"
                  label="&openLinkCmdInTab.label;"
                  command="cmd_editLink"/>
        <menuseparator/>
        <menuitem label="&spellCheck.label;"
                  accesskey="&spellCheck.accesskey;"
                  command="cmd_spellCheck"/>
        <menuseparator/>
        <menuitem id="bgmenu_find" command="cmd_bgfind"
                  key="findkb"/>
        <menuitem id="bgmenu_findAgain" command="cmd_bgfindagain"
                  key="findagainkb"/>
        <menuitem id="bgmenu_replace" command="cmd_replace"
                  key="replacekb"/>
      </menupopup>
    </menu>

    <menu id="viewMenu"   label="&viewMenu.label;"   accesskey="&viewMenu.accesskey;">
      <menupopup id="viewMenuPopup"
                 onpopupshowing="UpdateViewMenu()">
        <menuitem label="&allTagsMode.label;"
                  type="checkbox"
                  id="allTagsModeMenuitem"
                  observes="cmd_renderedHTMLEnabler"
                  oncommand="ToggleAllTagsMode()"/>
        <menuseparator/>
        <menu label="&viewToolbars.label;">
          <menupopup id="viewToolbarsPopup" onpopupshowing="onViewToolbarsPopupShowing()">
            <menuitem label="&formatToolbar.name;"
                      id="viewFormatToolbarMenuitem"
                      type="checkbox"
                      oncommand="ToggleToolbar('horizontal_toolbars')"/>
            <menuitem label="&formatToolbar2.name;"
                      id="viewFormatToolbar2Menuitem"
                      type="checkbox"
                      oncommand="ToggleToolbar('vertical_toolbar')"/>
            <menuseparator/>
            <menuitem label="&structureBar.caption;"
                      id="viewStructurebarMenuitem"
                      type="checkbox"
                      oncommand="ToggleToolbar('structurebar')"/>
            <menuseparator/>
            <menuitem label="&viewStatusbar.label;"
                      id="viewStatusbarMenuitem"
                      type="checkbox"
                      oncommand="ToggleToolbar('statusbar')"/>
          </menupopup>
        </menu>
        <menu label="&source.label;" observes="cmd_renderedSourceEnabler">
          <menupopup>
            <menu label="&theme.label;">
              <menupopup id="themesMenupopup"
                         onpopupshowing="FillAceThemesMenupopup()"
                         oncommand="UseAceTheme(event)"/>
            </menu>
          </menupopup>
        </menu>
        <menuseparator/>
        <menuitem label="&toggleViewMenu.label;"
                  id="toggleViewMenuitem"
                  accesskey="&toggleViewMenu.accesskey;"
                  key="toggleviewkb"
                  command="cmd_toggleView"/>
      </menupopup>
    </menu>

    <menu id="insertMenu" label="&insertMenu.label;" accesskey="&insertMenu.accesskey;">
      <menupopup id="insertMenuPopup">
        <menuitem label="&imageToolbarCmd.label;"
                  command="cmd_image"
                  accesskey="&imageToolbarCmd.key;"/>
        <menuitem label="&linkToolbarCmd.label;"
                  command="cmd_link"
                  accesskey="&linkToolbarCmd.key;"/>
        <menuitem label="&anchorToolbarCmd.label;"
                  command="cmd_anchor"
                  accesskey="&anchorToolbarCmd.key;"/>
        <menuitem label="&hrToolbarCmd.label;"
                  command="cmd_hr"
                  accesskey="&hrToolbarCmd.key;"/>
        <menuitem id="videoMenuitem"
                  label="&videoToolbarCmd.label;" command="cmd_video"/>
        <menuitem id="audioMenuitem"
                  label="&audioToolbarCmd.label;" command="cmd_audio"/>

        <menu label="&formToolbarCmd.label;" id="formMenu">
            <menupopup>
              <menuitem label="&formToolbarCmd.label;"
                        accesskey="&formToolbarCmd.key;"
                        command="cmd_form"/>
              <menuseparator/>
              <menu label="&formInputs.label;">
                <menupopup>
                    <menuitem label="&hiddenInputForm.label;"
                              command="cmd_formInputHidden"/>
                    <menuitem label="&textInputForm.label;"
                              command="cmd_formInputText"/>
                    <menuitem label="&searchInputForm.label;"
                              command="cmd_formInputSearch"/>
                    <menuitem label="&telInputForm.label;"
                              command="cmd_formInputTel"/>
                    <menuitem label="&urlInputForm.label;"
                              command="cmd_formInputUrl"/>
                    <menuitem label="&emailInputForm.label;"
                              command="cmd_formInputEmail"/>
                    <menuitem label="&passwordInputForm.label;"
                              command="cmd_formInputPassword"/>
                    <menuitem label="&datetimeInputForm.label;"
                              command="cmd_formInputDatetime"/>
                    <menuitem label="&dateInputForm.label;"
                              command="cmd_formInputDate"/>
                    <menuitem label="&monthInputForm.label;"
                              command="cmd_formInputMonth"/>
                    <menuitem label="&weekInputForm.label;"
                              command="cmd_formInputWeek"/>
                    <menuitem label="&timeInputForm.label;"
                              command="cmd_formInputTime"/>
                    <menuitem label="&datetimelocalInputForm.label;"
                              command="cmd_formInputDatetimelocal"/>
                    <menuitem label="&numberInputForm.label;"
                              command="cmd_formInputNumber"/>
                    <menuitem label="&rangeInputForm.label;"
                              command="cmd_formInputRange"/>
                    <menuitem label="&colorInputForm.label;"
                              command="cmd_formInputColor"/>
                    <menuitem label="&checkboxInputForm.label;"
                              command="cmd_formInputCheckbox"/>
                    <menuitem label="&radioInputForm.label;"
                              command="cmd_formInputRadio"/>
                    <menuitem label="&fileInputForm.label;"
                              command="cmd_formInputFile"/>
                    <menuitem label="&submitInputForm.label;"
                              command="cmd_formInputSubmit"/>
                    <menuitem label="&imageInputForm.label;"
                              command="cmd_formInputImage"/>
                    <menuitem label="&resetInputForm.label;"
                              command="cmd_formInputReset"/>
                    <menuitem label="&buttonInputForm.label;"
                              command="cmd_formInputButton"/>
                 </menupopup>
              </menu>
              <menuitem label="&fieldsetToolbarCmd.label;"
                        accesskey="&fieldsetToolbarCmd.key;"
                        command="cmd_fieldset"/>
              <menuitem label="&labelToolbarCmd.label;"
                        accesskey="&labelToolbarCmd.key;"
                        command="cmd_label"/>
              <menuitem label="&buttonToolbarCmd.label;"
                        accesskey="&buttonToolbarCmd.key;"
                        command="cmd_button"/>
              <menuitem label="&selectToolbarCmd.label;"
                        accesskey="&selectToolbarCmd.key;"
                        command="cmd_select"/>
              <menuitem label="&textareaToolbarCmd.label;"
                        accesskey="&textareaToolbarCmd.key;"
                        command="cmd_textarea"/>
              <menuitem label="&keygenToolbarCmd.label;"
                        accesskey="&keygenToolbarCmd.key;"
                        command="cmd_keygen"/>
              <menuitem label="&outputToolbarCmd.label;"
                        accesskey="&outputToolbarCmd.key;"
                        command="cmd_output"/>
              <menuitem label="&progressToolbarCmd.label;"
                        accesskey="&progressToolbarCmd.key;"
                        command="cmd_progress"/>
              <menuitem label="&meterToolbarCmd.label;"
                        accesskey="&meterToolbarCmd.key;"
                        command="cmd_meter"/>
              <menuitem label="&datalistToolbarCmd.label;"
                        accesskey="&datalistToolbarCmd.key;"
                        command="cmd_datalist"/>
           </menupopup>
        </menu>
        <menuseparator/>
          <menuitem label="&tableOfContents.label;"
                    observes="cmd_renderedHTMLEnabler"
                    oncommand="CreateOrUpdateTableOfContents()"/>
        <menuseparator/>
        <menu label="&html5Element.label;">
          <menupopup id="html5InsertionMenupopup"
                     onpopupshowing="HTML5Helper.initInsertMenu(this)"/>
        </menu>
        <menuseparator/>
        <menuitem label="&htmlToolbarCmd.label;"
                  command="cmd_html"
                  accesskey="&htmlToolbarCmd.key;"/>
        <menuitem label="&commentOrPHPOrPI.label;"
                  command="cmd_commentOrPI"/>
        <menuseparator/>
        <menu label="&webfonts.label;">
          <menupopup id="webfontsMenupopup"/>
        </menu>
#ifndef XP_MACOSX
        <menuseparator/>
        <menuitem label="&specialChars.label;"
                  oncommand="OpenCharInsertionDialog()"/>
#endif
      </menupopup>
    </menu>

    <menu id="formatMenu" label="&formatMenu.label;" accesskey="&formatMenu.accesskey;">
      <menupopup id="formatMenuPopup" onpopupshowing="initFontStyleMenu(this)">
        <menuitem label="&spanCmd.label;"
                  command="cmd_span"
                  accesskey="&spanCmd.accesskey;"/>
        <menuseparator/>
        <menuitem label="&styleBoldCmd.label;"        accesskey="&stylebold.accesskey;"         observes="cmd_bold"          type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleItalicCmd.label;"      accesskey="&styleitalic.accesskey;"       observes="cmd_italic"        type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleUnderlineCmd.label;"   accesskey="&styleunderline.accesskey;"    observes="cmd_underline"     type="checkbox" key="underlinekb">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleStrikeThruCmd.label;"  accesskey="&stylestrikethru.accesskey;"   observes="cmd_strikethrough" type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleSuperscriptCmd.label;" accesskey="&stylesuperscript.accesskey;"  observes="cmd_superscript"   type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleSubscriptCmd.label;"   accesskey="&stylesubscript.accesskey;"    observes="cmd_subscript"     type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&fontFixedWidth.label;"      accesskey="&fontfixedwidth.accesskey;"    observes="cmd_tt"            type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleNonbreakingCmd.label;" accesskey="&stylenonbreaking.accesskey;"  observes="cmd_nobreak"       type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuseparator/>
        <menuitem label="&styleEm.label;"             accesskey="&styleEm.accesskey;"           observes="cmd_em"            type="checkbox" key="emkb">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleStrong.label;"         accesskey="&styleStrong.accesskey;"       observes="cmd_strong"        type="checkbox" key="strongkb">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleCite.label;"           accesskey="&styleCite.accesskey;"         observes="cmd_cite"          type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleAbbr.label;"           accesskey="&styleAbbr.accesskey;"         observes="cmd_abbr"          type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleAcronym.label;"        accesskey="&styleAcronym.accesskey;"      observes="cmd_acronym"       type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleCode.label;"           accesskey="&styleCode.accesskey;"         observes="cmd_code"          type="checkbox" key="codekb">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleSamp.label;"           accesskey="&styleSamp.accesskey;"         observes="cmd_samp"          type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem label="&styleVar.label;"            accesskey="&styleVar.accesskey;"          observes="cmd_var"           type="checkbox">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuseparator/>
        <menuitem id="menu_removeAllStyles"  label="&removeAllStyles.label;"  accesskey="&removeAllStyles.accesskey;"  observes="cmd_removeStyles">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuitem id="menu_removeAllLinks"   label="&removeAllLinks.label;"   accesskey="&removeAllLinks.accesskey;"   observes="cmd_removeLinks">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuseparator />
        <menuitem label="&listProperties.label;" observes="cmd_list">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
        <menuseparator/>
        <menuitem label="&pageProperties.label;" observes="cmd_pageProperties">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled"/>
        </menuitem>
      </menupopup>
    </menu>

    <menu id="tableMenu" label="&tableMenu.label;" accesskey="&tableMenu.accesskey;">
      <menupopup id="tableMenuPopup">
        <menu id="tableInsertMenu" label="&tableInsertMenu.label;" accesskey="&tableinsertmenu.accesskey;">
          <menupopup>
            <menuitem label="&tableTable.label;"        accesskey="&tabletable.accesskey;"        command="cmd_InsertTable"/>
            <menuseparator />
            <menuitem label="&tableCaption.label;"                                                command="cmd_InsertTableCaption"/>
            <menuseparator />
            <menuitem label="&tableRowAbove.label;"     accesskey="&tablerow.accesskey;"          command="cmd_InsertRowAbove"/>
            <menuitem label="&tableRowBelow.label;"     accesskey="&tablerowbelow.accesskey;"     command="cmd_InsertRowBelow"/>
            <menuseparator />
            <menuitem label="&tableColumnBefore.label;" accesskey="&tablecolumn.accesskey;"       command="cmd_InsertColumnBefore"/>
            <menuitem label="&tableColumnAfter.label;"  accesskey="&tablecolumnafter.accesskey;"  command="cmd_InsertColumnAfter"/>
            <menuseparator />
            <menuitem label="&tableCellBefore.label;"   accesskey="&tablecell.accesskey;"         command="cmd_InsertCellBefore"/>
            <menuitem label="&tableCellAfter.label;"    accesskey="&tablecellafter.accesskey;"    command="cmd_InsertCellAfter"/>
          </menupopup>
        </menu>
        <menu id="tableSelectMenu" label="&tableSelectMenu.label;" accesskey="&tableselectmenu.accesskey;">
          <menupopup id="tableSelectPopup">
            <menuitem id="menu_SelectTable"        label="&tableTable.label;"    accesskey="&tabletable.accesskey;"    command="cmd_SelectTable"    />
            <menuitem id="menu_SelectTableCaption" label="&tableCaption.label;"                                        command="cmd_SelectTableCaption"    />
            <menuitem id="menu_SelectRow"          label="&tableRow.label;"      accesskey="&tablerow.accesskey;"      command="cmd_SelectRow"      />
            <menuitem id="menu_SelectColumn"       label="&tableColumn.label;"   accesskey="&tablecolumn.accesskey;"   command="cmd_SelectColumn"   />
            <menuitem id="menu_SelectCell"         label="&tableCell.label;"     accesskey="&tablecell.accesskey;"     command="cmd_SelectCell"     />
            <menuitem id="menu_SelectAllCells"     label="&tableAllCells.label;" accesskey="&tableallcells.accesskey;" command="cmd_SelectAllCells" />
          </menupopup>
        </menu>
        <menu id="tableDeleteMenu" label="&tableDeleteMenu.label;" accesskey="&tabledeletemenu.accesskey;">
          <menupopup id="tableDeletePopup">
            <menuitem id="menu_DeleteTable"         label="&tableTable.label;"        accesskey="&tabletable.accesskey;"          command="cmd_DeleteTable"/>
            <menuitem id="menu_DeleteTableCaption"  label="&tableCaption.label;"                                                  command="cmd_DeleteTableCaption"/>
            <menuitem id="menu_DeleteRow"           label="&tableRows.label;"         accesskey="&tablerow.accesskey;"            command="cmd_DeleteRow"/>
            <menuitem id="menu_DeleteColumn"        label="&tableColumns.label;"      accesskey="&tablecolumn.accesskey;"         command="cmd_DeleteColumn"/>
            <menuitem id="menu_DeleteCell"          label="&tableCells.label;"        accesskey="&tablecell.accesskey;"           command="cmd_DeleteCell"/>
            <menuitem id="menu_DeleteCellContents"  label="&tableCellContents.label;" accesskey="&tablecellcontents.accesskey;"   command="cmd_DeleteCellContents"/>
          </menupopup>
        </menu>
        <menuseparator />
        <!-- menu label is set in InitTableMenu -->
        <menuitem id="menu_JoinTableCells"   label="&tableJoinCells.label;"   accesskey="&tablejoincells.accesskey;"   command="cmd_JoinTableCells"/>
        <menuitem id="menu_SplitTableCell"   label="&tableSplitCell.label;"   accesskey="&tablesplitcell.accesskey;"   command="cmd_SplitTableCell"/>
        <menuitem id="menu_ConvertToTable"   label="&convertToTable.label;"   accesskey="&converttotable.accesskey;"   command="cmd_ConvertToTable"/>
        <menuitem id="menu_ConvertClipboardToTable"   label="&convertClipboardToTable.label;" command="cmd_ConvertClipboardToTable"/>
        <menuseparator />
        <menuitem id="menu_tableProperties"  label="&tableProperties.label;"  accesskey="&tableProperties.accesskey;"  command="cmd_editTable"/>

      </menupopup>
    </menu>

    <menu id="panelsMenu" label="&panelsMenu.label;" accesskey="&panelsMenu.accesskey;"
          oncommand="start_panel(event.originalTarget)">
      <menupopup id="panelsMenuPopup"/>
    </menu>

    <menu id="toolsMenu" label="&toolsMenu.label;" accesskey="&toolsMenu.accesskey;">
      <menupopup id="toolsPopup">
        <menuitem id="menu_cleanup" command="cmd_cleanup"/>
        <menuseparator/>
        <menuitem label="&addonsMenu.label;"  oncommand="OpenExtensionsManager()"/>
        <!--menuseparator/-->
        <!--menuitem label="&consoleMenu.label;"  oncommand="OpenConsole()"/-->
        <menuseparator id="menu_PrefsSeparator"/>
        <menuitem id="menu_preferences"
                  label="&preferences.label;"
#ifdef XP_MACOSX
                  key="key_preferencesCmdMac"
#endif
                  oncommand="OpenPreferences()"/>
#ifdef XP_MACOSX
        <menuitem id="menu_mac_services" label="&servicesMenuMac.label;"/>
        <menuitem id="menu_mac_hide_app" label="&hideThisAppCmdMac2.label;" key="key_hideThisAppCmdMac"/>
        <menuitem id="menu_mac_hide_others" label="&hideOtherAppsCmdMac.label;" key="key_hideOtherAppsCmdMac"/>
        <menuitem id="menu_mac_show_all" label="&showAllAppsCmdMac.label;"/>
#endif
        <!--menuitem id="menu_inspector" label="DOMI" oncommand="inspectDOMDocument();"/-->

      </menupopup>
    </menu>

#ifdef XP_MACOSX
#include macWindowMenu.inc
#endif

    <menu id="helpMenu" label="&helpMenu.label;" accesskey="&helpMenu.accesskey;">
      <menupopup id="helpMenuPopup">
        <menuitem label="&aboutComposer.label;"
                  id="aboutName"
                  oncommand="AboutComposer()"/>
        <menuitem label="&homePage.label;"
                  oncommand="loadExternalURL('http://bluegriffon.org')"/>
        <menuseparator/>
        <menuitem label="&cmd.showReleaseNotes.label;"
                  oncommand="ShowReleaseNotes(true)"/>
        <menuseparator/>
        <menuitem label="BlueGriffon @ Twitter"
                  oncommand="loadExternalURL('http://twitter.com/BlueGriffonApp')"/>
        <menuseparator/>
        <menuitem label="&forumsHelpMenu.label;"
                  oncommand="loadExternalURL('&forums.url;')"/>
        <menuitem label="&qa.label;"
                  oncommand="loadExternalURL('http://bugzilla.bluegriffon.org')"/>
        <menuseparator/>
        <menuitem label="&buyUsersManual.label;"
                  oncommand="loadExternalURL('http://bluegriffon.com/#manual')"/>
        <menuitem label="&buyLicense.label;"
                  oncommand="loadExternalURL('http://bluegriffon.com/#buy')"/>
      </menupopup>
    </menu>

  </menubar>
