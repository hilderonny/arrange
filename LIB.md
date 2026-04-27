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
- [Private Datei oder Verzeichnis laden - getPrivateFile(filePath)](#private-datei-oder-verzeichnis-laden---async-getprivatefilefilepath)


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
