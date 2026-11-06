import { useEffect, useMemo, useRef, useState } from 'react'
import { allItems, matchesItem, sections, type CatalogItem, type TechnologyFilter } from './catalog'
import { useHash } from './useHash'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResultsBar, { type ViewMode } from './components/ResultsBar'
import SectionBlock from './components/SectionBlock'
import SectionNav from './components/SectionNav'
import TopBar from './components/TopBar'
import Viewer from './components/Viewer'

export default function App() {
  const [query, setQuery] = useState('')
  const [technology, setTechnology] = useState<TechnologyFilter>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const { hash, clear } = useHash()
  const resultsRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(
    () =>
      sections
        .map((section) => ({
          section,
          items: section.items.filter((item) => matchesItem(item, query, technology)),
        }))
        .filter((entry) => entry.items.length > 0),
    [query, technology],
  )

  const flat = useMemo<CatalogItem[]>(() => visible.flatMap((entry) => entry.items), [visible])
  const openId = hash.startsWith('#/') ? decodeURIComponent(hash.slice(2)) : null
  const openItem = openId ? allItems.find((item) => item.id === openId) ?? null : null

  useEffect(() => {
    if (hash && !hash.startsWith('#/')) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    }
  }, [])

  const changeQuery = (value: string) => {
    if (!query && value && resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top
      if (top > 120) resultsRef.current.scrollIntoView({ behavior: 'auto' })
    }
    setQuery(value)
  }

  const resetFilters = () => {
    setQuery('')
    setTechnology('all')
  }

  return (
    <>
      <TopBar query={query} onQueryChange={changeQuery} />
      <Hero />
      <div className="mx-auto w-full max-w-[1560px] px-4 pb-16 sm:px-6 lg:grid lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-10 lg:px-8">
        <SectionNav entries={visible} />
        <main ref={resultsRef} className="min-w-0 scroll-mt-[116px] pt-6 lg:scroll-mt-[69px] lg:pt-10">
          <ResultsBar
            items={flat}
            technology={technology}
            onTechnologyChange={setTechnology}
            view={view}
            onViewChange={setView}
          />
          {visible.length === 0 ? (
            <div className="mt-10 border border-line bg-white p-8">
              <h2 className="type-heading">Nic takového v databázi není</h2>
              <p className="mt-2 max-w-[60ch]">
                Zkuste jiný závit, průměr nebo materiál, například M20, Ø35 nebo C45.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="type-action mt-5 cursor-pointer bg-brand px-4 py-3 text-white hover:bg-brand-deep"
              >
                Zrušit filtry
              </button>
            </div>
          ) : (
            visible.map(({ section, items }) => (
              <SectionBlock key={section.slug} section={section} items={items} view={view} />
            ))
          )}
        </main>
      </div>
      <Footer />
      {openItem && <Viewer key={openItem.id} item={openItem} list={flat} onClose={clear} />}
    </>
  )
}
