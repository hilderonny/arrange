/**
 * You need to include the ace scripts in the parent HTML file:
 *  <script src="//ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js"></script>
 *  <script src="//ajaxorg.github.io/ace-builds/src-min-noconflict/ext-modelist.js"></script>
 */
customElements.define('ace-editor', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<div style="height:400px;"></div>`;
        this.initializeAce();
    }

    async initializeAce() {
        this.editor = ace.edit(this.shadowRoot.querySelector('div'));
        this.editor.renderer.attachToShadowRoot();
        this.editor.setTheme('ace/theme/tomorrow_night_blue');
        this.modeList = ace.require('ace/ext/modelist');
    }

    async loadFile(filepath) {
        const response = await fetch(filepath);
        const fileContent = await response.text();
        const mode = this.modeList.getModeForPath(filepath).mode;
        this.editor.setValue(fileContent);
        this.editor.session.setMode(mode);
        this.editor.clearSelection();
    }

});