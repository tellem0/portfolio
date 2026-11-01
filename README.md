# Lionel Tellem — Portfolio

> Cybersecurity student · France · Heading toward cloud security ☁️🔒

A retro SNES-style platformer portfolio built for the **AWS Student Builder Challenge**.  
No frameworks, no build step, no backend — plain HTML5, CSS3, and ES6 JavaScript.

Live on **AWS Amplify**.

---

## What it is

Instead of a traditional portfolio page, visitors play a side-scrolling game.  
A pixel-art runner (white shirt, red shorts, race bib #809) moves along a path with four stages.  
Reaching each stage sign opens a card with content about me.

| Stage | Content |
|-------|---------|
| 1 — About Me | Who I am, my ISC2 CC cert, my AWS learning path, my mission |
| 2 — Projects | Raspberry Jam Cameroon, Arduino YouTube channel, cert roadmap |
| 3 — Finish Line | Marathon fun fact + photo, The Simpsons |
| 4 — Contact | LinkedIn, AWS Builder Center, YouTube, GitHub |

---

## Features

- **Retro game world** — side-scrolling canvas, pixel-art runner, coin pop on each stage reached
- **AWS service name rain** — IAM, S3, EC2, Lambda… drift down from the sky (subtle)
- **Chiptune music** — original loop synthesised in the browser via Web Audio API, off by default
- **Gamepad widget** — on-screen controller with D-pad (◀ ▶), ♪ music button, 🎨 theme button
- **Three colour themes** — dark (default), light, neon — cycled by button, persisted in localStorage
- **Press Start 2P** font throughout (SNES aesthetic)
- **Fully responsive** — canvas and gamepad scale from desktop to phone (tap targets ≥ 44px)
- **Reduced-motion support** — skips animation, jumps straight to About card
- **Content Security Policy** — enforced via both HTML meta tag and Amplify `_headers` file

---

## Project structure

```
portfolio/
├── index.html      # All markup — sections, gamepad, stage cards
├── styles.css      # Themes, layout, gamepad, canvas, responsive
├── script.js       # Theme toggle, Web Audio chiptune, game engine
├── marathon.jpg    # Race photo - EXIF removed for privacy
├── _headers        # Amplify HTTP response headers (CSP)
├── plan.md         # Full build plan and decisions log
└── README.md       # This file
```

---

## Running locally

No server needed — open `index.html` directly in any modern browser:

```
# Windows
start index.html

# macOS
open index.html
```

---

## Deploying to AWS Amplify

1. Push this folder to a GitHub repository
2. Connect the repo to AWS Amplify (Hosting → Host web app → GitHub)
3. Amplify detects a static site — no build command needed
4. Set the build output directory to `/` (root)
5. The `_headers` file is automatically picked up and served as HTTP response headers

> **Important:** make sure `marathon.jpg` is committed to the repo before deploying, or the Fun Fact card will show a broken image.

---

## Before deploying — checklist

- [ ] `marathon.jpg` is in the root folder
- [ ] EXIF metadata stripped from `marathon.jpg` (removes GPS location data)
- [ ] No account IDs, ARNs, access keys, or email addresses anywhere in the code
- [ ] Test all four stage cards open correctly
- [ ] Test music button in Chrome, Firefox, and Safari
- [ ] Test on mobile (gamepad tap targets, canvas resize)

---

## Contact

| Platform | Link |
|----------|------|
| LinkedIn | [linkedin.com/in/lionel-sichom](https://www.linkedin.com/in/lionel-sichom/) |
| AWS Builder Center | [community.aws/@tellem](https://community.aws/@tellem) |
| YouTube | [youtube.com/@LionelTellem](https://www.youtube.com/@LionelTellem) |
| GitHub | [github.com/tellem0](https://github.com/tellem0) |

---

## Tech notes

**Why no framework?**  
Plain files deploy anywhere with zero build step, zero dependencies, and zero supply-chain risk. Good fit for a security-focused portfolio.

**Why Web Audio API for music?**  
No audio files to host or copyright. The chiptune is generated entirely in the browser from oscillators — original composition, not a Nintendo asset.

**Why `_headers`?**  
AWS Amplify serves its own HTTP response headers which override `<meta http-equiv="Content-Security-Policy">`. The `_headers` file ensures the CSP is delivered as a real HTTP header, which is also required for Web Audio API to function correctly on Chromium over HTTPS (`connect-src` and `media-src` directives).

**Stack:** HTML5 · CSS3 · ES6 · Web Audio API · Canvas 2D · AWS Amplify
