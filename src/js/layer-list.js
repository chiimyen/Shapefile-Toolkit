// Layer Detail Module
// ===================

const LayerDetail = {
  currentLayer: null,

  init() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'preview' && this.currentLayer) {
          MapPreview.render(this.currentLayer);
        }
        if (btn.dataset.tab === 'attributes' && this.currentLayer) {
          AttributeTable.render(this.currentLayer);
        }
      });
    });
  },

  show(layer) {
    this.currentLayer = layer;
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('layer-detail').classList.remove('hidden');
    this.renderInfo(layer);
    if (document.querySelector('.tab-btn.active').dataset.tab === 'preview') {
      MapPreview.render(layer);
    }
    if (document.querySelector('.tab-btn.active').dataset.tab === 'attributes') {
      AttributeTable.render(layer);
    }
  },

  renderInfo(layer) {
    const container = document.getElementById('layer-info');
    const items = [
      { label: '文件名', value: layer.name + '.shp' },
      { label: '路径', value: layer.path },
      { label: '几何类型', value: layer.geometryType || '未知' },
      { label: '要素数量', value: layer.featureCount.toLocaleString() },
      { label: '文件大小', value: FileManager.formatSize(layer.fileSize) },
      { label: '属性表', value: layer.hasDbf ? '有' : '无' },
      { label: '投影文件', value: layer.hasPrj ? '有' : '无' },
      { label: '编码', value: layer.encoding || '未知' },
    ];

    if (layer.bounds) {
      items.push(
        { label: '经度范围', value: `${layer.bounds.minX.toFixed(4)} ~ ${layer.bounds.maxX.toFixed(4)}` },
        { label: '纬度范围', value: `${layer.bounds.minY.toFixed(4)} ~ ${layer.bounds.maxY.toFixed(4)}` }
      );
    }

    if (layer.projection) {
      items.push({ label: '投影/坐标系', value: layer.projection.substring(0, 120) + (layer.projection.length > 120 ? '...' : '') });
    }

    container.innerHTML = items.map(item => `
      <div class="info-row">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${FileManager.escapeHtml(item.value)}</span>
      </div>
    `).join('');
  }
};
