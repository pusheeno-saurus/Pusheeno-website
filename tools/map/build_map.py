#!/usr/bin/env python3
"""Build the "Where he's been" map.

Reads tools/map/places.json and tools/map/land-110m.json, writes assets/img/world.svg and
rewrites everything between the MAP:GENERATED markers in index.html (stats, pins, continent list).

Run from anywhere:  python3 tools/map/build_map.py
"""
import html, json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

# ---- Equal Earth projection (Savric, Patterson and Jenny, 2018) ----
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
M = math.sqrt(3) / 2

def equal_earth(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    t = math.asin(M * math.sin(phi))
    t2 = t * t
    t6 = t2 * t2 * t2
    x = lam * math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y

WIDTH = 1000.0
XMAX = equal_earth(180, 0)[0]
YMAX = equal_earth(0, 90)[1]
SCALE = WIDTH / (2 * XMAX)
HEIGHT = round(2 * YMAX * SCALE)

def to_svg(lon, lat):
    x, y = equal_earth(lon, lat)
    return (x + XMAX) * SCALE, (YMAX - y) * SCALE

# ---- Land outline from the TopoJSON ----
with open(os.path.join(HERE, 'land-110m.json'), encoding='utf-8') as f:
    topo = json.load(f)
(sx, sy), (tx, ty) = topo['transform']['scale'], topo['transform']['translate']
arcs = []
for arc in topo['arcs']:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)

def ring_points(ring):
    pts = []
    for idx in ring:
        a = arcs[idx] if idx >= 0 else arcs[~idx][::-1]
        pts.extend(a if not pts else a[1:])
    return pts

land = topo['objects']['land']
geoms = land['geometries'] if land['type'] == 'GeometryCollection' else [land]
rings = []
for g in geoms:
    if g['type'] == 'Polygon':
        rings.extend(g['arcs'])
    elif g['type'] == 'MultiPolygon':
        for poly in g['arcs']:
            rings.extend(poly)

def fmt(p):
    return '%.1f %.1f' % p

def split_antimeridian(pts):
    """Cut a ring wherever it jumps across the 180 degree meridian, so islands such as Fiji
    don't draw as a line across the whole map. Each piece is closed along the map edge."""
    pieces, cur = [], []
    for lon, lat in pts:
        if cur and abs(lon - cur[-1][0]) > 180:
            plon, plat = cur[-1]
            edge = 180 if plon > 0 else -180
            ulon = lon + 360 if plon > lon else lon - 360
            clat = plat if ulon == plon else plat + (edge - plon) / (ulon - plon) * (lat - plat)
            cur.append((edge, clat))
            pieces.append(cur)
            cur = [(-edge, clat)]
        cur.append((lon, lat))
    if not pieces:
        return [pts]
    pieces[0] = cur + pieces[0]   # the ring started mid-piece: join its tail to its head
    return pieces

land_d = []
split_count = 0
pieces = []
for ring in rings:
    parts = split_antimeridian(ring_points(ring))
    split_count += len(parts) - 1
    pieces.extend(parts)
for part in pieces:
    pts = [to_svg(lon, lat) for lon, lat in part]
    kept = []
    for p in pts:
        if not kept or abs(p[0] - kept[-1][0]) + abs(p[1] - kept[-1][1]) >= 0.5:
            kept.append(p)
    if len(kept) >= 3:
        land_d.append('M' + 'L'.join(fmt(p) for p in kept) + 'Z')

outline = []
outline += [to_svg(180, lat) for lat in range(-90, 91, 2)]
outline += [to_svg(lon, 90) for lon in range(180, -181, -5)]
outline += [to_svg(-180, lat) for lat in range(90, -91, -2)]
outline += [to_svg(lon, -90) for lon in range(-180, 181, 5)]
sphere_d = 'M' + 'L'.join(fmt(p) for p in outline) + 'Z'

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="World map">\n'
       '<style>.sea{fill:#fff;fill-opacity:.45;stroke:#2b2a33;stroke-opacity:.18;stroke-width:1}'
       '.land{fill:#bfe3cf;stroke:#86c7a4;stroke-width:.6;stroke-linejoin:round}'
       '@media (prefers-color-scheme:dark){.sea{fill:#000;fill-opacity:.25;stroke:#fff;stroke-opacity:.2}.land{fill:#4f9a74;stroke:#7fc9a0}}</style>\n'
       '<path class="sea" d="%s"/>\n<path class="land" fill-rule="evenodd" d="%s"/>\n</svg>\n'
       % (WIDTH, HEIGHT, WIDTH, HEIGHT, sphere_d, ''.join(land_d)))
svg_path = os.path.join(ROOT, 'assets', 'img', 'world.svg')
with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(svg)

# ---- Places: stats, pins and the list by continent ----
with open(os.path.join(HERE, 'places.json'), encoding='utf-8') as f:
    places = json.load(f)
home = next(p for p in places if p.get('home'))

def miles(a, b):
    la1, lo1, la2, lo2 = (math.radians(v) for v in (a['lat'], a['lon'], b['lat'], b['lon']))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 3958.8 * math.asin(math.sqrt(h))

farthest = max(places, key=lambda p: miles(home, p))
continents = []
countries = []
for p in places:
    if p['continent'] not in continents:
        continents.append(p['continent'])
    if p.get('country') and p['country'] not in countries:
        countries.append(p['country'])

stats = [('Continents', '%d of 7' % len(continents)), ('Countries', str(len(countries))),
         ('Farthest from home', '{:,} miles'.format(int(round(miles(home, farthest), -2))))]
stats_html = ''.join('          <li class="fact"><span class="fact-label">%s</span><span class="fact-value">%s</span></li>\n'
                     % (html.escape(k), html.escape(v)) for k, v in stats)

pins_html = ''
for p in places:
    x, y = to_svg(p['lon'], p['lat'])
    px, py = 100 * x / WIDTH, 100 * y / HEIGHT
    cls = 'pin' + (' pin-home' if p.get('home') else '') + (' edge-left' if px < 18 else ' edge-right' if px > 82 else '')
    label = p['name'] + ('. ' + p['note'] if p.get('note') else '')
    inner = html.escape(p['name']) + ('<small>%s</small>' % html.escape(p['note']) if p.get('note') else '')
    pins_html += ('          <button type="button" class="%s" style="left: %.2f%%; top: %.2f%%" aria-label="%s">'
                  '<span class="pin-label">%s</span></button>\n' % (cls, px, py, html.escape(label, quote=True), inner))

order = ['North America', 'South America', 'Antarctica', 'Europe', 'Asia', 'Oceania', 'Africa']
groups = {}
for p in places:
    groups.setdefault(p['continent'], []).extend(p.get('list') or [p['name']])
list_html = ''.join('          <li><strong>%s</strong><span>%s</span></li>\n'
                    % (html.escape(c), html.escape(' · '.join(groups[c]))) for c in order if c in groups)

generated = ('        <!-- MAP:GENERATED by tools/map/build_map.py from tools/map/places.json. Edit that file, not this block. -->\n'
             '        <ul class="facts map-stats reveal" aria-label="Travel stats">\n%s        </ul>\n'
             '        <div class="map reveal">\n'
             '          <img src="assets/img/world.svg" alt="World map with a pin on each place Pusheeno has been" width="%d" height="%d">\n'
             '%s        </div>\n'
             '        <ul class="places reveal" aria-label="Places by continent">\n%s        </ul>\n'
             '        <!-- /MAP:GENERATED -->' % (stats_html, WIDTH, HEIGHT, pins_html, list_html))

index_path = os.path.join(ROOT, 'index.html')
with open(index_path, encoding='utf-8') as f:
    page = f.read()
page, n = re.subn(r'        <!-- MAP:GENERATED.*?<!-- /MAP:GENERATED -->', lambda m: generated, page, flags=re.S)
if n != 1:
    raise SystemExit('index.html needs exactly one MAP:GENERATED block')
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(page)

print('world.svg: %d KB, %d land rings, %d split at the 180 meridian' % (os.path.getsize(svg_path) // 1024, len(land_d), split_count))
print('pins: %d | continents: %s | countries: %d | farthest: %s, %s miles'
      % (len(places), ', '.join(continents), len(countries), farthest['name'], '{:,}'.format(int(round(miles(home, farthest), -2)))))
