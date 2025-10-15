import type { Editor } from 'tldraw'

/**
 * 현재 다이어그램을 JSON 파일로 다운로드
 */
export function exportDiagram(editor: Editor) {
  // 현재 에디터의 전체 상태를 가져옴
  const snapshot = editor.store.getSnapshot()
  const jsonContent = JSON.stringify(snapshot, null, 2)

  // Blob 생성 및 다운로드
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `diagram-${new Date().toISOString().slice(0, 10)}.tldraw`
  link.click()

  // 메모리 정리
  URL.revokeObjectURL(url)
}

/**
 * JSON 파일에서 다이어그램 불러오기
 */
export function importDiagram(editor: Editor) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.tldraw,application/json'

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const snapshot = JSON.parse(text)

      // 에디터에 스냅샷 로드
      editor.store.loadSnapshot(snapshot)

      // 콘텐츠 중앙으로 이동 (줌 레벨 유지)
      const shapes = editor.getCurrentPageShapes()
      if (shapes.length > 0) {
        const bounds = editor.getCurrentPageBounds()
        if (bounds) {
          editor.centerOnPoint(bounds.center, { animation: { duration: 300 } })
        }
      }
    } catch (error) {
      console.error('Failed to load diagram:', error)
      alert('Failed to load diagram file. Please check if the file is valid.')
    }
  }

  input.click()
}

/**
 * 모든 shape을 삭제하여 새 다이어그램 시작
 */
export function newDiagram(editor: Editor) {
  const confirmed = confirm('Create a new diagram? Current diagram will be cleared.')
  if (!confirmed) return

  // 현재 페이지의 모든 shape 가져오기
  const shapes = editor.getCurrentPageShapes()

  // 모든 shape 삭제
  editor.deleteShapes(shapes.map((s) => s.id))

  // 뷰포트 초기화
  editor.resetZoom()
}
