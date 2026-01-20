async function autoLogin() {
    const autoLoginResponse = await fetch('/api/autologin')
    if (autoLoginResponse.status !== 200) {
        const successUrl = encodeURIComponent(location.href)
        const loginUrl = new URL('../login.html', import.meta.url).href + '?successurl=' + successUrl
        location.href = loginUrl
    }
}

async function logout() {
    await fetch('/api/logout')
    location.reload()
}

await autoLogin()

export { logout }