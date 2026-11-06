import { Download } from 'lucide-react'
import { countPages, technologyLabels, type CatalogItem } from '../catalog'

type Props = {
  items: CatalogItem[]
  isMaterials: boolean
}

const headCell = 'type-label border-b border-line px-3 py-2.5 text-left whitespace-nowrap text-muted'
const bodyCell = 'border-b border-line px-3 py-2 align-middle text-[14px] leading-[1.3] whitespace-nowrap'

function DownloadCell({ item }: { item: CatalogItem }) {
  return (
    <td className={bodyCell}>
      <a href={item.pdf} download={item.file} className="type-action inline-flex items-center gap-1.5 text-brand hover:underline">
        <Download aria-hidden className="size-4" />
        PDF
      </a>
    </td>
  )
}

function Preview({ item }: { item: CatalogItem }) {
  return (
    <td className={bodyCell}>
      <a href={`#/${item.id}`} className="block w-9" aria-label={`Otevřít ${item.title} č. ${item.number}`}>
        <img src={item.pages[0].thumb} alt="" width={36} height={51} loading="lazy" decoding="async" className="sheet block aspect-[595/842] w-9 bg-white" />
      </a>
    </td>
  )
}

export default function SheetTable({ items, isMaterials }: Props) {
  return (
    <div className="mt-5 overflow-x-auto border border-line bg-white">
      {isMaterials ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={headCell}>Náhled</th>
              <th className={headCell}>Název</th>
              <th className={headCell}>Rozsah</th>
              <th className={headCell}>Soubor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-table/60">
                <Preview item={item} />
                <td className={`${bodyCell} font-semibold`}>
                  <a href={`#/${item.id}`} className="hover:text-brand">
                    {item.title}
                  </a>
                </td>
                <td className={`${bodyCell} tabular`}>{countPages(item.pages.length)}</td>
                <DownloadCell item={item} />
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={headCell}>Náhled</th>
              <th className={headCell}>Č.</th>
              <th className={headCell}>Název</th>
              <th className={headCell}>Technologie</th>
              <th className={headCell}>Polotovar</th>
              <th className={headCell}>Materiál</th>
              <th className={headCell}>Měřítko</th>
              <th className={`${headCell} text-right`}>Hmotnost</th>
              <th className={headCell}>Závity</th>
              <th className={headCell}>Soubor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-table/60">
                <Preview item={item} />
                <td className={`${bodyCell} tabular`}>{item.number}</td>
                <td className={`${bodyCell} font-semibold`}>
                  <a href={`#/${item.id}`} className="hover:text-brand">
                    {item.title}
                  </a>
                </td>
                <td className={bodyCell}>{technologyLabels[item.technology]}</td>
                <td className={`${bodyCell} tabular`}>{item.blank}</td>
                <td className={bodyCell}>{item.material}</td>
                <td className={`${bodyCell} tabular`}>{item.scale}</td>
                <td className={`${bodyCell} tabular text-right`}>{item.mass} g</td>
                <td className={`${bodyCell} tabular`}>{item.threads.join(', ')}</td>
                <DownloadCell item={item} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
