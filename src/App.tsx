import { Tldraw } from 'tldraw'
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

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        assetUrls={customAssetUrls}
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
