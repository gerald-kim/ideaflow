import { Tldraw, ArrowShapeUtil, Editor, createShapeId } from 'tldraw'
import type { TLTextShape } from '@tldraw/tlschema'
import 'tldraw/tldraw.css'

// assetUrls를 컴포넌트 외부에 정의 (리렌더링 방지)
const customAssetUrls = {
  fonts: {
    tldraw_draw: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff',
    tldraw_draw_bold: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff',
    tldraw_draw_italic: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff',
    tldraw_draw_italic_bold: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff',
  },
}

// 커스텀 ArrowShapeUtil: Text와 Frame에만 연결 가능
class CustomArrowShapeUtil extends ArrowShapeUtil {
  override canBind({ toShapeType }: any): boolean {
    // Text와 Frame shape에만 연결 허용
    return toShapeType === 'text' || toShapeType === 'frame'
  }
}

// 커스텀 shape utils
const customShapeUtils = [CustomArrowShapeUtil]

// Arrow 검증: Text/Frame에만 연결 가능하도록 제한
function setupArrowValidation(editor: Editor) {
  const creatingArrows = new Set<string>() // 현재 생성 중인 arrow ID들
  let isDrawing = false

  const validateArrow = (arrowId: string) => {
    const arrow = editor.getShape(arrowId)
    if (!arrow || arrow.type !== 'arrow') return

    const bindings = editor.getBindingsFromShape(arrow, 'arrow')
    const startBinding = bindings.find((b: any) => b.props.terminal === 'start')
    const endBinding = bindings.find((b: any) => b.props.terminal === 'end')

    // canBind가 Text/Frame만 허용하므로, binding 존재 여부만 확인
    if (!startBinding || !endBinding) {
      editor.deleteShape(arrow.id)
    }
  }

  // arrow shape 생성 시 추적 시작
  editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
    if (shape.type !== 'arrow') return
    creatingArrows.add(shape.id)
    isDrawing = true
  })

  // Pointer up 이벤트 감지 - 드래그 완료 시점
  editor.on('event', (event) => {
    if (event.type === 'pointer' && event.name === 'pointer_up') {
      // Arrow 그리기 중이었으면 검증
      if (isDrawing && creatingArrows.size > 0) {
        // 모든 pending arrow 검증
        creatingArrows.forEach((arrowId) => {
          validateArrow(arrowId)
        })

        creatingArrows.clear()
        isDrawing = false
      }
    }
  })
}

// 't' 키로 커서 위치에 텍스트 즉시 생성
function setupTextShortcut(editor: Editor) {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 't' 키가 눌렸고 (KeyT는 물리적 키 위치로 한글/영문 모두 동작), 수식키가 눌리지 않았으며, 입력 요소에 포커스되어 있지 않을 때
    if (e.code === 'KeyT' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return // 입력 필드에서는 기본 동작 유지
      }

      e.preventDefault()
      e.stopPropagation()

      // 현재 마우스 커서 위치 가져오기
      const { currentPagePoint } = editor.inputs

      // 새 텍스트 shape ID 생성
      const id = createShapeId()

      // 커서 위치에 텍스트 shape 생성
      editor.createShape<TLTextShape>({
        id,
        type: 'text',
        x: currentPagePoint.x,
        y: currentPagePoint.y,
      })

      // 생성된 텍스트를 선택하고 편집 모드로 전환
      editor.select(id)
      editor.setEditingShape(id)
      editor.setCurrentTool('select')
    }
  }

  // 키보드 이벤트 리스너 등록 (capture phase에서 먼저 처리)
  window.addEventListener('keydown', handleKeyDown, true)

  // cleanup 함수 반환
  return () => {
    window.removeEventListener('keydown', handleKeyDown, true)
  }
}

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        assetUrls={customAssetUrls}
        shapeUtils={customShapeUtils}
        onMount={(editor) => {
          // Arrow 검증 설정
          setupArrowValidation(editor)
          // 't' 키 단축키 설정
          setupTextShortcut(editor)
        }}
        overrides={{
          tools: (_editor, tools) => {
            // Select, Hand, Arrow, Text, Frame만 남기고 나머지 제거
            const allowedTools = ['select', 'hand', 'arrow', 'text', 'frame']

            Object.keys(tools).forEach((toolId) => {
              if (!allowedTools.includes(toolId)) {
                delete tools[toolId]
              }
            })

            return tools
          },
        }}
      />
    </div>
  )
}

export default App
