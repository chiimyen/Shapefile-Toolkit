# Shapefile Toolkit

> The most beautiful SHP batch processing tool for Windows GIS data workflow.

![Electron](https://img.shields.io/badge/Electron-28.1.0-47848F) ![Node](https://img.shields.io/badge/Node-18%2B-339933) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Overview

Shapefile Toolkit is a professional-grade Windows desktop application built with Electron for batch processing GIS Shapefile (.shp) data. It provides a modern, dark-themed UI for managing, previewing, converting, and performing spatial operations on shapefile layers with zero configuration required.

## Features

### Core Capabilities

- **Batch Import** - Drag & drop or file dialog to load multiple .shp files at once
- **Layer Management** - Sidebar with layer list, metadata, and context menu actions
- **Attribute Table** - Sortable, searchable data grid for viewing and inspecting feature attributes
- **Geometry Preview** - Canvas-based interactive preview with zoom, pan, and fit-to-view
- **Format Conversion** - Export to GeoJSON, CSV, JSON with a single click
- **Spatial Operations** - Buffer, Simplify, Centroid, Dissolve using Turf.js
- **Batch Export** - Bulk export or zip-package all loaded layers

### Technical Highlights

- Frameless custom titlebar with window controls (minimize/maximize/close)
- Dark theme inspired by modern GIS tools like QGIS Dark and ArcGIS Pro
- Memory-efficient streaming shapefile reader using the `shapefile` library
- Spatial computation via `@turf/turf` for professional-grade geometry operations
- ContextIsolation + preload pattern for secure Electron architecture

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
git clone https://github.com/your-username/shapefile-toolkit.git
cd shapefile-toolkit
npm install
npm start
```

### Development

```bash
npm run dev
```

## Project Structure

```
shapefile-toolkit/
├── main.js              # Electron main process
├── preload.js           # Context bridge preload
├── package.json
├── lib/
│   ├── shp-service.js   # Shapefile reading & directory scanning
│   ├── converter.js     # GeoJSON/CSV/JSON format conversion
│   └── spatial.js       # Turf.js spatial operations
└── src/
    ├── index.html       # Main UI layout
    ├── styles/
    │   └── app.css      # Dark theme stylesheet
    ├── js/
    │   ├── app.js             # Application entry point
    │   ├── drag-drop.js       # File import & layer management
    │   ├── layer-list.js      # Layer detail & info panel
    │   ├── attribute-table.js # Sortable/searchable attribute grid
    │   ├── map-preview.js     # Canvas geometry renderer
    │   ├── batch-tasks.js     # Batch processing operations
    │   └── export-dialog.js   # Format conversion & export
    └── assets/
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `shapefile` | Streaming .shp/.dbf file reader |
| `@turf/turf` | Spatial analysis & geometry operations |
| `jszip` | Batch zip export packaging |
| `csv-stringify` / `csv-parse` | Attribute CSV format handling |
| `proj4` | Coordinate reference system utilities |
| `wellknown` | WKT/WKB format parser |

## License

MIT
