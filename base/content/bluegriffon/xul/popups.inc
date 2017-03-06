<popupset id="editorPopupSet">

  <menupopup id="tabContextPopup">
    <menuitem id="closeTabTabContextMenu"         label="&closeTab.label;"       oncommand="CloseOneTab()" />
    <menuitem id="closeOtherTabsTabContextMenu"   label="&closeOtherTabs.label;" oncommand="CloseAllTabsButOne()" />
    <menuseparator />
    <menuitem id="revertTabContextMenu"           label="&revert.label;" oncommand="RevertTab()" />
  </menupopup>

  <menupopup id="structureBarContextMenu"
         onpopupshowing="UpdateStructureBarContextMenu()">
    <menuitem label="&resetElementLanguage.label;"
              id="resetElementLanguageMenuitem"
              accesskey="&resetElementLanguage.accesskey;"
              oncommand="ResetLanguage(event)" />
    <menuitem label="&setElementLanguage.label;"
              accesskey="&setElementLanguage.accesskey;"
              oncommand="ShowLanguageDialog(event)" />
    <menu label="&writingDirectionMenu.label;"
          oncommand="SetDirection(event)">
      <menupopup onpopupshowing="UpdateDirectionMenu()">
        <menuitem id="noDirectionContextMenuitem"
                  label="&defaultDirectionMenu.label;"
                  value=""
                  type="radio"
                  name="direction"/>
        <menuseparator/>
        <menuitem id="ltrDirectionContextMenuitem"
                  label="▶¶ (&ltrDirectionMenu.label;)"
                  value="ltr"
                  type="radio"
                  name="direction"/>
        <menuitem id="rtlDirectionContextMenuitem"
                  label="¶◀ (&rtlDirectionMenu.label;)"
                  value="rtl"
                  type="radio"
                  name="direction"/>
      </menupopup>
    </menu>
    <menuseparator/>
    <menuitem label="&deleteElement.label;"
              id="deleteElementMenuitem"
              accesskey="&deleteElement.accesskey;"
              oncommand="DeleteElement(event)"/>
    <menuitem label="&removeTag.label;"
              id="removeTagMenuitem"
              accesskey="&removeTag.accesskey;"
              oncommand="ExplodeElement(event)"/>
     <menuitem label="&changeTag.label;"
              id="changeTagMenuitem"
              accesskey="&changeTag.accesskey;"
              oncommand="ChangeTag(event)"/>
     <menuseparator/>
     <menuitem label="&copyHTMLCodeInStructurebarContext.label;"
               id="copyHTMLCodeOfElementMenuitem"
               oncommand="goDoCommand('cmd_copyHTMLCode')"/>
     <menuseparator/>
     <menu label="&ariaRole.label;">
        <menupopup id="ARIARoleStructureBarPopup" oncommand="ComposerCommands.doStatefulCommand('cmd_ariaRole', event.target.value)"
                   onpopupshowing="onARIARoleChangeStructureBar('cmd_ariaRole')">
          <menuitem label="&noARIArole.label;" type="checkbox" value=""/>
          <menuseparator/>
        </menupopup>
     </menu>
  </menupopup>

  <menupopup id="editorContextMenu"
         onpopupshowing="UpdateEditorContextMenu(event, this)">
    <menu label="&spellCheck.label;"
          id="spellCheckMenu">
      <menupopup onpopupshowing="UpdateSpellCheckMenu(this)"
                 onpopuphiding="CleanSpellCheckMenu()">
        <menuitem label="&addToDictionary;"
                  oncommand="AddWordToDictionary()"
                  id="addToDictionarySpellCheckMenuitem"/>
        <menuseparator/>
        <menuseparator id="suggestionsSpellCheckSeparator"/>
        <menuitem label="&ignoreWord.label;"
                  command="IgnoreWord()"/>
      </menupopup>
    </menu>
    <menu label="&dictionary.label;">
      <menupopup id="dictionaryMenupopup"
                 onpopupshowing="UpdateSpellCheckDictionaries(this)"
                 onpopuphiding="CleanSpellCheckDictionaries()"/>
    </menu>
    <menuseparator/>
    <menuitem id="cMenu_undo" key="key_BGundo" command="cmd_BGundo"/>
    <menuitem id="cMenu_redo" key="key_BGredo" command="cmd_BGredo"/>
    <menuseparator/>
    <menuitem id="cMenu_cut" key="key_BGcut" command="cmd_BGcut"/>
    <menuitem id="cMenu_copy" key="key_BGcopy" command="cmd_BGcopy"/>
    <menuitem id="cMenu_paste" key="key_BGpaste" command="cmd_BGpaste"/>
    <menuitem label="&pasteNoFormatting.label;"
              command="cmd_BGpasteNoFormatting"/>
    <menuitem id="cMenu_delete" key="key_BGdelete" command="cmd_BGdelete"/>
    <menuseparator/>
    <menuitem id="cMenu_selectAll" key="key_BGselectAll"  command="cmd_BGselectAll"/>
    <menuseparator/>
    <menuitem id="cMenu_removeAllStyles"
              label="&removeAllStyles.label;"
              accesskey="&removeAllStyles.accesskey;"
              command="cmd_removeStyles"/>
    <menuitem id="cMenu_removeAllLinks"
              label="&removeAllLinks.label;"
              accesskey="&removeAllLinks.accesskey;"
              command="cmd_removeLinks"/>
    <menuseparator />
    <menuitem id="cMenu_copyHTMLCode"
              label="&copyHTMLCodeCmd.label;"
              command="cmd_copyHTMLCode"/>
    <menuseparator id="separator_before_cMenu_gotoLink" />
    <menuitem id="cMenu_insertLink"
              label="&cMenu_insertLink.label;"
              accesskey="&cMenu_insertLink.accesskey;"
              command="cmd_link"/>
    <menuitem id="cMenu_gotoLink" label="&gotoLink.label;" command="cmd_gotoLink"/>
    <menuitem id="cMenu_editLink" label="&openLinkCmdInTab.label;" command="cmd_editLink"/>
    <menuseparator id="separator_before_ctableInsertMenu"/>
    <menu id="ctableInsertMenu" label="&tableInsertMenu2.label;" accesskey="&tableinsertmenu.accesskey;">
      <menupopup>
        <menuitem label="&tableCaption.label;"                                                command="cmd_InsertTableCaption"/>
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
    <menu id="ctableSelectMenu" label="&tableSelectMenu2.label;" accesskey="&tableselectmenu.accesskey;">
      <menupopup id="ctableSelectPopup">
        <menuitem id="cmenu_SelectTable"       label="&tableTable.label;"    accesskey="&tabletable.accesskey;"    command="cmd_SelectTable"    />
        <menuitem id="menu_SelectTableCaption" label="&tableCaption.label;"                                        command="cmd_SelectTableCaption"    />
        <menuitem id="cmenu_SelectRow"         label="&tableRow.label;"      accesskey="&tablerow.accesskey;"      command="cmd_SelectRow"      />
        <menuitem id="cmenu_SelectColumn"      label="&tableColumn.label;"   accesskey="&tablecolumn.accesskey;"   command="cmd_SelectColumn"   />
        <menuitem id="cmenu_SelectCell"        label="&tableCell.label;"     accesskey="&tablecell.accesskey;"     command="cmd_SelectCell"     />
        <menuitem id="cmenu_SelectAllCells"    label="&tableAllCells.label;" accesskey="&tableallcells.accesskey;" command="cmd_SelectAllCells" />
      </menupopup>
    </menu>
    <menu id="ctableDeleteMenu" label="&tableDeleteMenu2.label;" accesskey="&tabledeletemenu.accesskey;">
      <menupopup id="ctableDeletePopup">
        <menuitem id="cmenu_DeleteTable"         label="&tableTable.label;"        accesskey="&tabletable.accesskey;"          command="cmd_DeleteTable"/>
        <menuitem id="menu_DeleteTableCaption"   label="&tableCaption.label;"                                                  command="cmd_DeleteTableCaption"/>
        <menuitem id="cmenu_DeleteRow"           label="&tableRows.label;"         accesskey="&tablerow.accesskey;"            command="cmd_DeleteRow"/>
        <menuitem id="cmenu_DeleteColumn"        label="&tableColumns.label;"      accesskey="&tablecolumn.accesskey;"         command="cmd_DeleteColumn"/>
        <menuitem id="cmenu_DeleteCell"          label="&tableCells.label;"        accesskey="&tablecell.accesskey;"           command="cmd_DeleteCell"/>
        <menuitem id="cmenu_DeleteCellContents"  label="&tableCellContents.label;" accesskey="&tablecellcontents.accesskey;"   command="cmd_DeleteCellContents"/>
      </menupopup>
    </menu>
    <menuseparator />
    <!-- menu label is set in InitTableMenu -->
    <menuitem id="cmenu_JoinTableCells"   label="&tableJoinCells.label;"   accesskey="&tablejoincells.accesskey;"   command="cmd_JoinTableCells"/>
    <menuitem id="cmenu_SplitTableCell"   label="&tableSplitCell.label;"   accesskey="&tablesplitcell.accesskey;"   command="cmd_SplitTableCell"/>
    <menuseparator />
    <menuitem id="cmenu_tableProperties"  label="&tableProperties.label;"  accesskey="&tableProperties.accesskey;"  command="cmd_editTable"/>
  </menupopup>

  <tooltip id="tab-tooltip" onpopupshowing="UpdateTabTooltip(document.tooltipNode)">
    <hbox align="center" id="tab-tooltip-main-info">
      <label id="tab-tooltip-html-dialect"/>
      <label id="tab-tooltip-title" flex="1" crop="end"/>
    </hbox>
    <grid id="tab-tooltip-grid">
      <columns>
        <column/>
        <column flex="1"/>
      </columns>
      <rows>
        <row align="center">
          <label value="&pageLocation.label;"/>
          <label id="tab-tooltip-location"/>
        </row>
        <row align="center">
          <label value="&pageAuthor.label;"/>
          <label id="tab-tooltip-author"/>
        </row>
        <row align="center">
          <label value="&pageDescription.label;"/>
          <label id="tab-tooltip-description" crop="end"/>
        </row>
        <row align="center">
          <label value="&pageKeywords.label;"/>
          <label id="tab-tooltip-keywords" crop="end"/>
        </row>
        <row align="center">
          <label value="&language.label;"/>
          <label id="tab-tooltip-language"/>
        </row>
        <row align="center">
          <label value="&charset.label;"/>
          <label id="tab-tooltip-charset"/>
        </row>
        <row align="center">
          <label value="&direction.label;"/>
          <label id="tab-tooltip-text-direction"/>
        </row>
      </rows>
    </grid>
  </tooltip>
</popupset>

