const defaultSettings = { saveAs: false }
function storageError(e) {
    console.error('storage error: ', e)
    return undefined
}
async function getSetting(key) {
    const userSettings = await browser.storage.sync.get(key).catch(storageError) || {}
    const policySettings = await browser.storage.managed.get(key).catch(() => undefined) || {}
    return userSettings[key] || policySettings[key] || defaultSettings[key];
}
async function setSetting(key, newValue) {
    console.log('newValue: ', newValue, 'for key: ', key)
    await browser.storage.sync.set({ [key]: newValue }).catch(storageError)
}
async function clearSettings() {
    console.log('removed')
    await browser.storage.sync.remove('saveAs').catch(storageError)
}

const resetButtonID = '#reset'
const saveAsID = '#saveAs'

async function loadSettings() {
    document.querySelector(saveAsID).checked = await getSetting('saveAs')
}

async function saveSettings(e) {
    e.preventDefault();
    console.log('saveAs value: ', document.querySelector(saveAsID).checked)
    await setSetting('saveAs', document.querySelector(saveAsID).checked)
}

async function resetSettings() {
    await clearSettings()
    await loadSettings()
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.querySelector("form").addEventListener("submit", saveSettings)
document.querySelector(resetButtonID).addEventListener("click", resetSettings)