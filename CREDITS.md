# SURFN 2000 — créditos / credits

Quem fez o jogo e o que ele realmente tem: seção **Jogo / Game** abaixo.
O resto do arquivo cobre o áudio licenciado.

Who made the game and what it actually contains: see **Jogo / Game** below.
The rest of this file covers the licensed audio.

## Áudio / Audio

O áudio do SURFN 2000 usa faixas e efeitos de bibliotecas públicas e de artistas
que liberaram o material para projetos não comerciais. Cada arquivo está em
`audio/` e cada licença está repetida em `audio/manifest.json`.

This game is free and non-commercial. If any creator wants their work removed,
we will remove it from the next build — no argument, no delay.

## Jogo / Game

**SURFN 2000** foi criado por **FloatingSkies**, também conhecido como
**Arikcnovais** e **azzynovais** — os três nicks são a mesma pessoa. Código,
arte, level design, texto, direção e o site do jogo são dele.

**SURFN 2000** was created by **FloatingSkies**, also known as **Arikcnovais**
and **azzynovais** (all three names are the same person): code, art, level
design, writing, direction and the game's site.

O que está no jogo, para os créditos baterem com o que existe:

- 10 capítulos de carreira em 7 mapas (Pool Day, Iceworld, Lagoa, Dust Surf,
  Assault, Templo e Heaven), cada um com sua prova de minigame.
- 5 capítulos da Lenda contra o Zel, com dificuldade própria e trilha BLACK ROSE.
- Pós-game livre: vila com NPCs e horários, festas, conquistas, fitas, bônus,
  RELÍQUIAS, modo REMIX e o arquivo escondido do modem dourado.
- Zel vem de `spritesheets/zel v2 spritesheet.png` (o redesenho com shorts de praia), recortado por
  `tools/slice_zel.py` em 16 poses e 4 direções; tiles, ondas, props, retratos,
  ícones e papéis de parede saem dos geradores em `tools/`.
- O favicon (`assets/favicon.png`) é um recorte da cabeça do Zel feito por
  `tools/gen_favicon.py`.
- O motor é o **Paperwing**, o mini engine do projeto skyblock, com áudio e
  fallback sintetizado próprios.
- Tipografia: **Comic Relief** (The Comic Relief Project Authors), SIL Open Font
  License 1.1 — `assets/fonts/OFL.txt`. Os `.woff2` ficam em `assets/fonts/` e
  entram no build único como data URI, então o jogo abre sem internet.
- Sem login, sem anúncio, sem servidor: o progresso fica no `localStorage` do
  navegador, chave `surfn-2000-save-v1`.
- `dev.html` é a entrada modular; `python3 tools/build_single.py` gera o
  `index.html` único, com tudo embutido (inclusive o favicon).

## Música / Music

| Faixa | Artista | Ano | Licença | Fonte |
| --- | --- | --- | --- | --- |
| **Glorious Morning** | Waterflame | 2007 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/91476) |
| **Jumper** | Waterflame | 2008 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/168734) |
| **Rose at Midnight (BLACK ROSE Ver.)** | NemesisTheory | 2023 (original de 2008) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/1268622) |
| **Rose at Nightfall (BLACK ROSE Ver.)** | Legendary x NemesisTheory | 2025 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/1444286) |
| **Rose at Twilight (BLACK ROSE Ver.)** | Legendary x NemesisTheory | 2026 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/1508320) |
| **Ricochet Love** | Waterflame | 2009 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/233860) |
| **Chaotic** | Waterflame | 2010 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/316681) |
| **Glorious Morning 2** | Waterflame | 2013 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/554504) |
| **Electroman Adventures** | Waterflame | 2012 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/479319) |
| **Space Pirates** | Waterflame | 2006 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/57239) |
| **Techock** | Waterflame | 2005 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/36355) |
| **The Show** | Waterflame | 2008 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/169148) |
| **Swampland** | Waterflame | 2008 | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | [Newgrounds](https://www.newgrounds.com/audio/listen/168396) |
| **Electronaut** | Aerologic | 2001–2013 | [CC BY-NC 3.0](https://creativecommons.org/licenses/by-nc/3.0/) | [Internet Archive / Toucan Music](https://archive.org/details/toulp6) |

Waterflame also publishes blanket permission for free, non-commercial use with
credit and a link back: <https://www.waterflame.com/contact-info>. The tracks
above are used unmodified under the Newgrounds CC BY-NC-SA 3.0 terms and that
permission. They are **not** cleared for a monetized or commercial release; if
this project is ever sold or monetized, replace them or obtain a license from
the artists first. The tracks remain under their own license; the game does not
claim ownership of them.

NemesisTheory's "Rose at Midnight (BLACK ROSE Ver.)" is the 2023 re-recording of
the 2008 original and is published under CC BY 3.0 (attribution only).

"Rose at Nightfall" and "Rose at Twilight" use the 2025/2026 **BLACK ROSE Ver.**
recordings, which are CC-licensed. The 2008 originals on Newgrounds are **not**
included because their licensing terms require contacting the artist first.

`audio/manifest.json` groups the music into small per-theme playlists. The game
plays through the list and advances to the next track when a song ends, instead
of looping one file forever. The synthesized fallback remains available.

## Efeitos / Sound effects

The sound-effect library is **CC0 1.0** (public domain dedication) unless noted:

- **Kenney — Interface Sounds**  
  <https://kenney.nl/assets/interface-sounds>  
  License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

- **Wayzata Technology — Sound Effects / Sound Effects 2**  
  <https://archive.org/details/Sound_Effects>  
  <https://archive.org/details/Sound_Effects_2>  
  License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

- **56k Dialup Modem Sound**  
  <https://archive.org/details/56kModem56kDialupModemSound>  
  License: [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)

Files used: `click`, `digital-beep`, `wrong`, `telegram`, `camera`,
`slide-whistle`, `boink`, `boing`, `splash`, `big-splash`, `wave`, `tada`,
`space-gun`, `laser`, `wind-chime`, `type-return`, `phone`, `ding`, `pop`,
`buzzer`, `chime`, `whoosh`, `coin`, `dialup`, plus the CC0 Kenney UI set
(`kenney-click`, `kenney-confirm`, `kenney-error`, `kenney-open`).

The old spoken-word cues (`yes`, `uh-oh`) and the crowd `applause` are no
longer in the mix: they were the loudest, most grating part of the game.

The synthesized fallback in `js/engine/audio.js` remains available if a sample
fails to load or the browser blocks audio.

## Pedido de remoção / Takedown request

If you are a creator (or represent one) and want a track or sound removed:

1. Open an issue in this project or contact the project maintainer.
2. Include the track/sound name and the source URL above.
3. We will remove the file and its manifest entry from the next build.

No license fee is claimed over the credited works. All rights remain with their
respective creators. The code and original art of SURFN 2000 belong to
FloatingSkies (Arikcnovais / azzynovais) and are separate from these audio
assets, which stay under the licenses listed above.
