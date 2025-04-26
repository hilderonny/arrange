# Module

Arrange ist eine einfache Plattform, die alle Funktionen über Module bereit stellt.
Module enthalten Apps, APIs, Express Middlewares und Daten.

Beim Start sucht Arrange im `/modules` Verzeichnis nach Unterverzeichnissen, die Module darstellen.
Die Namen der Unterverzeichnisse sind dabei egal.

In diesem Verzeichnis muss sich eine Datei `module.mjs` befinden.
Diese wird als Einstiegspunkt für das Modul betrachtet und sollte folgende Funktionen veröffentlichen (alle optional).

```js
async function init(arrange) {
   // Datenbank initialisieren
   arrange.database.createTable(table_name)
   arrange.database.udpateDatabaseField(table_name, field_name, field_type)
   arrange.database.updateDatabaseRecord(table_name, record)
}

async function publishMiddlewares(arrange) {
   // Global für alle Routen
   arrange.app.use(async(request, response, next) => {
      next()
   })
}

async function publishRoutes(arrange) {
   // API mit Authentifizierung über den Request
   arrange.app.get(url, async(request, response) => {
      if (request.user?.canWrite?('PERMISSION_ADMINISTRATION_USER')) {

      }
   })
   // Statisches HTML an Sub-URL
   arrange.app.use(suburl, express.static(folderWithStaticFiles))
}

export { init, publishMiddlewares, publishRoutes }
```

1. Zuerst ruft Arrange `init()` auf, damit die Datenbank aktualisiert wird.
2. Anschließend wird `publishMiddlewares()` aufgerufen, um globale Middlewares allen Routen über alle Module hinweg bereit zu stellen.
3. Zum Schluss wird `publishRoutes()` aufgerufen, womit Endpunkte für APIs oder statische HTML Seiten erstellt werden können.

Alle diese Funktionen sind optional. Wenn sie fehlen, ist das kein Fehler, sondern wird einfach ignoriert.


## Arrange

```js
arrange = {
   databaseHelper // Verweis auf databasehelper Instanz
   app // Verweis auf Express Instanz
   localConfig // Konfiguration aus localconfig.json
   log() // Funktion zur Logausgabe
   logError() // Fehler protokollieren
   logWarning() // Warnung protokollieren
}
```

## Request

```js
request = {
   user : { // Optional vorhanden. Wenn vorhanden, ist Benutzer angemeldet
      id, // Id des Benutzers
      canRead(permission_name), // Optional vorhanden. Prüft, ob angemeldeter Benutzer bestimmte Leseberechtigung hat
      canWrite(permission_name), // Optional vorhanden. Prüft, ob angemeldeter Benutzer bestimmte Schreibberechtigung hat
   }
   ...
}
```


## Aufbau Modulverzeichnis

```
/Modulverzeichnis
├── api
├── middlewares
├── module.mjs
└── public
    └── webcomponents
```



# OBSOLET


In diesen Unterverzeichnissen muss sich eine Datei `moduleconfig.json` befinden, welche das Modul selbst beschreibt.
Diese Datei wuird von arrange geparst und so das Modul beim Programmstart eingebunden.


## Verzeichnis `api`

Wenn hier `.mjs`Dateien liegen, werden diese als APIs (Express-Router) in einer Sub-URL eingebunden.
Der Sub-URL-Pfad richtet sich dabei nach dem Modulnamen und dem Namen der `.mjs`-Datei.
Beispielsweise hat das Modul `users` eine Datei `api/usergroups.mjs`. Diese wird in der Sub-URL `/api/users/usergroups` bereitgestellt.

## Verzeichnis `middlewares`

Die hier enthaltenen `.mjs` - Dateien werden als Express-Middlewares eingebunden, die Einfluss auf Requests und Responses nehmen können.
