# Pusheeno's website

The source for [pusheenosaurus.com](https://www.pusheenosaurus.com/): a single-page site about Pusheeno,
the one and only Pusheenosaurus.

It is plain HTML, CSS and JavaScript with no build step, so every file here is exactly what the browser
receives. Open `index.html` in a browser to preview it locally.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole site: hero, About, Gallery, Follow, footer |
| `assets/css/style.css` | Styles. Colours and fonts live in the `:root` block at the top |
| `assets/js/main.js` | Mobile menu, scroll-in animation, photo lightbox |
| `assets/img/` | Logo, favicon and photos |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages on every push to `main` |

## Editing content

Everything visible is in `index.html`. Each section is marked with a comment such as
`<!-- ============ ABOUT ============ -->`.

**Add a photo to the gallery**

1. Save the photo in `assets/img/` as a JPG about 1600px on its long side, plus an 800px copy with
   `-thumb` before `.jpg` (for example `pusheeno-10.jpg` and `pusheeno-10-thumb.jpg`). Export without
   location data, or let any image tool strip it.
2. Copy one of the `<a class="photo">` blocks inside `.photo-grid` in `index.html` and change `href`,
   `src`, `alt`, `width`, `height` and `data-caption`.
3. Use `class="photo tall"` for a portrait photo that should span two rows, and `object-position`
   on the `<img>` to choose which part stays visible in the grid. Keep the total at 12 grid cells
   (a tall photo counts as 2) so every row is full.

**Change the hero photo**: replace `assets/img/pusheeno-hero.jpg` with a new 900 x 1100 image, or point
the hero `<img>` at a different file. Portrait orientation (taller than wide) looks best.

**Social links**: the Follow section has one card, for Instagram. To add a network, copy the
`<li>` block and change its link, icon and text.

**Share preview image**: `assets/img/og-image.jpg` is what shows when the link is shared on social
media. Replace it with a 1200 x 630 photo.

## Publishing with GitHub Pages

One-time setup in the repository on GitHub:

1. Settings → Pages → under **Build and deployment**, set **Source** to **GitHub Actions**.
2. Merge this branch into `main`. The workflow in `.github/workflows/deploy.yml` deploys the site and
   prints its URL.

**Using the custom domain**

1. Settings → Pages → **Custom domain**: enter `www.pusheenosaurus.com` and save. GitHub creates a
   `CNAME` file in the repository.
2. At the domain registrar, add a `CNAME` record pointing `www` to `pusheeno-saurus.github.io`, and,
   for the bare domain, `A` records to GitHub Pages' IPs (listed in GitHub's docs under
   "Managing a custom domain for your GitHub Pages site").
3. Once the DNS check passes, tick **Enforce HTTPS**.
