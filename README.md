# Opulexis

Pure static marketing site with an embedded ROI calculator. No dependencies or build step.

## Source

- GitHub: https://github.com/kingsmangithub/opulexis-calculators

## Production

- Custom domain: https://calculators.opulexis.com/
- Calculator: https://calculators.opulexis.com/calculator/
- Vercel alias: https://opulexis-calculators.vercel.app/
- Project: Vercel `opulexis-calculators` (Hobby / dons-projects)

### iframe embed

```html
<iframe
  src="https://calculators.opulexis.com/calculator/"
  title="Opulexis ROI Calculator"
  loading="lazy"
  style="width:100%;max-width:1040px;height:1050px;border:0;"
></iframe>
```

## Open locally

Open `index.html` in a browser. For local HTTP preview, run from this directory:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000/> for the landing page and <http://localhost:8000/calculator/> for the standalone calculator.

## Paths

- `/` — English marketing landing page (`index.html` and `landing.css`).
- `/calculator/` — calculator (`index.html`, `styles.css`, `formula.js`, and `app.js`) with assumption-based net value and value / cost ratio. Run `node calculator/acceptance.test.js` to verify its formulas and input bounds.

Deploy this directory as the static site root. No install or build command is needed.

## Embed the calculator

For a page hosted on the same domain:

```html
<iframe
  src="/calculator/"
  title="Opulexis interactive ROI calculator"
  loading="lazy"
  style="display: block; width: 100%; min-height: 920px; border: 0; border-radius: 12px;"
></iframe>
```

For another website, use the full URL of your deployed calculator (for example, `https://your-domain.com/calculator/`) as `src`. The frame scrolls internally when its content exceeds its height; adjust the height to suit the host page, especially on mobile.

## Support and motion

Questions: [hello@opulexis.com](mailto:hello@opulexis.com).

Both pages share `motion.css` and `motion.js`: once-only IntersectionObserver reveals, gentle hover/press feedback, and brief metric updates. Reduced-motion preferences disable motion; content stays visible without JavaScript or IntersectionObserver. No libraries or build step.
