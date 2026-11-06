import { memo } from 'react'
import { Download } from 'lucide-react'
import {
  countDrawings,
  countMaterials,
  formatSize,
  isMixedTechnology,
  sectionFacts,
  type CatalogItem,
  type Section,
} from '../catalog'
import type { ViewMode } from './ResultsBar'
import SheetCard from './SheetCard'
import SheetTable from './SheetTable'

type Props = {
  section: Section
  items: CatalogItem[]
  view: ViewMode
}

function SectionBlock({ section, items, view }: Props) {
  const isMaterials = section.kind === 'materials'
  const facts = isMaterials ? [] : sectionFacts(section)
  const showTechnology = isMixedTechnology(section)

  return (
    <section id={section.slug} aria-labelledby={`${section.slug}-title`} className="scroll-mt-32 pt-10 lg:scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id={`${section.slug}-title`} className="type-heading">
            {section.label}
          </h2>
          <p className="type-label mt-1 text-muted">
            {isMaterials ? countMaterials(items.length) : countDrawings(items.length)}
            {items.length !== section.items.length && ` z ${section.items.length}`}
          </p>
        </div>
        {section.bundle && (
          <a
            href={section.bundle.pdf}
            download={section.bundle.file}
            className="type-action flex items-center gap-2 bg-brand px-4 py-3 text-white hover:bg-brand-deep"
          >
            <Download aria-hidden className="size-4" />
            Stáhnout celou sadu, {formatSize(section.bundle.size)}
          </a>
        )}
      </div>

      {facts.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 border border-line bg-white sm:flex">
          {facts.map((fact) => (
            <div key={fact.label} className="border-line px-4 py-2.5 not-last:border-r max-sm:border-b sm:min-w-[140px]">
              <dt className="type-label text-muted">{fact.label}</dt>
              <dd className="tabular type-action mt-0.5">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {view === 'grid' ? (
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-x-5">
          {items.map((item) => (
            <li key={item.id}>
              <SheetCard item={item} showTechnology={showTechnology} />
            </li>
          ))}
        </ul>
      ) : (
        <SheetTable items={items} isMaterials={isMaterials} />
      )}
    </section>
  )
}

export default memo(SectionBlock)
