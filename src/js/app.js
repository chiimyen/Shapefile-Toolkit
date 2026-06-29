// Main Application Entry Point
// ============================

const App = {
  init() {
    // Window controls
    document.getElementById('btn-minimize').addEventListener('click', () => electronAPI.minimize());
    document.getElementById('btn-maximize').addEventListener('click', () => electronAPI.maximize());
    document.getElementById('btn-close').addEventListener('click', () => electronAPI.close());

    // Initialize modules
    FileManager.init();
    ContextMenu.init();
    LayerDetail.init();
    AttributeTable.init();
    MapPreview.init();
    BatchProcessor.init();
    ExportManager.init();

    console.log('Shapefile Toolkit initialized');
    App.showToast('欢迎使用 Shapefile Toolkit', 'info');
  },

  showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showProgress(show, text) {
    const bar = document.getElementById('progress-bar');
    if (show) {
      bar.classList.remove('hidden');
      if (text) document.getElementById('progress-text').textContent = text;
    } else {
      bar.classList.add('hidden');
      document.getElementById('progress-fill').style.width = '0%';
    }
  },

  updateProgress(pct) {
    document.getElementById('progress-fill').style.width = pct + '%';
  }
};

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
