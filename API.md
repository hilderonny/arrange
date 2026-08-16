# REST-API-Referenz

## Benutzerverwaltung

### `POST /api/register` – Benutzer registrieren

#### Request-Body:
```json
{ "username": "max", "password": "geheim" }
```

#### Antwort (200):
```json
{ "id": "1712345678901234567", "username": "max" }
```
Erstellt Benutzer, legt Session-Cookie an.

|Status|Bedeutung|
|-|-|
|`200`|Erfolgreich, User-Objekt zurückgegeben|
|`400`|`username` oder `password` fehlt|
|`409`|Benutzername bereits vergeben|

### `POST /api/login` – Benutzer anmelden

#### Request-Body:
```json
{ "username": "max", "password": "geheim" }
```

#### Antwort (200):
```json
{ "id": "1712345678901234567", "username": "max" }
```

|Status|Bedeutung|
|-|-|
|`200`|Erfolgreich, Session-Cookie gesetzt|
|`400`|`username` oder `password` fehlt|
|`401`|Unbekannter Benutzer oder falsches Passwort|

### `GET /api/logout` – Abmelden

Löscht Session-Cookie. Antwortet immer mit `200`.

### `GET /api/autologin` – Sitzung prüfen

|Status|Bedeutung|
|-|-|
|`200` |Sitzung aktiv|
|`401` |Keine aktive Sitzung, Client sollte auf Login-Seite weiterleiten|

## Dateiverwaltung

Dateien werden unter `{dataPath}/files/{userId}/` gespeichert.

Der Spezialbenutzer `public` ist für öffentliche Dateien vorgesehen (kein Login erforderlich und auch nicht möglich).

### `GET /api/files/:userId/*filePath` – Datei laden oder Verzeichnis auflisten

#### Datei

Gibt Dateiinhalt mit passendem Content-Type zurück.

#### Verzeichnis

```json
[
    { "name": "bild.png",  "type": "file" },
    { "name": "unterordner", "type": "dir" }
]
```

|Status|Bedeutung|
|-|-|
|`200`|Datei oder Verzeichnisliste|
|`404`|Pfad nicht gefunden|

### `POST /api/files/:userId/*filePath` – Datei hochladen

Upload als `multipart/form-data` mit Feld `data` (Binär- oder Textdatei).

Überschreibt bestehende Dateien.

Erstellt fehlende Verzeichnisse automatisch.

|Status|Bedeutung|
|-|-|
|`200`|Erfolgreich hochgeladen|
|`400`|`filePath` ist ein existierendes Verzeichnis, oder Uploadfehler|

### `PUT /api/files/:userId/*directoryPath` – Verzeichnis erstellen

Erstellt Verzeichnis rekursiv.
Antwortet immer mit `200`.

### `DELETE /api/files/:userId/*filePath` – Datei oder Verzeichnis samt Inhalt rekursiv löschen

|Status|Bedeutung|
|-|-|
|`200`|Gelöscht|
|`404`|Pfad nicht gefunden|

## Datenbankverwaltung

Datenbanken sind SQLite-Dateien unter `{dataPath}/databases/{datenbankname}.sqlite`.

Jede Tabelle bekommt automatisch die Spalte `Id TEXT PRIMARY KEY`.

### `PATCH /api/database/:databaseName` – Schema aktualisieren / Datenbank erstellen

Erstellt Datenbank, Tabellen und Spalten, falls sie nicht existieren.
Bestehende Spalten werden **nicht** geändert.

Als Spaltenwert wird die vollständige SQLite-Spaltendefinition übergeben, die bei `ALTER TABLE ... ADD COLUMN` verwendet werden kann. 

Neben einfachen Typen sind daher auch Fremdschlüsselverweise mit kaskadierender Löschfunktion erlaubt:

#### Request-Body:
```json
{
    "schema": {
        "Tasks": {
            "Title":   "TEXT",
            "Done":    "INTEGER",
            "DueDate": "TEXT"
        },
        "Comments": {
            "TaskId": "TEXT REFERENCES Tasks(Id) ON DELETE CASCADE",
            "Text":   "TEXT"
        }
    }
}
```

|Status|Bedeutung|
|-|-|
|`200`|Schema aktualisiert|
|`400`|Request-Body unvollständig|

### `PATCH /api/database/:databaseName/:tableName/:recordId` – Datensatz speichern

#### Request-Body:
```json
{
    "fields": {
        "Title": "Aufgabe 1",
        "Done":  0,
        "LeeresFeldNullNichtUndefined": null
    }
}
```

#### Antwort (200):
```json
{
    "Id":    "recordId",
    "Title": "Aufgabe 1",
    "Done":  0,
    "LeeresFeldNullNichtUndefined": null
}
```

|Status|Bedeutung|
|-|-|
|`200`|Gespeichert, vollständiger Datensatz zurückgegeben|
|`400`|Request-Biody fehlerhaft oder Tabelle existiert nicht|

### `POST /api/database/:databaseName` – SELECT-Abfrage ausführen

Führt nur `SELECT` - Abfragen aus (kein `;` erlaubt).

#### Request-Body:
```json
{ "query": "SELECT * FROM Tasks WHERE Done = 0 ORDER BY Title" }
```

#### Antwort (200):
```json
[
    { "Id": "id1", "Title": "Aufgabe 1", "Done": 0 },
    { "Id": "id2", "Title": "Aufgabe 2", "Done": 0 }
]
```

|Status|Bedeutung|
|-|-|
|`200`|Ergebnisliste|
|`400`|Fehlerhafter Request-Body|

### `DELETE /api/database/:databaseName/:tableName/:recordId` – Datensatz löschen

Per `CASCADE` abhängige Datensätze werden ebenfalls gelöscht.

|Status|Bedeutung|
|-|-|
|`200`|Gelöscht|

### `DELETE /api/database/:databaseName/:tableName` – Tabelle löschen

|Status|Bedeutung|
|-|-|
|`200`|Tabelle gelöscht|

## Gamification

Hierfür gitb es eine Player-Datenbank, die für Benutzer Erfahrungspunkte und Münzen verwaltet.

`userId` entspricht der Id eines Benutzers.

Falls es keinen Benutzer mit der gegebenen `userId` gibt, liefert jede der APIs einen `404` Fehlercode.

### `GET /api/player/status/:userId` - Informationen über einen Spieler abrufen

Der Level eines Spielers wird serverseitig aus dessen Erfahrungspunkten berechnet.

#### Antwort (200):
```json
{
    "Coins":  23456,
    "Experience": 12345,
    "Level": 10,
}
```

### `POST /api/player/addcoins/:userId/:coinsToAdd` - Einem Spieler Münzen geben

Es sind nur positive Zahlen erlaubt, negative Zahlen werden ignoriert.

#### Antwort (200):

Anzahl der Münzen nach dem Hinzufügen.

```json
{
    "Coins":  23456
}
```

### `POST /api/player/addexperience/:userId/:experienceToAdd` - Einem Spieler Erfahrungspunkte geben

Es sind nur positive Zahlen erlaubt, negative Zahlen werden ignoriert.

#### Antwort (200):

Anzahl der Erfahrungspunkte nach dem Hinzufügen sowie Level vorher und nachher (für Level-Up-Handling).

```json
{
    "Experience": 12345,
    "LevelBefore":  9,
    "Level":  10,
}
```

### `POST /api/player/removecoins/:userId/:coinsToRemove` - Einem Spieler Münzen abziehen

Es sind nur positive Zahlen erlaubt, negative Zahlen werden ignoriert.

#### Antwort (200):

Anzahl der Münzen nach Abzug Hinzufügen.

```json
{
    "Coins":  23456
}
```

# Custom API erstellen

## 1. API-Script erstellen

Das Skript muss folgenden Aufbau haben und erhält Arrange-Funktionen als Parameter übergeben.

```js
export default function(config, databaseUtils, userUtils) {

    return function(request, response) {
        // Custom API Code
    }

}
```

2. API in `config.mjs` bekannt geben

```js
import config from './defaultConfig.mjs'

config.apis.get['/api/custom/api'] = '/my/custom/api/script/file'

export default config
```