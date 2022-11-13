# Prevent PDF Viewer on Download

## What it does

This extension prevents a new tab from opening after downloading a PDF and optionally shows a `Save As...` windows to choose where to save the PDF.

Due to changes in Firefox how PDF files are handled, any downloaded PDF will instantly open in a new tab by default. This extension restore how PDFs were handled before Firefox 98.0.

This extension works nearly 100%, the only issue is with PDF "downloads" directly from a web application that uses blob to store the PDF before downloading it. In this case only the opening of a new tab with the PDF Viewer is prevented, since there isn't an actual http request that can be intercepted.

## Release

You can find [this extension](https://addons.mozilla.org/en-US/firefox/addon/prevent-pdf-viewer-on-download/) on the official Mozilla Addons page.

## Settings

Since extensions aren't able to read browser settings, the user has to manually set the option if a `Save As...` dialog should be displayed. Go to `about:addons` click on the `Prevent PDF Viewer on Download` extension and then on `Preferences`.

Alternatively, this option can also be set using Firefox Enterprise Policy:
```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "{ffb7264d-cb68-4954-83e7-b4a8740a443a}": {
          "saveAs": true
        }
      }
    }
  }
}
```

## References

I created a [bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=1795874) for this issue, however since the current functionally was requested by many users it was closed as won't fix. If you think, like me, that the previous behaviour is more desirable, leave a comment on that bug report with your opinion, but please be civil about it.

Also as reference, a recent [reddit post](https://www.reddit.com/r/firefox/comments/ylwi8j/firefox_opens_any_pdf_that_i_download/) regarding this issue.

## TODO

- [x] Implement download cancel and restart for non-blob PDF files, this would also completely prevent a new tab from opening
- [x] Add an option to change if the `Where to save files` window should be opened

## Contribution

Feel free to create a pull request with your improvements.
