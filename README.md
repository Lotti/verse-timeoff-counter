# verse-timeoff-counter

**This plugin monitors yours Verse calendar entries and keeps count of the entries that 
represents vacation or work hour reduction in orderd to keep track of the amount holidays 
spent in a year.**

## What it does

- This add-on injects JavaScript into Verse pages.
- This add-on monitors Verse Ajax request to refresh its data.
- This add-on is customizable by its icon in the toolbar.

## What it shows

- A counter of vacation and work reduction left for the current year inside Verse main navbar
- A settings panel where is possible to configure the amount of vacation days and work reduction hours available per year and the possibility to customize the calendar entries labels that will be monitored

## How to run it

Use npm commands:

- npm run react: runs settings panel in dev mode (built with react)
- npm run react:build: builds react app that powers the settings panel
- npm run build: build react app and then packages the web extensions
- npm run lint: web-ext lint
- npm run sign: web-ext sign
- npm start: web-ext run
- npm run dev: web-ext with a specific profile called "dev" and keeps profile changes

## How it is programmed

- manifest.json is located inside "public" folder
- web-ext code (icons, css, js content and background files) is located inside "public" folder
- browser action popup is react app. Its source code is located inside "src" folder

---

Icons made by [monkik](https://www.flaticon.com/authors/monkik) from [www.flaticon.com](https://www.flaticon.com/)</a>