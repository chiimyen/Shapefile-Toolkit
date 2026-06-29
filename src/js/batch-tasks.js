// Batch Tasks Module
// ==================

const BatchProcessor = {
  init() {
    document.getElementById('btn-batch').addEventListener('click', async () => {
      const op = document.getElementById('batch-op').value;
      const layers = FileManager.getAllLayers();

      if (layers.length === 0) {
        App.showToast('没有可处理的图层', 'error');
        return;
      }

      const outputDir = await electronAPI.dialogSave({
        title: '选择导出目录',
        defaultPath: 'shapefile-export',
        filters: [{ name: '文件夹', extensions: ['*'] }]
      });

      if (!outputDir) return;

      const format = op.replace('export-', '');
      App.showProgress(true, `批量导出 ${format.toUpperCase()}...`);

      try {
        const result = await electronAPI.exportFiles({
          layers: layers.map(l => ({
            name: l.name,
            features: l.features
          })),
          outputDir,
          format
        });

        App.showProgress(false);
        if (result.success) {
          App.showToast(`成功导出 ${result.data.length} 个文件`, 'success');
        } else {
          App.showToast('导出失败: ' + result.error, 'error');
        }
      } catch (err) {
        App.showProgress(false);
        App.showToast('批量操作失败: ' + err.message, 'error');
      }
    });
  }
};
