# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based diagram editor built on top of tldraw (v4.0.3). The application is a minimal, focused concept mapping tool that restricts functionality to only Text, Frame, and Arrow shapes.

## Development Commands

```bash
# Start development server
npm run dev

# Type check and build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Technology Stack
- **Framework**: React 19.1 with Vite 7.1
- **Diagram Library**: tldraw 4.0.3
- **Language**: TypeScript 5.9

### Application Structure
The app has a minimal structure:
- `src/main.tsx`: Entry point with React root rendering
- `src/App.tsx`: Main application component containing all tldraw customization logic
- `src/utils/exportDot.ts`: Graphviz DOT format export utility

### Key Customizations in App.tsx

#### 1. Custom Arrow Shape Utility (lines 15-21)
The `CustomArrowShapeUtil` extends tldraw's `ArrowShapeUtil` to restrict arrow binding:
- Arrows can ONLY connect to `text` or `frame` shape types
- This is enforced in the `canBind()` override method

#### 2. Arrow Validation System (lines 27-67)
The `setupArrowValidation()` function enforces strict arrow connectivity rules:
- Tracks arrows during creation using a Set (`creatingArrows`)
- Listens to pointer_up events to detect when arrow drawing completes
- Validates that both start and end bindings exist
- **Automatically deletes arrows** that don't have both endpoints connected to valid shapes (text/frame)
- Uses tldraw's `sideEffects.registerAfterCreateHandler` and event system

#### 3. Text Shortcut (lines 69-114)
The `setupTextShortcut()` function enables instant text creation at cursor position:
- Press `t` key (physical key, works with both English and Korean keyboard layouts)
- Creates text shape at current mouse cursor position
- Immediately enters edit mode for typing
- Uses `e.code === 'KeyT'` for language-agnostic detection
- Skips when focus is on input fields

#### 4. Tool Restrictions (lines 119-130)
The `overrides.tools` configuration limits available tools to:
- `select`: Selection tool
- `hand`: Pan/hand tool
- `arrow`: Arrow drawing tool
- `text`: Text creation tool
- `frame`: Frame creation tool

All other default tldraw tools (geo shapes, draw, note, etc.) are removed.

#### 5. DOT Export Feature (lines 131-157)
Custom action and menu integration for exporting diagrams to Graphviz DOT format:
- Added to hamburger menu as "Export as DOT"
- Keyboard shortcut: `Cmd+E` (Mac) / `Ctrl+E` (Windows/Linux)
- Exports text nodes and arrow connections as directed graph
- Implementation in `src/utils/exportDot.ts`
- Downloads as `.dot` file for use with Graphviz

#### 6. Custom Font Configuration (lines 6-13)
Uses Korean font "RIDIBatang" from CDN for all draw font variants instead of default fonts.

#### 7. Persistence (line 164)
The `persistenceKey="ideaflow-v1"` prop enables automatic persistence:
- Saves diagram state to browser's IndexedDB
- Automatically restores content on page reload
- Supports cross-tab synchronization

### Important Implementation Details

- **Arrow deletion logic**: When an arrow is drawn without valid start/end bindings to text or frame shapes, it's deleted immediately after pointer_up. This prevents orphaned arrows from persisting.
- **Shape utils must be defined outside component**: The `customShapeUtils` array is defined at module level to prevent recreation on each render.
- **Editor instance access**: Arrow validation is set up in the `onMount` callback, which provides access to the tldraw `Editor` instance.

## TypeScript Configuration

The project uses project references with separate configs:
- `tsconfig.json`: Root configuration with references
- `tsconfig.app.json`: Application code configuration
- `tsconfig.node.json`: Node/build tooling configuration

## Extending the Application

When modifying this application:
1. Maintain the minimal tool set philosophy - only add tools if absolutely necessary
2. Any new shape types must be explicitly added to `CustomArrowShapeUtil.canBind()` if arrows should connect to them
3. Tool additions require updating the `allowedTools` array in overrides
4. Consider that this is a concept mapping tool - features should support connecting ideas (text/frames) with relationships (arrows)
