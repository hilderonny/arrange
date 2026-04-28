# Client-Bibliothek `arrange.mjs`

## Verwendung

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from '/arrange/js/arrange.mjs'
            // Beim ersten Aufruf wird automatisch die Anmeldeseite angezeigt bzw. es erfolgt das Auto-Login
        </script>
    </head>
</html>
```


## Funktionen

- [Benutzer abmelden - logout()](#benutzer-abmelden---logout)
- [Öffentliche Datei oder Verzeichnis laden - async getPubliceFile(filePath)](#öffentliche-datei-oder-verzeichnis-laden---async-getpublicefilefilepath)
- [Öffentliche Datei oder Verzeichnis löschen - async deletePublicPath(filePath)](#öffentliche-datei-oder-verzeichnis-löschen---async-deletepublicpathfilepath)
- [Private Datei oder Verzeichnis laden - getPrivateFile(filePath)](#private-datei-oder-verzeichnis-laden---async-getprivatefilefilepath)
- [Private Datei oder Verzeichnis löschen - async deletePrivatePath(filePath)](#private-datei-oder-verzeichnis-löschen---async-deleteprivatepathfilepath)
- [Privates Verzeichnis erstellen - async createPrivatePath(directoryPath)](#privates-verzeichnis-erstellen---async-createprivatepathdirectorypath)


### Benutzer abmelden - `logout()`

Meldet den Benutzer ab und lädt die Seite neu, damit der Anmeldedialog wieder angezeigt wird.

```js
Arrange.logout()
```


### Öffentliche Datei oder Verzeichnis laden - `async getPubliceFile(filePath)`

Lädt eine Datei aus dem öffentlich zugänglichen Verzeichnis oder listet ein Verzeichnis darin auf.

```js
// Öffentlichen Dateiinhalt laden
const publicFileContent = await Arrange.getPublicFile('path/to/file.ext')
// z.B.: "File content"

// Öffentliches Verzeichnis auflisten
const dirPublicEntries = await Arrange.getPublicFile('path/to/directory/')
// [
//     { "name": "filename.ext", "type": "file" },
//     { "name": "directoryname", "type": "dir" }
// ]
```


### Öffentliche Datei oder Verzeichnis löschen - `async deletePublicPath(filePath)`

Löscht eine Datei oder ein Verzeichnis aus dem öffentlichen Verzeichnis. Falls es sich beim angegebenen Pfad um ein Verzeichnis handelt, wird dieses rekursiv gelöscht.

```js
// Öffentliches Verzeichnis rekursiv löschen
await Arrange.deletePublicPath('path/to/directory')

// Öffentliche Datei löschen
await Arrange.deletePublicPath('path/to/directory/with/file.txt')
```


### Öffentliches Verzeichnis erstellen - `async createPublicPath(directoryPath)`

Erstellt ein Verzeichnis im öffentlichen Verzeichnis.
Falls an dem Zielpfad bereits ein Verzeichnis oder eine Datei existiert, passiert nichts weiter.
Alle übergeordneten Verzeichnisse qwerden bei bedarf ebenfalls automatisch erstellt.

```js
// Öffentliches Verzeichnis erstellen
await Arrange.createPublicPath('path/to/directory')
```


### Private Datei oder Verzeichnis laden - `async getPrivateFile(filePath)`

Lädt eine Datei aus dem Benutzerverzeichnis des angemeldeten Benutzers oder listet ein Verzeichnis darin auf.

```js
// Privaten Dateiinhalt laden
const privateFileContent = await Arrange.getPrivateFile('path/to/file.ext')
// z.B.: "File content"

// Privates Verzeichnis auflisten
const privateDirEntries = await Arrange.getPrivateFile('path/to/directory/')
// [
//     { "name": "filename.ext", "type": "file" },
//     { "name": "directoryname", "type": "dir" }
// ]
```


### Private Datei oder Verzeichnis löschen - `async deletePrivatePath(filePath)`

Löscht eine Datei oder ein Verzeichnis aus dem Benutzerverzeichnis des angemeldeten Benutzers. Falls es sich beim angegebenen Pfad um ein Verzeichnis handelt, wird dieses rekursiv gelöscht.

```js
// Privates Verzeichnis rekursiv löschen
await Arrange.deletePrivatePath('path/to/directory')

// Private Datei löschen
await Arrange.deletePrivatePath('path/to/directory/with/file.txt')
```


### Privates Verzeichnis erstellen - `async createPrivatePath(directoryPath)`

Erstellt ein Verzeichnis im Benutzerverzeichnis.
Falls an dem Zielpfad bereits ein Verzeichnis oder eine Datei existiert, passiert nichts weiter.
Alle übergeordneten Verzeichnisse qwerden bei bedarf ebenfalls automatisch erstellt.

```js
// Privates Verzeichnis erstellen
await Arrange.createPrivatePath('path/to/directory')
```
