export default function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-slate-500">
      <h2 className="text-lg font-bold text-slate-700">{title}</h2>
      <p>{phase}で実装予定です</p>
    </div>
  )
}
