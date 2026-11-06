import { Download } from 'lucide-react'
import { countPages, technologyLabels, type CatalogItem } from '../catalog'

const technologyColors = {
  turning: 'text-brand',
  milling: 'text-leaf',
  assembly: 'text-ink',
  material: 'text-ink',
}

type Props = {
  item: CatalogItem
  showTechnology: boolean
}

export default function SheetCard({ item, showTechnology }: Props) {
  const isMaterial = item.technology === 'material'
  const heading = isMaterial ? item.title : `${item.title} č. ${item.number}`
  const details = isMaterial
    ? [countPages(item.pages.length)]
    : [item.threads.join(', '), item.mass ? `${item.mass} g` : ''].filter(Boolean)

  return (
    <article>
      <a href={`#/${item.id}`} className="sheet-link block" aria-label={`Otevřít ${heading}`}>
        <img
          src={item.pages[0].thumb}
          alt={`${heading}, náhled výkresu`}
          width={520}
          height={735}
          loading="lazy"
          decoding="async"
          className="sheet block aspect-[595/842] w-full bg-white"
        />
      </a>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="type-action">{heading}</h3>
          <p className="tabular mt-0.5 text-[13px] leading-[1.3] font-medium text-muted">
            {details.map((detail) => (
              <span key={detail} className="mr-2.5 inline-block">
                {detail}
              </span>
            ))}
          </p>
          {showTechnology && (
            <p className={`mt-0.5 text-[13px] leading-[1.3] font-semibold ${technologyColors[item.technology]}`}>
              {technologyLabels[item.technology]}
            </p>
          )}
        </div>
        <a
          href={item.pdf}
          download={item.file}
          aria-label={`Stáhnout PDF: ${heading}`}
          title="Stáhnout PDF"
          className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center text-muted hover:bg-white hover:text-brand"
        >
          <Download aria-hidden className="size-4" />
        </a>
      </div>
    </article>
  )
}
