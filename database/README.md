# Datenbankaufbau

Ich schwanke zwischen verschiedenen Datenbankformaten: SQLite, PostgrSQL, MongoDB, JSON-Datei.
Im Prinzip möchte ich die Datenspeicherun so einfach, wie möglich halten, ohne große Server aufsetzen zu müssen.
Ich möchte aber auch viele Daten speichern können, ohne dass mir gleich der Speicher überläuft.

Momentan schwebt mir ein JSON-basierter Ansatz vor, bei dem ich nicht auf die Struktur achten muss.
Dabei speichere ich jede Tabelle in einer eigenen Datei und ermögliche den Zugriff über das `arrange.database` Objekt, welches einen Proxy mit automatischem Laden, Speichern und Entladen darstellt.

Die Module müssen sich dann halt abstimmen, wie die gemeinsam benutzen Daten auszusehen haben.
Das `users` Modul muss dann zum Beispiel genau beschreiben, welchen Aufbau die `permissions` Tabelle hat und wie andere Module daraus lesen und dort reinschreiben müssen.

Wenn Module auf noch nicht existierende Tabellen zugreifen, so wird diese eben erstellt, basta.

Jede Tabelle wird als Objekt gespeichert, wobei der Key einer Property des Objektes der Id des Datensatzes entspricht.

```js
// Benutzertabelle laden oder anlegen
const usersTable = arrange.database['users']
// Benutzer anhand seiner Id laden
const existingUser = usersTable['existing_user_id']
// Neuen Benutzer anlegen
const newUser = { password: 'Sachichnich' }
// Neuen Datensatz in Tabelle einfügen.
// Dabei Id als Property an Benutzertabelle benutzen
usersTable['self_defined_user_id'] = newUser
// Tabelle speichern
usersTable.save()
```