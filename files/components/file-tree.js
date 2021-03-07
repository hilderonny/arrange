/**
 * Tree view of folders and files which are returned by the `/api/files` api.
 * Events:
 * selectfile - When the user clicked on a file in the tree.
 */
customElements.define('file-tree', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.updateFromServer();
    }

    /**
     * Handles the click on a file and dispatches a "selectfile" event with tha path of the selected file as data
     */
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

    /**
     * Requests the /api/files api and constructs the tree of folders and files
     */
    async updateFromServer() {
        const response = await fetch('/api/files');
        const folderStructure = await response.json();
        this.shadowRoot.innerHTML = '';
        this.processFolder(folderStructure, this.shadowRoot, '/');
    }

});
