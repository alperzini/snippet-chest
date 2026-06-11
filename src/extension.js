const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const SNIPPETS = require('./snippets');
const { getWebviewContent } = require('./webview');

class SnippetsStorage {
  constructor(globalStoragePath) {
    this._filePath = path.join(globalStoragePath, 'user-snippets.json');
    this._snippets = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this._filePath)) {
        return JSON.parse(fs.readFileSync(this._filePath, 'utf8'));
      }
    } catch {}
    return [];
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this._filePath), { recursive: true });
      fs.writeFileSync(this._filePath, JSON.stringify(this._snippets, null, 2));
    } catch (err) {
      vscode.window.showErrorMessage('Snippet Sidebar: failed to save — ' + err.message);
    }
  }

  getAll() { return this._snippets; }

  setAll(snippets) {
    this._snippets = snippets;
    this._save();
  }
}

function activate(context) {
  const storage = new SnippetsStorage(context.globalStorageUri.fsPath);
  const provider = new SnippetSidebarProvider(context.extensionUri, storage);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('snippetPanel', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snippetSidebar.refresh', () => provider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snippetSidebar.addSnippet', () => provider.openAddForm())
  );
}

class SnippetSidebarProvider {
  constructor(extensionUri, storage) {
    this._extensionUri = extensionUri;
    this._storage = storage;
    this._view = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getWebviewContent(SNIPPETS, this._storage.getAll());

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'insertSnippet':
          this._insertSnippet(message.code);
          break;
        case 'saveSnippets':
          this._storage.setAll(message.snippets);
          break;
      }
    });
  }

  refresh() {
    if (this._view) {
      this._view.webview.html = getWebviewContent(SNIPPETS, this._storage.getAll());
    }
  }

  openAddForm() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'openAddForm' });
    }
  }

  _insertSnippet(code) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor — open a file first!');
      return;
    }
    editor.insertSnippet(new vscode.SnippetString(code));
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
