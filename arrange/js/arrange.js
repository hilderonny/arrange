let WEB_SOCKET = undefined;

async function aktualisiereDatenbankschema(datenbankname, schema) {
    const url = new URL(`/api/datenbank/${datenbankname}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schema: schema })
    })
    return response.ok
}

async function aktualisiereDatensatz(datenbankname, tabellenname, datensatzId, felder) {
    const url = new URL(`/api/datenbank/${datenbankname}/${tabellenname}/${datensatzId}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ felder: felder })
    })
    return response.ok
}

async function autoLogin() {
    const autoLoginResponse = await fetch('/api/autologin')
    if (autoLoginResponse.status !== 200) {
        const successUrl = encodeURIComponent(location.href)
        const loginUrl = new URL('../login.html', import.meta.url).href + '?successurl=' + successUrl
        location.href = loginUrl
    }
}

async function connectWebSocket(messageCallback) {
    return new Promise((resolve, _) => {
        WEB_SOCKET = new WebSocket('/ws')
        WEB_SOCKET.onopen = () => {
            resolve()
        }
        WEB_SOCKET.onmessage = async (messageEvent) => {
            const arrayBuffer = await messageEvent.data.arrayBuffer()
            const dataView = new DataView(arrayBuffer)
            const type = dataView.getInt8(0)
            switch (type) {
                case 0x01: {
                    const clientId = dataView.getBigInt64(1, true)
                    await messageCallback({ type, clientId })
                } break
                case 0x31: {
                    const senderId = dataView.getBigInt64(1, true)
                    const roomId = dataView.getBigInt64(9, true)
                    const message = arrayBuffer.slice(17)
                    await messageCallback({ type, senderId, roomId, message })
                } break
                case 0x41: {
                    const senderId = dataView.getBigInt64(1, true)
                    const message = arrayBuffer.slice(9)
                    await messageCallback({ type, senderId, message })
                } break
            }
        }
    })
}

async function createPrivatePath(path) {
    const userid = localStorage.getItem('userid')
    const filteredPath = path.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/${userid}/${filteredPath}`, import.meta.url).href
    return await fetch(url, { method: 'PUT' })
}

async function createPublicPath(path) {
    const filteredPath = path.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/public/${filteredPath}`, import.meta.url).href
    return await fetch(url, { method: 'PUT' })
}

async function deletePrivatePath(path) {
    const userid = localStorage.getItem('userid')
    const filteredPath = path.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/${userid}/${filteredPath}`, import.meta.url).href
    return await fetch(url, { method: 'DELETE' })
}

async function deletePublicPath(path) {
    const filteredPath = path.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/public/${filteredPath}`, import.meta.url).href
    return await fetch(url, { method: 'DELETE' })
}

async function erstelleDatensatz(datenbankname, tabellenname, datensatz) {
    const url = new URL(`/api/datenbank/${datenbankname}/${tabellenname}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ datensatz: datensatz })
    })
    if (response.ok) {
        return await response.json()
    } else {
        return undefined
    }
}

async function getPrivateFile(filePath) {
    const userid = localStorage.getItem('userid')
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/${userid}/${filteredFilePath}`, import.meta.url).href
    return await fetch(url)
}

async function getPublicFile(filePath) {
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/public/${filteredFilePath}`, import.meta.url).href
    return await fetch(url)
}

async function joinRoom(roomNumber) {
    const arrayBuffer = new ArrayBuffer(9)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x10)
    dataView.setBigInt64(1, roomNumber, true)
    WEB_SOCKET.send(arrayBuffer)
}

async function leaveRoom(roomNumber) {
    const arrayBuffer = new ArrayBuffer(9)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x20)
    dataView.setBigInt64(1, roomNumber, true)
    WEB_SOCKET.send(arrayBuffer)
}

async function logout() {
    await fetch('/api/logout')
    location.reload()
}

async function loescheDatensatz(datenbankname, tabellenname, datensatzId) {
    const url = new URL(`/api/datenbank/${datenbankname}/${tabellenname}/${datensatzId}`, import.meta.url).href
    const response = await fetch(url, { method: 'DELETE' })
    return response.ok
}

async function macheDatenbankabfrage(datenbankname, abfrage) {
    const url = new URL(`/api/datenbank/${datenbankname}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ abfrage: abfrage })
    })
    if (response.ok) {
        return await response.json()
    } else {
        return undefined
    }
}

async function postFile(url, fileContent) {
    const formData = new FormData()
    formData.append('data', new Blob([fileContent]))
    const result = await fetch(url, {
        method: 'POST',
        body: formData
    })
    return result.ok
}

async function postPrivateFile(filePath, fileContent) {
    const userid = localStorage.getItem('userid')
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/${userid}/${filteredFilePath}`, import.meta.url).href
    return await postFile(url, fileContent)
}

async function postPublicFile(filePath, fileContent) {
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/public/${filteredFilePath}`, import.meta.url).href
    return await postFile(url, fileContent)
}

async function queryDatabase(databaseName, sqlQuery) {
    const url = new URL(`/api/database/${databaseName}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query: sqlQuery })
    })
    if (response.ok) {
        return await response.json()
    } else {
        return undefined
    }
}

async function sendMessageToClient(clientId, textMessage) {
    const textBytes = new TextEncoder().encode(textMessage)
    const arrayBuffer = new ArrayBuffer(9 + textBytes.length)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x40)
    dataView.setBigInt64(1, clientId, true)
    new Uint8Array(arrayBuffer).set(textBytes, 9)
    WEB_SOCKET.send(arrayBuffer)
}

async function sendMessageToRoom(roomNumber, textMessage) {
    const textBytes = new TextEncoder().encode(textMessage)
    const arrayBuffer = new ArrayBuffer(9 + textBytes.length)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x30)
    dataView.setBigInt64(1, roomNumber, true)
    new Uint8Array(arrayBuffer).set(textBytes, 9)
    WEB_SOCKET.send(arrayBuffer)
}

async function uploadFile(url, file, progressCallback) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        if (progressCallback) {
            xhr.upload.onprogress = (progressEvent) => {
                if (progressEvent.lengthComputable) {
                    const progress = Math.round(progressEvent.loaded / progressEvent.total * 100)
                    progressCallback(progress)
                }
            }
        }

        xhr.onload = () => resolve(xhr)
        xhr.onerror = () => reject()

        xhr.open('POST', url)
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhr.send(file)
    })
}

async function uploadPrivateFile(filePath, file, progressCallback) {
    const userid = localStorage.getItem('userid')
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/${userid}/${filteredFilePath}`, import.meta.url).href
    return await uploadFile(url, file, progressCallback)
}

async function uploadPublicFile(filePath, file, progressCallback) {
    const filteredFilePath = filePath.split('/').filter(e => e).join('/')
    const url = new URL(`/api/files/public/${filteredFilePath}`, import.meta.url).href
    return await uploadFile(url, file, progressCallback)
}

await autoLogin()

export {
    aktualisiereDatenbankschema,
    aktualisiereDatensatz,
    connectWebSocket,
    createPrivatePath,
    createPublicPath,
    deletePrivatePath, 
    deletePublicPath, 
    erstelleDatensatz,
    getPrivateFile,
    getPublicFile,
    joinRoom,
    leaveRoom,
    loescheDatensatz,
    logout,
    macheDatenbankabfrage,
    postPrivateFile,
    postPublicFile,
    queryDatabase,
    sendMessageToClient,
    sendMessageToRoom,
    uploadPrivateFile,
    uploadPublicFile,
}