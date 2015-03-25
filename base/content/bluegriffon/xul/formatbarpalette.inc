  <toolbarpalette id="FormatToolbarPalette">

      <toolbarbutton id="boldButton" type="checkbox" autoCheck="false" command="cmd_bold" label="&boldToolbarCmd.label;"
                     tooltiptext="&boldToolbarCmd.tooltip;">
        <observes element="cmd_bold" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_bold')"/>
      </toolbarbutton>

      <toolbarbutton id="italicButton" type="checkbox" autoCheck="false" command="cmd_italic" label="&italicToolbarCmd.label;"
                     tooltiptext="&italicToolbarCmd.tooltip;">
        <observes element="cmd_italic" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_italic')"/>
      </toolbarbutton>

      <toolbarbutton id="underlineButton" type="checkbox" autoCheck="false" command="cmd_underline" label="&underlineToolbarCmd.label;"
                     tooltiptext="&underlineToolbarCmd.tooltip;">
        <observes element="cmd_underline" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_underline')"/>
      </toolbarbutton>
    
      <toolbarbutton id="strongButton" type="checkbox" autoCheck="false" command="cmd_strong" label="&strongToolbarCmd.label;"
                     tooltiptext="&strongToolbarCmd.tooltip;">
        <observes element="cmd_strong" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_strong')"/>
      </toolbarbutton>
    
      <toolbarbutton id="emButton" type="checkbox" autoCheck="false" command="cmd_em" label="&emToolbarCmd.label;"
                     tooltiptext="&emToolbarCmd.tooltip;">
        <observes element="cmd_em" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_em')"/>
      </toolbarbutton>

      <toolbarbutton id="codeButton" type="checkbox" autoCheck="false" command="cmd_code" label="&codeToolbarCmd.label;"
                     tooltiptext="&codeToolbarCmd.tooltip;">
        <observes element="cmd_code" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_code')"/>
      </toolbarbutton>

      <toolbaritem id="ParagraphSelectBox">
        <menulist class="toolbar-focustarget" id="ParagraphSelect" command="cmd_renderedHTMLEnabler"
                  tooltiptext="&ParagraphSelect.tooltip;" crop="right">
          <observes element="cmd_paragraphState" attribute="state" onbroadcast="onParagraphFormatChange(this.parentNode, 'cmd_paragraphState')"/>
          <menupopup id="ParagraphPopup" oncommand="ComposerCommands.doStatefulCommand('cmd_paragraphState', event.target.value)">
            <!-- TODO : add an onpopupshowing handler to hide the body text
                        choice in strict mode -->
            <menuitem label="&bodyTextCmd.label;"            value="" class="menuitem-non-iconic-accel"/>
            <menuitem label="&paragraphParagraphCmd.label;"  value="p" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading1Cmd.label;"            value="h1" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading2Cmd.label;"            value="h2" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading3Cmd.label;"            value="h3" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading4Cmd.label;"            value="h4" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading5Cmd.label;"            value="h5" class="menuitem-non-iconic-accel"/>
            <menuitem label="&heading6Cmd.label;"            value="h6" class="menuitem-non-iconic-accel"/>
            <menuitem label="&paragraphAddressCmd.label;"    value="address" class="menuitem-non-iconic-accel"/>
            <menuitem label="&paragraphPreformatCmd.label;"  value="pre" class="menuitem-non-iconic-accel"/>
            <menuseparator />
            <menuitem label="&genericContainerCmd.label;"    value="div" class="menuitem-non-iconic-accel"/>
          </menupopup>
        </menulist>
      </toolbaritem>

    <toolbaritem id="ARIARoleSelectBox">
      <menulist class="toolbar-focustarget"
                id="ARIARoleSelect"
                command="cmd_renderedHTMLEnabler"
                tooltiptext="&ARIARoleSelect.tooltip;" crop="right">
        <observes element="cmd_ariaRole" attribute="state" onbroadcast="onARIARoleChange(this.parentNode, 'cmd_ariaRole')"/>
        <menupopup id="ARIARolePopup" oncommand="ComposerCommands.doStatefulCommand('cmd_ariaRole', event.target.value)">
          <menuitem label="&noARIArole.label;" value="" class="menuitem-non-iconic-accel"/>
          <menuseparator/>
          <menuitem label="alert" value="alert" tooltiptext="&alertRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="alertdialog" value="alertdialog" tooltiptext="&alertdialogRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="application" value="application" tooltiptext="&applicationRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="article" value="article" tooltiptext="&articleRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="banner" value="banner" tooltiptext="&bannerRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="button" value="button" tooltiptext="&buttonRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="checkbox" value="checkbox" tooltiptext="&checkboxRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="columnheader" value="columnheader" tooltiptext="&columnheaderRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="combobox" value="combobox" tooltiptext="&comboboxRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="command" value="command" tooltiptext="&commandRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="complementary" value="complementary" tooltiptext="&complementaryRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="composite" value="composite" tooltiptext="&compositeRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="contentinfo" value="contentinfo" tooltiptext="&contentinfoRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="definition" value="definition" tooltiptext="&definitionRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="dialog" value="dialog" tooltiptext="&dialogRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="directory" value="directory" tooltiptext="&directoryRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="document" value="document" tooltiptext="&documentRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="form" value="form" tooltiptext="&formRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="grid" value="grid" tooltiptext="&gridRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="gridcell" value="gridcell" tooltiptext="&gridcellRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="group" value="group" tooltiptext="&groupRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="heading" value="heading" tooltiptext="&headingRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="img" value="img" tooltiptext="&imgRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="input" value="input" tooltiptext="&inputRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="landmark" value="landmark" tooltiptext="&landmarkRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="link" value="link" tooltiptext="&linkRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="list" value="list" tooltiptext="&listRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="listbox" value="listbox" tooltiptext="&listboxRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="listitem" value="listitem" tooltiptext="&listitemRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="log" value="log" tooltiptext="&logRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="main" value="main" tooltiptext="&mainRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="marquee" value="marquee" tooltiptext="&marqueeRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="math" value="math" tooltiptext="&mathRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="menu" value="menu" tooltiptext="&menuRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="menubar" value="menubar" tooltiptext="&menubarRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="menuitem" value="menuitem" tooltiptext="&menuitemRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="menuitemcheckbox" value="menuitemcheckbox" tooltiptext="&menuitemcheckboxRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="menuitemradio" value="menuitemradio" tooltiptext="&menuitemradioRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="navigation" value="navigation" tooltiptext="&navigationRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="note" value="note" tooltiptext="&noteRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="option" value="option" tooltiptext="&optionRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="presentation" value="presentation" tooltiptext="&presentationRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="progressbar" value="progressbar" tooltiptext="&progressbarRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="radio" value="radio" tooltiptext="&radioRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="radiogroup" value="radiogroup" tooltiptext="&radiogroupRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="range" value="range" tooltiptext="&rangeRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="region" value="region" tooltiptext="&regionRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="roletype" value="roletype" tooltiptext="&roletypeRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="row" value="row" tooltiptext="&rowRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="rowgroup" value="rowgroup" tooltiptext="&rowgroupRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="rowheader" value="rowheader" tooltiptext="&rowheaderRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="scrollbar" value="scrollbar" tooltiptext="&scrollbarRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="search" value="search" tooltiptext="&searchRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="section" value="section" tooltiptext="&sectionRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="sectionhead" value="sectionhead" tooltiptext="&sectionheadRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="select" value="select" tooltiptext="&selectRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="separator" value="separator" tooltiptext="&separatorRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="slider" value="slider" tooltiptext="&sliderRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="spinbutton" value="spinbutton" tooltiptext="&spinbuttonRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="status" value="status" tooltiptext="&statusRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="structure" value="structure" tooltiptext="&structureRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="tab" value="tab" tooltiptext="&tabRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="tablist" value="tablist" tooltiptext="&tablistRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="tabpanel" value="tabpanel" tooltiptext="&tabpanelRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="textbox" value="textbox" tooltiptext="&textboxRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="timer" value="timer" tooltiptext="&timerRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="toolbar" value="toolbar" tooltiptext="&toolbarRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="tooltip" value="tooltip" tooltiptext="&tooltipRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="tree" value="tree" tooltiptext="&treeRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="treegrid" value="treegrid" tooltiptext="&treegridRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="treeitem" value="treeitem" tooltiptext="&treeitemRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="widget" value="widget" tooltiptext="&widgetRole.label;" class="menuitem-non-iconic-accel"/>
          <menuitem label="window" value="window" tooltiptext="&windowRole.label;" class="menuitem-non-iconic-accel"/>
        </menupopup>
                   
      </menulist>
    </toolbaritem>

    <toolbarbutton id="ulButton" type="radio" group="lists" autoCheck="false" command="cmd_ul"
                   tooltiptext="&unorderedList.tooltip;" label="&unorderedList.label;">
        <observes element="cmd_ul" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_ul')"/>
    </toolbarbutton>

    <toolbarbutton id="olButton" type="radio" group="lists" autoCheck="false" command="cmd_ol"
                   tooltiptext="&orderedList.tooltip;" label="&orderedList.label;">
        <observes element="cmd_ol" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_ol')"/>
    </toolbarbutton>

    <toolbarbutton id="align-left-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_renderedHTMLEnabler"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_align', 'left')"
                   tooltiptext="&alignLeft.tooltip;" label="&alignLeft.label;" >
      <observes element="cmd_align" attribute="state" 
                onbroadcast="ComposerCommands.onStateButtonUpdate(this.parentNode, 'cmd_align', 'left')" />
    </toolbarbutton>

    <toolbarbutton id="align-center-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_renderedHTMLEnabler"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_align', 'center')"
                   tooltiptext="&alignCenter.tooltip;" label="&alignCenter.label;" >
      <observes element="cmd_align" attribute="state" 
                onbroadcast="ComposerCommands.onStateButtonUpdate(this.parentNode, 'cmd_align', 'center')"/>
    </toolbarbutton>

    <toolbarbutton id="align-right-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_renderedHTMLEnabler"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_align', 'right')"
                   tooltiptext="&alignRight.tooltip;" label="&alignRight.label;" >
      <observes element="cmd_align" attribute="state"
                onbroadcast="ComposerCommands.onStateButtonUpdate(this.parentNode, 'cmd_align', 'right')"/>
    </toolbarbutton>

    <toolbarbutton id="align-justify-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_renderedHTMLEnabler"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_align', 'justify')"
                   tooltiptext="&alignJustify.tooltip;" label="&alignJustify.label;" >
      <observes element="cmd_align" attribute="state"
                onbroadcast="ComposerCommands.onStateButtonUpdate(this.parentNode, 'cmd_align', 'justify')"/>
    </toolbarbutton>

    <toolbarbutton id="indentButton" command="cmd_indent" label="&indentToolbarCmd.label;"
                   tooltiptext="&indentToolbarCmd.tooltip;"/>

    <toolbarbutton id="outdentButton" command="cmd_outdent" label="&outdentToolbarCmd.label;"
                   tooltiptext="&outdentToolbarCmd.tooltip;"/>

    <toolbarbutton id="blockquoteButton" command="cmd_blockquote" label="&blockquoteToolbarCmd.label;"
                   tooltiptext="&blockquoteToolbarCmd.tooltip;"/>

    <toolbarbutton id="ddButton" type="radio" group="lists" autoCheck="false" command="cmd_dd"
                   tooltiptext="&definitionDescription.tooltip;" label="&definitionDescription.label;">
        <observes element="cmd_dd" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dd')"/>
    </toolbarbutton>

    <toolbarbutton id="dtButton" type="radio" group="lists" autoCheck="false" command="cmd_dt"
                   tooltiptext="&definitionTitle.tooltip;" label="&definitionTitle.label;">
        <observes element="cmd_dt" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dt')"/>
    </toolbarbutton>

    <toolbaritem id="FontFaceSelectBox">
      <menulist class="toolbar-focustarget" command="cmd_renderedHTMLEnabler"
                id="FontFaceSelect" tooltiptext="&FontFaceSelect.tooltip;" crop="right">
        <observes element="cmd_fontFace" attribute="state" onbroadcast="onFontFaceChange(this.parentNode, 'cmd_fontFace')"/>
        <menupopup id="FontFacePopup" oncommand="ComposerCommands.doStatefulCommand('cmd_fontFace', event.target.value)"
                   onpopupshowing="initFontFaceMenu(this);">
          <menuitem label="&fontVarWidth.label;"      value="" class="menuitem-non-iconic-accel"/>
          <menuitem label="&fontFixedWidth.label;"    value="tt" class="menuitem-non-iconic-accel"/>
          <menuseparator/>
          <menuitem label="&fontHelveticaFont.label;" value="Helvetica, Arial, sans-serif" class="menuitem-non-iconic-accel"/>
          <menuitem label="&fontTimes.label;"         value="Times New Roman, Times, serif" class="menuitem-non-iconic-accel"/>
          <menuitem label="&fontCourier.label;"       value="Courier New, Courier, monospace" class="menuitem-non-iconic-accel"/>
          <menuseparator/>
        </menupopup>
      </menulist>
    </toolbaritem>

    <toolbaritem id="ClassButtonsBox">
      <menulist class="toolbar-focustarget"
                id="ClassSelect"
                style="min-width: 10em"
                sizetopopup="none"
                editable="true"
                placeholder="&noClass.label;"
                onkeypress="OnKeyPressInClassMenulist(event)"
                onblur="OnBlurFromClassMenulist(event)"
                command="cmd_renderedHTMLEnabler"
                tooltiptext="&applyClassToSelectionCmd.tooltip;">
        <observes element="cmd_class" attribute="state" onbroadcast="onClassChange(this.parentNode, 'cmd_class')"/>
        <menupopup id="ClassPopup"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_class', event.target.value)"
                   onpopupshowing="initClassMenu(this, true);"/>
      </menulist>
    </toolbaritem>

    <toolbaritem id="IdButtonsBox">
      <menulist class="toolbar-focustarget"
                id="IdSelect"
                style="min-width: 10em"
                sizetopopup="none"
                editable="true"
                placeholder="&noId.label;"
                onkeypress="OnKeyPressInIdMenulist(event)"
                onblur="OnBlurFromIdMenulist(event)"
                command="cmd_renderedHTMLEnabler"
                tooltiptext="&applyIdToSelectionCmd.tooltip;">
        <observes element="cmd_id" attribute="state" onbroadcast="onIdChange(this.parentNode, 'cmd_id')"/>
        <menupopup id="IdPopup"
                   oncommand="ComposerCommands.doStatefulCommand('cmd_id', event.target.value)"
                   onpopupshowing="initIdMenu(this);"/>
      </menulist>
    </toolbaritem>

    <toolbarbutton id="rotateButton" command="cmd_renderedHTMLEnabler" label="Rotate" tooltiptext="Rotate"
                   type="checkbox" oncommand="CSSRotationsHandler.toggle(this)"/>

    <toolbaritem id="ColorsBox">
      <hbox align="center">
        <ecolorpicker id="TextColorColorpicker"
                      color="transparent"
                      tooltiptext="&color.label;"
                      colorObjectId="TextColor"
                      windowTitle="Text color"
                      observes="cmd_fontColor" 
                      oncommand="ApplyDirectTextColorChange(this.color)"
                      showTransparency="false"/>
        <ecolorpicker id="BackgroundColorColorpicker"
                      colorObjectId="BackgroundColor"
                      tooltiptext="&bgColor.label;"
                      windowTitle="Background color"
                      observes="cmd_backgroundColor" 
                      oncommand="ApplyDirectBackgroundColorChange(this.color)"
                      showTransparency="true"/>
      </hbox>
    </toolbaritem>

    <toolbarbutton id="EncapsulateSelect"
                   type="menu-button"
                   tooltiptext="&encapsulate.tooltip;"
                   observes="cmd_renderedHTMLEnabler"
                   tag="span"
                   oncommand="Encapsulate(event, this)">
      <menupopup id="EncapsulateSelectMenupopup"
                 onpopupshowing="initEncapsulateMenu(this);" />
    </toolbarbutton>

  </toolbarpalette>
