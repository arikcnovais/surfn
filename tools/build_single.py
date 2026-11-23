#!/usr/bin/env python3
"""Build SURFN 2000 as one self-contained index.html.

Everything the game needs — the eleven ES modules, the stylesheet, the atlases,
every PNG, the audio manifest, the soundtrack and the SFX — is inlined into a
single file, so it opens straight from a download (file://) with no server.

  python3 tools/build_single.py              # full build (~20 MB, with music)
  python3 tools/build_single.py --no-audio    # tiny build (no soundtrack)

dev.html stays the modular entry point (it loads js/main.js and css/style.css
over HTTP). Run the build after changing source files and it regenerates
index.html from dev.html.
"""
import base64
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRY = 'js/main.js'
CACHE = os.path.join(ROOT, '.tmp', 'embed')
MUSIC_BITRATE = 40   # kbps, mono — 77 MB of MP3 becomes ~12 MB
SFX_BITRATE = 64


def log(msg):
    print(f'  {msg}')


def read(path):
    with open(os.path.join(ROOT, path), 'r', encoding='utf-8') as fh:
        return fh.read()


# --------------------------------------------------------------- JS bundling
IMPORT_RE = re.compile(r"^import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';[ \t]*\r?\n?", re.M)
REEXPORT_RE = re.compile(r"^export\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';[ \t]*\r?\n?", re.M)
EXPORT_LIST_RE = re.compile(r"^export\s*\{([\s\S]*?)\};[ \t]*\r?\n?", re.M)
DECL_RE = re.compile(
    r"^export\s+(?:async\s+)?(function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)", re.M)
NAME_RE = re.compile(r"^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$")


def parse_pairs(inner, where):
    pairs = []
    for part in inner.split(','):
        part = part.strip()
        if not part:
            continue
        m = NAME_RE.match(part)
        if not m:
            raise SystemExit(f'cannot parse names {part!r} in {where}')
        pairs.append((m.group(1), m.group(2) or m.group(1)))
    return pairs


def module_id(path):
    return path.replace(os.sep, '/')


def resolve(from_path, spec):
    base = os.path.dirname(from_path)
    return module_id(os.path.normpath(os.path.join(base, spec)))


def collect(entry):
    order, seen = [], set()

    def visit(path):
        if path in seen:
            return
        seen.add(path)
        src = read(path)
        for m in IMPORT_RE.finditer(src):
            visit(resolve(path, m.group(2)))
        for m in REEXPORT_RE.finditer(src):
            visit(resolve(path, m.group(2)))
        order.append(path)

    visit(entry)
    return order


def transform(path):
    """ES module -> plain function body that returns its export object."""
    src = read(path)
    deps = []       # (module id, [(name in dep, local name)])
    exports = []    # (exported name, local name)

    def take_reexport(m):
        pairs = parse_pairs(m.group(1), path)
        dep = resolve(path, m.group(2))
        deps.append((dep, pairs))
        for _, local in pairs:
            exports.append((local, local))
        return ''

    def take_import(m):
        pairs = parse_pairs(m.group(1), path)
        deps.append((resolve(path, m.group(2)), pairs))
        return ''

    def take_list(m):
        pairs = parse_pairs(m.group(1), path)
        for orig, alias in pairs:
            exports.append((alias, orig))
        return ''

    def take_decl(m):
        exports.append((m.group(2), m.group(2)))
        return f'{m.group(1)} {m.group(2)}'

    src = REEXPORT_RE.sub(take_reexport, src)
    src = IMPORT_RE.sub(take_import, src)
    src = EXPORT_LIST_RE.sub(take_list, src)
    src = DECL_RE.sub(take_decl, src)

    leftover = re.search(r"^(?:import|export)\b", src, re.M)
    if leftover:
        raise SystemExit(f'unhandled module syntax in {path}: '
                         f'{src[leftover.start():leftover.start() + 70]!r}')

    head = []
    for dep, pairs in deps:
        binding = ', '.join(a if a == b else f'{a}: {b}' for a, b in pairs)
        head.append(f"const {{ {binding} }} = __req('{dep}');")
    fields = ', '.join(a if a == b else f'{a}: {b}' for a, b in exports)
    return '\n'.join(head) + '\n' + src + f'\nreturn {{ {fields} }};'


def bundle(entry=ENTRY):
    order = collect(entry)
    parts = ['(function () {',
             'const __defs = {}, __cache = {};',
             'function __def(id, fn) { __defs[id] = fn; }',
             'function __req(id) {',
             "  if (!(id in __cache)) __cache[id] = __defs[id]();",
             '  return __cache[id];',
             '}']
    for path in order:
        parts.append(f"__def('{module_id(path)}', function () {{")
        parts.append(transform(path))
        parts.append('});')
    parts.append(f"__req('{module_id(entry)}');")
    parts.append('})();')
    return '\n'.join(parts), order


# ------------------------------------------------------------------ assets
def data_uri(path):
    ext = os.path.splitext(path)[1].lower()
    mime = {'.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
            '.woff2': 'font/woff2', '.woff': 'font/woff'}.get(ext, 'application/octet-stream')
    with open(os.path.join(ROOT, path), 'rb') as fh:
        return f'data:{mime};base64,' + base64.b64encode(fh.read()).decode('ascii')


def inline_css_urls(css):
    """Point the stylesheet's url()s at data URIs so file:// needs no files.

    Paths are resolved from css/, which is where style.css lives in the dev
    tree; anything remote or already inline is left alone.
    """
    def repl(m):
        rel = m.group(2)
        if rel.startswith('data:') or rel.startswith('http') or rel.startswith('//'):
            return m.group(0)
        path = os.path.normpath(os.path.join('css', rel)).replace(os.sep, '/')
        if not os.path.isfile(os.path.join(ROOT, path)):
            log(f'css url() not found, left as-is: {rel}')
            return m.group(0)
        return 'url("' + data_uri(path) + '")'

    return re.sub(r'url\((["\']?)([^)"\']+)\1\)', repl, css)


def walk_assets():
    out = []
    for base, _dirs, files in os.walk(os.path.join(ROOT, 'assets')):
        for name in sorted(files):
            full = os.path.relpath(os.path.join(base, name), ROOT)
            if os.path.splitext(name)[1].lower() in ('.png', '.jpg', '.json'):
                out.append(module_id(full))
    return sorted(out)


def transcode(src, bitrate, tag):
    """Re-encode one audio file to small mono MP3 (cached in .tmp/embed)."""
    os.makedirs(os.path.join(CACHE, 'audio'), exist_ok=True)
    stem = os.path.splitext(os.path.basename(src))[0]
    out = os.path.join(CACHE, 'audio', f'{stem}-{tag}.mp3')
    src_full = os.path.join(ROOT, src)
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src_full):
        return out
    # note: element and property are separate argv tokens; gst-launch re-joins
    # argv with spaces and chokes on a single token that already contains one
    cmd = ['gst-launch-1.0', '-q', 'filesrc', f'location={src_full}', '!', 'decodebin',
           '!', 'audioconvert', '!', 'audioresample', '!', 'lamemp3enc',
           'target=bitrate', f'bitrate={bitrate}', 'mono=true', 'cbr=true',
           '!', 'filesink', f'location={out}']
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not os.path.exists(out):
        raise SystemExit(f'ffmpeg is not here and gstreamer failed on {src}:\n{res.stderr[:400]}')
    return out


def audio_map(manifest, with_music):
    out = {}
    t0 = time.time()
    files = list(manifest.get('sfx', {}).values())
    if with_music:
        files += [m['file'] for m in manifest.get('music', [])]
    for i, rel in enumerate(files, 1):
        src = 'audio/' + rel
        if not os.path.exists(os.path.join(ROOT, src)):
            log(f'missing {src}, skipped')
            continue
        bitrate = MUSIC_BITRATE if rel.startswith('music/') else SFX_BITRATE
        tag = f'{bitrate}k'
        out[rel] = 'data:audio/mpeg;base64,' + base64.b64encode(
            open(transcode(src, bitrate, tag), 'rb').read()).decode('ascii')
        log(f'[{i}/{len(files)}] {rel} -> {len(out[rel]) // 1024} KB')
    log(f'audio encoded in {time.time() - t0:.1f}s')
    return out


# -------------------------------------------------------------------- build
def main():
    with_music = '--no-audio' not in sys.argv
    os.chdir(ROOT)

    log('bundling modules…')
    js, order = bundle()
    log(f'{len(order)} modules, {len(js) // 1024} KB')

    payload = {'json': {}, 'img': {}, 'audio': {}}
    for rel in walk_assets():
        if rel.endswith('.json'):
            payload['json'][rel] = json.loads(read(rel))
        else:
            payload['img'][rel] = data_uri(rel)
    log(f'{len(payload["json"])} json + {len(payload["img"])} images')

    manifest = json.loads(read('audio/manifest.json'))
    payload['json']['audio/manifest.json'] = manifest
    payload['audio'] = audio_map(manifest, with_music)
    if not with_music:
        manifest['music'] = []

    embedded = json.dumps(payload, separators=(',', ':')).replace('</', '<\\/')
    css = inline_css_urls(read('css/style.css'))
    html = read('dev.html')
    # plain str.replace: the bundle is megabytes of JS, so it must never be
    # treated as a regex replacement template
    link = '<link rel="stylesheet" href="css/style.css" />'
    icon = '<link rel="icon" type="image/png" href="assets/favicon.png" />'
    module_script = '<script type="module" src="js/main.js"></script>'
    if link not in html or module_script not in html:
        raise SystemExit('dev.html lost its stylesheet or module script tag')
    if icon not in html:
        raise SystemExit('dev.html lost its favicon link')
    html = html.replace(link, '<style>\n' + css + '\n  </style>')
    html = html.replace(icon, '<link rel="icon" type="image/png" href="'
                      + data_uri('assets/favicon.png') + '" />')
    script = ('<script>\nwindow.__SURFN_EMBED = ' + embedded + ';\n'
              + js.replace('</', '<\\/') + '\n  </script>')
    html = html.replace(module_script, script)
    if 'type="module"' in html or 'css/style.css' in html:
        raise SystemExit('the template changed; dev.html no longer matches the build')

    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write(html)
    size = os.path.getsize(out)
    log(f'index.html: {size / 1048576:.1f} MB')


if __name__ == '__main__':
    main()
