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
                case 0x01:
                    const clientId = dataView.getBigInt64(1, true)
                    await messageCallback(type, undefined, clientId)
                    break
                case 0x31:
                case 0x41:
                    const senderId = dataView.getBigInt64(1, true)
                    const message = new TextDecoder().decode(bytes.subarray(9))
                    await messageCallback(type, senderId, message)
                    break
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

}

async function leaveRoom(roomNumber) {

}

async function logout() {
    await fetch('/api/logout')
    location.reload()
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

async function sendMessageToClient(clientId) {

}

async function sendMessageToRoom(roomNumber) {

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
    connectWebSocket,
    createPrivatePath,
    createPublicPath,
    deletePrivatePath, 
    deletePublicPath, 
    getPrivateFile,
    getPublicFile,
    joinRoom,
    leaveRoom,
    logout,
    postPrivateFile,
    postPublicFile,
    sendMessageToClient,
    sendMessageToRoom,
    uploadPrivateFile,
    uploadPublicFile
}