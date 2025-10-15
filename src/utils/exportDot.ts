import type { Editor } from 'tldraw'

/**
 * Export the current diagram to Graphviz DOT format
 * Focuses on Text and Arrow shapes, with optional Frame support as subgraphs
 */
export function exportToDot(editor: Editor): string {
  // Get all shapes on current page
  const shapes = editor.getCurrentPageShapes()

  // Filter text and frame shapes
  const textShapes = shapes.filter(shape => shape.type === 'text')
  // const frameShapes = shapes.filter(shape => shape.type === 'frame') // TODO: support subgraphs

  // Get all arrow bindings
  const arrowShapes = shapes.filter(shape => shape.type === 'arrow')

  // Build DOT format
  let dot = 'digraph IdeaFlow {\n'
  dot += '  // Graph settings\n'
  dot += '  rankdir=TB;\n'
  dot += '  node [shape=box, style=rounded];\n'
  dot += '  \n'

  // Helper function to create a slug from text
  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .substring(0, 30) // Limit length
  }

  // Create a map of shape IDs to node IDs
  const shapeToNodeId = new Map<string, string>()

  // Add text nodes
  dot += '  // Text nodes\n'
  textShapes.forEach((shape) => {
    // Extract text from richText structure
    const richText = (shape.props as any).richText
    let textContent = ''

    if (richText && richText.content && Array.isArray(richText.content)) {
      // Extract text from richText content array
      textContent = richText.content
        .map((paragraph: any) => {
          if (paragraph.content && Array.isArray(paragraph.content)) {
            return paragraph.content
              .map((textNode: any) => textNode.text || '')
              .join('')
          }
          return ''
        })
        .join('\n')
    }

    // Create node ID from slug + short ID
    const slug = createSlug(textContent) || 'node'
    // Extract just the unique part after 'shape:' prefix
    const idPart = shape.id.includes(':') ? shape.id.split(':')[1] : shape.id
    const shortId = idPart
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters like dashes
      .substring(0, 4) // Use first 4 alphanumeric characters
    const nodeId = `${slug}_${shortId}`

    shapeToNodeId.set(shape.id, nodeId)

    // Escape quotes and newlines for DOT format
    const escapedText = textContent
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')

    dot += `  ${nodeId} [label="${escapedText}"];\n`
  })

  dot += '  \n'

  // Add arrows as edges
  dot += '  // Edges\n'
  arrowShapes.forEach(arrow => {
    const bindings = editor.getBindingsFromShape(arrow, 'arrow')
    const startBinding = bindings.find((b: any) => b.props.terminal === 'start')
    const endBinding = bindings.find((b: any) => b.props.terminal === 'end')

    if (startBinding && endBinding) {
      const fromNodeId = shapeToNodeId.get(startBinding.toId)
      const toNodeId = shapeToNodeId.get(endBinding.toId)

      if (fromNodeId && toNodeId) {
        // Extract arrow label text from richText if it exists
        const richText = (arrow.props as any).richText
        let arrowText = ''

        if (richText && richText.content && Array.isArray(richText.content)) {
          arrowText = richText.content
            .map((paragraph: any) => {
              if (paragraph.content && Array.isArray(paragraph.content)) {
                return paragraph.content
                  .map((textNode: any) => textNode.text || '')
                  .join('')
              }
              return ''
            })
            .join('\n')
        }

        if (arrowText) {
          // Escape quotes and newlines for DOT format
          const escapedLabel = arrowText
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')

          dot += `  ${fromNodeId} -> ${toNodeId} [label="${escapedLabel}"];\n`
        } else {
          dot += `  ${fromNodeId} -> ${toNodeId};\n`
        }
      }
    }
  })

  dot += '}\n'

  return dot
}

/**
 * Download the DOT content as a .dot file
 */
export function downloadDotFile(content: string, filename: string = 'ideaflow.dot'): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  // Cleanup
  URL.revokeObjectURL(url)
}
