const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');

function geojsonToCsv(geojson) {
  const features = geojson.features || [geojson];
  if (features.length === 0) return '';
  const rows = features.map(f => {
    const props = f.properties || {};
    props._geometry_type = f.geometry?.type || '';
    if (f.geometry?.coordinates) {
      if (f.geometry.type === 'Point') {
        props._longitude = f.geometry.coordinates[0];
        props._latitude = f.geometry.coordinates[1];
      } else {
        props._geometry = JSON.stringify(f.geometry);
      }
    }
    return props;
  });
  return stringify(rows, { header: true });
}

async function convert(options) {
  const { data, format } = options;
  if (format === 'geojson' || format === 'json') {
    return { content: JSON.stringify(data, null, 2), ext: '.' + format };
  } else if (format === 'csv') {
    return { content: geojsonToCsv(data), ext: '.csv' };
  }
  throw new Error('Unsupported format: ' + format);
}

async function exportFiles(options) {
  const { layers, outputDir, format } = options;
  const results = [];
  const JSZip = require('jszip');
  const zip = new JSZip();

  for (const layer of layers) {
    const geojson = { type: 'FeatureCollection', features: layer.features };
    const baseName = layer.name || 'export';
    if (format === 'geojson') {
      const outPath = path.join(outputDir, baseName + '.geojson');
      fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf-8');
      results.push(outPath);
    } else if (format === 'csv') {
      const outPath = path.join(outputDir, baseName + '.csv');
      fs.writeFileSync(outPath, geojsonToCsv(geojson), 'utf-8');
      results.push(outPath);
    } else if (format === 'zip') {
      zip.file(baseName + '.geojson', JSON.stringify(geojson, null, 2));
    }
  }

  if (format === 'zip' && outputDir) {
    const zipPath = path.join(outputDir, 'shapefile-export.zip');
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(zipPath, buf);
    results.push(zipPath);
  }
  return results;
}

module.exports = { convert, exportFiles, geojsonToCsv };
