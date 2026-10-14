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

1. Put the image in `assets/img/` (JPG or PNG, ideally under 500 KB).
2. Copy one of the `<a class="photo">` blocks inside `.photo-grid` and change `href`, `src`, `alt`
   and `data-caption`.
3. Add the class `tall` (`class="photo tall"`) to make a portrait photo span two rows.

**Change the hero photo**: replace `assets/img/hero-placeholder.svg` in the hero `<img>` with your
portrait. Portrait orientation (taller than wide) looks best.

**Social links**: edit the `href` and `@handle` text in the Follow section. Delete any card for a
network Pusheeno isn't on.

**Share preview image**: `assets/img/og-image.png` is what shows when the link is shared on social
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
