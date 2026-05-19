/**
 * Demonstration von Arrange.
 * Liefert statische Dateien aus dem text/html-Verzeichnis aus.
 * Kann in VS Code mit F5 gestartet werden.
 */
import ArrangeServer from './ArrangeServer.mjs'

// Server vorbereiten
const server = new ArrangeServer({
    crtFile: './server.crt',
    htmlPaths: {
        '/' : './test/html/root',
        '/subfolder1' : './test/html/subfolder1',
        '/subfolder2' : './test/html/subfolder2',
    },
    keyFile: './server.key',
    name: 'Arrange Demo Server',
    port: 8443,
    useSSL: true,
    useWebsockets: true
})

// Server starten
server.start()