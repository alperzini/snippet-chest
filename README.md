# SnippetChest

A VS Code sidebar extension for storing, organizing, and instantly inserting your personal code snippets — right from the activity bar.

---

## Features

- **One-click insert** — click any snippet to paste it at your cursor
- **Add from selection** — highlight code, right-click, and choose *Add to SnippetChest...* to save it instantly
- **Categories** — organize snippets into named groups; create empty categories without needing a snippet first
- **Drag and drop** — reorder snippets or move them between categories by dragging
- **Inline rename** — click the pencil icon on any category header to rename it in place
- **Collapse / expand** — click the arrow on a category header to hide or show its snippets
- **Search** — filter across all snippets by label in real time
- **Edit & delete** — hover over any snippet to reveal edit (✏) and delete (✕) buttons
- **Persistent storage** — snippets are saved to VS Code's global storage and survive restarts
- **Export & import** — save your snippets to a `.json` file to share with teammates; load a file to merge snippets in (duplicates are skipped automatically)

---

## Getting Started (Dev Mode)

1. Open the `snippet-sidebar` folder in VS Code
2. Press **F5** to launch an Extension Development Host window
3. In the new window, click the **SnippetChest icon** in the Activity Bar
4. The panel opens — you're ready to go

To reload after making changes, press **F5** again (full restart) or **Cmd+R** inside the Extension Development Host window for a lighter refresh.

---

## Adding Snippets

### From the panel
Click the **+** button in the *My Snippets* header to open the Add Snippet form. Fill in:
- **Label** (required) — the name shown in the list
- **Description** (optional) — shown as a subtitle
- **Category** — choose an existing one from the dropdown or type a new name
- **Code** (required) — paste your snippet; Tab key inserts a tab character

### From the editor
1. Select any code block in an open file
2. Right-click → **Add to SnippetChest...**
3. The panel opens with the selected code pre-filled in the Code field
4. Fill in Label and Category, then save

---

## Categories

- Click **+ Add Category** at the bottom of the panel to create an empty category
- Type the name and press **Enter** (or **Escape** to cancel)
- Empty categories show a subtle hint and an **✕** button to remove them
- Rename a category by clicking the **✏** icon in its header — all snippets in it update automatically
- Collapse or expand a category by clicking the **▼ / ▶** arrow in its header

---

## Export & Import

### Save Snippets
Click **Save Snippets** at the bottom of the panel. A file picker opens — choose where to save the `.json` file.

### Load Snippets
Click **Load Snippets**, pick a `.json` file, and any snippets not already present will be added. Snippets that match an existing one (same label, category, and code) are silently skipped.

The export format is a plain JSON array, human-readable and easy to share:

```json
[
  {
    "label": "Async fetch",
    "description": "Fetch with error handling",
    "category": "JavaScript",
    "code": "const res = await fetch(url);\nconst data = await res.json();"
  }
]
```

---

## Packaging for Distribution (optional)

```bash
npx @vscode/vsce package
# Produces: snippet-sidebar-0.0.1.vsix
# Install:  code --install-extension snippet-sidebar-0.0.1.vsix
```

> No global install needed — `npx` handles it automatically.

---

## Tips

- Use **Tab** inside the Code field to indent without leaving the form
- The search bar filters by label across all categories in real time
- Drag a snippet on top of another to reorder; drag across category headers to move it to a different group
- Collapsed state is remembered within a session but resets on reload
