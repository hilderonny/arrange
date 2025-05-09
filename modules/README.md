# Module

Arrange ist eine einfache Plattform, die alle Funktionen über Module bereit stellt.
Module enthalten Apps, APIs, Express Middlewares und Daten.

Beim Start sucht Arrange im `/modules` Verzeichnis nach Unterverzeichnissen, die Module darstellen.
Die Namen der Unterverzeichnisse sind dabei egal.

In diesem Verzeichnis muss sich eine Datei `module.mjs` befinden.
Diese wird als Einstiegspunkt für das Modul betrachtet und sollte folgende Funktionen veröffentlichen (alle optional).


## Aufbau Modulverzeichnis

```
/Modulverzeichnis
├── api
├── middlewares
├── module.mjs
├── public
│   └── components
└── README.md
```


## Datei `module.mjs`

```js
async function init(arrange) {
   // Datenbank initialisieren
   const table = arrange.database[table_name]
   table[record_id] = record_content
   table.save()
   // App registrieren
   arrange.apps.push({
      name: 'users-users', // Eindeutiger identifizierer für HTML IDs. Sollte aus Modulnamen und Appnamen bestehen
      label: 'Benutzer',
      icon: '/modules/users/images/users.png',
      url: '/modules/users/index.html,
      default: true // Wenn Home-Modul diese Anwendung standardmäßig anzeigen soll
   })
}

async function publishMiddlewares(arrange) {
   // Global für alle Routen
   arrange.webServer.use(async(request, response, next) => {
      next()
   })
}

async function publishRoutes(arrange) {
   // API mit Authentifizierung über den Request
   arrange.webServer.get(url, async(request, response) => {
      if (request.user?.canWrite?('USERS_ADMINISTRATION_USER')) {

      }
   })
   // Statisches HTML an Sub-URL
   arrange.webServer.use(suburl, express.static(folderWithStaticFiles))
}

export { init, publishMiddlewares, publishRoutes }
```

1. Zuerst ruft Arrange `init()` auf, damit die Datenbank aktualisiert wird.
2. Anschließend wird `publishMiddlewares()` aufgerufen, um globale Middlewares allen Routen über alle Module hinweg bereit zu stellen.
3. Zum Schluss wird `publishRoutes()` aufgerufen, womit Endpunkte für APIs oder statische HTML Seiten erstellt werden können.

Alle diese Funktionen sind optional. Wenn sie fehlen, ist das kein Fehler, sondern wird einfach ignoriert.


### Parameter `arrange`

```js
arrange = {
   databaseHelper // Verweis auf databasehelper Instanz
   webServer // Verweis auf Express Instanz
   apps // Liste von Apps, die auf Home-Seite und in Navigation angezeigt werden. Wird von Modul "home" geparst
   metadata // Metainformationen über Datebnbanktabellen. Wird von Modul "home" geparst
   log() // Funktion zur Logausgabe
   logError() // Fehler protokollieren
   logWarning() // Warnung protokollieren
}
```

### Parameter `request`

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


## Verzeichnis `api`

Hier kann das Modul APIs, die an bestimmten Sub-URLs verfügbar sein sollen, definieren.
Diese werden dann in `module.mjs` innerhalb von `publishRoutes()` veröffentlicht.

Prinzipiell sollten die Sub-URLs dem Schema `/api/MODULNAME/APINAME/FUNKTIONSNAME` folgen.


## Verzeichnis `middlewares`

Die hier enthaltenen `.mjs` - Dateien werden vom Modul als Express-Middlewares eingebunden, die Einfluss auf Requests und Responses nehmen können.
Die Veröffentlichung erfolgt in `module.mjs` innerhalb von `publishMiddlewares()`

