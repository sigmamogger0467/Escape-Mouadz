# Mouadz Escapes Trump – Projektwissen

3D-Endlos-Runner im Browser (Subway-Surfers-artige Mechanik, eigene Figuren/Welten).
Mouadz flieht vor Trump (oder einem anderen Verfolger) und dessen Crew durch Länder und Welten.
Alle Texte im Spiel und die Kommunikation mit dem Nutzer: **Deutsch**.

## Technik
- Reines HTML/CSS/JS, **kein Build-Schritt**, kein npm. Three.js **0.149** (globales `THREE`).
- Module sind normale `<script>`-Dateien mit gemeinsamem globalem Scope, Ladereihenfolge in `index.html`:
  `data → core → gfx → world → characters → objects → game → ui → main`.
  Spätere Dateien dürfen alles aus früheren benutzen; Reihenfolge beachten.
- Lokal testen: `python3 -m http.server` im Repo-Ordner, dann im Browser öffnen (Playwright/Chromium ist vorinstalliert).
- Debug-Hook: `window.__escape` (in `js/main.js`) – Zugriff auf `G`, `state`, `save`, `startGame`, `moveLane`, `jump`, `slide`, `setWorld`, `setCountry`, `makeObstacle`, `makePower`, `objsInfo()` usw. Gut für automatisierte Bot-Tests/Screenshots.
- Steuerung: Pfeile/WASD, Leertaste = Springen, P/Esc = Pause, Enter = Start. Touch: Wischen.

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | CSS (Variablen in `:root`, Fonts Luckiest Guy + Fredoka), HUD, alle Panels (menu, shop, missions, settings, over, pause, countries, daily, crate) |
| `js/data.js` | **Alle Inhalte**: `SKINS` (Läufer), `CHASERS`, `CREWS`, Sprüche (`TRUMP_LINES`, `STUMBLE_LINES`, `JET_LINES`, pro Verfolger `lines`), `WORLD_AT`, `WORLD_DEFAULTS`, `COUNTRIES` (je 6 Welten), `MISSIONS`, `UPGRADES`, `UPGRADE_COST`, `DAILY`. Helfer `$`, `fmt`, `pick` |
| `js/core.js` | Speicherstand (`defaultSave`, `sanitize`, 3 Slots in localStorage, Export/Import-Code, Cloud-Sync), Stats (`addStat`/`maxStat`), Missionen, `scoreMultiplier` (max ×20), `powerDur`, Soundeffekte `sfx()`, prozedurale Musik (rumänische Sârba: Geige, Zimbal, Akkordeon) |
| `js/gfx.js` | Renderer, Licht, Toon-Material (`toon`, `lam`, `std`, `glossy`, `glowMat`), Form-Helfer (`box`, `rbox`, `sph`, `caps`, `cyl`, `cone`, `torus`, `plane`), `labelTex`/`canvasTex`, Outline-Pass, Qualitätsstufen (high/mid/low), `mergeTree` zum Zusammenfassen von Meshes |
| `js/world.js` | `LANES = [-2.2, 0, 2.2]`, Straße, Gehweg, Gebäude, Deko, Himmel/Sterne/Wolken, Sonne/Mond, Wahrzeichen (`buildLandmark`), Paletten-Überblendung, `setWorld`, `setCountry` |
| `js/characters.js` | `buildRunner(skin)`, `buildTrump(chaser)`, Crew (`setCrew`), Animation mit Pose-Blending: `RUN_STYLE`, `IDLE_STYLE`, `CHEER_STYLE`, `CH_STYLE` pro Figur-ID |
| `js/objects.js` | Hindernisse (Barrieren, Bus, Mauer, ICE-SUV, Züge `train`/`mtrain` mit Rampen), `BLOCKING`, Münzen (InstancedMesh), Power-ups (`makePower`), Partikel (`emit`) |
| `js/game.js` | Zustand `G`, `state` ('menu','running','paused','over',…), `spawnRow`, Kreuzungen (T/L/R, Abbiegen), Springen/Rutschen/Stolpern/Gefangen, Jetpack, `update(dt)`, Kamera, `frame()` |
| `js/ui.js` | Menüs, Shop (Läufer/Verfolger/Upgrades), Missionen, Kisten, Tagesbelohnung, Einstellungen/Speicherplätze, Sprechblasen (`say`), Länderauswahl |
| `js/main.js` | Start + `window.__escape` |

## Inhalte (Stand Nov. 2026)
- **24 Läufer**: mouadz, ninja, soccer, hero, astro, chef, pirate, gamer, rapper, robo, fire, zombie, knight, alien, viking, mummy, gold, khaby, beast, sahara, messi, cr7, vini, dino.
- **22 Verfolger**: classic, golf, cowboy, pirate, santa, ninja, super, icechef, astro, robot, zombie, gold, king, baby (alles Trump-Varianten), ref, interpol, bibi (Netanyahu), putin, kim, musk, merz, bling. Jeder hat eine eigene Crew (`CREWS`) und eigene Sprüche.
- **7 Länder** à 6 Welten: usa, de, ma (frei), fr (5.000), jp (10.000), eg (16.000), br (24.000 Rekord nötig).
  Weltwechsel im Lauf bei `WORLD_AT = [0, 2500, 6000, 11000, 18000, 27000]` Punkten; Schwellen werden dem Spieler nicht angezeigt. Danach zufällige Welten mit exponentiell steigenden Schwellen.
- **6 Power-ups/Upgrades** (5 Stufen, Kosten 250/600/1200/2500/5000, +25 % Dauer pro Stufe): magnet, double, turbo, jet, boots, slowmo.
- **21 Missionen** mit Stufen; je 3 Missionsstufen +1 Punkte-Multiplikator.
- 7-Tage-Belohnung, Kisten, Münz-Combo („Bling“), Superhelden-Jetpack-Flug.

## Speicherstand
- `save`-Objekt, Version `v:2`, Felder u. a. `coins, best, owned, skin, chOwned, chaser, crates, stats, missions, upgrades, daily, settings{music,shadows,quality}, country, played`.
- Neue Felder **immer** in `defaultSave()` und `sanitize()` (core.js) ergänzen, damit alte Spielstände nicht kaputtgehen.
- Cloud-Sync über die Claude-Artifact-Datenbank: `window.claude.use('db')`, Dokument `data/users/<uid>/game`. Ohne `window.claude` läuft das Spiel nur lokal.

## Veröffentlichung
1. **Claude-Artifact** (öffentlich geteilt!): „Mouadz Escapes Trump“,
   slug `faa86ff3-a6c5-4d69-b35e-9d173a1e6f7e`, https://claude.ai/artifact/XxEakcaGeCFpJz1tnoavKF
   Mehrdatei-Artifact mit exakt `index.html` + `js/*.js` (Three.js und Fonts per CDN).
   Aktualisieren mit `publish_files` (vorher `list_files`/`get_artifact` für `base_version`, `shared_live: "public"`).
   Nur veröffentlichen, wenn der Nutzer es möchte.
2. **Branch `app`** = App-Version fürs iPad (PWA, z. B. über GitHub Pages): lokale Fonts (`fonts/`), lokales `js/three.min.js`,
   `manifest.webmanifest`, Icons (`icons/`), Service Worker `sw.js` (offline). Bei Spieländerungen die JS-Dateien dorthin übernehmen
   und in `sw.js` die `VERSION` erhöhen (`mouadz-v1` → `mouadz-v2` …), sonst laden Geräte die alten Dateien.

## Arbeitsweise / Konventionen
- Inhalte (neue Figuren, Welten, Missionen) zuerst in `data.js` anlegen; Aussehen in `characters.js` (`buildRunner`/`buildTrump` über `extra`-Feld) bzw. `world.js`.
- Performance zählt (läuft auf iPad/Handy): geteilte Geometrien/Materialien aus den Caches nutzen, Meshes mergen, Draw-Calls gering halten, Texturen beim Entfernen freigeben.
- Fairness: Hindernis-Reihen müssen immer einen Ausweg lassen (wurde mit Bot-Backtests über `window.__escape` geprüft).
- Commit-Nachrichten: kurz, beschreibend, auf Englisch (bisheriger Stil).

## Verlauf
- f37749c Escape Run: 3D-Endlos-Runner mit Skins
- 95ad262 ICE, Missionen mit Kisten, Verfolger-Skins, Speicherplätze
- 6c27fc6 Cloud-Speicher, sechs Welten, Züge mit Rampen, Gegenzüge, Kreuzungen
- 9487458 Großes Overhaul: runde Figuren mit Gesichtern, Jetpack, Upgrades, Tagesbelohnung, Musik, Module
- ef7964f Länder mit 36 Welten, Toon-Shading mit Umrissen, Wahrzeichen, Qualitätsstufen
- d76da9b Versteckte Weltschwellen, zufällige Welten, Roll-/Salto-Animationen, Cartoon-Font
- 8ecb0b9 Neue Läufer (Vini, Messi, CR7, MrBeast, Khaby, Sahara) und Verfolger (Schiri, Interpol, Netanyahu, Putin, Kim, Musk, Merz), Sprungschuhe, Zeitlupe
- 6d1a2eb Münz-Bling mit Combo, Sârba-Musik, Lauf-/Steh-/Jubelstile pro Figur, eigene Crews
- (Branch `app`) 3fc9a67 App-Version fürs iPad: Home-Bildschirm-Symbol, Vollbild, offline
