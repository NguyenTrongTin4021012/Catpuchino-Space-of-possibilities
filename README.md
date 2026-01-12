# Catpuchino: The Space of Possibilities

A collaborative generative art project exploring different systems of thinking through interactive visual and audio experiences. Built with p5.js and inspired by the quote: "Children must be taught how to think, not what to think." — Margaret Mead.

## Quick Start

### Run Locally
Open `group_website/index.html` directly, or run a local server:
```powershell
cd "d:\documents\Spec 1\ASM2\group_website"
python -m http.server 8000; Start-Process "http://localhost:8000"
```

Then navigate to `http://localhost:8000/main.html` to begin.

---

## Project Structure

### Entry Points & Navigation

| File | Purpose |
|------|---------|
| **index.html** | Initial splash screen with typewriter intro animation and "Enter" button. Sets `localStorage.enteredSite` flag on first visit. |
| **main.html** | Main hub with landing p5.js sketch and navigation dropdown. Displays SGD 4 (Quality of Education) content. Uses fade transitions between pages. |

### Individual Works (Artist-Specific Pages)

#### 1. **Trang — Planetary Soroban** (`trang.html` / `trangsketch.js`)
- **Description**: A generative exploration of planetary harmony through sound and motion, using a soroban (abacus) visual metaphor.
- **Visual Elements**:
  - 5-column soroban layout with 60px radius beads
  - 5000-star starfield background
  - Beads animate smoothly between positions (0.05 interpolation speed)
  - Max 1 simultaneous bead movement to simulate finger interaction
- **Audio**:
  - 3 ambient tracks (Ambience.wav, Ambience2.wav, Ambience3.wav) — one randomly selected per session
  - Bead movement sound (Bead.wav)
  - 2 click SFX (SFX1-Trang.wav, SFX2-Trang.wav)
  - Sound starts muted to comply with autoplay policies
- **Responsive**: Regenerates star buffer on window resize
- **Font**: JetBrainsMono-Light.ttf

#### 2. **Bach — Disrupted Saturn** (`bach.html` / `bachsketch.js`)
- **Description**: A showcase of generative audio and visual art responding to planetary motion, featuring Saturn's rings.
- **Visual Elements**:
  - Nebula background with white starfield (drawn from star array)
  - Dynamically generated Saturn rings (3–23 rings per spawn cycle)
  - Ring animation: smooth fade-out with rotation offset and arc drawing
  - Ring center: (950, 540) with base width 700 and height 90
  - Random ring spawn intervals and arc lengths
- **Audio**:
  - Planet ambience loop (planetAmbience)
  - Rings ambience loop (ringsAmbience)
  - 3 atmosphere/Saturn sounds (saturnSound array) — played on interaction
  - Sound state tracked via `audioStarted`, `isMuted`, `planetReady`, `ringsReady`
- **Controls**: Sound toggle button (toggles `isMuted` state)
- **Ring Class Features**:
  - Smooth alpha fade with configurable fade speed
  - Phase offset for staggered fade timing
  - Update and isDead methods for lifecycle management

#### 3. **Khoa — The Sun** (`khoa.html` / `khoasketch.js`)
- **Description**: Solar Rays sketch — a radiant exploration of the sun's light and motion.
- **Visual Elements**:
  - Counter-clockwise rotating rays emanating from center (80–150 rays per session)
  - Star buffer (1000 stars, pre-rendered for performance)
  - Gradient alpha fade on rays (200 inner → 30 outer, across 40 segments)
  - Canvas-responsive star buffer regeneration on resize
- **Audio**:
  - 3 sequential sound effects (sfx4.wav, sfx5.wav, sfx6.wav)
  - Looping playback through sfxList array with sfxIndex tracker
  - Sound state: `audioStarted`, `isMuted`, `isPlaying`
  - Auto-advances to next sound in sequence
- **Controls**: Audio sequence control with play/pause and global toggle
- **Performance**: Star buffer drawn once per canvas size change

#### 4. **Tin — Turbulence** (`tin.html` / `tinsketch.js`)
- **Description**: A turbulent, storm-like generative experience with complex motion and layered audio.
- **Canvas**: Responsive to window size; 750px boundary circle at center
- **Visual Elements**:
  - 2000-star starfield pre-rendered to off-screen buffer (refreshed once per setup)
  - Circular boundary at center with margin enforcement
  - Orbiting dancers with Perlin noise-driven center movement
  - Circular-buffer trails for performance optimization
  - Cached radius calculations for smooth movement
- **Audio Management**: Simplified `Sound` state and `S` sound map:
  - **Ambient**: storm.wav (0.4, looped when sound is on)
  - **Interactive**: track4_tone12.wav (0.8) on click inside boundary
  - **Transitions**: slide.wav (1.0) on enter/exit boundary
  - **Feedback**: blipSelect2tin.wav (0.6) on outside click
  - **Ambient Effects**: breathe (0.1, every 5–10s), jumpscare (0.7, every ~2–3m), space2 (0.5, every 120s when other lead sounds aren’t playing)
  - **Resize Sounds**: increase/decrease (0.1) when circle size changes
  - **State**: `Sound.started` and `Sound.muted`; simple helpers `playSound(name, vol, loop)` and `stopAllSounds()`
- **Scheduling**: Straightforward `setTimeout`/`setInterval` instead of a custom scheduler
- **Controls**: `toggleSound()` function; audio gated until first user interaction
- **Performance**:
  - Circular-buffer trails instead of array appending
  - Constant noise step (0.02) for consistent Perlin movement
  - Cached canvas center and circle radius
  - No unnecessary starfield regeneration per frame

### Shared Assets & Utilities

#### HTML/CSS
| File | Purpose |
|------|---------|
| **style.css** | Global styles: grid layout, fixed header, responsive canvas, typography (Typekit + Google Fonts), color variables (`--bg`, `--cl`, `--ac`), overlay/popup styling |
| **icon.png** | Logo/branding used in site header and navigation links |

#### JavaScript
| File | Purpose |
|------|---------|
| **script.js** | Landing page sketch (main.html): starfield generation, dot/square animation, page navigation, fade transitions, ambience audio (blip on selection, slide on hover). Includes `Dot` class with hover animation and `pageMap` object linking to works. |

#### Shared Patterns
- **Header Navigation**: Consistent across all work pages (trang.html, bach.html, khoa.html, tin.html) with dropdown "Works" menu
- **Sound Button**: Standard HTML sound toggle button (class `sound-button`) on all work pages
- **Info/Guide Popups**: Reused popup structure with close buttons across all pages
- **Responsive Canvas**: p5.js sketches scale to `windowWidth` × `windowHeight` on resize
- **Font Stack**: Typekit fonts + JetBrains Mono for monospace text
- **p5.js Version**: v1.11.11 with p5.sound addon

---

## Configuration & Customization

### Landing Page (script.js)
- **Dots**: Edit `dots` array to change landing page navigation points
- **Page Map**: Modify `pageMap` object to link dots to different HTML files
- **Colors**: Use CSS variables `--bg`, `--cl`, `--ac` in style.css for background, text, and accent colors

### Turbulence (tinsketch.js)
Edit the `CONFIG` object at the top of the file:
- **Canvas**: `CONFIG.canvas.bg`, `CONFIG.canvas.cl`, `CONFIG.canvas.sw` (stroke weight), `CONFIG.canvas.cr` (boundary radius)
- **Audio Volumes**: `CONFIG.audio.volumes.*` (0–1 scale)
- **Audio Intervals**: `CONFIG.audio.intervals.*` in milliseconds
- **Stars**: `CONFIG.stars.count`, `CONFIG.stars.noiseStep`
- **Audio Paths**: `CONFIG.audio.paths.*` (ensure files exist in root directory)

### Bach — Disrupted Saturn (bachsketch.js)
- **Ring Position**: `ringX`, `ringY` in `listOfRings()` function
- **Ring Dimensions**: `ringW`, `ringH`, `stepW`, `stepH` control base size and growth
- **Ring Count**: `count = 3 + Math.floor(Math.random() * 20)` for spawn variation
- **Fade Speed**: `this.fadeSpeed` in Rings class constructor

### Khoa — The Sun (khoasketch.js)
- **Ray Count**: `numQuads = int(random(80, 150))`
- **Rotation Speed**: `rot += random(-0.0001, -0.0005)` (negative = counter-clockwise)
- **Ray Length**: `triHeight = 750`
- **Alpha Fade**: `lerp(200, 30, t1)` for inner-to-outer gradient

### Trang — Planetary Soroban (trangsketch.js)
- **Canvas Dimensions**: `CANVAS_W = 1920`, `CANVAS_H = 1080`
- **Soroban Layout**: `COLS = 5`, `BEAD_RADIUS = 60`, `COL_SPACE = 220`
- **Movement Speed**: `MOVE_LERP = 0.05` (interpolation), `MOVE_THRESHOLD = 0.3` (snap distance)
- **Max Simultaneous Moves**: `MAX_ACTIVE_MOVES = 1`
- **Stars**: `NUM_STARS = 5000`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty space or unwanted scrolling | `html` and `body` have `overflow: hidden`; canvas is fixed within `#p5-container` |
| Audio not playing | Ensure first user interaction (click/touch) occurred before audio starts. Check audio file paths match `CONFIG.audio.paths` or respective preload statements. |
| Navigation flicker on transitions | All links point to correct HTML files; fade transitions use CSS + JS event listeners (`transitionend`) |
| Canvas not filling viewport | Window resize functions trigger `resizeCanvas(windowWidth, windowHeight)` — check for JS errors in browser console |
| Star buffer appearing stretched | Star buffer regenerates on `windowResized()` for each sketch; verify canvas dimensions are set before buffer creation |
| Popup not closing | Ensure popup overlay and content elements exist in HTML; `closeInfoPopup()` and `closeGuidePopup()` toggle `display: none` via CSS |

---

## File Dependencies

Each work page loads:
- p5.js library (CDN)
- p5.sound addon (CDN)
- style.css (shared)
- Respective sketch file (e.g., tinsketch.js for tin.html)
- Font libraries (Typekit + Google Fonts)

Audio files must be in the root `group_website/` directory to load correctly.

---

## Project Team

- **Trang** — Planetary Soroban concept & implementation
- **Bach** — Disrupted Saturn concept & implementation
- **Khoa** — The Sun (Solar Rays) concept & implementation
- **Tin** — Turbulence concept & implementation

Built as part of COMM2754 — A2w8 (Turbulence/Individual Reflection group project).
- Space2 not playing: verify `space2.wav` exists; check that tone and jumpscare are not playing (space2 is conditional)