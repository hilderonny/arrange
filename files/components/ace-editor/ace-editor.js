import { WebComponent } from '/utils/webcomponents.js';

export default class extends WebComponent {

    constructor() {
        super();
        this.initializeAce();
    }

    // Load external javascripts, see https://levelup.gitconnected.com/how-to-load-external-javascript-files-from-the-browser-console-8eb97f7db778
    async importScript(url) {
        const response = await fetch(url);
        const fileContent = await response.text();
        Function(fileContent)();
    }

    async initializeAce() {
        await this.importScript('//ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js');
        await this.importScript('//ajaxorg.github.io/ace-builds/src-min-noconflict/ext-modelist.js');
        ace.config.set('basePath', '//ajaxorg.github.io/ace-builds/src-min-noconflict/');
        this.editor = ace.edit(this.shadowRoot.querySelector('div'));
        this.editor.renderer.attachToShadowRoot();
        this.editor.setTheme('ace/theme/tomorrow_night_blue');
        this.modeList = ace.require('ace/ext/modelist');
    }

    async loadFile(filepath) {
        console.log(filepath);
        const response = await fetch(filepath);
        const fileContent = await response.text();
        const mode = this.modeList.getModeForPath(filepath).mode;
        this.editor.setValue(fileContent);
        this.editor.session.setMode(mode);
        this.editor.clearSelection();
    }

}
