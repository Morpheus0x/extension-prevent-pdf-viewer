
const forbiddenHeaders = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Cookie', 'Date', 'DNT', 'Expect', 'Feature-Policy', 'Host', 'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'Via']
const forbiddenHeaderPrefixes = ['Proxy-', 'Sec-']

let preventPreview = {};
let downloadHeaders = {};
let preventDownload = {};
let preventDoubleDownload = {};

// helper functions
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

browser.tabs.onCreated.addListener((tab) => { 
  console.log('newTabEvent: ', tab); 
  if (preventPreview[tab.title.split('/').slice(-1)[0]] !== undefined) {
    browser.tabs.remove(tab.id)
    delete preventPreview[tab.title.split('/').slice(-1)[0]]
  }
  /* if (details.title.toLowerCase().endsWith('.pdf')) {
    browser.tabs.remove(details.id)
  } */
});

function downloadPDF(url) {
  preventDoubleDownload[url] = true
  browser.downloads.download({ saveAs: true, url: preventDownload[url].url, filename: preventDownload[url].filename })
    .then((e) => delete preventDoubleDownload[url])
    .catch((e) => delete preventDoubleDownload[url])
  delete preventDownload[url]
}

browser.downloads.onCreated.addListener( (dl) => {
  console.log('download created: ', dl)
  if (dl.filename.toLowerCase().endsWith('.pdf')) {
    if (dl.url.startsWith('blob:')) {
      if (browser.runtime.PlatformOs === 'win') {
        preventPreview[dl.filename.split('\\').slice(-1)[0]] = true
      } else {
        preventPreview[dl.filename.split('/').slice(-1)[0]] = true
      }
      console.warn('prevent preview of blob pdf')
    } else {
      if (preventDownload[dl.url] !== undefined) { // Check for user saveAs setting
        console.log('preventDownload: ', preventDownload)
        browser.downloads.cancel(dl.id)
        // query: [dl.url], id: dl.id, startTime: dl.startTime
        browser.downloads.erase({ url: dl.url, filename: dl.filename }).then((e) => {
          console.warn('erased successfully: ', e)
          downloadPDF(dl.url)
        }).catch((e) => {
          console.error('erased error: ', e)
          downloadPDF(dl.url)
        })
        // TODO: delete dl history entry
      }
      /*try {
        browser.downloads.download({ saveAs: true, url: dl.url }) // cookieStoreId: dl.cookieStoreId,  
      } catch (e) {
        console.log('caught dl error: ', e)
      } */
    }
    console.log('preventPreview: ', preventPreview)
  }
});

function getResponseHeadersPDF (resp) {
  console.log('resp: ', resp)
  if (preventDoubleDownload[resp.url] !== undefined) {
    delete preventDoubleDownload[resp.url]
    console.warn('response untouched to prevent double download')
    return
  } else {
    console.warn('processing response to prevent auto download')
  }
  // console.log('downloadHeaders: ', downloadHeaders)
  // console.log('dispo: ', resp.responseHeaders.find(e => e.name === "content-disposition"))
  const contentDisposition = resp.responseHeaders.find(e => e.name.toLowerCase() === "content-disposition")
  // console.log('contentDisposition !== undefined: ', contentDisposition !== undefined, 'contentDisposition.startsWith("attachment"): ', contentDisposition.value.startsWith("attachment"), 'contentDisposition: ', contentDisposition)
  if( contentDisposition !== undefined && contentDisposition.value.startsWith("attachment")) { //, [0] === "attachment"
    // console.log('content dispo attachment')
    try {
      let filename = ''
      if (contentDisposition.value.split(';').length > 1) {
        filename = getFileName(contentDisposition.value)
      } else {
        filename = resp.url.split('/').slice(-1)[0].split('?')[0]
      }
      // TODO: saveAs: depending on user settings
      // console.log('before custom dl')
      preventDownload[resp.url] = { url: resp.url, filename }
      // console.log('triggered download from Response Header')
    } catch (e) {
      console.log('custom dl error: ', e)
    }
    return // { cancel: true }
  }
}
browser.webRequest.onHeadersReceived.addListener(
  getResponseHeadersPDF,
  { urls: ['*://*/*.pdf', '*://*/*.pdf?*'] }, // ['<all_urls>'], types: ['main_frame']
  ['blocking', 'responseHeaders']
)
