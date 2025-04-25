# Datenbank

Die Datenbank wird beim ersten Start angelegt.

Die Datenbankstruktur wird je Modul in der Datei `moduleconfig.json` in der Eigenschaft `datatypes` konfiguriert. Diese Datei wird beim Start ausgelesen und die Datenbank entsprechend aktualisiert.

Bestehende Spalten werden bei Updates nicht geändert, sondern nur neue hinzugefügt.

Jede Tabelle erhält automatisch ein Feld `id`, welches eine UUID als Identifikator für den Datensatz enthält. Dieses Feld wird nur intern benutzt. Es kann in `moduleconfig.json` als Vorgabe für vordefinierte Datensätze angegeben werden (z.B. für Berechtigungen oder die Administratoren-Benutzergruppe). Wird die `id` nicht angegeben, wird bei der Datensatzerstellung eine UUID generiert.


## Definition einer Tabelle in `datatypes`

|Schlüssel|Wert|
|---|---|
|`name`|Name der Tabelle. Kleinschreibung Plural, z.B. `users` für Benutzertabelle|
|`label`|Bezeichner eines einzelnen Tabelleneintrags, z.B. `Benutzergruppe`. Wird in UI zur Anzeige einzelner Datensätze als Überschrift verwendet.|
|`plurallabel`|Pluralbezeichnung der Datensätze, z.B. `Benutzergruppen`. Wird in der UI für Auflistungen verwendet.|
|`titlefield`|Name des Feldes, z.B. `name`, welcher in der UI als Label für verlinkte Datensätze verwendet wird.|
|`icon`|URL relativ zu `/public`, welche auf ein Icon für die App-Übersicht oder für Verweise und Auflistungen verweist.|
|`permissionid`|Optional. Verweist auf die Id der Berechtigung, die notwendig ist, um Datensätze in dieser Tabelle zu bearbeiten, z.B. `PERMISSION_ADMINISTRATION_USER`. Falls nicht angegeben, kann jeder Datensätze in der Tabelle manipulieren.|
|`fields`|Auflistung von Feldern (Spalten), die in der Tabelle enthalten sind. Die `id` Spalte wird automatisch erstellt und ignoriert, falls sie hier angegeben wurde.|
|`values`|Liste von vordefinierten Datensätzen, die stets vorhanden sein müssen. Werden diese Datensätze gelöscht, werden sie beim nächsten Start erneut erstellt.|


## Definition eines Feldes in `fields`

|Schlüssel|Wert|
|---|---|
|`name`|Name des Tabellenfeldes. Kleinschreibung ohne Sonderzeichen|
|`label`|Bezeichnung des Feldes. Wird in der UI als Label für Ein- oder Ausgabefelder benutzt.|
|`type`|Typ des Feldes (siehe weiter unten)`, z.B. `text`|
|`reference`|Wenn der Typ des Feldes `reference` ist, so wird hierin der Name der Zieltabelle, auf die die Datensätze hier verweisen sollen, gespeichert.|
|`isrequired`|Gibt an, ob es sich um ein Pflichfeld handelt (`true`). In diesem Fall muss bei der Eingabe an der UI das entsprechende Feld ausgefüllt sein, bevor der Datensatz gespeichert werden kann.|


## Feldtypen

|Feldtyp|Beschreibung|
|---|---|
|`text`|Beliebiger Text freier Länge. Wird in UI als einzeiliges Eingabefeld oder Fließtext angezeigt.|
|`password`|Beliebiger Text, der in UI als verschleiertes Passwortfeld angezeigt wird.|
|`reference`|Gibt an, dass das Feld auf einen Datensatz einer Tabelle verweist und eine Id eines Datensatzes enthält.|


## Definition eines Datensatzes in `values`

Der Aufbau der vordefinierten Werte richtet sich nach den Feldern der jeweiligen Tabelle. Als Schlüssel werden die Feldnamen angegeben.

Jeder vordefinierte Datensatz muss das Feld `id` angeben. Damit wird gewährleistet, dass beim Neustart und Aktualisieren der Datenbank nicht stets die gleichen vordefinierten Datensätze mit unterschiedlichen generierten IDs angelegt werden.

Wenn man einen vordefinierten Datensatz in der Konfigurationsdatei `moduleconfig.json` ändert, wird diese Änderung bei der nächsten Aktualisierung in die Datenbank übernommen.