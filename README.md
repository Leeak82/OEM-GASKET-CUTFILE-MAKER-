What This App Does
OEM Gasket Cutfile Maker helps turn gasket information into usable cut patterns.

It supports two main workflows:
1. Catalog Workflow
Find a gasket by:
Make
Model
Year
Engine
Gasket Type
Then load:
part number
dimensions
pattern source
hole layout
SVG preview

2. Scan Workflow
Use:
live camera capture
uploaded image files
to detect:
gasket outline
hole positions
rough width and height
Then apply the scan result directly into the SVG generator.

Features

Vehicle Catalog Selection
Pick a gasket by application using a cascading selector:
Make
Model
Year
Engine
Gasket Type
The app loads the matching part from gasket_database.json.
Part Search

Search by:
part number
make
model
engine
brand
gasket type
Includes:
live filtering
clickable results
clear search button
result count
Selected Part Info Panel

Displays the loaded part details:
Brand
Part Number
Pattern Name
Pattern Source
Fastener-Based Pattern System
Reusable pattern references help the app generate realistic hole layouts even when exact coordinates are not stored yet.

Examples:
Valve Cover 8-Bolt
Valve Cover 14-Bolt
Oil Pan 18-Bolt
Oil Pan 20-Bolt
Head Gasket 6-Bolt
Pattern priority is:
exact holePattern
patternRef
fallback perimeter layout
SVG Preview and Download

The app generates a simple SVG cutfile from:
width
height
outline path
hole coordinates
You can then download the SVG for later use.

Scan-to-Gasket Tools
The app includes a basic browser-based scan workflow with:
Start Camera
Capture Photo
Stop Camera
Upload Image
Process Scan
Use Scan In SVG

Adjustable scan controls:
Scan Threshold
Scale
Minimum Hole Area
Also includes:
source preview
processed mask preview
scan status messages

JSON Database Import / Export
You can:
import a JSON gasket database
export the current JSON gasket database
This helps the catalog grow without rewriting code every time.
Current Limitations
This version is functional and useful, but it is still evolving.

Database Limitations
not every vehicle/application has been added yet
some entries still use estimated geometry
some part coverage is broad rather than fully exact
exact OEM hole coordinates are still limited

Geometry Limitations
many outlines are still simplified
some entries rely on reusable fastener patterns
not all parts have true side-specific or exact traced shapes yet
Scan Limitations
scan quality depends heavily on image quality
messy backgrounds can confuse detection
shadows can distort results
dark gaskets on dark surfaces reduce accuracy
scan results are best treated as a starting point, not perfect measurement data

Platform Limitations
static GitHub Pages hosting cannot write back into the repository automatically
scan results are not directly saved into gasket_database.json
database updates still require exporting/importing or manual edits

Scan Instructions
Best Results Setup
For the cleanest scan results:
place gasket on a light, plain background
keep gasket flat
take the picture from directly above
avoid strong shadows
fill most of the frame with the gasket
use bright, even lighting
avoid clutter in the background
Camera Scan Workflow
Click Start Camera
Position the gasket in frame
Click Capture Photo
Adjust Scan Threshold if needed
Click Process Scan
Review the processed mask
Click Use Scan In SVG
Upload Image Workflow
Click Upload Image
Choose a gasket photo
Adjust Scan Threshold if needed
Click Process Scan
Review the processed mask
Click Use Scan In SVG

Scan Controls Explained
Scan Threshold
Controls how dark a pixel must be before the app treats it as gasket material.
lower value = stricter dark detection
higher value = more of the image becomes part of the mask
Scale
Defines how many image pixels equal one geometry unit.
This affects the final width, height, and hole placement scaling.
Minimum Hole Area
Filters out tiny noise and prevents the app from detecting dirt specks or texture as bolt holes.

Project Structure
index.html
Main UI layout for:
search
scan tools
selector
geometry controls
preview
style.css
Styles for:
layout
cards
search UI
scan panels
preview area
info boxes
app.js
Main logic for:
database loading
search
vehicle filtering
info panel updates
fastener pattern logic
SVG generation
scan processing
import/export
gasket_database.json
Part and vehicle database used by the app.
Database Format

Each entry in gasket_database.json looks like this:
JSON
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

Geometry Fields
Inside geometry:
width = gasket width
height = gasket height
patternRef = reusable fastener layout reference
outlinePath = optional custom SVG path
holePattern = optional exact hole coordinates
Running Locally
Because the app loads gasket_database.json, it should be served through a local web server instead of opened directly as a file.

Python
Bash
python -m http.server 8000
Then open:
Plain text
http://localhost:8000
Node
Bash
npx serve .
