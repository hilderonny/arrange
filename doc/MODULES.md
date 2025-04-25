# Module

Arrange ist eine einfache Plattform, die alle Funktionen über Module bereit stellt.
Module enthalten Apps, Express Middlewares und Daten.

Beim Start sucht Arrange im `/modules` Verzeichnis nach Unterverzeichnissen, die Module darstellen.
Die Namen der Unterverzeichnisse sind dabei egal.
In diesen Unterverzeichnissen muss sich eine Datei `moduleconfig.json` befinden, welche das Modul selbst beschreibt.
Diese Datei wuird von arrange geparst und so das Modul beim Programmstart eingebunden.


## Aufbau Modulverzeichnis

```
/Modulverzeichnis
   ├── api
   ├── middlewares
   ├── moduleconfig.json
   └── public
```


## Verzeichnis `api`

Wenn hier `.mjs`Dateien liegen, werden diese als APIs (Express-Router) in einer Sub-URL eingebunden.
Der Sub-URL-Pfad richtet sich dabei nach dem Modulnamen und dem Namen der `.mjs`-Datei.
Beispielsweise hat das Modul `users` eine Datei `api/usergroups.mjs`. Diese wird in der Sub-URL `/api/users/usergroups` bereitgestellt.

## Verzeichnis `middlewares`

Die hier enthaltenen `.mjs` - Dateien werden als Express-Middlewares eingebunden, die Einfluss auf Requests und Responses nehmen können.


## Datei `moduleconfig.json`

|Schlüssel|Bedeutung|
|---|---|
|`name`|Sprechender Name des Moduls. Wird in UI zur Anzeige verwendet.|
|`id`|Eindeutiger Identifizierer des Moduls. Kleinschreibung ohne Sonderzeichen. Wird in Sub-URLs für APIs verwendet|
|`datatypes`|Liste von Datentypen, die das Modul mitbringt oder verwendet. Wird zur Aktualisierung der [Datenbank](DATABASE.md) verwendet.|