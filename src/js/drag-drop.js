// Drag & Drop and File Import Module
// ===================================

const FileManager = {
  layers: [],
  currentLayerId: null,

  init() {
    this.dropZone = document.getElementById('drop-zone');
    this.layerList = document.getElementById('layer-list');
    this.initDragDrop();
    this.initButtons();
  },

  initDragDrop() {
    const zone = this.dropZone;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.name.toLowerCase().endsWith('.shp')
      );
      for (const file of files) {
        await this.loadLayer(file.path);
      }
    });

    zone.addEventListener('click', async () => {
      const paths = await electronAPI.dialogOpenShp();
      for (const p of paths) {
        await this.loadLayer(p);
      }
    });
  },

  initButtons() {
    document.getElementById('btn-add-files').addEventListener('click', async () => {
      const paths = await electronAPI.dialogOpenShp();
      for (const p of paths) await this.loadLayer(p);
    });

    document.getElementById('btn-add-folder').addEventListener('click', async () => {
      const paths = await electronAPI.dialogOpenFolder();
      for (const dir of paths) {
        const entries = await electronAPI.dialogOpenShp(dir);
        // We can't get dir listing from renderer, so use main process
        const result = await electronAPI.readShapefile(dir);
        // This is a directory, scan it
      }
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.layers = [];
      this.currentLayerId = null;
      this.render();
      document.getElementById('empty-state').classList.remove('hidden');
      document.getElementById('layer-detail').classList.add('hidden');
    });
  },

  async loadLayer(filePath) {
    const stats = await electronAPI.getFileStats(filePath);
    const result = await electronAPI.readShapefile(filePath);

    if (!result.success) {
      App.showToast('读取失败: ' + result.error, 'error');
      return;
    }

    const layer = result.data;
    layer.loadedAt = new Date().toISOString();
    layer.fileSizeFormatted = this.formatSize(stats.data.size);
    this.layers.push(layer);
    this.currentLayerId = layer.id;
    this.render();
    this.selectLayer(layer.id);
    App.showToast('已加载: ' + layer.name, 'success');
  },

  selectLayer(id) {
    this.currentLayerId = id;
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      this.render();
      LayerDetail.show(layer);
    }
  },

  removeLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.currentLayerId === id) {
      this.currentLayerId = this.layers.length > 0 ? this.layers[0].id : null;
    }
    this.render();
    if (this.layers.length === 0) {
      document.getElementById('empty-state').classList.remove('hidden');
      document.getElementById('layer-detail').classList.add('hidden');
    } else if (this.currentLayerId) {
      this.selectLayer(this.currentLayerId);
    }
  },

  getCurrentLayer() {
    return this.layers.find(l => l.id === this.currentLayerId);
  },

  getAllLayers() {
    return this.layers;
  },

  render() {
    this.layerList.innerHTML = '';
    if (this.layers.length === 0) return;

    for (const layer of this.layers) {
      const el = document.createElement('div');
      el.className = 'layer-item' + (layer.id === this.currentLayerId ? ' active' : '');
      el.dataset.layerId = layer.id;

      const geomClass = this.geomClass(layer.geometryType);

      el.innerHTML = `
        <div class="layer-name">${this.escapeHtml(layer.name)}</div>
        <div class="layer-meta">
          <span class="${geomClass}">${layer.geometryType || 'Unknown'}</span>
          <span>${layer.featureCount} 要素</span>
          <span>${layer.fileSizeFormatted}</span>
        </div>
      `;

      el.addEventListener('click', () => this.selectLayer(layer.id));

      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        ContextMenu.show(e.clientX, e.clientY, layer.id);
      });

      this.layerList.appendChild(el);
    }
  },

  geomClass(type) {
    if (!type) return '';
    if (type.includes('Point')) return 'geom-point';
    if (type.includes('Polygon')) return 'geom-polygon';
    if (type.includes('Line')) return 'geom-linestring';
    return '';
  },

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Context Menu
const ContextMenu = {
  menu: null,
  targetLayerId: null,

  init() {
    this.menu = document.getElementById('context-menu');
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', () => this.hide());

    this.menu.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleAction(action);
        this.hide();
      });
    });
  },

  show(x, y, layerId) {
    this.targetLayerId = layerId;
    this.menu.style.left = x + 'px';
    this.menu.style.top = y + 'px';
    this.menu.classList.remove('hidden');
  },

  hide() {
    this.menu.classList.add('hidden');
  },

  handleAction(action) {
    const layer = FileManager.layers.find(l => l.id === this.targetLayerId);
    if (!layer) return;

    switch (action) {
      case 'remove':
        FileManager.removeLayer(layer.id);
        App.showToast('已移除: ' + layer.name, 'info');
        break;
      case 'export':
        ExportManager.exportLayer(layer);
        break;
      case 'show-in-explorer':
        electronAPI.openInExplorer(layer.path);
        break;
    }
  }
};
