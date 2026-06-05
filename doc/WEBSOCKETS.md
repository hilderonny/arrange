# WebSockets

→ [Dokumentationsindex](./README.md)

WebSockets ermöglichen bidirektionale Echtzeit-Kommunikation zwischen Server und Clients. Arrange nutzt ein binäres Protokoll.

**Voraussetzung:** `useWebsockets: true` im `ArrangeServer`-Konstruktor.

---

## Verbindung aufbauen (Client)

**Mit Clientbibliothek (empfohlen):**
```js
import * as Arrange from '/arrange/js/arrange.mjs'

await Arrange.connectWebSocket((event) => {
    // event.type, event.clientId, event.senderId, event.roomId, event.message
})
// Direkt nach Connect kommt Nachricht 0x01 mit eigener clientId
```

**Direkt (ohne Bibliothek):**
```js
const ws = new WebSocket(`wss://${location.host}/ws`)
ws.binaryType = 'arraybuffer'
ws.onmessage = (e) => { /* binäre Nachricht verarbeiten */ }
```

---

## Protokoll – Nachrichtenformat

Alle Nachrichten sind binär. Das erste Byte ist der **Typ**. Numerische IDs sind immer `8 Bytes Little-Endian BigInt (uint64)`.

### Client → Server

| Byte 0 | Bedeutung | Payload |
|---|---|---|
| `0x10` | Raum betreten | 8 Bytes Raumnummer |
| `0x20` | Raum verlassen | 8 Bytes Raumnummer |
| `0x30` | Broadcast an Raum | 8 Bytes Raumnummer + beliebiger Payload |
| `0x40` | Direktnachricht | 8 Bytes Ziel-Client-ID + beliebiger Payload |

### Server → Client

| Byte 0 | Bedeutung | Payload |
|---|---|---|
| `0x01` | Eigene Client-ID (bei Connect) | 8 Bytes eigene ID |
| `0x31` | Broadcast empfangen | 8 Bytes Sender-ID + 8 Bytes Raum-ID + Payload |
| `0x41` | Direktnachricht empfangen | 8 Bytes Sender-ID + Payload |

---

## Räume

Ein **Raum** ist eine numerische ID (`BigInt`). Jeder Client kann beliebig vielen Räumen beitreten.

```js
// Raum betreten
await Arrange.joinRoom(42n)

// Broadcast senden (kein eigenes Mitglied nötig)
await Arrange.sendMessageToRoom(42n, 'Neue Aufgabe angelegt')

// Raum verlassen
await Arrange.leaveRoom(42n)
```

Typische Raumnummern-Strategie: pro Entität eine feste Raumnummer verwenden (z.B. Datenbank-Hash, feste Konstante, oder aus einem Datensatz-Typ abgeleitet).

---

## Direktnachrichten

```js
// Eigene ID merken
let myId
await Arrange.connectWebSocket((event) => {
    if (event.type === 0x01) myId = event.clientId

    if (event.type === 0x41) {
        console.log(`Direktnachricht von ${event.senderId}: ${event.message}`)
    }
})

// An anderen Client senden (clientId muss vorher bekannt sein)
await Arrange.sendMessageToClient(otherClientId, 'Hallo direkt!')
```

---

## Binäres Protokoll (low-level)

Für eigene Implementierungen ohne Clientbibliothek:

```js
// Raum betreten (0x10 + 8 Bytes Raumnummer)
function joinRoom(ws, roomNumber) {
    const buf = new ArrayBuffer(9)
    const view = new DataView(buf)
    view.setUint8(0, 0x10)
    view.setBigUint64(1, roomNumber, true) // Little-Endian
    ws.send(buf)
}

// Broadcast senden (0x30 + 8 Bytes Raumnummer + Payload)
function sendToRoom(ws, roomNumber, text) {
    const payload = new TextEncoder().encode(text)
    const buf = new ArrayBuffer(9 + payload.byteLength)
    const view = new DataView(buf)
    view.setUint8(0, 0x30)
    view.setBigUint64(1, roomNumber, true)
    new Uint8Array(buf, 9).set(payload)
    ws.send(buf)
}

// Eingehende Nachrichten parsen
ws.onmessage = (e) => {
    const buf = e.data
    const view = new DataView(buf)
    const type = view.getUint8(0)

    if (type === 0x01) {
        const myId = view.getBigUint64(1, true)
    } else if (type === 0x31) {
        const senderId = view.getBigUint64(1, true)
        const roomId   = view.getBigUint64(9, true)
        const message  = new TextDecoder().decode(new Uint8Array(buf, 17))
    } else if (type === 0x41) {
        const senderId = view.getBigUint64(1, true)
        const message  = new TextDecoder().decode(new Uint8Array(buf, 9))
    }
}
```

---

## Anwendungsmuster

### Echtzeit-Datenbankänderungen propagieren

```js
// Beim Speichern einer Aufgabe andere Clients benachrichtigen
async function saveTaskAndNotify(task) {
    await task.save()
    await Arrange.sendMessageToRoom(TASKS_ROOM, JSON.stringify({
        type:   'taskUpdated',
        taskId: task.Id
    }))
}

// Andere Clients: Raum beobachten und Liste aktualisieren
await Arrange.connectWebSocket(async (event) => {
    if (event.type === 0x31) {
        const data = JSON.parse(event.message)
        if (data.type === 'taskUpdated') {
            await reloadTaskList()
        }
    }
})
await Arrange.joinRoom(TASKS_ROOM)
```

---

## Verwandte Dokumente

- [CLIENT.md](./CLIENT.md) – `connectWebSocket`, `joinRoom`, `sendMessageToRoom` etc.
- [USE_CASES.md](./USE_CASES.md) – Kollaborative Anwendungen


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
