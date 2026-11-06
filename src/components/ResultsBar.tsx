import { LayoutGrid, Rows3 } from 'lucide-react'
import { countDrawings, countMaterials, type CatalogItem, type TechnologyFilter } from '../catalog'

export type ViewMode = 'grid' | 'table'

type Props = {
  items: CatalogItem[]
  technology: TechnologyFilter
  onTechnologyChange: (value: TechnologyFilter) => void
  view: ViewMode
  onViewChange: (value: ViewMode) => void
}

const filters: { value: TechnologyFilter; label: string }[] = [
  { value: 'all', label: 'Vše' },
  { value: 'turning', label: 'Soustružení' },
  { value: 'milling', label: 'Frézování' },
  { value: 'assembly', label: 'Sestavy' },
  { value: 'material', label: 'Materiály' },
]

const views: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'grid', label: 'Mřížka', icon: LayoutGrid },
  { value: 'table', label: 'Tabulka', icon: Rows3 },
]

export default function ResultsBar({ items, technology, onTechnologyChange, view, onViewChange }: Props) {
  const materials = items.filter((item) => item.technology === 'material').length
  const drawings = items.length - materials
  const summary = [drawings ? countDrawings(drawings) : '', materials ? countMaterials(materials) : '']
    .filter(Boolean)
    .join(' a ')

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
      <p aria-live="polite" className="type-action">
        {summary ? `Zobrazeno ${summary}` : 'Žádný výsledek'}
      </p>
      <div className="flex max-w-full min-w-0 flex-wrap items-center gap-3">
        <fieldset className="no-scrollbar flex max-w-full min-w-0 overflow-x-auto border border-line bg-white">
          <legend className="sr-only">Technologie</legend>
          {filters.map((filter) => (
            <label
              key={filter.value}
              className={`type-action cursor-pointer px-3.5 py-2.5 whitespace-nowrap has-focus-visible:outline-3 has-focus-visible:outline-spark ${
                technology === filter.value ? 'bg-ink text-white' : 'text-ink hover:bg-table'
              }`}
            >
              <input
                type="radio"
                name="technology"
                value={filter.value}
                checked={technology === filter.value}
                onChange={() => onTechnologyChange(filter.value)}
                className="sr-only"
              />
              {filter.label}
            </label>
          ))}
        </fieldset>
        <div role="group" aria-label="Zobrazení" className="flex border border-line bg-white">
          {views.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
              className={`type-action flex cursor-pointer items-center gap-2 px-3.5 py-2.5 ${
                view === value ? 'bg-ink text-white' : 'text-ink hover:bg-table'
              }`}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
