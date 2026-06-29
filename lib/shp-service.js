const path = require('path');
const fs = require('fs');

// Read shapefile and return GeoJSON + metadata
async function readShapefile(shpPath) {
  const shapefile = require('shapefile');
  const baseName = path.basename(shpPath, '.shp');
  const dir = path.dirname(shpPath);

  // Check for companion files
  const dbfPath = shpPath.replace(/\.shp$/i, '.dbf');
  const prjPath = shpPath.replace(/\.shp$/i, '.prj');
  const cpgPath = shpPath.replace(/\.shp$/i, '.cpg');

  const existsDbf = fs.existsSync(dbfPath);
  const existsPrj = fs.existsSync(prjPath);
  const existsCpg = fs.existsSync(cpgPath);

  // Read projection if available
  let projection = null;
  if (existsPrj) {
    projection = fs.readFileSync(prjPath, 'utf-8').trim();
  }

  // Read encoding if available
  let encoding = null;
  if (existsCpg) {
    encoding = fs.readFileSync(cpgPath, 'utf-8').trim();
  }

  // Read shapefile
  const source = await shapefile.open(shpPath);
  const features = [];
  let featureCount = 0;
  let geometryType = null;
  let bounds = null;

  while (true) {
    const result = await source.read();
    if (result.done) break;
    const feature = result.value;
    if (!geometryType && feature.geometry) geometryType = feature.geometry.type;
    if (feature.geometry) {
      featureCount++;
      // Calculate bounding box
      if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
        const [x, y] = feature.geometry.coordinates;
        if (!bounds) bounds = { minX: x, minY: y, maxX: x, maxY: y };
        else {
          bounds.minX = Math.min(bounds.minX, x);
          bounds.minY = Math.min(bounds.minY, y);
          bounds.maxX = Math.max(bounds.maxX, x);
          bounds.maxY = Math.max(bounds.maxY, y);
        }
      }
    }
    features.push(feature);
  }

  return {
    id: baseName,
    name: baseName,
    path: shpPath,
    features,
    featureCount,
    geometryType: geometryType || 'Unknown',
    bounds,
    projection,
    encoding,
    fileSize: fs.statSync(shpPath).size,
    hasDbf: existsDbf,
    hasPrj: existsPrj
  };
}

// Scan directory for .shp files
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.shp')) {
      files.push(path.join(dirPath, entry.name));
    }
  }
  return files;
}

module.exports = { readShapefile, scanDirectory };