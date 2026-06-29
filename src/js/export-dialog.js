// Export Dialog Module
// ====================

const ExportManager = {
  init() {
    document.getElementById('btn-export').addEventListener('click', () => {
      const layer = FileManager.getCurrentLayer();
      if (!layer) {
        App.showToast('请先选择一个图层', 'error');
        return;
      }
      this.exportLayer(layer);
    });

    document.getElementById('btn-convert').addEventListener('click', async () => {
      const layer = FileManager.getCurrentLayer();
      if (!layer) {
        App.showToast('请先选择一个图层', 'error');
        return;
      }
      const format = document.getElementById('convert-format').value;
      const geojson = { type: 'FeatureCollection', features: layer.features };
      try {
        const result = await electronAPI.convertFormat({ data: geojson, format });
        const savePath = await electronAPI.dialogSave({
          title: '保存转换文件',
          defaultPath: layer.name + result.data.ext,
          filters: [{ name: format.toUpperCase(), extensions: [result.data.ext.replace('.', '')] }]
        });
        if (savePath) {
          await electronAPI.writeFile(savePath, result.data.content);
          App.showToast('转换完成: ' + layer.name + result.data.ext, 'success');
        }
      } catch (err) {
        App.showToast('转换失败: ' + err.message, 'error');
      }
    });

    document.getElementById('btn-spatial').addEventListener('click', async () => {
      const layer = FileManager.getCurrentLayer();
      if (!layer) {
        App.showToast('请先选择一个图层', 'error');
        return;
      }
      const operation = document.getElementById('spatial-op').value;
      const radius = document.getElementById('spatial-radius').value;
      const units = document.getElementById('spatial-units').value;
      App.showProgress(true, '执行空间操作...');
      try {
        const result = await electronAPI.spatialOperation({ operation, features: layer.features, params: { radius, units } });
        App.showProgress(false);
        if (result.success) {
          const resultLayer = {
            ...layer,
            id: layer.id + '-' + operation + '-' + Date.now(),
            name: layer.name + ' (' + operation + ')',
            features: result.data.features,
            featureCount: result.data.features.length
          };
          FileManager.layers.push(resultLayer);
          FileManager.currentLayerId = resultLayer.id;
          FileManager.render();
          FileManager.selectLayer(resultLayer.id);
          App.showToast('操作完成: ' + result.data.features.length + ' 个要素', 'success');
        } else {
          App.showToast('操作失败: ' + result.error, 'error');
        }
      } catch (err) {
        App.showProgress(false);
        App.showToast('空间操作失败: ' + err.message, 'error');
      }
    });
  },

  async exportLayer(layer) {
    const format = document.getElementById('export-format').value;
    const geojson = { type: 'FeatureCollection', features: layer.features };
    const ext = '.' + (format === 'geojson' ? 'geojson' : format);
    const savePath = await electronAPI.dialogSave({
      title: '导出图层',
      defaultPath: layer.name + ext,
      filters: [{ name: format.toUpperCase(), extensions: [format === 'geojson' ? 'geojson' : format] }]
    });
    if (!savePath) return;
    App.showProgress(true, '导出中...');
    try {
      const result = await electronAPI.convertFormat({ data: geojson, format });
      await electronAPI.writeFile(savePath, result.data.content);
      App.showProgress(false);
      App.showToast('导出成功', 'success');
    } catch (err) {
      App.showProgress(false);
      App.showToast('导出失败: ' + err.message, 'error');
    }
  }
};
