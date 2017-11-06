  <toolbarpalette id="FormatToolbarPalette">

      <toolbarbutton id="boldButton" type="checkbox" autoCheck="false" command="cmd_bold" label="&boldToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&boldToolbarCmd.tooltip;">
        <observes element="cmd_bold" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_bold')"/>
      </toolbarbutton>

      <toolbarbutton id="italicButton" type="checkbox" autoCheck="false" command="cmd_italic" label="&italicToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&italicToolbarCmd.tooltip;">
        <observes element="cmd_italic" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_italic')"/>
      </toolbarbutton>

      <toolbarbutton id="underlineButton" type="checkbox" autoCheck="false" command="cmd_underline" label="&underlineToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&underlineToolbarCmd.tooltip;">
        <observes element="cmd_underline" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_underline')"/>
      </toolbarbutton>
    
      <toolbarbutton id="strongButton" type="checkbox" autoCheck="false" command="cmd_strong" label="&strongToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&strongToolbarCmd.tooltip;">
        <observes element="cmd_strong" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_strong')"/>
      </toolbarbutton>
    
      <toolbarbutton id="emButton" type="checkbox" autoCheck="false" command="cmd_em" label="&emToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&emToolbarCmd.tooltip;">
        <observes element="cmd_em" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_em')"/>
      </toolbarbutton>

      <toolbarbutton id="codeButton" type="checkbox" autoCheck="false" command="cmd_code" label="&codeToolbarCmd.label;"
                       observes="cmd_renderedHTMLEnabler"
                     tooltiptext="&codeToolbarCmd.tooltip;">
        <observes element="cmd_code" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_code')"/>
      </toolbarbutton>

      <toolbarbutton id="rotateButton" command="cmd_renderedHTMLEnabler" label="Rotate" tooltiptext="Rotate"
                     type="checkbox" oncommand="CSSRotationsHandler.toggle(this)"/>

    <toolbaritem id="ColorsBox">
      <stack>
        <ecolorpicker id="BackgroundColorColorpicker" left="11" top="11"
                      colorObjectId="BackgroundColor"
                      tooltiptext="&bgColor.label;"
                      windowTitle="Background color"
                      oncommand="ApplyDirectBackgroundColorChange(this.color)"
                      showTransparency="true">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled" onbroadcast="onColorDisableChange(this.parentNode, 'cmd_renderedHTMLEnabler')"/>
          <observes element="cmd_bgBackgroundColor"   attribute="state"    onbroadcast="onColorChange(this.parentNode, 'cmd_bgBackgroundColor')"/>
        </ecolorpicker>
        <ecolorpicker id="TextColorColorpicker" left="1" top="1"
                      color="transparent"
                      tooltiptext="&color.label;"
                      colorObjectId="TextColor"
                      windowTitle="Text color"
                      oncommand="ApplyDirectTextColorChange(this.color)"
                      showTransparency="true">
          <observes element="cmd_renderedHTMLEnabler" attribute="disabled" onbroadcast="onColorDisableChange(this.parentNode, 'cmd_renderedHTMLEnabler')"/>
          <observes element="cmd_bgFontColor"         attribute="state"    onbroadcast="onColorChange(this.parentNode, 'cmd_bgFontColor')"/>
        </ecolorpicker>
      </stack>
    </toolbaritem>

    <toolbarbutton id="ulButton" type="radio" group="lists" autoCheck="false" command="cmd_ul"
                       observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&unorderedList.tooltip;" label="&unorderedList.label;">
        <observes element="cmd_ul" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_ul')"/>
    </toolbarbutton>

    <toolbarbutton id="olButton" type="radio" group="lists" autoCheck="false" command="cmd_ol"
                       observes="cmd_renderedHTMLEnabler"
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
                   observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&indentToolbarCmd.tooltip;"/>

    <toolbarbutton id="outdentButton" command="cmd_outdent" label="&outdentToolbarCmd.label;"
                   observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&outdentToolbarCmd.tooltip;"/>

    <toolbarbutton id="blockquoteButton" command="cmd_blockquote" label="&blockquoteToolbarCmd.label;"
                   observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&blockquoteToolbarCmd.tooltip;"/>

    <toolbarbutton id="ddButton" type="radio" group="lists" autoCheck="false" command="cmd_dd"
                   observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&definitionDescription.tooltip;" label="&definitionDescription.label;">
        <observes element="cmd_dd" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dd')"/>
    </toolbarbutton>

    <toolbarbutton id="dtButton" type="radio" group="lists" autoCheck="false" command="cmd_dt"
                   observes="cmd_renderedHTMLEnabler"
                   tooltiptext="&definitionTitle.tooltip;" label="&definitionTitle.label;">
        <observes element="cmd_dt" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dt')"/>
    </toolbarbutton>

    <toolbarbutton id="EncapsulateSelect"
                   type="menu"
                   tooltiptext="&encapsulate.tooltip;"
                   observes="cmd_renderedHTMLEnabler"
                   tag="span"
                   oncommand="Encapsulate(event, this)">
      <menupopup id="EncapsulateSelectMenupopup"
                 onpopupshowing="initEncapsulateMenu(this);" />
    </toolbarbutton>

  </toolbarpalette>
