# The Eternal Argument — Project Documentation

## Overview
A podcast website for "The Eternal Argument" — a series covering the history of human thought across 7 eras, structured as an inverted pyramid (fast/broad at the start, slow/deep toward the present).

**Live site**: https://theeternalargument.org
**GitHub**: https://github.com/jtor014/philosophy-site
**Firebase project**: `philosophy-site-b04cd`

## Architecture
Data-driven static site. A single JSON file drives all content; HTML template pages use query parameters to render the right data via vanilla JS. No build step, no framework.

### File Structure
```
philosophy-site/
├── index.html              # Landing page (data-page="landing")
├── era.html                # Era template, ?era=N (data-page="era")
├── episode.html            # Episode template, ?ep=N (data-page="episode")
├── about.html              # About page (data-page="about")
├── styles.css              # All styles, dark cinematic theme
├── script.js               # All JS: data loading, rendering, search, UI
├── feed.xml                # RSS podcast feed (manually maintained)
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project link
├── data/
│   └── episodes.json       # All series/era/episode data
├── audio/
│   └── Era I - Foundations/ # MP3 files (ep001.mp3 - ep008.mp3 so far)
│   └── Era II - Architects of Modernity/
│   └── ... (7 era folders)
├── transcripts/
│   └── Era I - Foundations/ # Markdown transcripts (ep001.md - ep008.md so far)
│   └── ... (7 era folders, .gitkeep in empty ones)
└── assets/
    └── favicon.svg
```

## Data Model (`data/episodes.json`)
```
{
  "series": { "title", "tagline" },
  "eras": [
    {
      "id": 1,              # Integer 1-7
      "number": "I",         # Roman numeral
      "title", "subtitle", "description",
      "color": "#c9a84c",   # Era accent color
      "episodeRange": [1, 18],
      "sections": [          # Groups of episodes within the era
        { "title", "subtitle", "episodes": [1, 2] }
      ]
    }
  ],
  "episodes": [
    {
      "id": 1,              # Sequential integer
      "era": 1,             # Links to era.id
      "title", "focus",     # Title and subtitle/focus line
      "context",            # Historical context paragraph
      "keyConflict": null,  # Optional
      "keyConcept": null,   # Optional
      "audioFile": "ep001.mp3" or null  # Filename only, path built by JS
    }
  ]
}
```

## How Pages Work
- `body[data-page]` attribute tells `script.js` which page to render
- JS loads `data/episodes.json` once (cached), then calls the appropriate render function
- `renderEraTimeline(data)` → landing page era cards
- `renderEraPage(data, eraId)` → era page with sectioned episode list
- `renderEpisodePage(data, epId)` → episode detail with audio player + transcript
- Transcripts loaded separately via `loadTranscript(epId)` from markdown files, rendered with marked.js (CDN, only on episode.html)

## Era Folder Mapping
Used for audio and transcript paths:
```
1: "Era I - Foundations"
2: "Era II - Architects of Modernity"
3: "Era III - 19th Century Explosion"
4: "Era IV - The Great Split"
5: "Era V - Post-War & Post-Modern"
6: "Era VI - Contemporary Explosion"
7: "Era VII - The Now & The Future"
```

## Design
- Dark cinematic theme: `--bg-deep: #0a0a0f`, off-white text, gold accent `#d4a843`
- Each era has its own accent color (CSS vars `--era-1` through `--era-7`)
- Typography: Georgia/serif for body, system sans-serif for UI
- Glassmorphism cards with subtle borders
- Responsive down to mobile

## Common Tasks

### Adding a new episode
1. Add audio MP3 to `audio/{Era Folder}/ep{NNN}.mp3`
2. Convert script docx to markdown: `pandoc "Script.docx" -t markdown -o "transcripts/{Era Folder}/ep{NNN}.md"`
3. Update `data/episodes.json`: set `"audioFile": "ep{NNN}.mp3"` for the episode
4. Add item to `feed.xml` with correct file size (`stat -c%s` the mp3), URL-encode spaces in path
5. Deploy

### Local development
```bash
python3 -m http.server 8090
# Browse to http://localhost:8090
```

### Deploying
```bash
git add <files> && git commit -m "message"
git push origin main
firebase deploy
```

## Key Conventions
- Episodes without audio show "Audio coming soon" on episode page and "Soon" badge on era page
- Transcripts are collapsible (collapsed by default, click to expand)
- Episode prev/next arrows appear inline with the title (‹ Title ›)
- The RSS feed (`feed.xml`) is manually maintained — add new items when episodes get audio
- All content is AI-generated; this is disclosed in the footer and about page
- No build tools, no npm, no bundler — everything is vanilla HTML/CSS/JS
