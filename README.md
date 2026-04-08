# AfricaAncestry Landing Page

Dynamic hero landing page inspired by the provided reference design.

## Run locally

From the project root:

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## Files

- `index.html` - Page structure and content
- `styles.css` - Full visual design and responsive layout
- `app.js` - Dynamic interactions (parallax, reveal animations, mobile nav, floating embers)

## Use a different hero image

Update `--hero-image` in `styles.css`:

```css
--hero-image: url("Image Assets/ExampleHero2.png");
```

You can switch it to:

- `Image Assets/Hero.png`
- `Image Assets/Hero2.png`
- `Image Assets/ExampleHero.png`
