let WEB_SOCKET = undefined;

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

async function createPrivatePath(directoryPath) {
    const userid = localStorage.getItem('userid')
    const url = new URL(`/api/files/${userid}/${directoryPath}`, import.meta.url).href
    return await fetch(url, { method: 'PUT' })
}

async function createPublicPath(directoryPath) {
    const url = new URL(`/api/files/public/${directoryPath}`, import.meta.url).href
    return await fetch(url, { method: 'PUT' })
}

async function deletePrivatePath(filePath) {
    const userid = localStorage.getItem('userid')
    const url = new URL(`/api/files/${userid}/${filePath}`, import.meta.url).href
    return await fetch(url, { method: 'DELETE' })
}

async function deletePublicPath(filePath) {
    const url = new URL(`/api/files/public/${filePath}`, import.meta.url).href
    return await fetch(url, { method: 'DELETE' })
}

async function getPrivateFile(filePath) {
    const userid = localStorage.getItem('userid')
    const url = new URL(`/api/files/${userid}/${filePath}`, import.meta.url).href
    return await fetch(url)
}

async function getPublicFile(filePath) {
    const url = new URL(`/api/files/public/${filePath}`, import.meta.url).href
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

async function loescheDatenbanktabelle(datenbankname, tabellenname) {
    const url = new URL(`/api/database/${datenbankname}/${tabellenname}`, import.meta.url).href
    const response = await fetch(url, { method: 'DELETE' })
    return response.ok
}

async function loescheDatensatz(datenbankname, tabellenname, datensatzId) {
    const url = new URL(`/api/database/${datenbankname}/${tabellenname}/${datensatzId}`, import.meta.url).href
    const response = await fetch(url, { method: 'DELETE' })
    return response.ok
}

async function macheDatenbankabfrage(datenbankname, abfrage) {
    const url = new URL(`/api/database/${datenbankname}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'POST',
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

async function postTextFile(url, fileContent) {
    const formData = new FormData()
    formData.append('data', new Blob([fileContent]))
    const result = await fetch(url, {
        method: 'POST',
        body: formData
    })
    return result.ok
}

async function postPrivateTextFile(filePath, fileContent) {
    const userid = localStorage.getItem('userid')
    const url = new URL(`/api/files/${userid}/${filePath}`, import.meta.url).href
    return await postTextFile(url, fileContent)
}

async function postPublicTextFile(filePath, fileContent) {
    const url = new URL(`/api/files/public/${filePath}`, import.meta.url).href
    return await postTextFile(url, fileContent)
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

async function speichereDatensatz(datenbankname, tabellenname, datensatzId, felder) {
    if (!datensatzId) {
        datensatzId = Math.floor((Date.now() + Math.random()) * 1000).toString()
    }
    // Null durch undefined ersetzen
    for (const key of Object.keys(felder)) {
        if (felder[key] == null) felder[key] = undefined
    }
    const url = new URL(`/api/database/${datenbankname}/${tabellenname}/${datensatzId}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ felder: felder })
    })
    if (response.ok) {
        return await response.json()
    } else {
        return undefined
    }
}

async function updateDatabase(datenbankname, schema) {
    const url = new URL(`/api/database/${datenbankname}`, import.meta.url).href
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schema: schema })
    })
    return response.ok
}

async function uploadFile(url, binaryFileContent, progressCallback) {
    const formData = new FormData()
    formData.append('data', new Blob([binaryFileContent]))
    return new Promise((resolve) => {
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

        xhr.open('POST', url)
        xhr.send(formData)
    })
}

async function uploadPrivateBinaryFile(filePath, binaryFileContent, progressCallback) {
    const userid = localStorage.getItem('userid')
    const url = new URL(`/api/files/${userid}/${filePath}`, import.meta.url).href
    return await uploadFile(url, binaryFileContent, progressCallback)
}

async function uploadPublicBinaryFile(filePath, binaryFileContent, progressCallback) {
    const url = new URL(`/api/files/public/${filePath}`, import.meta.url).href
    return await uploadFile(url, binaryFileContent, progressCallback)
}

await autoLogin()

export {
    connectWebSocket,
    createPrivatePath,
    createPublicPath,
    deletePrivatePath, 
    deletePublicPath, 
    getPrivateFile,
    getPublicFile,
    joinRoom,
    leaveRoom,
    loescheDatenbanktabelle,
    loescheDatensatz,
    logout,
    macheDatenbankabfrage,
    postPrivateTextFile,
    postPublicTextFile,
    sendMessageToClient,
    sendMessageToRoom,
    speichereDatensatz,
    updateDatabase,
    uploadPrivateBinaryFile,
    uploadPublicBinaryFile,
}