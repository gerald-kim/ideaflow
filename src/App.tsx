import {
  Tldraw,
  ArrowShapeUtil,
  TextShapeUtil,
  Editor,
  createShapeId,
  DefaultMainMenu,
  DefaultMainMenuContent,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  useEditor,
} from 'tldraw'
import type { TLTextShape, TLShapeId } from '@tldraw/tlschema'
import 'tldraw/tldraw.css'
import { exportToDot, downloadDotFile } from './utils/exportDot'

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

// 커스텀 TextShapeUtil: resize 비활성화
class CustomTextShapeUtil extends TextShapeUtil {
  override canResize(): boolean {
    return false
  }
}

// 커스텀 shape utils
const customShapeUtils = [CustomArrowShapeUtil, CustomTextShapeUtil]

// Arrow 검증: Text/Frame에만 연결 가능하도록 제한
function setupArrowValidation(editor: Editor) {
  const creatingArrows = new Set<TLShapeId>() // 현재 생성 중인 arrow ID들
  let isDrawing = false

  const validateArrow = (arrowId: TLShapeId) => {
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

      // 먼저 클릭 위치에 텍스트 shape 생성
      editor.createShape<TLTextShape>({
        id,
        type: 'text',
        x: currentPagePoint.x,
        y: currentPagePoint.y,
      })

      // 생성된 shape의 실제 bounds를 가져와서 높이의 절반만큼 위로 이동 (tldraw 방식)
      const shape = editor.getShape<TLTextShape>(id)
      if (shape) {
        const bounds = editor.getShapePageBounds(shape)
        if (bounds) {
          editor.updateShape({
            ...shape,
            x: shape.x,
            y: shape.y - bounds.height / 2,
          })
        }
      }

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

// Custom Main Menu component with DOT export
function CustomMainMenu() {
  const editor = useEditor()

  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="export-dot-group">
        <TldrawUiMenuItem
          id="export-dot"
          label="Export as DOT"
          icon="external-link"
          readonlyOk
          onSelect={() => {
            const dotContent = exportToDot(editor)
            downloadDotFile(dotContent)
          }}
        />
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  )
}

// Custom overrides for tldraw UI
const uiOverrides = {
  tools: (_editor: Editor, tools: any) => {
    // Select, Hand, Arrow, Text, Frame만 남기고 나머지 제거
    const allowedTools = ['select', 'hand', 'arrow', 'text', 'frame']

    Object.keys(tools).forEach((toolId) => {
      if (!allowedTools.includes(toolId)) {
        delete tools[toolId]
      }
    })

    return tools
  },
}

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        persistenceKey="ideaflow-v3"
        assetUrls={customAssetUrls}
        shapeUtils={customShapeUtils}
        onMount={(editor) => {
          // Arrow 검증 설정
          setupArrowValidation(editor)
          // 't' 키 단축키 설정
          setupTextShortcut(editor)
        }}
        overrides={uiOverrides}
        components={{
          MainMenu: CustomMainMenu,
        }}
      />
    </div>
  )
}

export default App
