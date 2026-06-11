# Snippet Sidebar

A Photoshop-style sidebar panel for VS Code — click any button to instantly insert a code snippet at your cursor.

---

## How to Install (Dev Mode)

1. Copy the `snippet-sidebar` folder anywhere on your machine
2. Open it in VS Code: `File > Open Folder`
3. Press **F5** to launch an Extension Development Host window
4. In the new window, click the **`</>` icon** in the Activity Bar (left sidebar)
5. Your snippet panel appears — click any snippet to insert it!

## How to Add Your Own Snippets

Open `src/snippets.js` and add to any category, or create a new one:

```js
{
  category: "My Category",
  items: [
    {
      label: "My Snippet",
      description: "What it does",
      code: `const example = () => {\n\t// your code here\n};`
    }
  ]
}
```

Use `\n` for newlines and `\t` for tabs in code strings.

After editing, click the **refresh icon (↺)** at the top of the panel.

## Packaging as a real .vsix (optional)

```bash
npm install -g @vscode/vsce
cd snippet-sidebar
vsce package
# Produces: snippet-sidebar-0.0.1.vsix
# Install: code --install-extension snippet-sidebar-0.0.1.vsix
```

## What's included

- **React**: Destructure Props, useState, useEffect, useRef, Custom Hook, Context Provider
- **JavaScript**: Array Destructure, Object Spread, Optional Chaining, Async/Await, Array Methods, Promise.all
- **CSS / Tailwind**: Flex Center, CSS Grid, Tailwind Card
- **Node / Express**: Express Route, Middleware

## Tips

- Use the **search bar** to filter across all categories
- Hover over a button to see the full description
- The panel works like a Photoshop panel — collapsible sections, always visible
