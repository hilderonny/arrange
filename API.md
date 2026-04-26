# API

- [Benutzersitzung prüfen - GET /api/autologin](#benutzersitzung-prüfen---get-apiautologin)

## Benutzersitzung prüfen - `GET /api/autologin`

Prüft anhand der Client-Cookies, ob eine Sitzung existiert, und ob darin eine `userId` angegeben ist.
Antwortet nur mit HTTP Statuscodes ohne Inhalt.
Eine Prüfung, ob es einen Benutzer mit der gegebenen `userId` wirklich gibt, erfolgt nicht.

Diese API dient der schnellen Prüfung, ob der Client auf die Anmeldeseite umleiten muss, oder davon ausgehen kann, dass die fortfolgenden API-Aufrufe funktionieren.

|HTTP Statuscode|Bedeutung|
|-|-|
|`200`|Eine aktive Sitzung existiert und enthält eine `userId`. Der Client kann davon ausgehen, dass der Benutzer angemeldet ist.|
|`401`|Es existiert entweder keine aktive Sitzung oder diese enthält keine `userId`. Der Client sollte auf die Anmeldeseite umleiten.|





```
GET /api/autologin
GET /api/logout
POST /api/login
POST /api/register

DELETE /api/files/{userid}/{path...}
GET /api/files/{userid}/{filepath...}
POST /api/files/{userid}/{filepath...}
PUT /api/files/{userid}/{path...}

PATCH /api/datenbank/{datenbankname}
PATCH /api/datenbank/{datenbankname}/{tabellenname}/{datensatzId}
DELETE /api/datenbank/{datenbankname}/{tabellenname}
DELETE /api/datenbank/{datenbankname}/{tabellenname}/{datensatzId}
POST /api/datenbank/{datenbankname}
```