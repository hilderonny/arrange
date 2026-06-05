# REST-API-Referenz

→ [Dokumentationsindex](./README.md)

Alle Endpunkte sind unter dem Präfix `/api/` erreichbar. Sitzungsverwaltung erfolgt über HTTP-Cookies (Cookie-Session).

---

## Benutzerverwaltung

### `POST /api/register` – Benutzer registrieren

**Request-Body:**
```json
{ "username": "max", "password": "geheim" }
```

**Antwort (200):**
```json
{ "id": "1712345678901234567", "username": "max" }
```
Erstellt Benutzer, legt Session-Cookie an.

| Status | Bedeutung |
|---|---|
| `200` | Erfolgreich, User-Objekt zurückgegeben |
| `400` | `username` oder `password` fehlt |
| `409` | Benutzername bereits vergeben |

---

### `POST /api/login` – Benutzer anmelden

**Request-Body:**
```json
{ "username": "max", "password": "geheim" }
```

**Antwort (200):**
```json
{ "id": "1712345678901234567", "username": "max" }
```

| Status | Bedeutung |
|---|---|
| `200` | Erfolgreich, Session-Cookie gesetzt |
| `400` | `username` oder `password` fehlt |
| `401` | Unbekannter Benutzer oder falsches Passwort |

---

### `GET /api/logout` – Abmelden

Löscht Session-Cookie. Antwortet immer mit `200`.

---

### `GET /api/autologin` – Sitzung prüfen

Prüft, ob ein gültiges Session-Cookie vorhanden ist (kein DB-Lookup).

| Status | Bedeutung |
|---|---|
| `200` | Sitzung aktiv |
| `401` | Keine aktive Sitzung → Client sollte auf Login-Seite weiterleiten |

---

## Dateiverwaltung

Dateien werden unter `{dataPath}/files/{userId}/` gespeichert. Der Spezialbenutzer `public` ist für öffentliche Dateien vorgesehen (kein Login erforderlich).

### `GET /api/files/:userId/*filePath` – Datei laden oder Verzeichnis auflisten

**Datei:** Gibt Dateiinhalt mit passendem Content-Type zurück.

**Verzeichnis:**
```json
[
    { "name": "bild.png",  "type": "file" },
    { "name": "unterordner", "type": "dir" }
]
```

| Status | Bedeutung |
|---|---|
| `200` | Datei oder Verzeichnisliste |
| `404` | Pfad nicht gefunden |

---

### `POST /api/files/:userId/*filePath` – Datei hochladen

Upload als `multipart/form-data` mit Feld `data` (Binär- oder Textdatei).
Überschreibt bestehende Dateien. Erstellt fehlende Verzeichnisse automatisch.

| Status | Bedeutung |
|---|---|
| `200` | Erfolgreich hochgeladen |
| `400` | Ziel ist ein Verzeichnis, oder nicht genau 1 Datei gesendet |

---

### `PUT /api/files/:userId/*directoryPath` – Verzeichnis erstellen

Erstellt Verzeichnis rekursiv. Kein Fehler, wenn es bereits existiert. Antwortet immer mit `200`.

---

### `DELETE /api/files/:userId/*filePath` – Datei oder Verzeichnis löschen

Löscht Datei oder Verzeichnis (rekursiv).

| Status | Bedeutung |
|---|---|
| `200` | Gelöscht |
| `404` | Pfad nicht gefunden |

---

## Datenbankverwaltung

Datenbanken sind SQLite-Dateien unter `{dataPath}/databases/{datenbankname}.sqlite`. Jede Tabelle bekommt automatisch die Spalte `Id TEXT PRIMARY KEY`.

### `PATCH /api/database/:databaseName` – Schema aktualisieren / Datenbank erstellen

Erstellt Datenbank, Tabellen und Spalten, falls sie nicht existieren. Bestehende Spalten werden **nicht** geändert.

Als Spaltenwert wird die vollständige SQLite-Spaltendefinition übergeben, die bei `ALTER TABLE … ADD COLUMN` verwendet werden kann. Neben einfachen Typen sind daher auch Fremdschlüsselverweise mit kaskadierender Löschfunktion erlaubt:

**Request-Body:**
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

Durch `ON DELETE CASCADE` werden alle `Comments`-Einträge automatisch gelöscht, sobald der zugehörige `Tasks`-Datensatz entfernt wird.

| Status | Bedeutung |
|---|---|
| `200` | Schema aktualisiert |
| `400` | Body fehlt oder hat keine `schema`-Eigenschaft |
| `500` | Fehlerhafte Schemadefinition |

---

### `PATCH /api/database/:databaseName/:tableName/:recordId` – Datensatz speichern

Erstellt Datensatz (falls `recordId` neu) oder aktualisiert Felder (falls vorhanden). Unbekannte Felder werden ignoriert. Gibt vollständigen Datensatz zurück.

**Request-Body:**
```json
{
    "fields": {
        "Title": "Aufgabe 1",
        "Done":  0,
        "Leeres": null
    }
}
```

**Antwort (200):**
```json
{
    "Id":    "meine-id",
    "Title": "Aufgabe 1",
    "Done":  0,
    "Leeres": null
}
```

| Status | Bedeutung |
|---|---|
| `200` | Gespeichert, vollständiger Datensatz zurückgegeben |
| `400` | Body fehlt, kein `fields`, oder Tabelle existiert nicht |
| `500` | Datenbankfehler |

---

### `POST /api/database/:databaseName` – SELECT-Abfrage ausführen

Führt nur `SELECT`-Abfragen aus (kein `;` erlaubt).

**Request-Body:**
```json
{ "query": "SELECT * FROM Tasks WHERE Done = 0 ORDER BY Title" }
```

**Antwort (200):**
```json
[
    { "Id": "id1", "Title": "Aufgabe 1", "Done": 0 },
    { "Id": "id2", "Title": "Aufgabe 2", "Done": 0 }
]
```

| Status | Bedeutung |
|---|---|
| `200` | Ergebnisliste (kann leer sein) |
| `400` | Kein Body, keine `query`, nicht `SELECT`, oder enthält `;` |
| `500` | Datenbankfehler |

---

### `DELETE /api/database/:databaseName/:tableName/:recordId` – Datensatz löschen

| Status | Bedeutung |
|---|---|
| `200` | Gelöscht (auch wenn nicht vorhanden) |
| `500` | Datenbankfehler |

> **Hinweis CASCADE:** Wenn andere Tabellen per `REFERENCES … ON DELETE CASCADE` auf diese Tabelle verweisen, werden abhängige Datensätze beim Löschen automatisch mit entfernt.

---

### `DELETE /api/database/:databaseName/:tableName` – Tabelle löschen

| Status | Bedeutung |
|---|---|
| `200` | Tabelle gelöscht |
| `500` | Datenbankfehler (z.B. Foreign Key Constraint) |

> **Achtung Fremdschlüssel:** Wenn andere Tabellen per `REFERENCES` auf die zu löschende Tabelle verweisen und **kein** `ON DELETE CASCADE` definiert ist, antwortet dieser Endpunkt mit `500`. Alle abhängigen Tabellen müssen vorher gelöscht oder die Fremdschlüsselreferenzen aufgelöst werden.

---

## Datentypen in SQLite-Spalten

Gültige SQLite-Typangaben für das Schema:

| Typ | Verwendung |
|---|---|
| `TEXT` | Zeichenketten, Datum (ISO), JSON als String |
| `INTEGER` | Ganzzahlen, Boolean (0/1) |
| `REAL` | Fließkommazahlen |
| `BLOB` | Binärdaten |
| `TEXT REFERENCES Tabelle(Id) ON DELETE CASCADE` | Fremdschlüssel mit kaskadierender Löschung |

Der Wert kann die vollständige SQLite-Spaltendefinition enthalten, die bei `ALTER TABLE … ADD COLUMN` gültig wäre — einschließlich Constraints wie `NOT NULL`, `DEFAULT` oder `REFERENCES`.

---

## Verwandte Dokumente

- [CLIENT.md](./CLIENT.md) – Clientseitige Wrapper-Funktionen für alle Endpunkte
- [DATABASEOBJECT.md](./DATABASEOBJECT.md) – ORM-Klasse für Datenbankzugriff
- [USE_CASES.md](./USE_CASES.md) – Typische Verwendungsmuster


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
