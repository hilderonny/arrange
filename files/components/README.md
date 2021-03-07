# Web components

## ace-editor

File editor like VS Code based on ACE Editor (https://ace.c9.io/)

|Method|Description|
|---|---|
|`loadFile(filepath)`|Load the file located at the path via fetch and shows it in the editor. The language to show is determined by the file extension.|

## file-tree

Tree view of folders and files which are returned by the `/api/files` api.

|Event|Description|
|---|---|
|`selectfile`|When the user clicked on a file in the tree. Contains the full path to the file as data, e.g. `/files/components/file-tree.js`|