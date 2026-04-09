# OEM Gasket Cutfile Maker

A browser-based gasket lookup, scan, and SVG cutfile tool for mechanics, fabricators, DIY builders, and anyone who needs a cleaner way to turn gasket info into usable patterns.

## Live Demo

**GitHub Pages:**  
https://leeak82.github.io/OEM-GASKET-CUTFILE-MAKER-/

---

## Overview

OEM Gasket Cutfile Maker supports two main workflows:

### 1. Catalog Workflow
Find a gasket by vehicle and application:

- Make
- Model
- Year
- Engine
- Gasket Type

The app then loads:

- part number
- dimensions
- pattern source
- hole layout
- SVG preview

### 2. Scan Workflow
Use a phone camera or uploaded image to:

- detect the gasket outline
- detect hole locations
- estimate width and height
- generate an SVG-ready pattern

This makes it possible to start from either a known catalog part or a real physical gasket.

---

## Features

### Vehicle Catalog Selection
Select a gasket by:

- Make
- Model
- Year
- Engine
- Gasket Type

The app loads matching data from `gasket_database.json`.

### Smart Part Search
Search by:

- part number
- make
- model
- year
- engine
- brand
- gasket type

Includes:

- live filtering
- clickable results
- result count
- clear search button

### Selected Part Info Panel
Displays:

- Brand
- Part Number
- Pattern Name
- Pattern Source

### Fastener-Based Pattern Engine
Reusable pattern references help generate realistic hole layouts when exact coordinates are not available yet.

Examples include:

- Valve Cover 8-Bolt
- Valve Cover 14-Bolt
- Oil Pan 18-Bolt
- Oil Pan 20-Bolt
- Head Gasket 6-Bolt

Pattern priority:

1. exact `holePattern`
2. `patternRef`
3. fallback perimeter layout

### SVG Preview and Download
Generate an SVG using:

- width
- height
- outline path
- hole coordinates

Export the SVG for:

- Cricut
- CNC
- laser cutting
- printing
- manual tracing

### Scan-to-Gasket Tools
Built-in scan workflow supports:

- Start Camera
- Capture Photo
- Stop Camera
- Upload Image
- Process Scan
- Use Scan In SVG

Adjustable scan controls:

- Scan Threshold
- Scale
- Minimum Hole Area

Visual scan tools include:

- source preview
- processed mask preview
- scan status messages

### JSON Database Import / Export
The app supports:

- importing a gasket JSON database
- exporting the current gasket JSON database

This makes the catalog expandable without rewriting the app every time.

---

## Current Limitations

This version is useful and working, but it is still growing.

### Database Limitations
- not every vehicle/application is included yet
- some entries still use estimated geometry
- some entries are broader fitment references rather than exact OEM geometry packs
- exact OEM hole coordinate coverage is still limited

### Geometry Limitations
- some outlines are simplified
- some entries rely on reusable fastener patterns
- not every gasket has exact traced side-specific geometry yet

### Scan Limitations
- scan quality depends heavily on image quality
- shadows and clutter can reduce accuracy
- dark gaskets on dark surfaces can confuse detection
- scan output should be treated as a starting point, not perfect measurement-grade data

### Platform Limitations
- GitHub Pages cannot directly write scan results back into the repo database
- scanned geometry is not auto-saved into `gasket_database.json`
- database updates still require export/import or manual edits

---

## Scan Instructions

### Best Results Setup
For the best scan results:

- place the gasket on a light, plain background
- keep the gasket flat
- take the photo from directly above
- avoid strong shadows
- fill most of the frame with the gasket
- use bright, even lighting
- keep the background uncluttered

### Camera Scan Workflow
1. Click **Start Camera**
2. Position the gasket in frame
3. Click **Capture Photo**
4. Adjust **Scan Threshold** if needed
5. Click **Process Scan**
6. Review the processed mask
7. Click **Use Scan In SVG**

### Upload Image Workflow
1. Click **Upload Image**
2. Select a gasket photo
3. Adjust **Scan Threshold** if needed
4. Click **Process Scan**
5. Review the processed mask
6. Click **Use Scan In SVG**

### Scan Controls Explained

#### Scan Threshold
Controls how dark a pixel must be before the app treats it as gasket material.

- lower value = stricter dark detection
- higher value = more of the image becomes gasket material

#### Scale
Defines how many image pixels equal one geometry unit.

This affects:

- estimated width
- estimated height
- hole placement scaling

#### Minimum Hole Area
Filters out tiny noise so the app is less likely to mistake dust, texture, or small artifacts for bolt holes.

---

## Project Structure

### `index.html`
Main UI layout for:

- part search
- scan tools
- catalog selector
- info panel
- geometry controls
- SVG preview

### `style.css`
Styles for:

- layout
- cards
- search UI
- scan panels
- info boxes
- preview area

### `app.js`
Main logic for:

- database loading
- search
- vehicle filtering
- info panel updates
- fastener pattern logic
- SVG generation
- camera scan processing
- image upload scan processing
- database import/export

### `gasket_database.json`
Vehicle and gasket data used by the app.

---

## Database Format

Each entry in `gasket_database.json` looks like this:

```json
{
  "make": "Ford",
  "model": "F-150",
  "year": 2015,
  "engine": "5.0L V8",
  "gasketType": "oil_pan",
  "brand": "OEM Ford",
  "partNumber": "FL3Z-6710-B",
  "fitmentStatus": "verified",
  "geometry": {
    "width": 318,
    "height": 216,
    "patternRef": "oilpan_perimeter_20",
    "outlinePath": "",
    "holePattern": []
  }
}
