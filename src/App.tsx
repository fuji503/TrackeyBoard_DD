import type { ComponentType } from 'react'
import AppHeader from './components/AppHeader'
import { useHashScreen, type ScreenId } from './hooks/useHashScreen'
import ChangelogScreen from './screens/ChangelogScreen'
import ExportImportScreen from './screens/ExportImportScreen'
import HelpScreen from './screens/HelpScreen'
import KeyboardEditorScreen from './screens/KeyboardEditorScreen'
import SimulatorScreen from './screens/SimulatorScreen'
import AppStateProvider from './state/AppStateProvider'

/** onNavigate: 画面内のリンクから別の画面へ移る（使い方ページで使用） */
const SCREEN_COMPONENTS: Record<ScreenId, ComponentType<{ onNavigate: (id: ScreenId) => void }>> = {
  simulator: SimulatorScreen,
  editor: KeyboardEditorScreen,
  io: ExportImportScreen,
  help: HelpScreen,
  changelog: ChangelogScreen,
}

export default function App() {
  const [screen, setScreen] = useHashScreen()
  const Screen = SCREEN_COMPONENTS[screen]

  return (
    <AppStateProvider>
      <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
        <AppHeader screen={screen} onSelect={setScreen} />
        {/* 画面を切り替えたらスクロール位置を先頭に戻す */}
        <main key={screen} className="min-h-0 flex-1 overflow-auto">
          <Screen onNavigate={setScreen} />
        </main>
      </div>
    </AppStateProvider>
  )
}
