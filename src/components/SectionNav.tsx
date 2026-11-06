import { useEffect, useRef, useState } from 'react'
import type { CatalogItem, Section } from '../catalog'

type Props = {
  entries: { section: Section; items: CatalogItem[] }[]
}

export default function SectionNav({ entries }: Props) {
  const [active, setActive] = useState(entries[0]?.section.slug ?? '')
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (records) => {
        const hit = records.find((record) => record.isIntersecting)
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-140px 0px -70% 0px' },
    )
    entries.forEach(({ section }) => {
      const element = document.getElementById(section.slug)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [entries])

  useEffect(() => {
    const strip = stripRef.current
    const link = strip?.querySelector<HTMLElement>(`[data-slug="${active}"]`)
    if (strip && link && getComputedStyle(strip).overflowX !== 'visible') {
      strip.scrollLeft = link.offsetLeft - 16
    }
  }, [active])

  return (
    <nav aria-label="Sekce výkresů" className="sticky top-[65px] z-20 sm:top-[69px] -mx-4 self-start border-b border-line bg-table sm:-mx-6 lg:top-[85px] lg:mx-0 lg:border-0 lg:pt-10">
      <div ref={stripRef} className="no-scrollbar relative flex gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:flex-col lg:gap-0 lg:overflow-visible lg:p-0">
        {entries.map(({ section, items }) => {
          const isActive = section.slug === active
          return (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              data-slug={section.slug}
              aria-current={isActive ? 'true' : undefined}
              className={`type-action flex shrink-0 items-center justify-between gap-3 border-l-0 px-3 py-2.5 whitespace-nowrap lg:border-l-[3px] lg:px-3.5 ${
                isActive
                  ? 'border-brand bg-brand text-white lg:bg-white lg:text-brand'
                  : 'border-transparent text-ink hover:bg-white/70'
              }`}
            >
              <span>{section.label}</span>
              <span className={`tabular font-medium ${isActive ? 'text-white/80 lg:text-brand' : 'text-muted'}`}>{items.length}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
