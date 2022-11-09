
let preventPreview = {};
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

