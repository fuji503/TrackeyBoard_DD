import type { ComponentType } from 'react'
import AppHeader from './components/AppHeader'
import { useHashScreen, type ScreenId } from './hooks/useHashScreen'
import ExportImportScreen from './screens/ExportImportScreen'
import KeyboardEditorScreen from './screens/KeyboardEditorScreen'
import SimulatorScreen from './screens/SimulatorScreen'
import TrackpointScreen from './screens/TrackpointScreen'
import AppStateProvider from './state/AppStateProvider'

const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  simulator: SimulatorScreen,
  editor: KeyboardEditorScreen,
  trackpoint: TrackpointScreen,
  io: ExportImportScreen,
}

export default function App() {
  const [screen, setScreen] = useHashScreen()
  const Screen = SCREEN_COMPONENTS[screen]

  return (
    <AppStateProvider>
      <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
        <AppHeader screen={screen} onSelect={setScreen} />
        <main className="min-h-0 flex-1 overflow-auto">
          <Screen />
        </main>
      </div>
    </AppStateProvider>
  )
}
