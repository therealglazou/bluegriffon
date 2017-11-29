  <toolbarpalette id="ComposerToolbarPalette">

      <toolbarbutton id="newButton"  class="toolbarbutton-1"
                     label="&newMenu.label;"
                     type="menu-button"
                     iconsize="smaller"
                     oncommand="NewDocument(event);"
                     tooltiptext="&newToolbarCmd.tooltip;">
        <menupopup>
          <menuitem label="&newOtherCmd.label;"     oncommand="NewDocumentWithOptions(event);"
                    key="key_newWithOptions" />
        </menupopup>
      </toolbarbutton>

      <toolbarbutton id="openButton"  class="toolbarbutton-1"
                     label="&openMenu.label;"
                     type="menu-button"
                     oncommand="OpenLocation(event, 'tab');"
                     tooltiptext="&openMenu.tooltip;">
        <menupopup>
          <menuitem label="&openTab.label;"          oncommand="OpenLocation(event, 'tab');" default="true"/>
          <menuitem label="&openWindow.label;"       oncommand="OpenLocation(event, 'window');"/>
        </menupopup>
      </toolbarbutton>

      <toolbarbutton id="saveButton" class="toolbarbutton-1" command="cmd_save"
                     label="&saveCmd.label;"
                     tooltiptext="&saveToolbarCmd.tooltip;"/>

      <toolbarbutton id="stopButton"
                     label="&stopButton.label;"
                     class="toolbarbutton-1"
                     iconsize="smaller"
                     tooltiptext="&stopButton.tooltip;"
                     command="cmd_stopLoading"/>

      <toolbarbutton id="refreshButton"
                     label="&tableOfContents.label;"
                     class="toolbarbutton-1"
                     iconsize="smaller"
                     tooltiptext="&tableOfContents.tooltip;"
                     command="cmd_rebuildTOC"/>

      <toolbarbutton id="tableButton" class="toolbarbutton-1"
                     label="&tableToolbarCmd.label;" command="cmd_table"
                     tooltiptext="&tableToolbarCmd.tooltip;"/>

      <toolbarbutton id="imageButton" class="toolbarbutton-1"
                     label="&imageToolbarCmd.label;" command="cmd_image"
                     tooltiptext="&imageToolbarCmd.tooltip;"/>

      <toolbarbutton id="anchorButton" class="toolbarbutton-1"
                     label="&anchorToolbarCmd.label;" command="cmd_anchor"
                     tooltiptext="&anchorToolbarCmd.tooltip;"/>

      <toolbarbutton id="linkButton" class="toolbarbutton-1"
                     label="&linkToolbarCmd.label;" command="cmd_link"
                     tooltiptext="&linkToolbarCmd.tooltip;"/>

      <toolbarbutton id="videoButton" class="toolbarbutton-1"
                     label="&videoToolbarCmd.label;" command="cmd_video"
                     tooltiptext="&videoToolbarCmd.tooltip;"/>

      <toolbarbutton id="audioButton" class="toolbarbutton-1"
                     label="&audioToolbarCmd.label;" command="cmd_audio"
                     tooltiptext="&audioToolbarCmd.tooltip;"/>

      <toolbarbutton id="browseButton" class="toolbarbutton-1"
                     label="&browseToolbarCmd.label;" command="cmd_browse"
                     tooltiptext="&browseToolbarCmd.tooltip;"/>

      <toolbarbutton id="formButton" class="toolbarbutton-1"
                     label="&formToolbarCmd.label;"
                     command="cmd_form"
                     tooltiptext="&formToolbarCmd.tooltip;"
                     type="menu-button">
        <menupopup>
          <menuitem label="&formToolbarCmd.label;"
                    accesskey="&formToolbarCmd.key;"
                    command="cmd_form"
                    default="true"/>
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
      </toolbarbutton>

      <toolbaritem id="throbber-box"  align="center" pack="center">
        <image id="composer-throbber" tooltiptext="&throbber.tooltip;" onclick="AboutComposer()"/>
      </toolbaritem> 

    </toolbarpalette>
