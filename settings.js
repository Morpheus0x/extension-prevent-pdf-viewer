import { getSetting, setSetting, resetSettings } from './store.js'

const resetButtonID = '#reset'
const saveAsID = '#saveAs'

async function loadSettings() {
    document.querySelector(saveAsID).checked = getSetting('saveAs')
}

async function saveSettings(e) {
    e.preventDefault();
    console.log('saveAs value: ', document.querySelector(saveAsID).checked)
    setSetting('saveAs', document.querySelector(saveAsID).checked)
}

async function resetSettings() {
    resetSettings()
    loadSettings()
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.querySelector("form").addEventListener("submit", saveSettings)
document.querySelector(resetButtonID).addEventListener("click", resetSettings)