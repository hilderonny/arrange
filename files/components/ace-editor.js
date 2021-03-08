/**
 * File editor like VS Code based on ACE Editor (https://ace.c9.io/)
 * You need to include the ace scripts in the parent HTML file:
 *  <script src="//ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js"></script>
 *  <script src="//ajaxorg.github.io/ace-builds/src-min-noconflict/ext-modelist.js"></script>
 * Methods:
 * setContent(filename, filecontent) - Shows the content of a file in the editor. The language to show is determined by the filename.
 */

 const style = `
 :host { display: flex; flex: 1; flex-direction: column; }
 `;
 
customElements.define('ace-editor', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${style}</style><div style="height:100%"></div>`;
        this.initializeAce();
    }

    async initializeAce() {
        this.editor = ace.edit(this.shadowRoot.querySelector('div'));
        this.editor.renderer.attachToShadowRoot();
        this.editor.setTheme('ace/theme/tomorrow_night_blue');
        this.modeList = ace.require('ace/ext/modelist');
    }

    /**
     * Shows the content of a file in the editor.
     * The language to show is determined by the filename.
     */
    setContent(filename, filecontent) {
        const mode = this.modeList.getModeForPath(filename).mode;
        this.editor.setValue(filecontent);
        this.editor.session.setMode(mode);
        this.editor.clearSelection();
    }

});