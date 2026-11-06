import rawCatalog from './data/catalog.json'

export type Technology = 'turning' | 'milling' | 'assembly' | 'material'
export type TechnologyFilter = 'all' | Technology

export type SheetPage = { thumb: string; full: string }

export type CatalogItem = {
  id: string
  section: string
  title: string
  subtitle?: string
  number: number
  file: string
  pdf: string
  size: number
  pages: SheetPage[]
  technology: Technology
  threads: string[]
  notes: string[]
  blank?: string
  material?: string
  scale?: string
  mass?: string
  date?: string
  designer?: string
  approver?: string
  format?: string
}

export type Bundle = { file: string; pdf: string; size: number; pages: number }

export type Section = {
  slug: string
  label: string
  kind: 'drawings' | 'materials'
  bundle: Bundle | null
  items: CatalogItem[]
}

const catalog = rawCatalog as { sections: Section[]; walls: string[] }

export const sections = catalog.sections

export const walls = catalog.walls

export const allItems = sections.flatMap((section) => section.items)

export const technologyLabels: Record<Technology, string> = {
  turning: 'Soustružení',
  milling: 'Frézování',
  assembly: 'Sestava',
  material: 'Výukový materiál',
}

export function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/×/g, 'x')
}

const haystacks = new Map(
  allItems.map((item) => {
    const section = sections.find((entry) => entry.slug === item.section)
    const fields = [
      item.title,
      item.subtitle,
      section?.label,
      `c${item.number}`,
      `vykres${item.number}`,
      item.blank,
      item.material,
      item.scale,
      technologyLabels[item.technology],
      ...item.threads,
      ...item.notes,
    ]
    return [item.id, fields.filter(Boolean).map((field) => normalize(field as string).replace(/\s+/g, '')).join(' ')]
  }),
)

export function matchesItem(item: CatalogItem, query: string, technology: TechnologyFilter) {
  if (technology !== 'all' && item.technology !== technology) return false
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = haystacks.get(item.id) ?? ''
  return terms.every((term) => haystack.includes(term))
}

export function plural(count: number, one: string, few: string, many: string) {
  if (count === 1) return `${count} ${one}`
  if (count >= 2 && count <= 4) return `${count} ${few}`
  return `${count} ${many}`
}

export function countDrawings(count: number) {
  return plural(count, 'výkres', 'výkresy', 'výkresů')
}

export function countMaterials(count: number) {
  return plural(count, 'materiál', 'materiály', 'materiálů')
}

export function countPages(count: number) {
  return plural(count, 'strana', 'strany', 'stran')
}

export function formatSize(bytes: number) {
  const value = bytes / (1024 * 1024)
  return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: value < 1 ? 2 : 1 })} MB`
}

export function latestDate(items: CatalogItem[]) {
  const dates = items
    .map((item) => item.date)
    .filter((date): date is string => Boolean(date))
    .map((date) => {
      const [day, month, year] = date.split('.').map(Number)
      return { date, order: year * 10000 + month * 100 + day }
    })
  return dates.reduce((latest, entry) => (entry.order > latest.order ? entry : latest), dates[0])?.date ?? ''
}

function single(values: (string | undefined)[], ignored: string[] = []) {
  const unique = [...new Set(values.filter((value): value is string => Boolean(value) && !ignored.includes(value as string)))]
  return unique.length === 1 ? unique[0] : null
}

export function sectionFacts(section: Section) {
  const threadSizes = section.items
    .flatMap((item) => item.threads)
    .map((thread) => /^M(\d+)$/.exec(thread)?.[1])
    .filter((size): size is string => Boolean(size))
    .map(Number)
  const low = Math.min(...threadSizes)
  const high = Math.max(...threadSizes)
  const threads = threadSizes.length === 0 ? null : low === high ? `M${low}` : `M${low} až M${high}`
  return [
    { label: 'Polotovar', value: single(section.items.map((item) => item.blank), ['viz kusovník']) ?? 'podle dílu' },
    { label: 'Materiál', value: single(section.items.map((item) => item.material)) ?? 'podle dílu' },
    { label: 'Měřítko', value: single(section.items.map((item) => item.scale)) ?? 'podle listu' },
    ...(threads ? [{ label: 'Závity', value: threads }] : []),
  ]
}

export function isMixedTechnology(section: Section) {
  return new Set(section.items.map((item) => item.technology)).size > 1
}
