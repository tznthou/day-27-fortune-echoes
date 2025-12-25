# Fortune Echoes 財運迴響

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com/)
[![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C.svg)](https://d3js.org/)
[![NLSC](https://img.shields.io/badge/NLSC-Taiwan%20Gov-7EBC6F.svg)](https://maps.nlsc.gov.tw/)

[← Back to Muripo HQ](https://tznthou.github.io/muripo-hq/) | [中文](README.md)

An interactive map visualizing Taiwan lottery jackpot locations. Golden energy orbs mark each winning district, and as the timeline advances, ripples emanate from new winning points—like fortune's waves echoing across the island.

![Fortune Echoes](assets/preview.webp)

> **"Every draw sends a ripple of fortune across the land."**

---

## Core Concept

This is not a static statistical chart—it's a **visual narrative through time**.

From January 2024 to December 2025: 24 months, 778 jackpot wins. Each district's energy orb size represents cumulative wins, while ripples show new wins for the current month. You're not just seeing "where people won"—you're witnessing "how fortune flows across this land."

---

## Features

| Feature | Description |
|---------|-------------|
| **Timeline Playback** | Auto-play through 24 months, observe shifting hotspots |
| **Cumulative/Monthly Mode** | Toggle between accumulated stats and monthly snapshots |
| **Lottery Filter** | Isolate Power Lottery, Super Lotto, or Daily 539 |
| **Theme Toggle** | Switch between dark and light map styles |
| **Hover Details** | View detailed winning records for each district |

---

## Data Sources

### Lottery Data

- **Source**: Taiwan Lottery official website
- **Range**: 2024/01 - 2025/12 (24 months)
- **Lottery Types**: Power Lottery (威力彩), Super Lotto (大樂透), Daily 539 (今彩539)
- **Records**: 778 jackpot wins
- **Coverage**: 207 districts

### Map Data

- **Base Map**: [NLSC](https://maps.nlsc.gov.tw/) (National Land Surveying and Mapping Center) - Taiwan government tiles, no commercial restrictions
- **District Coordinates**: Calculated centroids from [taiwan-atlas](https://github.com/dkaoster/taiwan-atlas) TopoJSON

---

## Visual Design

### Energy Orbs

Orb size and color reflect win count and lottery type:

| Lottery | Color | Glow |
|---------|-------|------|
| **Power Lottery** | Flame Orange `#ff6b35` | Largest glow (highest prize) |
| **Super Lotto** | Gold `#fbbf24` | Medium glow |
| **Daily 539** | Amber `#d97706` | Standard glow |

### Ripple Animation

New wins for the current month generate expanding concentric ripples, visualizing the "wave of fortune":

```
     ○ ○ ○
   ○ ○ ● ○ ○    ← New winning point
     ○ ○ ○         generates ripple
       ↓
    Expands & fades
```

### Theme Toggle

- **Dark Mode**: Night-friendly, CSS filter inverts NLSC tiles
- **Light Mode**: Original NLSC tiles, crisp and clear

---

## Technical Architecture

### Frontend Stack

| Technology | Purpose | Notes |
|------------|---------|-------|
| [Leaflet.js](https://leafletjs.com/) | Map rendering | Bounded to Taiwan, zoom 7-16 |
| [D3.js](https://d3js.org/) | SVG visualization | Energy orbs + ripple animations |
| [NLSC](https://maps.nlsc.gov.tw/) | Tile layer | Taiwan gov, Traditional Chinese |
| Vanilla JS | No framework | Modular design |

### Data Processing Pipeline

```
┌─────────────────────────────────────────────────────┐
│              Data Processing Pipeline               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐  │
│  │ CSV Raw  │ →  │ Address Parse│ →  │ JSON     │  │
│  │ Lottery  │    │ Match District│    │ Visual   │  │
│  └──────────┘    └──────────────┘    └──────────┘  │
│                                                     │
│  taiwan-atlas TopoJSON → 368 district centroids    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Module Structure

| Module | Responsibility |
|--------|----------------|
| `data.js` | Load JSON, query by month/cumulative |
| `map.js` | Leaflet map init, theme toggle |
| `ripple.js` | D3 SVG overlay, orb & ripple rendering |
| `timeline.js` | Timeline control, autoplay |
| `app.js` | Main entry, state management, event binding |

---

## Code Review

This project underwent comprehensive code review, with all Critical and High priority issues resolved:

### Fixed ✅

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| C01 | Critical | CSP security policy | Added Content-Security-Policy meta tag |
| C02 | Critical | D3.js SRI integrity | Added integrity & crossorigin attributes |
| H01 | High | Error boundary handling | Added try/catch with user-friendly error messages |
| H02 | High | Event listener memory leak | Stored handler references, added destroy() method |
| H03 | High | Animation timing conflicts | Added animation lock to prevent overlap |
| H04 | High | Accessibility | Added ARIA attributes, keyboard navigation, focus styles |
| H05 | High | Timeline accessibility | Added aria-valuetext for screen readers |
| H06 | High | XSS prevention | Added escapeHtml() for user-derived data |
| H07 | High | Data validation | Coordinate bounds checking, format validation |
| M01 | Medium | D3 transition cleanup | Using .interrupt() to stop old animations |
| M02 | Medium | Viewport culling | Only render visible elements |
| M06 | Medium | Dynamic timeline labels | Update start/end dates from data |
| M07 | Medium | Theme persistence | Store preference in localStorage |
| M08 | Medium | Loading state | Added loading overlay with spinner |
| M09 | Medium | Tile policy | Switched to NLSC government tiles |

### Deferred (Low Impact)

| ID | Issue | Reason |
|----|-------|--------|
| M03 | console.log removal | Debug use, can strip in production build |
| M04 | Magic numbers | Readability optimization, no functional impact |
| M05 | Map bounds constant | Already defined in data.js, duplicate but harmless |
| M10 | renderMonth refactor | Code structure, no functional impact |
| L01-L09 | Various Low | Lowest priority, optional improvements |

---

## Project Structure

```
day-27-fortune-echoes/
├── index.html
├── static/
│   ├── css/
│   │   └── style.css              # Dark theme + control panel
│   └── js/
│       ├── data.js                # Data module
│       ├── map.js                 # Leaflet map
│       ├── ripple.js              # D3 ripple visuals
│       ├── timeline.js            # Timeline control
│       └── app.js                 # Main entry
├── data/
│   ├── fortune.json               # Processed winning data
│   └── taiwan_districts.json      # District centroids
├── assets/
│   └── preview.webp               # Preview image
├── package.json
├── LICENSE
├── README.md
└── README_EN.md
```

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/tznthou/day-27-fortune-echoes.git
cd day-27-fortune-echoes

# Install dependencies (dev server only)
npm install

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

---

## Reflections

### Why "Echoes"?

Winning the lottery is like dropping a stone into still water.

Ripples spread outward, then fade. But the water remembers. In cumulative mode, the energy orbs are the water's memory—they remember every fortune that landed, even after the ripples have long disappeared.

### Why Districts, Not Addresses?

We deliberately use district centroids instead of exact store locations.

This isn't a technical limitation—it's a design choice. When you see a district's orb growing larger, you're sensing "the density of fortune in this area," not "this particular lottery shop is lucky." This is a story about geographic distribution, not a treasure map.

### The Warmth of Data

778 jackpot records. Each one represents a turning point in someone's life.

Someone might have paid off their mortgage. Someone might have started a new business. Someone might have just bought a ticket and forgotten about it. We can't know these stories, but when the orbs light up and ripples spread, these numbers gain a little warmth.

This is what data visualization means—letting cold data begin to speak.

### The Geography of Fortune

Does fortune favor certain places? Or does it just happen to land there?

Looking at the orbs on the map, you'll notice some districts shine brighter than others, while some have never lit up at all. Will those places that have never won see their first light tomorrow? Will the places you frequent—day after day, month after month—suddenly become the spot where fortune lands?

No one can give you a definite answer.

But that's exactly what makes this map fascinating—it records the past, not the future. As you watch the timeline advance, watching ripples rise and fall across the island, you'll realize one thing: fortune never plays by the rules. It arrives at unexpected times, in unexpected places, quietly.

Perhaps gazing at the map itself brings you closer to an answer than any analysis ever could.

---

## License

This work is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

This means:
- ✅ Free to share and adapt
- ✅ Attribution required
- ❌ No commercial use
- 🔄 Derivatives must use same license

---

## Related Projects

- [Day-23 City Breath](https://github.com/tznthou/day-23-city-breath) - Air quality visualization
- [Day-24 Topography of Care](https://github.com/tznthou/day-24-topography-of-care) - Social welfare contour map
- [Day-25 Data Tapestry](https://github.com/tznthou/day-25-data-tapestry) - GitHub Trending weave

---

> **"The trajectory of fortune is not about predicting the future, but seeing the ripples of the past."**
