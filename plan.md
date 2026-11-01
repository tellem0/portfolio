# My Portfolio — Build Plan
---

## Personal info

- **Name:** Lionel Tellem (also Lionel Sichom)
- **Location:** France
- **Role:** Cybersecurity student heading toward cloud security
- **Tagline:** "Happy meeting you! 😊"

---

## Introduction / Hero section

- Heading: "Lionel Tellem" (pixel title, SNES-style font — Press Start 2P)
- Sub-heading: "Cybersecurity student · France · Heading toward cloud security ☁️🔒"
- Blinking "PLAYER 1 READY" tag above the title
- Hero joke (built-in): **"Currently 0% compromised. Monitoring in progress. 🛡️"**
- CTA button: ▶ START GAME — scrolls down to the game world
- Background: sky gradient with three animated pixel clouds drifting across
- Scanline overlay for CRT effect
- Animated clouds adapt to the active colour theme

---

## About me

Content shown when the runner reaches Stage 1 (About Me sign):

- Cybersecurity student based in France
- Holds: **ISC2 Certified in Cybersecurity (CC)**
- Learning path: AWS Solutions Architect → then Cloud Security
- Applied to be an **AWS Student Builder Group Leader** (wish me luck! 🤞)
- Mission: Bridging the gap by helping classmates and the French community better understand AWS services, especially through analogies

---

## Skills

Displayed as a two-column card grid (plain section, always visible):

**✅ Unlocked**
- Security Fundamentals (ISC2 CC)
- AWS IAM Basics
- AWS CLI
- MFA & Account Hygiene
- Budgets & Cost Control

**🔄 In Progress**
- AWS Networking (VPC)
- Amazon S3
- Amazon EC2
- CloudFormation
- Cloud Security Services

---

## Projects

Content shown when the runner reaches Stage 2 (Projects sign):

1. **Raspberry Jam — Cameroon**
   Hosted a Raspberry Pi learning community and organised a Raspberry Jam.
   Link: https://www.raspberrypi.org/blog/raspberry-jam-cameroon-piparty/

2. **Arduino DIY YouTube Channel**
   Hands-on electronics projects — because sharing is caring !smiley.
   Link: https://www.youtube.com/playlist?list=PLLSsxX-xgRiOwkEvbtWkvHBzxq0xN0a1U

3. **Certification Roadmap**
   CLF-C02 (Dec 2026) → SAA-C03 (early 2027) → AWS Security Specialty

---

## Fun fact

Content shown when the runner reaches Stage 3 (Finish Line):

- Runner hobby: completed a marathon — "top 0.01% of people who have ever run one" *(stated clearly as a joke, not a real stat)*
- Planning two more marathons next year
- Favourite cartoon: The Simpsons 🍩
- **Photo:** `marathon.jpg` — Lionel running during a race, bib #809, File must be placed in the same folder as `index.html`. EXIF data should be removed before deploying.

---

## Contact

Content shown when the runner reaches Stage 4 (Contact sign), and also as a plain section at the bottom of the page:

| Platform          | URL / handle                                      |
|-------------------|--------------------------------------------------|
| LinkedIn          | https://www.linkedin.com/in/lionel-sichom/        |
| AWS Builder Center| https://community.aws/@tellem  (@tellem)          |
| YouTube           | https://www.youtube.com/@LionelTellem             |
| GitHub            | https://github.com/tellem0  (@tellem0)            |

**Public-safety rule:** no account IDs, ARNs, access keys, email addresses, or usernames visible anywhere on the site.

---

## Style & game world

### Theme
- Retro SNES/platformer aesthetic throughout
- Font: **Press Start 2P** (Google Fonts) with monospace fallback
- Three colour themes, cycled by the 🎨 button (persisted in localStorage):
  - **dark** (default) — deep navy/indigo, gold accent, red accent
  - **light** — warm parchment, orange/red accent
  - **neon** — near-black with cyan borders, pink/green accents

### Game canvas
- Full-width canvas, `max-width: 900px`
- Height: `clamp(220px, 40vw, 380px)` — scales with viewport, larger on desktop
- Pixel-art rendering (`image-rendering: pixelated`)
- `touch-action: none` to prevent scroll stealing on mobile

### Runner character
- Original pixel-art runner drawn on canvas (no Nintendo assets)
- White shirt + red shorts + race bib #809 — matches the marathon photo
- Two-frame stride animation (legs/arms alternate)
- Faces left or right depending on direction of travel

### Game mechanics
- **World width:** 1 400 px
- **Stage positions** (as % of world width):
  1. About Me — 20%
  2. Projects — 40%
  3. Finish Line (Fun Fact) — 62%
  4. Contact — 82%
- Runner moves with: Arrow keys ◀ ▶, A/D keys, or the on-screen gamepad
- Jumping: Arrow Up / W / Space (when on ground)
- Reaching a stage sign triggers the stage card and pops a **🪙 coin** above the runner
- Progress bar at the bottom of the canvas
- AWS service names rain gently from the sky (subtle, behind everything)
- In light theme the rain uses deep navy (`#1a3a6b`) at 4.55× opacity (capped at 0.92) for visibility against the pale sky
- Pixel clouds drift across the game sky
- Finish-line tape drawn at Stage 3

### Gamepad widget
Located below the canvas. Layout: `[D-pad] [LT.EXE label] [action buttons]`

- **D-pad (left side):** explicit 3×3 CSS grid
  - ◀ button at `grid-column:1 / grid-row:2`
  - centre nub at `grid-column:2 / grid-row:2`
  - ▶ button at `grid-column:3 / grid-row:2`
  - top/bottom rows are transparent spacers
- **Action buttons (right side):** two round buttons side by side
  - ♪ green — plays/mutes the chiptune (forwards to `#music-btn`)
  - 🎨 purple — cycles the colour theme (forwards to `#theme-btn`)
- Controller body: rounded pill shape with grip tabs via `::before` / `::after` (`pointer-events: none` so they never intercept clicks)
- Gamepad center and sides have `position: relative; z-index: 1` to sit above pseudo-elements
- Responsive: compresses on tablet (≤768px) and phone (≤480px), tap targets stay ≥ 44px

### Music
- Original chiptune loop generated in the browser via **Web Audio API** (no audio files, no Nintendo assets)
- Three voices: square-wave melody, triangle-wave bass, square-wave percussion
- **OFF by default** — browser autoplay policy prevents autoplay
- `AudioContext` creation wrapped in `try/catch`; calls `ctx.resume()` to handle browsers that create it in suspended state
- Play / Mute button in the navbar and on the gamepad
- Hint text above canvas blinks to prompt interaction

### Accessibility
- `prefers-reduced-motion`: animations skipped, game jumps straight to the About card
- All interactive elements have `aria-label`
- `role="status"` and `aria-live="polite"` on the hint and stage-card container
- `tabindex="0"` on the canvas for keyboard focus
- Minimum tap target size ≥ 44px on all devices
- Theme contrast maintained across all three themes

---

## Sections layout (top to bottom)

1. **Navbar** (fixed) — LT.EXE logo · nav links · Music button · Theme button
2. **Hero** — name, tagline, joke, START GAME button, drifting clouds
3. **Skills** — two-column unlocked / in-progress grid (always visible)
4. **Game World** — canvas + gamepad + stage cards
5. **Contact** — plain link section (LinkedIn, AWS Builder Center, YouTube, GitHub)
6. **Footer** — name, tagline, build note

---

## Security notes (implemented)

| # | Control | Status |
|---|---------|--------|
| 1 | Root MFA, root kept for rare tasks only | Planned |
| 2 | IAM admin user with MFA | Done |
| 3 | CLI profiles, keys never in the repository | Done |
| 4 | Budget alerts as a cost guardrail | Done |
| 5 | No admin access for a coding agent | Done |
| 6 | **Content Security Policy** — `media-src 'self' blob:`, `worker-src blob:`, `connect-src 'self'` in both HTML meta tag and `_headers` file | ✅ Built into index.html + _headers |
| 7 | GitHub access limited to one repository | Planned (until deployed) |

**Note:** The Security Receipts section (originally planned as a visible page section) was removed from the site. Controls are tracked here in the plan only.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Single-page markup, all sections, gamepad HTML, stage cards |
| `styles.css` | All styling — themes, layout, gamepad, canvas, responsive |
| `script.js` | Theme toggle, Web Audio chiptune, game loop, runner, coins |
| `marathon.jpg` | **You must place this file here** — marathon race photo |
| `_headers` | Amplify HTTP response headers — CSP sent as a real header (overrides meta tag) |
| `plan.md` | This file |

**Stack:** plain HTML5 · CSS3 · ES6 JavaScript — no frameworks, no build step, no backend, no npm.

---

## Decisions log

| Decision | Reason |
|----------|--------|
| Security Receipts section removed | Requested by user |
| No email address on site | Public-safety rule — avoids spam |
| Mario sprites not used | Nintendo copyright — original pixel art drawn instead |
| Music off by default | Browser autoplay policy; user must click to start |
| Music silent on Amplify (HTTPS) — fixed | CSP `connect-src 'none'` blocked Web Audio API on Chromium; `media-src` was missing; `_headers` file added so Amplify sends CSP as HTTP header |
| `WORLD_W = 1400` (was 3200) | Stages felt too far apart — reduced on user request |
| Canvas height `clamp(220px, 40vw, 380px)` | User requested larger game window, responsive on all devices |
| Gamepad D-pad: explicit 3×3 grid | Previous layout had buttons misaligned — rebuilt from scratch |
