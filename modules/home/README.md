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

## API GET `/api/home/applist`

Liefert Liste aller in `arrange.apps` registrierten Apps zurück.
Wird für den Aufbau der Navigation und des Home-Screens verwendet.

```js
response = [
    {
        name: 'users-users', // Eindeutiger identifizierer für HTML IDs. Sollte aus Modulnamen und Appnamen bestehen
        label: 'Benutzer',
        icon: '/modules/users/images/users.png',
        url: '/modules/users/index.html,
        default: true // Wenn Home-Modul diese Anwendung standardmäßig anzeigen soll
   }
]
```

## Navigationsselektion erzwingen

Das geht über eine Nachricht, die die Anweisung zum Selektieren und die App-ID enthält.

```js
// Modul "home", App "home" selektieren
parent.postMessage({ action: 'selectApp', appid: 'home-home' })
```