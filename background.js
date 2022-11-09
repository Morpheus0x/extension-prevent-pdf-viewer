
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
	if (tab.url === "about:newtab") {
		console.log('created empty tab with id: ', tab.id);
		// browser.tabs.remove(tab.id);
	}
});

browser.webNavigation.onCreatedNavigationTarget.addListener((evt) => { 
	console.log('onCreatedNavigationTarget: ', evt); 
});

browser.webNavigation.onBeforeNavigate.addListener((evt) => { 
	console.log('onBeforeNavigate: ', evt); 
});

browser.webNavigation.onCommitted.addListener((evt) => { 
	console.log('onCommitted: ', evt); 
});


browser.downloads.onCreated.addListener( (dl) => {
	console.log('download created: ', dl)
	if (dl.filename.toLowerCase().endsWith('.pdf')) {
		// console.log('downloaded pdf: ', dl.url, 'filename: ', dl.url.split('/').slice(-1)[0])
		if (browser.runtime.PlatformOs === 'win') {
			preventPreview[dl.filename.split('\\').slice(-1)[0]] = true
		} else {
			preventPreview[dl.filename.split('/').slice(-1)[0]] = true
		}
		console.log('preventPreview: ', preventPreview)
	}
});

