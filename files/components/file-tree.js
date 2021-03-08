/**
 * Tree view of folders and files which are returned by the `/api/files` api.
 * Events:
 * selectfile - When the user clicked on a file in the tree.
 * Methods:
 * setFolderStructure(folderstructure) - Sets the content of the tree hierarchy.
 */

 const style = `
 :host { display: flex; padding: 4px; }
 `; 

customElements.define('file-tree', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.setFolderStructure({}); // Initialize empty but with styles
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
     * Set the data to be displayed. Must be in this structure:
     * {
     *   folders: {
     *     "folderName" : {
     *       folders: ...,
     *       files: ...
     *     }
     *   },
     *   files: [
     *     "filename1",
     *     "filename2"
     *   ]
     * }
     */
    setFolderStructure(folderStructure) {
        this.shadowRoot.innerHTML = `<style>${style}</style>`;
        this.processFolder(folderStructure, this.shadowRoot, '/');
    }

});
