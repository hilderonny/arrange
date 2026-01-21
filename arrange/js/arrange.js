async function autoLogin() {
    const autoLoginResponse = await fetch('/api/autologin')
    if (autoLoginResponse.status !== 200) {
        const successUrl = encodeURIComponent(location.href)
        const loginUrl = new URL('../login.html', import.meta.url).href + '?successurl=' + successUrl
        location.href = loginUrl
    }
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

await autoLogin()

export {
    createPrivatePath,
    createPublicPath,
    deletePrivatePath, 
    deletePublicPath, 
    getPrivateFile,
    getPublicFile,
    logout,
    postPrivateFile,
    postPublicFile
}