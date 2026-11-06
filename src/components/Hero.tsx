import { allItems, latestDate, sections, walls } from '../catalog'

function WallRow({ source, offset }: { source: string; offset?: boolean }) {
  return (
    <div className={`wall-row ${offset ? 'wall-row-offset' : ''}`}>
      <img src={source} alt="" width={3872} height={320} decoding="async" />
    </div>
  )
}

export default function Hero() {
  const drawings = sections.filter((section) => section.kind === 'drawings')
  const drawingCount = drawings.reduce((sum, section) => sum + section.items.length, 0)
  const bundleCount = drawings.filter((section) => section.bundle).length
  const materialCount = allItems.length - drawingCount
  const facts = [
    { label: 'Výkresů', value: drawingCount },
    { label: 'Souhrnných sad', value: bundleCount },
    { label: 'Učebních materiálů', value: materialCount },
    { label: 'Nejnovější výkres', value: latestDate(allItems) },
  ]

  return (
    <section className="relative overflow-hidden bg-brand">
      <div aria-hidden className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col gap-4">
        {walls.map((wall, index) => (
          <WallRow key={wall} source={wall} offset={index % 2 === 1} />
        ))}
      </div>
      <div className="relative mx-auto flex w-full max-w-[1560px] items-center px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[600px] lg:px-8">
        <div className="w-full max-w-[640px] border border-ink bg-white shadow-[0_24px_48px_rgb(0_30_60/0.42)]">
          <div className="flex items-center justify-center gap-3 border-b border-ink px-5 py-3">
            <img src="/brand/mark.png" alt="" width={256} height={256} className="size-9" />
            <span className="text-[20px] leading-tight font-medium">Odborný výcvik</span>
          </div>
          <div className="border-b border-ink px-5 pt-3 pb-5 sm:px-6">
            <p className="type-label text-muted">Název:</p>
            <h1 className="type-title mt-1">Databáze výkresů</h1>
            <p className="type-lead mt-4 max-w-[52ch]">
              Všechny výkresy z odborného výcviku na jednom místě. Prohlédněte si je, najděte podle závitu nebo materiálu
              a stáhněte PDF.
            </p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-[0.8fr_1.2fr_1.4fr_1.3fr]">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="border-ink px-5 py-3 max-sm:odd:border-r max-sm:nth-[-n+2]:border-b sm:px-4 sm:not-last:border-r"
              >
                <dt className="type-label text-muted">{fact.label}</dt>
                <dd className="tabular mt-1 text-[18px] leading-tight font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
