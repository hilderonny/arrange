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
- [Datei oder Verzeichnis laden - getPrivateFile(filePath)](#datei-oder-verzeichnis-laden---async-getprivatefilefilepath)


### Benutzer abmelden - `logout()`

Meldet den Benutzer ab und lädt die Seite neu, damit der Anmeldedialog wieder angezeigt wird.

```js
Arrange.logout()
```

### Datei oder Verzeichnis laden - `async getPrivateFile(filePath)`

Lädt eine Datei aus dem Benutzerverzeichnis des angemeldeten Benutzers oder listet ein Verzeichnis darin auf.

```js
// Dateiinhalt laden
const privateFileContent = await Arrange.getPrivateFile('path/to/file.ext')
// z.B.: "File content"

// Verzeichnis auflisten
const dirEntries = await Arrange.getPrivateFile('path/to/directory/')
// [
//     { "name": "filename.ext", "type": "file" },
//     { "name": "directoryname", "type": "dir" }
// ]
```
