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
   +-- moduleconfig.json
   |
```


## Aufbau `moduleconfig.json`

|Schlüssel|Bedeutung|
|---|---|
|`name`|Sprechender Name des Moduls. Wird in UI zur Anzeige verwendet.|
|`datatypes`|Liste von Datentypen, die das Modul mitbringt oder verwendet. Wird zur Aktualisierung der [Datenbank](DATABASE.md) verwendet.|