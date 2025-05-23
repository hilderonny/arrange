# Module

Arrange ist eine einfache Plattform, die alle Funktionen über Module bereit stellt.
Module enthalten Apps, APIs, Express Middlewares und Daten.

## Einbindung in Server

```js
import { start } from './arrange.mjs'

start(
    process.env.ARRANGE_DATABASE_DIRECTORY,
    process.env.ARRANGE_PRIVATE_KEY_FILE,
    process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE,
    process.env.ARRANGE_HTTPS_PORT,
    process.env.ARRANGE_TOKEN_SECRET,
    [
        '../arrange_home/module.mjs',
        '../arrange_users/module.mjs',
        '../arrange_todo/module.mjs'
    ]
)
```

## Datei `module.mjs`

```js
async function init(arrange) {
   // Datenbank initialisieren
   const table = arrange.database[table_name]
   table[record_id] = record_content
   table.save()
   // App registrieren
   const appTable = arrange.database['home/apps']
   if (!appTable['USERS_USERMANAGEMENT']) appTable['USERS_USERMANAGEMENT'] = { // Nur anlegen, wenn nicht bereits vorhanden
      name: 'Benutzerverwaltung',
      icon: '/modules/users/images/group.png',
      url: '/modules/users/usermanagement.html',
      default: false, // Wenn Home-Modul diese Anwendung standardmäßig anzeigen soll
      permissionid: 'USERS_ADMINISTRATION_USER'
   }
   appTable.save()
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
   arrange.webServer.use(suburl, arrange.express.static(folderWithStaticFiles))
   // API Typspezifisch einbinden
    arrange.apiHelper.createListApi(arrange, 'users/users', '/api/users/listusers', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createSaveApi(arrange, 'users/permissions', '/api/users/savepermission', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createDeleteApi(arrange, 'users/users', '/api/users/deleteuser', [ 'USERS_ADMINISTRATION_USER' ])
    // Alle APIs aus Unterverzeichnis einbinden
    await arrange.apiHelper.loadApis(arrange, path.resolve(import.meta.dirname, './api'))
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
   apiHelper // Hilfsfunktionen zur API-Erstellung
   express // Express Klasse für statische Routen
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


### Verzeichnis `api`

Hier kann das Modul APIs, die an bestimmten Sub-URLs verfügbar sein sollen, definieren.
Diese werden dann in `module.mjs` innerhalb von `publishRoutes()` veröffentlicht.

Prinzipiell sollten die Sub-URLs dem Schema `/api/MODULNAME/APINAME/FUNKTIONSNAME` folgen.


### Verzeichnis `middlewares`

Die hier enthaltenen `.mjs` - Dateien werden vom Modul als Express-Middlewares eingebunden, die Einfluss auf Requests und Responses nehmen können.
Die Veröffentlichung erfolgt in `module.mjs` innerhalb von `publishMiddlewares()`

