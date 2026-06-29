// Attribute Table Module
// ======================

const AttributeTable = {
  currentFeatures: [],
  currentHeaders: [],
  sortColumn: null,
  sortAsc: true,
  searchTerm: '',

  init() {
    document.getElementById('attr-search-input').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderTable();
    });
  },

  render(layer) {
    this.currentFeatures = layer.features || [];
    this.sortColumn = null;
    this.sortAsc = true;
    this.searchTerm = '';
    document.getElementById('attr-search-input').value = '';
    this.renderTable();
  },

  getHeaders() {
    const headers = new Set();
    this.currentFeatures.forEach(f => {
      if (f.properties) {
        Object.keys(f.properties).forEach(k => headers.add(k));
      }
    });
    return Array.from(headers);
  },

  renderTable() {
    const headers = this.getHeaders();
    this.currentHeaders = headers;

    const searchTerm = this.searchTerm;

    // Filter
    let features = this.currentFeatures;
    if (searchTerm) {
      features = features.filter(f => {
        if (!f.properties) return false;
        return Object.values(f.properties).some(v =>
          String(v).toLowerCase().includes(searchTerm)
        );
      });
    }

    // Sort
    if (this.sortColumn) {
      const idx = headers.indexOf(this.sortColumn);
      features = [...features].sort((a, b) => {
        const va = a.properties?.[this.sortColumn];
        const vb = b.properties?.[this.sortColumn];
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return this.sortAsc ? cmp : -cmp;
      });
    }

    document.getElementById('attr-count').textContent = `${features.length} 条记录 (共 ${this.currentFeatures.length} 条)`;

    // Render headers
    const headerRow = document.getElementById('attr-header');
    headerRow.innerHTML = headers.map(h => `
      <th data-col="${FileManager.escapeHtml(h)}" class="${this.sortColumn === h ? 'sorted' : ''}">
        ${FileManager.escapeHtml(h)}
        ${this.sortColumn === h ? (this.sortAsc ? ' ▲' : ' ▼') : ''}
      </th>
    `).join('');

    // Header click sorting
    headerRow.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (this.sortColumn === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortColumn = col;
          this.sortAsc = true;
        }
        this.renderTable();
      });
    });

    // Render body
    const body = document.getElementById('attr-body');
    body.innerHTML = features.map(f => {
      const vals = headers.map(h => {
        const v = f.properties?.[h];
        return `<td title="${FileManager.escapeHtml(String(v ?? ''))}">${FileManager.escapeHtml(String(v ?? ''))}</td>`;
      }).join('');
      return `<tr>${vals}</tr>`;
    }).join('');
  }
};
