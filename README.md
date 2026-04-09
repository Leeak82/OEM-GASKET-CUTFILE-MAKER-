# Gasket Maker

Gasket Maker is a browser-based tool for selecting a vehicle gasket by make, model, year, engine, and gasket type, then generating a simple SVG pattern for preview and download.

This project is built to be lightweight, easy to expand, and simple to host with GitHub Pages.

---

## Features

- Vehicle-based catalog flow
  - Make
  - Model
  - Year
  - Engine
  - Gasket Type
- Loads part number automatically
- Loads gasket dimensions automatically
- Auto-generates hole layout when custom coordinates are not provided
- SVG preview in the browser
- Download generated SVG
- Import JSON database
- Export JSON database

---

## Project Files

- `Index.html`  
  Main app layout and UI

- `Style.css`  
  Styling for the app interface

- `App.js`  
  Main application logic for:
  - dropdown filtering
  - loading gasket data
  - SVG rendering
  - import/export tools

- `gasket_database.json`  
  Starter database containing vehicle and gasket entries

---

## How It Works

The app reads gasket data from `gasket_database.json`.

The selection flow is:

1. Choose a **Make**
2. Choose a **Model**
3. Choose a **Year**
4. Choose an **Engine**
5. Choose a **Gasket Type**

Once selected, the app:

- finds the matching gasket entry
- fills in the part number
- fills in width and height
- loads either:
  - a stored hole pattern, or
  - an automatically generated hole layout
- renders an SVG preview

---

## Database Format

Each gasket entry in `gasket_database.json` looks like this:

```json
{
  "make": "Dodge",
  "model": "Ram 1500",
  "year": 2008,
  "engine": "5.7L Hemi",
  "gasketType": "oil_pan",
  "partNumber": "OS30726R",
  "geometry": {
    "width": 320,
    "height": 220,
    "holes": 18,
    "holePattern": []
  }
}
