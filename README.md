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
| `tools/crew/` | The friends list and the script that builds the crew cards |
| `tools/map/` | The places list, the map data and the script that draws the map |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages on every push to the default branch |

## Editing content

Everything visible is in `index.html`. Each section is marked with a comment such as
`<!-- ============ ABOUT ============ -->`.

**Add a photo to the gallery**

1. Save the photo in `assets/img/` as a JPG about 1600px on its long side, plus an 800px copy with
   `-thumb` before `.jpg` (for example `pusheeno-10.jpg` and `pusheeno-10-thumb.jpg`). Export without
   location data, or let any image tool strip it.
2. The gallery is split into groups ("The two of them", "On the road", "Snack time", "The crew"). Copy one of the
   `<a class="photo">` blocks into the right group's `.photo-grid` in `index.html` and change `href`,
   `src`, `alt`, `width`, `height` and `data-caption`.
3. Use `class="photo tall"` for a portrait photo that should span two rows, and `object-position`
   on the `<img>` to choose which part stays visible in the grid. Keep each group's cell count a
   multiple of 4 (a tall photo counts as 2) so every row is full on both desktop and phones.

**The two of them** is the first gallery group. A landscape photo can use `class="photo wide"` to span
two columns; a group's cell count must stay a multiple of 4 (tall and wide photos count as 2).

**Add or edit a friend in Meet the crew**

1. Edit `tools/crew/crew.json`: name, bio, the photo to cut the portrait from, the square to cut
   (`crop` = left, top, side as fractions of the photo), and the words that identify the friend in
   captions, which drive the "In N photos" count.
2. Run `python3 tools/crew/build_crew.py`. It writes the portraits to `assets/img/crew/` and rewrites
   the cards between the `CREW:GENERATED` markers in `index.html`. Re-run it after adding gallery
   photos so the counts stay right.

**Look after Pusheeno (the Play section)**

A small virtual-pet toy. Visitors feed him matcha or pandan, pat him, or send him on a trip; three
meters (snacks, adventure, cuddles) drain slowly in real time, and his face follows their average
from furious to "tolerating you". He never looks happy. Each trip sends back a postcard drawn at
random from the gallery photos, so new gallery photos join the game automatically. Progress is saved
in each visitor's own browser. What he says lives in the `LINES` list in `assets/js/main.js`, under
"Look after Pusheeno".

**Suggestions form ("Where should he go next?")**

Suggestions go to a Google Form, so answers land privately in Google Forms and its linked Sheet. The
form stays hidden on the site until it is connected. To connect or change it:

1. In the Google Form, open the ⋮ menu, choose **Get pre-filled link**, type any answer into each
   question, click **Get link**, and copy it. It looks like
   `https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.111=...&entry.222=...&entry.333=...`.
2. On `<form id="suggest-form">` in `index.html`, set `data-action` to the same address with
   `viewform?...` replaced by `formResponse`, and set `data-entry-place`, `data-entry-idea` and
   `data-entry-name` to the matching `entry.NNN` ids.

The form must not require sign-in: in its settings, leave "Collect email addresses" off and
"Limit to 1 response" off.

**Add a place to the map**

1. Add an entry to `tools/map/places.json`: name, latitude, longitude, continent, country, and an
   optional `note` for the tooltip. Nearby places can share one pin: name them all in `name` or `note`, which is what the hover label shows.
2. Run `python3 tools/map/build_map.py`. It redraws `assets/img/world.svg` and rewrites the stats
   line and the pins between the `MAP:GENERATED` markers in `index.html`.
3. Commit the changed files.

The coastlines come from Natural Earth via the `world-atlas` package (ISC licence), stored in
`tools/map/land-110m.json`.

**Change the hero photo**: replace `assets/img/pusheeno-hero.jpg` with a new 900 x 1100 image, or point
the hero `<img>` at a different file. Portrait orientation (taller than wide) looks best.

**Social links**: the Follow section has one card, for Instagram. To add a network, copy the
`<li>` block and change its link, icon and text.

**Share preview image**: `assets/img/og-image.jpg` is what shows when the link is shared on social
media. Replace it with a 1200 x 630 photo.

## Publishing with GitHub Pages

One-time setup in the repository on GitHub:

1. Settings → Pages → under **Build and deployment**, set **Source** to **GitHub Actions**.
2. Every push to the repository's default branch runs `.github/workflows/deploy.yml`, which deploys
   the site and prints its URL. (GitHub only lets the default branch deploy to the github-pages
   environment; if you change the default branch, update the branch name in the workflow too.)

**Using the custom domain**

1. Settings → Pages → **Custom domain**: enter `www.pusheenosaurus.com` and save. The site deploys
   through GitHub Actions, so the domain lives in that setting, not in a `CNAME` file.
2. At the domain's DNS provider (Squarespace), add a `CNAME` record for `www` pointing to
   `pusheeno-saurus.github.io`, and `A` and `AAAA` records for the root domain pointing to GitHub
   Pages' addresses, listed in GitHub's docs under "Managing a custom domain for your GitHub Pages
   site". Remove any older records for `@` and `www` that point elsewhere.
3. Once the DNS check in Settings → Pages passes, tick **Enforce HTTPS**.
