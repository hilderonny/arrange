# Modul Home

Dieses Modul stellt die Startseite `/` sowie die Navigation bereit.
Zusätzlich werden Buttons zum Anmelden und Registrieren von Benutzern über das `users` Modul angezeigt.

Das Modul verwendet `arrange.apps[]`, um anzuzeigende Anwendungen zu ermitteln.
Diese Liste muss von anderen Modulen gefüllt werden.

## Struktur von `arrange.apps[]`

```js
app = {
    navigationIcon // URL zu kleinem Icon für die Navigation
    homeIcon // URL zu großen Icon für Home Screen
    name // Name der Anwendung, wird in Navigation und auf Home-Screen angezeigt
}
```