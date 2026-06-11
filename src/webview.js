function getWebviewContent(snippets, userSnippets) {
  const categoriesHtml = snippets.map(category => {
    const itemsHtml = category.items.map(item => `
      <div class="snippet-item">
        <button class="snippet-btn" data-code="${escapeAttr(item.code)}" title="${escapeHtml(item.description)}">
          <span class="snippet-label">${escapeHtml(item.label)}</span>
          <span class="snippet-desc">${escapeHtml(item.description)}</span>
        </button>
      </div>
    `).join('');
    return `
      <details class="category" open>
        <summary class="category-header">
          <span class="category-arrow">&#9658;</span>
          ${escapeHtml(category.category)}
          <span class="category-count">${category.items.length}</span>
        </summary>
        <div class="category-items">${itemsHtml}</div>
      </details>
    `;
  }).join('');

  const userSnippetsJson = JSON.stringify(userSnippets);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snippets</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      user-select: none;
    }

    .search-wrap {
      padding: 8px;
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, #333);
      position: sticky;
      top: 0;
      background: var(--vscode-sideBar-background);
      z-index: 10;
    }

    .search-input {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #555);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      outline: none;
    }

    .search-input:focus { border-color: var(--vscode-focusBorder); }
    .search-input::placeholder { color: var(--vscode-input-placeholderForeground); }

    .category { border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, #333); }

    .category-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      cursor: pointer;
      list-style: none;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-foreground));
      background: var(--vscode-sideBarSectionHeader-background, transparent);
      user-select: none;
    }

    .category-header::-webkit-details-marker { display: none; }
    .category-header:hover { background: var(--vscode-list-hoverBackground); }

    .category-arrow {
      font-size: 9px;
      transition: transform 0.15s;
      flex-shrink: 0;
    }

    details[open] .category-arrow { transform: rotate(90deg); }

    .category-count {
      margin-left: auto;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 10px;
      padding: 0 6px;
      font-size: 10px;
      font-weight: normal;
      flex-shrink: 0;
    }

    .add-snippet-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      padding: 0 5px;
      font-size: 16px;
      line-height: 1;
      border-radius: 3px;
      margin-left: 4px;
      flex-shrink: 0;
    }

    .add-snippet-btn:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2));
      color: var(--vscode-foreground);
    }

    .category-items { padding: 4px 0; }

    /* ── Snippet items ── */

    .snippet-item {
      padding: 1px 6px;
      position: relative;
    }

    .snippet-btn {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: background 0.1s, border-color 0.1s;
    }

    .snippet-btn:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-list-focusOutline, transparent);
    }

    .snippet-btn:active { background: var(--vscode-list-activeSelectionBackground); }

    .snippet-label {
      font-size: 12px;
      color: var(--vscode-foreground);
      font-weight: 500;
    }

    .snippet-desc {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── User snippet layout (flex row for drag handle) ── */

    .user-snippet {
      display: flex;
      align-items: center;
    }

    .user-snippet .snippet-btn {
      flex: 1;
      min-width: 0;
      width: auto;
      padding-right: 52px;
    }

    .drag-handle {
      color: var(--vscode-descriptionForeground);
      opacity: 0;
      padding: 0 4px 0 2px;
      font-size: 13px;
      flex-shrink: 0;
      align-self: center;
      line-height: 1;
    }

    .snippet-item:hover .drag-handle { opacity: 0.5; }

    .user-snippet { cursor: grab; }
    .user-snippet:active { cursor: grabbing; }
    .user-snippet .action-btn { cursor: pointer; }
    .user-snippet.dragging { cursor: grabbing; }

    /* ── Edit / Delete action buttons ── */

    .snippet-actions {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      display: none;
      gap: 2px;
      align-items: center;
    }

    .snippet-item:hover .snippet-actions { display: flex; }

    .action-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 3px;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      padding: 2px 5px;
      font-size: 12px;
      line-height: 1.2;
    }

    .action-btn:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2));
      color: var(--vscode-foreground);
    }

    .delete-btn:hover { color: var(--vscode-errorForeground, #f48771); }

    /* ── Drag and drop indicators ── */

    .user-snippet.dragging { opacity: 0.35; }

    .user-snippet.drag-above { border-top: 2px solid var(--vscode-focusBorder, #007acc); }

    .user-snippet.drag-below { border-bottom: 2px solid var(--vscode-focusBorder, #007acc); }

    .drop-zone.drag-over-zone {
      background: var(--vscode-list-hoverBackground);
      border-radius: 3px;
      min-height: 28px;
    }

    /* ── User category sub-groups ── */

    .user-cat-group {
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, rgba(128,128,128,0.15));
    }

    .user-cat-group:last-of-type { border-bottom: none; }

    .user-cat-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 8px 3px 10px;
      user-select: none;
    }

    .user-cat-name {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-cat-rename {
      opacity: 0;
      font-size: 11px;
      padding: 1px 4px;
    }

    .user-cat-header:hover .user-cat-rename { opacity: 1; }

    .user-cat-count {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 10px;
      padding: 0 5px;
      font-size: 10px;
    }

    .cat-rename-input {
      flex: 1;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-focusBorder, #007acc);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 11px;
      font-family: var(--vscode-font-family);
      outline: none;
      min-width: 0;
    }

    /* ── Add Category button ── */

    .add-cat-row { padding: 6px 8px 8px; }

    .add-cat-btn {
      width: 100%;
      background: transparent;
      border: 1px dashed var(--vscode-input-border, #555);
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      padding: 5px 10px;
      font-size: 11px;
      border-radius: 3px;
      font-family: var(--vscode-font-family);
      text-align: left;
    }

    .add-cat-btn:hover {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }

    .empty-user {
      padding: 10px 14px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-style: italic;
    }

    /* ── Category custom dropdown ── */

    .category-wrap { position: relative; }

    .category-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--vscode-dropdown-background, var(--vscode-input-background));
      border: 1px solid var(--vscode-focusBorder, #007acc);
      border-top: none;
      border-radius: 0 0 3px 3px;
      z-index: 150;
      overflow: hidden;
      display: none;
    }

    .category-option {
      padding: 6px 8px;
      font-size: 12px;
      cursor: pointer;
      color: var(--vscode-foreground);
    }

    .category-option:hover { background: var(--vscode-list-hoverBackground); }

    /* ── Modal ── */

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: 100;
      padding: 12px;
    }

    .modal {
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background, #252526));
      border: 1px solid var(--vscode-editorWidget-border, #454545);
      border-radius: 6px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
      font-size: 12px;
      font-weight: 600;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 3px;
      opacity: 0.6;
    }

    .modal-close:hover { opacity: 1; }

    .modal-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .field-label {
      display: block;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
    }

    .modal-input, .modal-textarea {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      border-radius: 3px;
      padding: 5px 8px;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      outline: none;
    }

    .modal-input:focus, .modal-textarea:focus { border-color: var(--vscode-focusBorder); }

    .modal-textarea {
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      resize: vertical;
      min-height: 100px;
    }

    .field-error {
      display: none;
      font-size: 10px;
      color: var(--vscode-errorForeground, #f48771);
      margin-top: 3px;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 10px 12px;
      border-top: 1px solid var(--vscode-editorWidget-border, #454545);
    }

    .btn {
      padding: 5px 14px;
      border-radius: 3px;
      font-size: 12px;
      cursor: pointer;
      font-family: var(--vscode-font-family);
      border: 1px solid transparent;
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, transparent);
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      border-color: var(--vscode-button-border, rgba(128,128,128,0.4));
    }

    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.1)); }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

    /* ── Toast ── */

    .toast {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--vscode-notificationToast-background, #1e1e1e);
      color: var(--vscode-notificationToast-foreground, #fff);
      border: 1px solid var(--vscode-notificationToast-border, #444);
      border-radius: 4px;
      padding: 6px 14px;
      font-size: 11px;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
      white-space: nowrap;
      z-index: 200;
    }

    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>

  <div class="search-wrap">
    <input class="search-input" type="text" id="search" placeholder="Filter snippets&hellip;" />
  </div>

  <div id="snippet-list">

    <details class="category user-category" open>
      <summary class="category-header">
        <span class="category-arrow">&#9658;</span>
        My Snippets
        <span class="category-count" id="user-count">0</span>
        <button class="add-snippet-btn" id="add-btn" title="Add snippet">+</button>
      </summary>
      <div id="user-snippets-container"></div>
    </details>

    ${categoriesHtml}

  </div>

  <div class="modal-overlay" id="modal" style="display:none" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modal-header">
        <span id="modal-title">Add Snippet</span>
        <button class="modal-close" id="modal-close" title="Close">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div>
          <span class="field-label">Label *</span>
          <input class="modal-input" id="f-label" type="text" placeholder="e.g. useState Hook" maxlength="80" />
          <span class="field-error" id="err-label">Label is required</span>
        </div>
        <div>
          <span class="field-label">Description</span>
          <input class="modal-input" id="f-desc" type="text" placeholder="Short description" maxlength="120" />
        </div>
        <div>
          <span class="field-label">Category</span>
          <div class="category-wrap">
            <input class="modal-input" id="f-category" type="text" placeholder="e.g. React, Utilities&hellip;" maxlength="60" autocomplete="off" />
            <div id="category-dropdown" class="category-dropdown"></div>
          </div>
        </div>
        <div>
          <span class="field-label">Code *</span>
          <textarea class="modal-textarea" id="f-code" placeholder="Paste your code here&hellip;" rows="7"></textarea>
          <span class="field-error" id="err-code">Code is required</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-save">Save</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script id="user-snippets-data" type="application/json">${userSnippetsJson}</script>

  <script>
    var vscode = acquireVsCodeApi();
    var userSnippets = JSON.parse(document.getElementById('user-snippets-data').textContent);
    var editingId = null;
    var dragSrcId = null;

    renderUserSnippets();

    // ── Save all snippets to extension ──

    function saveToExtension() {
      vscode.postMessage({ type: 'saveSnippets', snippets: userSnippets });
    }

    // ── Render grouped user snippets ──

    function renderUserSnippets() {
      var container = document.getElementById('user-snippets-container');
      document.getElementById('user-count').textContent = userSnippets.length;

      if (userSnippets.length === 0) {
        container.innerHTML = '<div class="empty-user">No snippets yet — click + to add one.</div>';
        reapplySearch();
        return;
      }

      var groups = {};
      var order = [];
      userSnippets.forEach(function(s) {
        var cat = (s.category && s.category.trim()) ? s.category.trim() : 'General';
        if (!groups[cat]) { groups[cat] = []; order.push(cat); }
        groups[cat].push(s);
      });

      var html = order.map(function(cat) {
        var items = groups[cat];
        var itemsHtml = items.map(snippetItemHtml).join('');
        return '<div class="user-cat-group" data-cat="' + escHtml(cat) + '">' +
          '<div class="user-cat-header">' +
          '<span class="user-cat-name" data-cat="' + escHtml(cat) + '">' + escHtml(cat) + '</span>' +
          '<button class="action-btn user-cat-rename" data-cat="' + escHtml(cat) + '" title="Rename category">✏</button>' +
          '<span class="user-cat-count">' + items.length + '</span>' +
          '</div>' +
          '<div class="user-cat-items drop-zone" data-cat="' + escHtml(cat) + '">' +
          itemsHtml +
          '</div>' +
          '</div>';
      }).join('');

      html += '<div class="add-cat-row"><button class="add-cat-btn" id="add-cat-btn">+ Add Category</button></div>';
      container.innerHTML = html;

      attachDragListeners();
      reapplySearch();
    }

    function snippetItemHtml(s) {
      var cat = (s.category && s.category.trim()) ? s.category.trim() : 'General';
      return '<div class="snippet-item user-snippet" data-id="' + escId(s.id) + '" data-cat="' + escHtml(cat) + '" draggable="true">' +
        '<span class="drag-handle" title="Drag to reorder">≡</span>' +
        '<button class="snippet-btn" data-code="' + escAttr(s.code) + '" title="' + escHtml(s.description || s.label) + '">' +
        '<span class="snippet-label">' + escHtml(s.label) + '</span>' +
        '<span class="snippet-desc">' + escHtml(s.description || '') + '</span>' +
        '</button>' +
        '<div class="snippet-actions">' +
        '<button class="action-btn edit-btn" title="Edit">✏</button>' +
        '<button class="action-btn delete-btn" title="Delete">✕</button>' +
        '</div>' +
        '</div>';
    }

    // ── Drag and drop ──

    function attachDragListeners() {
      document.querySelectorAll('#user-snippets-container .user-snippet').forEach(function(item) {
        item.addEventListener('dragstart', function(e) {
          if (e.target.closest('.action-btn')) { e.preventDefault(); return; }
          dragSrcId = this.dataset.id;
          e.dataTransfer.effectAllowed = 'move';
          var self = this;
          setTimeout(function() { self.classList.add('dragging'); }, 0);
        });

        item.addEventListener('dragend', function() {
          this.classList.remove('dragging');
          document.querySelectorAll('.drag-above, .drag-below').forEach(function(el) {
            el.classList.remove('drag-above', 'drag-below');
          });
          document.querySelectorAll('.drag-over-zone').forEach(function(el) {
            el.classList.remove('drag-over-zone');
          });
        });

        item.addEventListener('dragover', function(e) {
          if (!dragSrcId || this.dataset.id === dragSrcId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          document.querySelectorAll('.drag-above, .drag-below').forEach(function(el) {
            el.classList.remove('drag-above', 'drag-below');
          });
          var rect = this.getBoundingClientRect();
          this.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-above' : 'drag-below');
        });

        item.addEventListener('dragleave', function(e) {
          if (this.contains(e.relatedTarget)) return;
          this.classList.remove('drag-above', 'drag-below');
        });

        item.addEventListener('drop', function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.classList.remove('drag-above', 'drag-below');
          if (!dragSrcId || this.dataset.id === dragSrcId) return;

          var targetId = this.dataset.id;
          var targetCat = this.dataset.cat;
          var srcIdx = indexOfId(dragSrcId);
          var tgtIdx = indexOfId(targetId);
          if (srcIdx === -1 || tgtIdx === -1) return;

          var rect = this.getBoundingClientRect();
          var before = e.clientY < rect.top + rect.height / 2;

          var removed = userSnippets.splice(srcIdx, 1)[0];
          removed.category = targetCat || 'General';

          var newTgt = indexOfId(targetId);
          userSnippets.splice(before ? newTgt : newTgt + 1, 0, removed);

          saveToExtension();
          renderUserSnippets();
        });
      });

      document.querySelectorAll('#user-snippets-container .drop-zone').forEach(function(zone) {
        zone.addEventListener('dragover', function(e) {
          if (!dragSrcId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          this.classList.add('drag-over-zone');
        });

        zone.addEventListener('dragleave', function(e) {
          if (this.contains(e.relatedTarget)) return;
          this.classList.remove('drag-over-zone');
        });

        zone.addEventListener('drop', function(e) {
          this.classList.remove('drag-over-zone');
          if (e.target.closest('.user-snippet')) return;
          e.preventDefault();
          var targetCat = this.dataset.cat;
          if (!dragSrcId || !targetCat) return;

          var srcIdx = indexOfId(dragSrcId);
          if (srcIdx === -1) return;

          var removed = userSnippets.splice(srcIdx, 1)[0];
          removed.category = targetCat;

          var lastIdx = -1;
          userSnippets.forEach(function(s, i) {
            if ((s.category || 'General') === targetCat) lastIdx = i;
          });
          userSnippets.splice(lastIdx + 1, 0, removed);

          saveToExtension();
          renderUserSnippets();
        });
      });
    }

    function indexOfId(id) {
      for (var i = 0; i < userSnippets.length; i++) {
        if (userSnippets[i].id === id) return i;
      }
      return -1;
    }

    // ── Rename category inline ──

    function renameCategory(oldName) {
      var nameEl = document.querySelector('.user-cat-name[data-cat="' + escHtml(oldName) + '"]');
      if (!nameEl) return;

      var input = document.createElement('input');
      input.className = 'cat-rename-input';
      input.value = oldName;
      nameEl.replaceWith(input);
      input.focus();
      input.select();

      var done = false;
      function finish() {
        if (done) return;
        done = true;
        var newName = input.value.trim() || oldName;
        if (newName !== oldName) {
          userSnippets = userSnippets.map(function(s) {
            var c = (s.category && s.category.trim()) ? s.category.trim() : 'General';
            return c === oldName ? Object.assign({}, s, { category: newName }) : s;
          });
          saveToExtension();
        }
        renderUserSnippets();
      }

      input.addEventListener('blur', finish);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); finish(); }
        if (e.key === 'Escape') { input.value = oldName; finish(); }
      });
    }

    // ── Central click handler ──

    document.getElementById('snippet-list').addEventListener('click', function(e) {
      if (e.target.closest('#add-btn')) return;

      var catRename = e.target.closest('.user-cat-rename');
      if (catRename) { renameCategory(catRename.dataset.cat); return; }

      if (e.target.closest('.add-cat-btn')) { openModal(null, '', true); return; }

      var delBtn = e.target.closest('.delete-btn');
      if (delBtn) { handleDelete(delBtn.closest('.user-snippet').dataset.id); return; }

      var editBtn = e.target.closest('.edit-btn');
      if (editBtn) { openModal(editBtn.closest('.user-snippet').dataset.id); return; }

      var btn = e.target.closest('.snippet-btn');
      if (!btn) return;
      var code = btn.getAttribute('data-code');
      vscode.postMessage({ type: 'insertSnippet', code });
      showToast('Inserted: ' + btn.querySelector('.snippet-label').textContent);
    });

    // ── Add button ──

    document.getElementById('add-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      openModal(null);
    });

    // ── Modal ──

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveModal);

    document.getElementById('modal').addEventListener('mousedown', function(e) {
      if (e.target === this) closeModal();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.getElementById('modal').style.display !== 'none') {
        closeModal();
      }
    });

    document.getElementById('f-label').addEventListener('input', function() { showErr('label', false); });
    document.getElementById('f-code').addEventListener('input', function() { showErr('code', false); });

    // ── Category custom dropdown ──

    document.getElementById('f-category').addEventListener('focus', updateCategoryDropdown);
    document.getElementById('f-category').addEventListener('input', updateCategoryDropdown);
    document.getElementById('f-category').addEventListener('blur', function() {
      setTimeout(function() {
        document.getElementById('category-dropdown').style.display = 'none';
      }, 150);
    });

    function updateCategoryDropdown() {
      var input = document.getElementById('f-category');
      var dropdown = document.getElementById('category-dropdown');
      var query = input.value.toLowerCase().trim();

      var cats = [];
      userSnippets.forEach(function(s) {
        var c = (s.category && s.category.trim()) ? s.category.trim() : 'General';
        if (cats.indexOf(c) === -1) cats.push(c);
      });

      var filtered = cats.filter(function(c) {
        return !query || c.toLowerCase().indexOf(query) !== -1;
      });

      if (filtered.length === 0) { dropdown.style.display = 'none'; return; }

      dropdown.innerHTML = filtered.map(function(c) {
        return '<div class="category-option" data-value="' + escHtml(c) + '">' + escHtml(c) + '</div>';
      }).join('');

      dropdown.querySelectorAll('.category-option').forEach(function(opt) {
        opt.addEventListener('mousedown', function(e) {
          e.preventDefault();
          input.value = this.dataset.value;
          dropdown.style.display = 'none';
        });
      });

      dropdown.style.display = 'block';
    }

    document.getElementById('f-code').addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      var ta = e.target, s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.substring(0, s) + '\t' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = s + 1;
    });

    function openModal(id, prefillCat, focusCat) {
      editingId = id;
      document.getElementById('modal-title').textContent = id ? 'Edit Snippet' : 'Add Snippet';

      if (id) {
        var s = userSnippets[indexOfId(id)];
        document.getElementById('f-label').value = s.label;
        document.getElementById('f-desc').value = s.description || '';
        document.getElementById('f-category').value = (s.category || 'General');
        document.getElementById('f-code').value = s.code;
      } else {
        document.getElementById('f-label').value = '';
        document.getElementById('f-desc').value = '';
        document.getElementById('f-category').value = prefillCat || '';
        document.getElementById('f-code').value = '';
      }

      showErr('label', false);
      showErr('code', false);
      document.getElementById('modal').style.display = 'flex';
      setTimeout(function() {
        document.getElementById(focusCat ? 'f-category' : 'f-label').focus();
      }, 50);
    }

    function closeModal() {
      document.getElementById('modal').style.display = 'none';
      editingId = null;
    }

    function saveModal() {
      var label    = document.getElementById('f-label').value.trim();
      var desc     = document.getElementById('f-desc').value.trim();
      var category = document.getElementById('f-category').value.trim() || 'General';
      var code     = document.getElementById('f-code').value;
      var ok = true;
      if (!label) { showErr('label', true); ok = false; }
      if (!code.trim()) { showErr('code', true); ok = false; }
      if (!ok) return;

      if (editingId) {
        var idx = indexOfId(editingId);
        if (idx !== -1) {
          userSnippets[idx] = { id: editingId, label: label, description: desc, category: category, code: code };
        }
      } else {
        userSnippets.push({ id: Date.now().toString(), label: label, description: desc, category: category, code: code });
      }

      saveToExtension();
      renderUserSnippets();
      closeModal();
    }

    function handleDelete(id) {
      userSnippets = userSnippets.filter(function(s) { return s.id !== id; });
      saveToExtension();
      renderUserSnippets();
      showToast('Snippet deleted');
    }

    // ── Messages from extension ──

    window.addEventListener('message', function(e) {
      if (e.data.type === 'openAddForm') openModal(null);
    });

    // ── Search ──

    document.getElementById('search').addEventListener('input', function(e) {
      var q = e.target.value.toLowerCase().trim();

      document.querySelectorAll('.snippet-item').forEach(function(item) {
        if (!q) { item.style.display = ''; return; }
        var label = item.querySelector('.snippet-label').textContent.toLowerCase();
        var desc  = item.querySelector('.snippet-desc').textContent.toLowerCase();
        item.style.display = (label.indexOf(q) !== -1 || desc.indexOf(q) !== -1) ? '' : 'none';
      });

      document.querySelectorAll('details.category').forEach(function(d) { if (q) d.open = true; });

      document.querySelectorAll('.category').forEach(function(cat) {
        if (!q) { cat.style.display = ''; return; }
        var visible = Array.prototype.some.call(cat.querySelectorAll('.snippet-item'), function(i) {
          return i.style.display !== 'none';
        });
        cat.style.display = visible ? '' : 'none';
      });

      document.querySelectorAll('.user-cat-group').forEach(function(g) {
        if (!q) { g.style.display = ''; return; }
        var visible = Array.prototype.some.call(g.querySelectorAll('.snippet-item'), function(i) {
          return i.style.display !== 'none';
        });
        g.style.display = visible ? '' : 'none';
      });
    });

    function reapplySearch() {
      var q = document.getElementById('search').value.toLowerCase().trim();
      if (!q) return;
      document.querySelectorAll('#user-snippets-container .snippet-item').forEach(function(item) {
        var label = item.querySelector('.snippet-label').textContent.toLowerCase();
        var desc  = item.querySelector('.snippet-desc').textContent.toLowerCase();
        item.style.display = (label.indexOf(q) !== -1 || desc.indexOf(q) !== -1) ? '' : 'none';
      });
    }

    // ── Toast ──

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 1800);
    }

    // ── Helpers ──

    function showErr(field, show) {
      document.getElementById('err-' + field).style.display = show ? 'block' : 'none';
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function escAttr(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/\\n/g, '&#10;')
        .replace(/\\r/g, '&#13;');
    }

    function escId(str) {
      return String(str).replace(/[^a-zA-Z0-9_-]/g, '');
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');
}

module.exports = { getWebviewContent };
