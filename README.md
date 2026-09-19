# Gasket Maker

Gasket Maker is a measurement-first gasket pattern and SVG cutfile app for mechanics, fabricators, DIY builders, and anyone who needs to turn real gasket measurements into a usable digital cutting pattern.

The app can also scan a gasket image, detect the outline and holes, and use that result as a starting point. Scan results still require physical calibration and verification before export.

## Live App

**Render app:**
https://gasket-maker-app.onrender.com

**GitHub Pages mirror:**
https://leeak82.github.io/OEM-GASKET-CUTFILE-MAKER-/

The Render version is a Progressive Web App (PWA). On Android, open it in Chrome and choose **Install app** or **Add to Home screen**.

## What It Does

### Measurement-to-cutfile workflow

The safest and most accurate workflow is:

1. Measure the real gasket or mating surface.
2. Enter the actual width and height.
3. Enter or adjust hole locations and hole diameters.
4. Preview the generated geometry.
5. Confirm that the measurements were checked against the real part.
6. Download the verified SVG cutfile.

The exported SVG uses physical millimeter dimensions and can be used as a starting point for compatible Cricut, laser, CNC, printing, tracing, or fabrication workflows.

### Camera and image scan

The app can:

- open the phone camera
- capture a gasket image
- accept an uploaded image
- threshold the image into a binary mask
- detect the gasket bounding area
- detect likely internal holes
- generate an outline path
- convert the detected geometry into an SVG preview

A scan does **not** automatically become a trusted cutfile. The user must enter a real pixels-per-mm calibration and verify the resulting dimensions against the physical gasket.

### Catalog lookup

The catalog can be searched by:

- make
- model
- year
- engine
- gasket type
- brand
- part number

Catalog data is useful for identifying parts and generating previews, but generic pattern data is **not treated as exact OEM cut geometry**.

## No Fake Precision

Gasket Maker deliberately separates reference data from verified geometry.

- Generic fastener patterns are labeled **PREVIEW ONLY**.
- Catalog entries are not considered cut-ready merely because a part number exists.
- SVG download is disabled until the user confirms the current measurements and hole locations were physically measured or calibrated.
- Changing width, height, or hole coordinates automatically clears verification.
- Scan mode has no guessed default scale.
- A real pixels-per-mm calibration is required before scan dimensions are calculated.
- Unverified previews display **PREVIEW ONLY - VERIFY MEASUREMENTS**.
- Verified exports use physical millimeter dimensions.

This prevents a convincing-looking generic drawing from being presented as an accurate production gasket pattern.

## Features

- Vehicle/application catalog
- Part-number search
- Manual measurement entry
- Manual hole-coordinate editing
- SVG preview
- Verified SVG export
- Camera capture
- Image upload
- Threshold-based gasket detection
- Hole detection
- Calibration-based scan dimensions
- JSON database import/export
- Offline-capable PWA
- Installable Android home-screen app
- Service-worker caching
- Automatic Render deployment from `main`

## Scan Setup

For better scan results:

- place the gasket flat
- use a plain, contrasting background
- photograph it directly from above
- avoid strong shadows
- use bright, even lighting
- fill most of the image with the gasket
- include or measure a known real-world distance for calibration

### Scan controls

**Scan Threshold** determines how dark a pixel must be before the app considers it gasket material.

**Calibration (pixels per mm)** converts image pixels into physical dimensions. This value must come from a real measured reference; do not guess it.

**Minimum Hole Area** filters small image noise that could otherwise be mistaken for a bolt hole.

## Install as an App

### Android / Chrome

1. Open https://gasket-maker-app.onrender.com
2. Open Chrome's menu.
3. Choose **Install app** or **Add to Home screen**.
4. Launch Gasket Maker from the new app icon.

The installed PWA runs in standalone mode and caches its core files for offline use.

## Project Structure

- `index.html` — main user interface
- `style.css` — responsive styling
- `app.js` — catalog, scan, verification, and SVG-generation logic
- `gasket_database.json` — reference gasket catalog
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline service worker
- `icon-192.png` / `icon-512.png` — installable app icons
- `www/` — synchronized Capacitor web assets
- `android/` — native Android Capacitor project

## Deployment

Production PWA is deployed as a Render static site:

- Service: `gasket-maker-app`
- Branch: `main`
- Auto-deploy: enabled
- URL: https://gasket-maker-app.onrender.com

GitHub Pages also publishes the repository's `main` branch as a secondary web copy.

## Current Limitations

- The catalog is not a complete OEM gasket database.
- Generic catalog patterns are references, not exact production geometry.
- Image processing is intentionally lightweight and can be affected by shadows, clutter, surface texture, and poor contrast.
- Scanning does not eliminate the need for physical measurement.
- Exact OEM geometry should only be marked verified when supported by trustworthy dimensional source data or direct physical measurement.
- Users should test-fit patterns before cutting expensive material.

## Development

The project is intentionally simple and mostly client-side. No remote AI service is required to create manual measurement-based SVGs.

To test locally, serve the project directory with any static HTTP server. Camera access requires a secure context on normal browsers, so HTTPS deployment is recommended for mobile use.

## License

MIT
