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
          <menuitem label="alert" value="alert" tooltiptext="&alertRole.label;" type="checkbox"/>
          <menuitem label="alertdialog" value="alertdialog" tooltiptext="&alertdialogRole.label;" type="checkbox"/>
          <menuitem label="application" value="application" tooltiptext="&applicationRole.label;" type="checkbox"/>
          <menuitem label="article" value="article" tooltiptext="&articleRole.label;" type="checkbox"/>
          <menuitem label="banner" value="banner" tooltiptext="&bannerRole.label;" type="checkbox"/>
          <menuitem label="button" value="button" tooltiptext="&buttonRole.label;" type="checkbox"/>
          <menuitem label="checkbox" value="checkbox" tooltiptext="&checkboxRole.label;" type="checkbox"/>
          <menuitem label="columnheader" value="columnheader" tooltiptext="&columnheaderRole.label;" type="checkbox"/>
          <menuitem label="combobox" value="combobox" tooltiptext="&comboboxRole.label;" type="checkbox"/>
          <menuitem label="command" value="command" tooltiptext="&commandRole.label;" type="checkbox"/>
          <menuitem label="complementary" value="complementary" tooltiptext="&complementaryRole.label;" type="checkbox"/>
          <menuitem label="composite" value="composite" tooltiptext="&compositeRole.label;" type="checkbox"/>
          <menuitem label="contentinfo" value="contentinfo" tooltiptext="&contentinfoRole.label;" type="checkbox"/>
          <menuitem label="definition" value="definition" tooltiptext="&definitionRole.label;" type="checkbox"/>
          <menuitem label="dialog" value="dialog" tooltiptext="&dialogRole.label;" type="checkbox"/>
          <menuitem label="directory" value="directory" tooltiptext="&directoryRole.label;" type="checkbox"/>
          <menuitem label="document" value="document" tooltiptext="&documentRole.label;" type="checkbox"/>
          <menuitem label="form" value="form" tooltiptext="&formRole.label;" type="checkbox"/>
          <menuitem label="grid" value="grid" tooltiptext="&gridRole.label;" type="checkbox"/>
          <menuitem label="gridcell" value="gridcell" tooltiptext="&gridcellRole.label;" type="checkbox"/>
          <menuitem label="group" value="group" tooltiptext="&groupRole.label;" type="checkbox"/>
          <menuitem label="heading" value="heading" tooltiptext="&headingRole.label;" type="checkbox"/>
          <menuitem label="img" value="img" tooltiptext="&imgRole.label;" type="checkbox"/>
          <menuitem label="input" value="input" tooltiptext="&inputRole.label;" type="checkbox"/>
          <menuitem label="landmark" value="landmark" tooltiptext="&landmarkRole.label;" type="checkbox"/>
          <menuitem label="link" value="link" tooltiptext="&linkRole.label;" type="checkbox"/>
          <menuitem label="list" value="list" tooltiptext="&listRole.label;" type="checkbox"/>
          <menuitem label="listbox" value="listbox" tooltiptext="&listboxRole.label;" type="checkbox"/>
          <menuitem label="listitem" value="listitem" tooltiptext="&listitemRole.label;" type="checkbox"/>
          <menuitem label="log" value="log" tooltiptext="&logRole.label;" type="checkbox"/>
          <menuitem label="main" value="main" tooltiptext="&mainRole.label;" type="checkbox"/>
          <menuitem label="marquee" value="marquee" tooltiptext="&marqueeRole.label;" type="checkbox"/>
          <menuitem label="math" value="math" tooltiptext="&mathRole.label;" type="checkbox"/>
          <menuitem label="menu" value="menu" tooltiptext="&menuRole.label;" type="checkbox"/>
          <menuitem label="menubar" value="menubar" tooltiptext="&menubarRole.label;" type="checkbox"/>
          <menuitem label="menuitem" value="menuitem" tooltiptext="&menuitemRole.label;" type="checkbox"/>
          <menuitem label="menuitemcheckbox" value="menuitemcheckbox" tooltiptext="&menuitemcheckboxRole.label;" type="checkbox"/>
          <menuitem label="menuitemradio" value="menuitemradio" tooltiptext="&menuitemradioRole.label;" type="checkbox"/>
          <menuitem label="navigation" value="navigation" tooltiptext="&navigationRole.label;" type="checkbox"/>
          <menuitem label="note" value="note" tooltiptext="&noteRole.label;" type="checkbox"/>
          <menuitem label="option" value="option" tooltiptext="&optionRole.label;" type="checkbox"/>
          <menuitem label="presentation" value="presentation" tooltiptext="&presentationRole.label;" type="checkbox"/>
          <menuitem label="progressbar" value="progressbar" tooltiptext="&progressbarRole.label;" type="checkbox"/>
          <menuitem label="radio" value="radio" tooltiptext="&radioRole.label;" type="checkbox"/>
          <menuitem label="radiogroup" value="radiogroup" tooltiptext="&radiogroupRole.label;" type="checkbox"/>
          <menuitem label="range" value="range" tooltiptext="&rangeRole.label;" type="checkbox"/>
          <menuitem label="region" value="region" tooltiptext="&regionRole.label;" type="checkbox"/>
          <menuitem label="roletype" value="roletype" tooltiptext="&roletypeRole.label;" type="checkbox"/>
          <menuitem label="row" value="row" tooltiptext="&rowRole.label;" type="checkbox"/>
          <menuitem label="rowgroup" value="rowgroup" tooltiptext="&rowgroupRole.label;" type="checkbox"/>
          <menuitem label="rowheader" value="rowheader" tooltiptext="&rowheaderRole.label;" type="checkbox"/>
          <menuitem label="scrollbar" value="scrollbar" tooltiptext="&scrollbarRole.label;" type="checkbox"/>
          <menuitem label="search" value="search" tooltiptext="&searchRole.label;" type="checkbox"/>
          <menuitem label="section" value="section" tooltiptext="&sectionRole.label;" type="checkbox"/>
          <menuitem label="sectionhead" value="sectionhead" tooltiptext="&sectionheadRole.label;" type="checkbox"/>
          <menuitem label="select" value="select" tooltiptext="&selectRole.label;" type="checkbox"/>
          <menuitem label="separator" value="separator" tooltiptext="&separatorRole.label;" type="checkbox"/>
          <menuitem label="slider" value="slider" tooltiptext="&sliderRole.label;" type="checkbox"/>
          <menuitem label="spinbutton" value="spinbutton" tooltiptext="&spinbuttonRole.label;" type="checkbox"/>
          <menuitem label="status" value="status" tooltiptext="&statusRole.label;" type="checkbox"/>
          <menuitem label="structure" value="structure" tooltiptext="&structureRole.label;" type="checkbox"/>
          <menuitem label="tab" value="tab" tooltiptext="&tabRole.label;" type="checkbox"/>
          <menuitem label="tablist" value="tablist" tooltiptext="&tablistRole.label;" type="checkbox"/>
          <menuitem label="tabpanel" value="tabpanel" tooltiptext="&tabpanelRole.label;" type="checkbox"/>
          <menuitem label="textbox" value="textbox" tooltiptext="&textboxRole.label;" type="checkbox"/>
          <menuitem label="timer" value="timer" tooltiptext="&timerRole.label;" type="checkbox"/>
          <menuitem label="toolbar" value="toolbar" tooltiptext="&toolbarRole.label;" type="checkbox"/>
          <menuitem label="tooltip" value="tooltip" tooltiptext="&tooltipRole.label;" type="checkbox"/>
          <menuitem label="tree" value="tree" tooltiptext="&treeRole.label;" type="checkbox"/>
          <menuitem label="treegrid" value="treegrid" tooltiptext="&treegridRole.label;" type="checkbox"/>
          <menuitem label="treeitem" value="treeitem" tooltiptext="&treeitemRole.label;" type="checkbox"/>
          <menuitem label="widget" value="widget" tooltiptext="&widgetRole.label;" type="checkbox"/>
          <menuitem label="window" value="window" tooltiptext="&windowRole.label;" type="checkbox"/>
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

</popupset>

