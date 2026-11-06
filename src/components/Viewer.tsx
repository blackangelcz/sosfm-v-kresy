import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Download, ExternalLink, X, ZoomIn, ZoomOut } from 'lucide-react'
import { countPages, formatSize, sections, technologyLabels, type CatalogItem } from '../catalog'

type Props = {
  item: CatalogItem
  list: CatalogItem[]
  onClose: () => void
}

function go(id: string) {
  window.location.hash = `/${id}`
}

export default function Viewer({ item, list, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null)
  const focusRef = useRef<{ x: number; y: number } | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const section = sections.find((entry) => entry.slug === item.section)
  const index = list.findIndex((entry) => entry.id === item.id)
  const previous = index > 0 ? list[index - 1] : null
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null
  const page = item.pages[pageIndex]
  const siblings = list.filter((entry) => entry.section === item.section)
  const siblingIndex = siblings.findIndex((entry) => entry.id === item.id)
  const isMaterial = item.technology === 'material'
  const heading = isMaterial ? item.title : `${item.title} č. ${item.number}`

  const stepForward = () => {
    setZoomed(false)
    if (pageIndex < item.pages.length - 1) setPageIndex(pageIndex + 1)
    else if (next) go(next.id)
  }

  const stepBack = () => {
    setZoomed(false)
    if (pageIndex > 0) setPageIndex(pageIndex - 1)
    else if (previous) go(previous.id)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
      dialog.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') stepForward()
      if (event.key === 'ArrowLeft') stepBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const sources = [item.pages[pageIndex + 1]?.full, item.pages[pageIndex - 1]?.full, next?.pages[0].full, previous?.pages[0].full]
    sources.filter(Boolean).forEach((source) => {
      new Image().src = source as string
    })
  }, [item, pageIndex, next, previous])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (zoomed && focusRef.current) {
      stage.scrollLeft = focusRef.current.x * stage.scrollWidth - stage.clientWidth / 2
      stage.scrollTop = focusRef.current.y * stage.scrollHeight - stage.clientHeight / 2
    }
    if (!zoomed) {
      stage.scrollLeft = 0
      stage.scrollTop = 0
    }
  }, [zoomed])

  const toggleZoomAt = (event: ReactPointerEvent<HTMLImageElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    focusRef.current = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    }
    setZoomed((value) => !value)
  }

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current
    if (!zoomed || !stage) return
    dragRef.current = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false }
  }

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const stage = stageRef.current
    if (!drag || !stage) return
    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) drag.moved = true
    stage.scrollLeft = drag.left - deltaX
    stage.scrollTop = drag.top - deltaY
  }

  const endDrag = () => {
    window.setTimeout(() => {
      dragRef.current = null
    })
  }

  const facts = isMaterial
    ? [
        { label: 'Sekce', value: section?.label },
        { label: 'Rozsah', value: countPages(item.pages.length) },
        { label: 'Soubor', value: formatSize(item.size) },
      ]
    : [
        { label: 'Technologie', value: technologyLabels[item.technology] },
        { label: 'Polotovar', value: item.blank },
        { label: 'Materiál', value: item.material },
        { label: 'Měřítko', value: item.scale },
        { label: 'Hmotnost', value: item.mass ? `${item.mass} g` : '' },
        { label: 'Závity', value: item.threads.join(', ') },
        { label: 'Formát', value: item.format },
        { label: 'Navrhl', value: item.designer },
        { label: 'Schválil', value: item.approver },
        { label: 'Datum', value: item.date },
      ]

  const iconButton = 'grid size-11 cursor-pointer place-items-center text-white hover:bg-white/15 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <dialog
      ref={dialogRef}
      className="viewer"
      tabIndex={-1}
      aria-label={heading}
      onClose={onClose}
    >
      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
        <div className="relative flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-1 text-white sm:px-3">
            <div className="flex items-center">
              <button type="button" onClick={stepBack} disabled={!previous && pageIndex === 0} aria-label="Předchozí" className={iconButton}>
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button type="button" onClick={stepForward} disabled={!next && pageIndex === item.pages.length - 1} aria-label="Další" className={iconButton}>
                <ChevronRight aria-hidden className="size-5" />
              </button>
              <p className="type-action tabular ml-2" aria-live="polite">
                {item.pages.length > 1
                  ? `Strana ${pageIndex + 1} z ${item.pages.length}`
                  : siblingIndex >= 0
                    ? `${section?.label}: ${siblingIndex + 1} z ${siblings.length}`
                    : section?.label}
              </p>
            </div>
            <div className="flex items-center">
              <button type="button" onClick={() => { focusRef.current = { x: 0.5, y: 0.5 }; setZoomed((value) => !value) }} aria-label={zoomed ? 'Zmenšit' : 'Přiblížit'} aria-pressed={zoomed} className={iconButton}>
                {zoomed ? <ZoomOut aria-hidden className="size-5" /> : <ZoomIn aria-hidden className="size-5" />}
              </button>
              <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Zavřít" className={`${iconButton} lg:hidden`}>
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
          <div
            ref={stageRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className={`flex min-h-0 flex-1 overflow-auto px-3 pb-3 sm:px-6 sm:pb-6 ${zoomed ? 'cursor-grab select-none active:cursor-grabbing' : ''}`}
          >
            <img
              key={page.full}
              src={page.full}
              alt={`${heading}, celý výkres`}
              draggable={false}
              onClick={(event) => {
                if (dragRef.current?.moved) return
                toggleZoomAt(event as unknown as ReactPointerEvent<HTMLImageElement>)
              }}
              style={{ backgroundImage: `url("${page.thumb}")`, backgroundSize: '100% 100%' }}
              className={`m-auto block aspect-[595/842] bg-white ${
                zoomed ? 'w-[min(1900px,240%)] max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in'
              }`}
            />
          </div>
        </div>

        <aside className="flex max-h-[42dvh] flex-col overflow-y-auto bg-white lg:max-h-none">
          <div className="flex items-start justify-between gap-3 border-b border-ink px-5 py-4">
            <div className="min-w-0">
              <a href={`#${item.section}`} onClick={() => dialogRef.current?.close()} className="type-label text-brand hover:underline">
                {section?.label}
              </a>
              <h2 className="mt-1 text-[24px] leading-[1.25] font-semibold tracking-[-0.01em]">{heading}</h2>
              {item.subtitle && <p className="mt-1.5 text-[14px] leading-[1.45] text-muted">{item.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Zavřít"
              className="-mt-1 -mr-2 hidden size-11 shrink-0 cursor-pointer place-items-center text-ink hover:bg-table lg:grid"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex gap-2 border-b border-line px-5 py-3 lg:flex-col">
            <a href={item.pdf} download={item.file} className="type-action flex flex-1 items-center justify-center gap-2 bg-brand px-4 py-3 text-white hover:bg-brand-deep">
              <Download aria-hidden className="size-4" />
              Stáhnout PDF
            </a>
            <a href={item.pdf} target="_blank" rel="noreferrer" className="type-action flex flex-1 items-center justify-center gap-2 border border-ink px-4 py-3 hover:bg-table">
              <ExternalLink aria-hidden className="size-4" />
              Otevřít PDF
            </a>
          </div>
          <dl className="px-5 py-2">
            {facts
              .filter((fact) => fact.value)
              .map((fact) => (
                <div key={fact.label} className="grid grid-cols-[104px_1fr] gap-3 border-b border-line py-2 last:border-0">
                  <dt className="type-label pt-[1px] text-muted">{fact.label}</dt>
                  <dd className="tabular text-[14px] leading-[1.35] font-medium">{fact.value}</dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>
    </dialog>
  )
}
