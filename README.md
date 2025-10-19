# IdeaFlow

A minimal, focused concept mapping tool for personal use. Built on top of tldraw, this editor restricts functionality to only the essentials: text nodes, frames, and arrows.

## Features

- **Minimal toolset**: Only text, frames, and arrows - no distractions
- **Smart arrows**: Arrows can only connect to text or frames, and automatically delete if not properly connected
- **Instant text creation**: Press `t` to create text at cursor position and start typing immediately
- **Keyboard-first workflow**: Common operations accessible via keyboard shortcuts
- **File operations**: Save/load diagrams as JSON files, or export to Graphviz DOT format
- **Auto-persistence**: Diagrams automatically save to browser storage
- **Compact sizing**: Reduced default font and stroke sizes for denser concept maps

## Usage

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Keyboard Shortcuts

- `t` - Create text at cursor position
- `Cmd/Ctrl + N` - New diagram (clears canvas)
- `Cmd/Ctrl + S` - Save diagram as file
- `Cmd/Ctrl + O` - Load diagram from file
- `Cmd/Ctrl + E` - Export as Graphviz DOT

## Tech Stack

- React 19 + TypeScript
- tldraw 3.15.5
- Vite 7

## Personal Project

This is a personal tool designed for quick concept mapping and idea organization. The constrained feature set is intentional - keeping only what's essential for connecting ideas.
