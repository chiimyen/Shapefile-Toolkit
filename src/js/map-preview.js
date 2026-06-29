// Map Preview Module (Canvas-based)
// ================================

const MapPreview = {
  canvas: null,
  ctx: null,
  currentLayer: null,
  zoom: 1,
  panX: 0,
  panY: 0,

  init() {
    this.canvas = document.getElementById('preview-canvas');
    this.ctx = this.canvas.getContext('2d');

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.zoom *= 1.3;
      this.draw();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.zoom /= 1.3;
      this.draw();
    });
    document.getElementById('btn-reset-view').addEventListener('click', () => {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.draw();
    });

    // Mouse drag to pan
    let isDragging = false;
    let startX, startY;
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.offsetX;
      startY = e.offsetY;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.panX += (e.offsetX - startX);
      this.panY += (e.offsetY - startY);
      startX = e.offsetX;
      startY = e.offsetY;
      this.draw();
    });
    this.canvas.addEventListener('mouseup', () => { isDragging = false; });
    this.canvas.addEventListener('mouseleave', () => { isDragging = false; });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom *= delta;
      this.draw();
    });

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (this.currentLayer) this.render(this.currentLayer);
    });
    resizeObserver.observe(document.getElementById('preview-container'));
  },

  render(layer) {
    this.currentLayer = layer;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.draw();
  },

  draw() {
    const layer = this.currentLayer;
    if (!layer) return;

    const container = document.getElementById('preview-container');
    const rect = container.getBoundingClientRect();
    const w = rect.width - 4;
    const h = rect.height - 4;

    this.canvas.width = w * 2;
    this.canvas.height = h * 2;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(2, 2);

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, w, h);

    const features = layer.features || [];
    if (features.length === 0) {
      this.ctx.fillStyle = '#6b6b8d';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('无几何数据可预览', w / 2, h / 2);
      return;
    }

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasCoords = false;

    function extractCoords(geometry) {
      if (!geometry || !geometry.coordinates) return;
      const type = geometry.type;
      if (type === 'Point') { processCoords([geometry.coordinates]); }
      else if (type === 'MultiPoint' || type === 'LineString') { processCoords(geometry.coordinates); }
      else if (type === 'MultiLineString' || type === 'Polygon') {
        geometry.coordinates.forEach(ring => processCoords(ring));
      }
      else if (type === 'MultiPolygon') {
        geometry.coordinates.forEach(poly => poly.forEach(ring => processCoords(ring)));
      }
    }

    function processCoords(coords) {
      coords.forEach(c => {
        if (c.length >= 2 && typeof c[0] === 'number') {
          minX = Math.min(minX, c[0]);
          minY = Math.min(minY, c[1]);
          maxX = Math.max(maxX, c[0]);
          maxY = Math.max(maxY, c[1]);
          hasCoords = true;
        }
      });
    }

    features.forEach(f => extractCoords(f.geometry));

    if (!hasCoords) return;

    const padding = 40;
    const dataW = maxX - minX || 1;
    const dataH = maxY - minY || 1;
    const scaleX = (w - padding * 2) / dataW;
    const scaleY = (h - padding * 2) / dataH;
    const scale = Math.min(scaleX, scaleY) * this.zoom;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    function transform(x, y) {
      return {
        px: (x - cx) * scale + w / 2 + this.panX,
        py: -(y - cy) * scale + h / 2 + this.panY
      };
    }

    const self = this;
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';

    features.forEach(f => {
      if (!f.geometry || !f.geometry.coordinates) return;
      const type = f.geometry.type;

      if (type === 'Point') {
        const { px, py } = transform.call(self, f.geometry.coordinates[0], f.geometry.coordinates[1]);
        self.ctx.beginPath();
        self.ctx.arc(px, py, Math.max(4 / self.zoom, 2), 0, Math.PI * 2);
        self.ctx.fillStyle = '#4ECDC4';
        self.ctx.fill();
      }
      else if (type === 'MultiPoint') {
        f.geometry.coordinates.forEach(c => {
          const { px, py } = transform.call(self, c[0], c[1]);
          self.ctx.beginPath();
          self.ctx.arc(px, py, Math.max(4 / self.zoom, 2), 0, Math.PI * 2);
          self.ctx.fill();
        });
      }
      else if (type === 'LineString') {
        self.ctx.beginPath();
        f.geometry.coordinates.forEach((c, i) => {
          const { px, py } = transform.call(self, c[0], c[1]);
          i === 0 ? self.ctx.moveTo(px, py) : self.ctx.lineTo(px, py);
        });
        self.ctx.stroke();
      }
      else if (type === 'MultiLineString') {
        f.geometry.coordinates.forEach(line => {
          self.ctx.beginPath();
          line.forEach((c, i) => {
            const { px, py } = transform.call(self, c[0], c[1]);
            i === 0 ? self.ctx.moveTo(px, py) : self.ctx.lineTo(px, py);
          });
          self.ctx.stroke();
        });
      }
      else if (type === 'Polygon') {
        f.geometry.coordinates.forEach((ring, ri) => {
          self.ctx.beginPath();
          ring.forEach((c, i) => {
            const { px, py } = transform.call(self, c[0], c[1]);
            i === 0 ? self.ctx.moveTo(px, py) : self.ctx.lineTo(px, py);
          });
          self.ctx.closePath();
          if (ri === 0) {
            self.ctx.fill();
          }
          self.ctx.stroke();
        });
      }
      else if (type === 'MultiPolygon') {
        f.geometry.coordinates.forEach(poly => {
          poly.forEach((ring, ri) => {
            self.ctx.beginPath();
            ring.forEach((c, i) => {
              const { px, py } = transform.call(self, c[0], c[1]);
              i === 0 ? self.ctx.moveTo(px, py) : self.ctx.lineTo(px, py);
            });
            self.ctx.closePath();
            if (ri === 0) self.ctx.fill();
            self.ctx.stroke();
          });
        });
      }
    });

    // Draw coordinate info
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${features.length} 要素 · ${layer.geometryType || ''} · 缩放: ${this.zoom.toFixed(1)}x`, 8, h - 8);
  }
};
