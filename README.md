# 💚 Matrix Love — hacker's way to say I LOVE YOU

> Day 1 of 100 · Daily Reel Challenge by **[@hack.n.code](https://www.instagram.com/hack.n.code/)**

**▶ Live demo: https://matrixlove-hackncode.sites.tab.bot/**

Matrix-style green code rain fills the screen… then the falling characters pour into a big glowing heart, and the message **I LOVE YOU** decrypts itself out of the code. Tap the heart → it pulses and the whole rain turns pink 💖.

Plain **HTML + CSS + JavaScript (Canvas)**. No libraries, no build step.

## ✨ Make it personal

Add URL parameters and send the link to your person:

| Param | Example | What it does |
|---|---|---|
| `name` | `?name=My%20Love` | shows **For My Love** under the heart (default: *For you*) |
| `msg` | `?msg=I%20MISS%20YOU` | changes the decrypted message (max 14 chars) |

Example: https://matrixlove-hackncode.sites.tab.bot/?name=My%20Love&msg=I%20LOVE%20YOU

Or just tap **Make yours ✍️** on the page — it builds the link for you. **Share 💚** uses your phone's share sheet.

## 🧠 How it works

- **Code rain** – every column has drops with a random speed & length. Glyphs stay on a grid while the bright "head" moves down, so it looks exactly like the movie.
- **Heart shape** – grid cells inside the classic heart curve `(x² + y² − 1)³ − x²y³ ≤ 0` become targets. Each one is a drop that falls down its column and *lands* — bottom first, so the heart fills up like a glass.
- **Decrypt effect** – each letter of the message scrambles through random characters and then locks, one by one.
- **Glow** – bright glyphs are drawn on a separate layer and blurred back on top (bloom).
- **Tap** – heart pulse + shockwave rings + flying ♥, and the colour smoothly blends green → pink.

## 📁 Files

```
index.html   – page + UI
style.css    – neon terminal styles
script.js    – rain, heart, decrypt, tap, share
```

## 🚀 Run it

Open `index.html` in a browser — that's it. Or fork & deploy on GitHub Pages / Netlify.

---

Made with 💚 by **[@hack.n.code](https://www.instagram.com/hack.n.code/)** — comment **MATRIX** on the reel for more code like this. Follow for 100 days, 2 reels a day 💻
