# Databáze výkresů SOŠ Frýdek-Místek

Web se všemi výkresy z odborného výcviku. React, Vite a Tailwind, bez databáze a bez serveru.

## Nasazení

Vercel se napojí na tento repozitář přes GitHub a nastavení si vezme z `vercel.json`. Build potřebuje jen npm, Python ani složku s výkresy nepotřebuje, protože PDF, náhledy a `src/data/catalog.json` jsou uložené přímo v repozitáři.

## Přidání nebo změna výkresů

Dělá se na počítači, kde je složka `Desktop\výkresy`, a je k tomu potřeba Python s balíčky `pymupdf` a `pillow`.

1. Spustit `npm run sync`.
2. Změny nahrát na GitHub. Vercel web nasadí sám.

Nová podsložka se sama stane novou sekcí a její název se vezme z názvu složky. Výjimkou je složka začínající `MZ 2026`, ta se na web nikdy nedostane. Jiné umístění výkresů se nastaví proměnnou `VYKRESY_SOURCE`.

## Vývoj

`npm install` a `npm run dev`, web poběží na http://localhost:10007/.
"# sosfm-v-kresy" 
