const turf = require('@turf/turf');

async function performOperation(options) {
  const { operation, features, params } = options;
  const fc = { type: 'FeatureCollection', features };

  switch (operation) {
    case 'buffer': {
      const radius = parseFloat(params.radius) || 10;
      const units = params.units || 'meters';
      const result = turf.buffer(fc, radius, { units });
      return { features: result.features };
    }
    case 'simplify': {
      const tolerance = parseFloat(params.tolerance) || 0.01;
      const result = turf.simplify(fc, { tolerance, highQuality: true });
      return { features: result.features };
    }
    case 'centroid': {
      const results = features.map(f => turf.centroid(f));
      return { features: results };
    }
    case 'bbox': {
      const extents = features.map(f => turf.bbox(f));
      return { extents };
    }
    case 'explode': {
      const results = [];
      features.forEach(f => {
        turf.explode(f).features.forEach(x => results.push(x));
      });
      return { features: results };
    }
    case 'union': {
      if (features.length < 2) throw new Error('需要至少两个面要素进行合并');
      let result = features[0];
      for (let i = 1; i < features.length; i++) {
        result = turf.union(result, features[i]);
      }
      return { features: result.type === 'FeatureCollection' ? result.features : [result] };
    }
    case 'dissolve': {
      const attr = params.field;
      if (!attr) {
        // Dissolve all by geometry
        const dissolved = turf.dissolve(fc);
        return { features: dissolved.features };
      }
      // Group by attribute and dissolve each group
      const groups = {};
      features.forEach(f => {
        const key = f.properties?.[attr] ?? 'null';
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });
      const results = [];
      Object.entries(groups).forEach(([key, feats]) => {
        const gfc = { type: 'FeatureCollection', features: feats };
        const dissolved = turf.dissolve(gfc);
        dissolved.features.forEach(f => {
          f.properties = f.properties || {};
          f.properties[attr] = key;
          results.push(f);
        });
      });
      return { features: results };
    }
    default:
      throw new Error('不支持的空间操作: ' + operation);
  }
}

module.exports = { performOperation };