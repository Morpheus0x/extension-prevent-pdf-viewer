// store.js
// Simple storage library to get user or enterprise policy settings for webextensions

const defaultSettings = { saveAs: false }

function storageError(e) {
    console.error('storage error: ', e)
    return undefined
}

export async function getSetting(key) {
    const userSettings = await browser.storage.sync.get(key).catch(storageError)
    const policySettings = await browser.storage.managed.get(key).catch(() => undefined)
    return userSettings[key] || policySettings[key] || defaultSettings[key];
}

export async function setSetting(key, newValue) {
    console.log('newValue: ', newValue, 'for key: ', key)
    await browser.storage.sync.set({ [key]: newValue }).catch(storageError)
}

export async function resetSettings() {
    console.log('removed')
    await browser.storage.sync.remove('saveAs').catch(storageError)
}
