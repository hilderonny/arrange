# API

- [Benutzer abmelden - GET / api/logout](#benutzer-abmelden---get--apilogout)
- [Benutzer anmelden - POST /api/login](#benutzer-anmelden---post-apilogin)
- [Benutzer registrieren - POST /api/register](#benutzer-registrieren---post-apiregister)
- [Benutzersitzung prüfen - GET /api/autologin](#benutzersitzung-prüfen---get-apiautologin)
- [Datei abrufen oder Verzeichnis auflisten - GET /api/files/:userId/*filePath](#datei-abrufen-oder-verzeichnis-auflisten---get-apifilesuseridfilepath)
- [Datei hochladen - POST /api/files/:userId/*filePath](#datei-hochladen---post-apifilesuseridfilepath)
- [Datei oder Verzeichnis löschen - DELETE /api/files/:userId/*filePath](#datei-oder-verzeichnis-löschen---delete-apifilesuseridfilepath)
- [Datenbank abfragen - POST /api/database/:databasename](#datenbank-abfragen---post-apidatabasedatabasename)
- [Datenbankeintrag löschen - DELETE /api/database/:databaseName/:tableName/:recordId](#datenbankeintrag-löschen---delete-apidatabasedatabasenametablenamerecordid)
- [Datenbankeintrag speichern - PATCH /api/database/:databaseName/:tableName/:recordId](#datenbankeintrag-speichern---patch-apidatabasedatabasenametablenamerecordid)
- [Datenbankschema aktualisieren - PATCH /api/database/:databasename](#datenbankschema-aktualisieren---patch-apidatabasedatabasename)
- [Datenbanktabelle löschen - DELETE /api/database/:databaseName/:tableName](#datenbanktabelle-löschen---delete-apidatabasedatabasenametablename)
- [Verzeichnis erstellen - PUT /api/files/:userId/*directoryPath](#verzeichnis-erstellen---put-apifilesuseriddirectorypath)

## Benutzer abmelden - `GET / api/logout`

Meldet einen Benutzer von System ab, indem die Sitzung und das Sitzungs-Cookie gelöscht werden.
Falls kein Benutzer angemeldet war, passiert nichts weiter.

Diese API gibt immer einen HTTP Statuscode `200` ohne Inhalt zurück.


## Benutzer anmelden - `POST /api/login`

Meldet einen existierenden Benutzer am System an. Es wird erwartet, dass als Body eine JSON-Struktur gesendet wird:

```json
{
    "username": "Benutzername des Benutzers",
    "password": "Klartextpasswort des Benutzers"
}
```

Bei Erfolg wird eine ähnliche JSON-Struktur zurück gesandt, die die Id des existierenden Benutzers enthält.
Außerdem wird ein Sitzungs-Cookie erstellt.

```json
{
    "id": "Id des Benutzers",
    "username": "Benutzername des Benutzers",
}
```

Falls kein Benutzername oder kein Passwort angegeben wurde, es keinen Benutzer mit dem Benutzernamen im System gibt oder das Passwort nicht korrekt ist, wird ein HTTP-Status-Fehler zurückgegeben.

|HTTP Statuscode|Bedeutung|
|-|-|
|`200`|Anmeldung erfolgreich.|
|`400`|Im POST-Body fehlt entweder die Eigenschaft `username` oder die Eigenschaft `password`.|
|`401`|Es existiert kein Benutzer mit dem angegebenen Benutzernamen oder das angegebene Passwort ist falsch.|


## Benutzer registrieren - `POST /api/register`

Registriert einen neuen Benutzer. Es wird erwartet, dass als Body eine JSON-Struktur gesendet wird:

```json
{
    "username": "Benutzername des neuen Benutzers",
    "password": "Klartextpasswort des neuen Benutzers"
}
```

Bei Erfolg wird eine ähnliche JSON-Struktur zurück gesandt, die die Id des neuen Benutzers enthält.
Außerdem wird der Benutzer gleich angemeldet und ein Sitzungs-Cookie erstellt.

```json
{
    "id": "Generierte Id des neuen Benutzers",
    "username": "Benutzername des neuen Benutzers",
}
```

Falls kein Benutzername oder kein Passwort angegeben wurde oder es bereits einen Benutzer mit demselben Benutzernamen im System gibt, wird ein HTTP-Status-Fehler zurückgegeben.

|HTTP Statuscode|Bedeutung|
|-|-|
|`200`|Registrierung erfolgreich.|
|`400`|Im POST-Body fehlt entweder die Eigenschaft `username` oder die Eigenschaft `password`.|
|`409`|Es existiert bereits ein Benutzer mit dem angegebenen Benutzernamen.|


## Benutzersitzung prüfen - `GET /api/autologin`

Prüft anhand der Client-Cookies, ob eine Sitzung existiert, und ob darin eine `userId` angegeben ist.
Antwortet nur mit HTTP Statuscodes ohne Inhalt.
Eine Prüfung, ob es einen Benutzer mit der gegebenen `userId` wirklich gibt, erfolgt nicht.

Diese API dient der schnellen Prüfung, ob der Client auf die Anmeldeseite umleiten muss, oder davon ausgehen kann, dass die fortfolgenden API-Aufrufe funktionieren.

|HTTP Statuscode|Bedeutung|
|-|-|
|`200`|Eine aktive Sitzung existiert und enthält eine `userId`. Der Client kann davon ausgehen, dass der Benutzer angemeldet ist.|
|`401`|Es existiert entweder keine aktive Sitzung oder diese enthält keine `userId`. Der Client sollte auf die Anmeldeseite umleiten.|


## Datei abrufen oder Verzeichnis auflisten - `GET /api/files/:userId/*filePath`

Lädt eine Datei unterhalb eines Benutzerverzeichnisses herunter oder listet den Inhalt des Verzeichnisses auf, wenn es sich beim Pfad um ein Verzeichnis handelt.

Bei Dateien wird diese direkt als Ergebnis ausgeliefert, mit dem zur Erweiterung passenden Content-Type.

Bei Verzeichnissen wird eine JSON-Struktur mit den Eintragsnamen und deren Typen (`file`= reguläre Datei, `dir` = Verzeichnis) zurückgegeben:

```json
[
    { "name": "filename.ext", "type": "file" },
    { "name": "directoryname", "type": "dir" }
]
```

Wird der Pfad nicht gefunden, wird als HTTP Statuscode `404` zurückgegeben.


## Datei hochladen - `POST /api/files/:userId/*filePath`

Lädt eine Datei in den angegebenen Pfad innerhalb des Benutzerverzeichnisses hoch.
Dabei wird der Dateiname aus dem URL-Parameter `filePath` übernommen.
Die Datei selbst muss als Feld `data` innerhalb eines `FormData` Objektes übertragen werden.

```js
FormData {
  data: File { size: 17, type: '', name: 'blob', lastModified: 1777376379952 }
}
```

Wenn an dem angegebenen Pfad bereits ein Verzeichnis mit demselben Namen existiert oder nicht genau eine Datei gesendet wird, wird der HTTP Statuscode `400` zurückgegeben.

Falls an dem Zielpfad bereits eine Datei existiert, wird diese überschrieben.


## Datei oder Verzeichnis löschen - `DELETE /api/files/:userId/*filePath`

Löscht einen Pfad (Datei oder Verzeichnis) unterhalb eines Benutzerverzeichnisses. Wenn der angegebene Pfad ein Verzeichnis ist, wird dieses samt Inhalt rekursiv gelöscht.

Wenn der angegebene Pfad nicht existiert, wird als HTTP Statuscode `404` zurückgegeben.

Bei Erfolg wird der HTTP Statuscode `200` ohne Inhalt zurückgegeben.


## Datenbank abfragen - `POST /api/database/:databasename`

Macht eine Abfrage an die Datenbank.
Die Abfrage wird direkt an die Datenbank durchgereicht.
Die Abfrage muss mit `SELECT` beginnen und darf keine Semikola (`;`)  enthalten.

```json
{
    "query": "SELECT * FROM Table1"
}
```

Wenn im Body kein JSON-Objekt übergeben wird, oder dieses keine `query` Eigenschaft hat, oder die Abfrage nicht mit `SELECT` beginnt oder ein Semikolon enthält, wird der HTTP Statuscode `400` zurückgegeben.

Bei erfolgreicher Abfrage wird ein JSON-Feld zurückgegeben, welches für jeden Record ein Objekt enthält. Die Keys der Objekte stellen dabei die Spaltennamen und die Values deren Inhalte dar.

```JSON
[
    {
        "Id": "id1",
        "Column1": "text1",
        "Column2": 42
    },
    ...
]
```

Das Feld kann auch leer sein, wenn es keine zur Abfrage passenden Ergebnisse gibt.


## Datenbankeintrag löschen - `DELETE /api/database/:databaseName/:tableName/:recordId`

Löscht einen Record mit der angegeben `:recordId` aus der Tabelle `:tableName` der Datenbank `:databaseName`.

Bei Erfolgt wird der HTTP Statuscode `200` zurückgegeben.

Bei Fehlern - etwa durch nicht existierende Datenbanken, Tabellen oder Records - wird der HTTP Statuscode `500` mit dem Text `Cannot delete database record` als Inhalt zurückgegeben.


## Datenbankeintrag speichern - `PATCH /api/database/:databaseName/:tableName/:recordId`

Erstellt einen Datenbankeintrag oder aktualisiert diesen.
Falls es keine Datenbank mit dem angegebenen Namen gibt, wird eine erstellt.
Im body wird eine JSON-Struktur mit Property `fields` erwartet, welche die Inhalte der einzelnen Spalten enthalten.

```json
{
    "fields": {
        "Column1": "text1",
        "Column2": 42,
        "Column3": null
    }
}
```

Fehlt die angegebene Tabelle oder wird kein body mit Property `fields` übergeben oder treten sonstige SQL-Fehler auf, wird der HTTP Statuscode `400` zurückgegeben.

Wenn noch kein Datensatz mit der gegebenen `:recordId` existiert, wird einer angelegt.
Andernfalls werden der bestehende Datensatz mit den gelieferten Werten überschrieben.
Spalten, die nicht explizit mitgegeben werden, bleiben unverändert.
Es werden nur solche Felder in der Datenbank gespeichert, für die eine Datenbankspalte existiert.
Alle unbekannten Spalten werden ignoriert.
Ein nachträgliches Ändern der Id eines Datensatzes ist nicht möglich, das Feld `Id` wird beim Speichern herausgefiltert.

Bei erfolgreichem Speichern wird im Response der gesamte Datensatz als JSON zurückgegeben.

```json
{
    "Id": "id1",
    "Column1": "text1",
    "Column2": 42,
    "Column3": null
}
```


## Datenbankschema aktualisieren - `PATCH /api/database/:databasename`

Erstellt eine Datenbank oder aktualisiert ihr Schema.
Der Datenbankname wird als URL-Parameter `:databasename` und das Schema als JSON-Struktur im Body des Requests übergeben.

```json
{
    "schema": {
        "Tablename": { // Name der Tabelle als Key
            "Column1name": "TEXT", // Name der Spalte als Key und Schemadefinition als Value
            "Column2name": "INTEGER"
        }
    }
}
```

Die Datenbank, Tabellen und Spalten werden bei Bedarf automatisch erstellt.
Dabei bekommt jede Tabelle automatisch als Primärschlüssel die Spalte `Id` (TEXT), die nicht in der Schemadefinition angegeben werden braucht.

Bestehende Spalten werden nicht überschrieben, auch wenn im angegebenen Schema eine andere Spaltendefinition angegeben ist.

Wenn im Request kein Body angegeben wird, oder darin die Eigenschaft `schema` fehlt, wird der HTTP Statuscode `400` zurückgegeben.
Bei erfolgreicher Ausführung wird einfach der HTTP Statuscode `200` zurückgegeben.


## Datenbanktabelle löschen - `DELETE /api/database/:databaseName/:tableName`

Löscht die Tabelle `:tableName` der Datenbank `:databaseName`.

Es wird stets der HTTP Statuscode `200` zurückgegeben.
Fehler - etwa durch nicht existierende Datenbanken oder Tabellen - werden stillschweigend ignoriert.


## Verzeichnis erstellen - `PUT /api/files/:userId/*directoryPath`

Erstellt ein Verzeichnis innerhalb eines Benutzerverzeichnisses.
Die Erstellung erfolgt rekursiv, wobei nicht existierende Elternverzeichnisse automatisch erstellt werden.

Sollte das Zielverzeichnis bereits existieren, oder der Zielpfad auf eine existierende Datei verweisen, passiert nichts weiter.

Es wird immer der HTTP Statuscode `200` zurückgegeben.


```
PATCH /api/database/{datenbankname}
PATCH /api/database/{datenbankname}/{tabellenname}/{datensatzId}
DELETE /api/database/{datenbankname}/{tabellenname}
DELETE /api/database/{datenbankname}/{tabellenname}/{datensatzId}
POST /api/database/{datenbankname}
```