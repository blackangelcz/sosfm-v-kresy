export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/brand/mark.png" alt="" width={256} height={256} className="size-10" />
          <p className="type-action">
            Střední odborná škola, Frýdek-Místek, příspěvková organizace
            <span className="mt-0.5 block font-medium text-muted">Odborný výcvik</span>
          </p>
        </div>
        <div className="type-action flex flex-wrap items-center gap-x-6 gap-y-1">
          <a href="https://www.sosfm.cz/" className="text-brand hover:underline">
            sosfm.cz
          </a>
          <a href="https://www.angelodev.eu/" className="text-muted hover:text-ink">
            By: Ondřej Michl
          </a>
        </div>
      </div>
    </footer>
  )
}
