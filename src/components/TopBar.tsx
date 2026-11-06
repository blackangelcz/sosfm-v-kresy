import { Search, X } from 'lucide-react'

type Props = {
  query: string
  onQueryChange: (value: string) => void
}

export default function TopBar({ query, onQueryChange }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1560px] items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-6 lg:px-8">
        <a href="https://www.sosfm.cz/" className="shrink-0" aria-label="Web školy sosfm.cz">
          <img src="/brand/logo.png" alt="SOŠ Frýdek-Místek" width={640} height={177} className="hidden h-12 w-auto sm:block" />
          <img src="/brand/mark.png" alt="SOŠ Frýdek-Místek" width={256} height={256} className="size-10 sm:hidden" />
        </a>
        <label className="relative min-w-0 flex-1 lg:max-w-[560px]">
          <span className="sr-only">Hledat výkres</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Hledat název, závit, průměr nebo materiál"
            className="type-action h-11 w-full border border-line bg-table pr-10 pl-10 font-medium placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Smazat hledání"
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center text-muted hover:text-ink"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </label>
      </div>
    </header>
  )
}
