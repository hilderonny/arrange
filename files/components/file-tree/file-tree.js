import { WebComponent } from '/utils/webcomponents.js';

export default class extends WebComponent {

    constructor() {
        super();
        this.updateFromServer();
    }

    async handleFileClick(filepath) {
        this.dispatchEvent(new CustomEvent('selectfile', { bubbles: true, detail: filepath }));
    }

    processFolder(folder, parentNode, parentPath) {
        const ul = document.createElement('ul');
        parentNode.appendChild(ul);
        if (folder.folders) for (const [folderName, folderContent] of Object.entries(folder.folders)) {
            const li = document.createElement('li');
            const label = document.createElement('label');
            label.innerText = folderName;
            li.appendChild(label);
            ul.appendChild(li);
            this.processFolder(folderContent, li, `${parentPath}${folderName}/`);
        }
        if (folder.files) for (const fileName of folder.files) {
            const li = document.createElement('li');
            li.innerText = fileName;
            li.addEventListener('click', () => this.handleFileClick(parentPath + fileName));
            ul.appendChild(li);
        }
    }

    async updateFromServer() {
        const response = await fetch('/api/files');
        const folderStructure = await response.json();
        this.shadowRoot.innerHTML = '';
        this.processFolder(folderStructure, this.shadowRoot, '/');
    }

}
