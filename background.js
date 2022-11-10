
const forbiddenHeaders = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Cookie', 'Date', 'DNT', 'Expect', 'Feature-Policy', 'Host', 'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'Via']
const forbiddenHeaderPrefixes = ['Proxy-', 'Sec-']

let preventPreview = {};

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
		if (browser.runtime.PlatformOs === 'win') {
			preventPreview[dl.filename.split('\\').slice(-1)[0]] = true
		} else {
			preventPreview[dl.filename.split('/').slice(-1)[0]] = true
		}
		console.log('preventPreview: ', preventPreview)
	}
});

