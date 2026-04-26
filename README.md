# Easy Game

A tiny endless runner for boring moments.

You run on a flat road, jump over obstacles, and see how many meters you can survive. It works on desktop and mobile:

- Desktop: press `Space` or `ArrowUp`
- Mobile: tap the screen or the jump button
- Double jump: press/tap again while in the air
- Endless mode with gradually increasing speed
- Best score saved locally in the browser

## Play Locally

Open `index.html` in a browser:

```bash
open index.html
```

No build step, no dependencies, no server required.

## Deploy As A Website

This repo is ready for GitHub Pages. After pushing to GitHub:

1. Open the repository on GitHub
2. Go to **Settings → Pages**
3. Set **Source** to **GitHub Actions**
4. Push to `main`
5. The site will be deployed by `.github/workflows/pages.yml`

The final URL will look like:

```text
https://whatsupp762.github.io/littlegame/
```

## Files

```text
littlegame/
├── index.html
├── styles.css
├── game.js
├── README.md
├── LICENSE
└── .github/workflows/pages.yml
```

## License

MIT
