  <toolbarpalette id="FormatMenulistsToolbarPalette">
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
        </menupopup>
                   
      </menulist>
    </toolbaritem>

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
  </toolbarpalette>
