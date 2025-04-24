# Web components

## ace-editor

File editor like VS Code based on ACE Editor (https://ace.c9.io/)

|Method|Description|
|---|---|
|`getContent()`|Retreive the current content of the editor as text string|
|`setContent(filename, filecontent)`|Shows the content of a file in the editor. The language to show is determined by the filename.|

## file-tree

Tree view of folders and files which are returned by the `/api/files` api.

|Method|Description|
|---|---|
|`setFolderStructure(folderstructure)`|Sets the content of the tree hierarchy.|

|Event|Description|
|---|---|
|`selectfile`|When the user clicked on a file in the tree. Contains the full path to the file as data, e.g. `/files/components/file-tree.js`|