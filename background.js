
const forbiddenHeaders = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Cookie', 'Date', 'DNT', 'Expect', 'Feature-Policy', 'Host', 'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'Via']
const forbiddenHeaderPrefixes = ['Proxy-', 'Sec-']

let preventPreview = {};
let downloadHeaders = {};
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

browser.downloads.onCreated.addListener( (dl) => {
  console.log('download created: ', dl)
  if (dl.filename.toLowerCase().endsWith('.pdf')) {
    if (dl.url.startsWith('blob:')) {
      if (browser.runtime.PlatformOs === 'win') {
        preventPreview[dl.filename.split('\\').slice(-1)[0]] = true
      } else {
        preventPreview[dl.filename.split('/').slice(-1)[0]] = true
      }
      }
    console.log('preventPreview: ', preventPreview)
  }
});

function getRequestHeadersPDF (req) {
  console.log('req: ', req)
  downloadHeaders[req.url] = req.requestHeaders
}
browser.webRequest.onBeforeSendHeaders.addListener(
  getRequestHeadersPDF,
  { urls: ['*://*/*.pdf', '*://*/*.pdf?*'], types: ['main_frame'] },
  ['blocking', 'requestHeaders']
)

async function customDownload (url, filename, headers) {
  try { // not needed try
    await timeout(100)
    console.warn('downloading now')
    browser.downloads.download({ saveAs: true, url, filename, headers }).catch((e) => {
      console.warn('download aborted')
      delete preventDoubleDownload[url]
    })
  } catch (e) {
    console.warn('custom dl error: ', e)
  }
}
function getResponseHeadersPDF (resp) {
  console.log('resp: ', resp)
  if (preventDoubleDownload[resp.url] !== undefined) {
    delete preventDoubleDownload[resp.url]
    return
  }
  // console.log('downloadHeaders: ', downloadHeaders)
  // console.log('dispo: ', resp.responseHeaders.find(e => e.name === "content-disposition"))
  const contentDisposition = resp.responseHeaders.find(e => e.name === "content-disposition")
  // console.log('contentDisposition !== undefined: ', contentDisposition !== undefined, 'contentDisposition.startsWith("attachment"): ', contentDisposition.value.startsWith("attachment"), 'contentDisposition: ', contentDisposition)
  if( contentDisposition !== undefined && contentDisposition.value.startsWith("attachment")) { //, [0] === "attachment"
    // console.log('content dispo attachment')
      let filename = ''
      if (contentDisposition.value.split(';').length > 1) {
        filename = getFileName(contentDisposition.value)
      } else {
        filename = resp.url.split('/').slice(-1)[0].split('?')[0]
      }
      let headers = []
      if (downloadHeaders[resp.url] !== undefined) {
        headers = downloadHeaders[resp.url].filter((e) => {
          // Check and Remove Forbidden Headers
          let noPrefix = true
            for (prefix of forbiddenHeaderPrefixes) {
          if (e.name.startsWith(prefix)) {
                noPrefix = false
                break
              }
            }
          return forbiddenHeaders.indexOf(e.name) === -1 && noPrefix
        })
        delete downloadHeaders[resp.url]
      }
      // TODO: saveAs: depending on user settings
      // console.log('before custom dl')
      preventDoubleDownload[resp.url] = true
    customDownload(resp.url, fielname, headers)
    console.warn('returning')
    return { cancel: true }
  }
}
browser.webRequest.onHeadersReceived.addListener(
  getResponseHeadersPDF,
  { urls: ['*://*/*.pdf', '*://*/*.pdf?*'] }, // ['<all_urls>'], types: ['main_frame']
  ['blocking', 'responseHeaders']
)
