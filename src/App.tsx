import SimulatorScreen from './screens/SimulatorScreen'

export default function App() {
  return (
    <div className="flex h-dvh flex-col bg-slate-900 text-slate-100">
      <header className="flex h-12 items-center border-b border-slate-700 px-4 font-bold">
        TrackeyBoard DD
      </header>
      <main className="flex-1 overflow-hidden">
        <SimulatorScreen />
      </main>
    </div>
  )
}
