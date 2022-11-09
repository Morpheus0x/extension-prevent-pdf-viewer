# Prevent PDF Viewer on Download

## What it does

This extension instantly closes the new tab that is opened after downloading a PDF.

Due to changes in Firefox how PDF files are handled, any downloaded PDF will instantly open in a new tab by default. This extension tries to restore how PDFs were handled prior to Firefox 98.0.

This extension is designed to work in all cirumstances, even when sometimes restarting a download isn't possible. The current functionality therefore is limited to only closing the new tab.

## Goal

Any PDF that has `content-disposition: attachment` set or is otherwise indicated to be downloaded should just be downloaded and not opened with the Firefox PDF Viewer. Depending on user preference, the `where to save files` window should be shown.

I initially tried aborting any PDF download with `browser.downloads.cancel()` and restarting it via `browser.downloads.download()` with saveAs set to true. This would work for any normal PDF, however this doens't work for PDFs that are generated as a blob in a web application and directly downloaded that way, since the extension is unable to access that blob.

## References

I created a bug report [bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=1795874) for this issue, however since the current functionally was requested by many users it was closed as wont fix. If you think, like me, that the previous behavior is more desireable, leave a comment on that bug report with your opinion, but please be civil about it.

Also as reference, a recent [reddit post](https://www.reddit.com/r/firefox/comments/ylwi8j/firefox_opens_any_pdf_that_i_download/) regarding this issue.

## TODO

- [ ] Implement download cancel and restart for non-blob pdf files, this would also completely prevent a new tab from opening
- [ ] Add an option to change if the `Where to save files` window should be opened

## Contribution

Feel free to create a pull request with your improvements.
