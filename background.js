const defaultSettings = { saveAs: false }
async function getSetting(key) {
  const userSettings = await browser.storage.sync.get(key).catch(() => undefined) || {}
  const policySettings = await browser.storage.managed.get(key).catch(() => undefined) || {}
  console.log('bg getSetting: ', userSettings[key], policySettings[key], defaultSettings[key])
  return userSettings[key] !== undefined ? userSettings[key] : policySettings[key] !== undefined ? policySettings[key] : defaultSettings[key];
}
// Modified from Source: https://stackoverflow.com/a/67994693
function getFileName(disposition) {
  const utf8FilenameRegex = /filename\*=(["']?)utf-8''([\w%\-\.]+)(?:; ?|$|\1)/i;
  const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;

  let fileName = null;
  if (utf8FilenameRegex.test(disposition)) {
    fileName = decodeURIComponent(utf8FilenameRegex.exec(disposition)[2]);
  } else {
    // prevent ReDos attacks by anchoring the ascii regex to string start and
    //  slicing off everything before 'filename='
    const filenameStart = disposition.toLowerCase().indexOf('filename=');
    if (filenameStart >= 0) {
      const partialDisposition = disposition.slice(filenameStart);
      const matches = asciiFilenameRegex.exec(partialDisposition );
      if (matches != null && matches[2]) {
        fileName = matches[2];
      }
    }
  }
  return fileName;
}

let preventPreview = {};
let preventDownload = {};
let preventDoubleDownload = {};

browser.tabs.onCreated.addListener((tab) => { 
  // Close any PDF Viewer tab that opens for downloaded PDFs
  if (preventPreview[tab.title.split('/').slice(-1)[0]] !== undefined) {
    browser.tabs.remove(tab.id)
    delete preventPreview[tab.title.split('/').slice(-1)[0]]
  }
});

async function downloadPDF(url) {
  preventDoubleDownload[url] = true
  browser.downloads.download({ saveAs: await getSetting('saveAs'), url: preventDownload[url].url, filename: preventDownload[url].filename })
    .then((e) => delete preventDoubleDownload[url])
    .catch((e) => delete preventDoubleDownload[url])
  delete preventDownload[url]
}

browser.downloads.onCreated.addListener( (dl) => {
  if (dl.filename.toLowerCase().endsWith('.pdf')) {
    if (dl.url.startsWith('blob:')) {
      if (browser.runtime.PlatformOs === 'win') {
        preventPreview[dl.filename.split('\\').slice(-1)[0]] = true
      } else {
        preventPreview[dl.filename.split('/').slice(-1)[0]] = true
      }
      console.warn('prevent preview of blob pdf')
    } else {
      if (preventDownload[dl.url] !== undefined) {
        // Even if no saveAs dialog should be displayed, redownload it to completely prevent popup
        browser.downloads.cancel(dl.id)
        browser.downloads.erase({ 
          url: dl.url, 
          filename: dl.filename, 
          limit: 1, 
          orderBy: ["-startTime"] 
        }).then((e) => {
          console.warn('erased successfully: ', e)
          downloadPDF(dl.url)
        }).catch((e) => {
          console.error('erased error: ', e)
          downloadPDF(dl.url)
        })
      }
    }
  }
});

function getResponseHeadersPDF (resp) {
  if (preventDoubleDownload[resp.url] !== undefined) {
    delete preventDoubleDownload[resp.url]
    console.warn('response untouched to prevent double download')
    return
  } else {
    console.warn('processing response to prevent auto download')
  }
  const contentDisposition = resp.responseHeaders.find(e => e.name.toLowerCase() === "content-disposition")
  if( contentDisposition !== undefined && contentDisposition.value.startsWith("attachment")) {
    try {
      let filename = ''
      if (contentDisposition.value.split(';').length > 1) {
        filename = getFileName(contentDisposition.value)
      } else {
        filename = resp.url.split('/').slice(-1)[0].split('?')[0]
      }
      preventDownload[resp.url] = { url: resp.url, filename }
    } catch (e) {
      console.error('custom dl error: ', e)
    }
    return
  }
}
browser.webRequest.onHeadersReceived.addListener(
  getResponseHeadersPDF,
  { urls: ['*://*/*.pdf', '*://*/*.pdf?*'] }, // ['<all_urls>'], types: ['main_frame']
  ['blocking', 'responseHeaders']
)
