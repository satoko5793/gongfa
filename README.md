# Card Inventory Web Page

This folder now contains a fresh standalone webpage for card inventory showcase.

## Files

- `index.html` - main page
- `styles.css` - page styles
- `app.js` - screenshot slicing and card clustering logic

## How to use

1. Open `index.html` in your browser.
2. Upload one or more backpack screenshots.
3. Adjust grid settings to match the screenshot layout.
4. Click **Grid Preview** to check slot alignment.
5. Click **Extract Inventory** to auto-group cards and render storefront.
6. Optionally rename items and click **Export JSON**.

## Notes

- No login, no backend, pure local browser processing.
- Card names are stored in `localStorage` keyed by image hash.
- Visual grouping is based on dHash similarity threshold.
