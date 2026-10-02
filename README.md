# ascii-spotify

A paper-and-ink editorial theme for Spotify (Spicetify): warm paper, near-black ink,
a single restrained green accent, Fragment Mono, and sparse delicate ASCII line
rendered from album art.

## Features

- **ASCII plate** on Home: the currently playing album cover is dithered into
  characters and printed as a signed, framed "plate". Click it to re-roll a random
  cover; keyboard accessible (Enter/Space).
- **Retro vinyl deck**: a 33⅓ RPM turntable showing the current track — spinning
  disc with cover artwork, swinging tonearm, and a "SIDE A" caption strip.
- **Album ASCII on hover/focus** for card rows; a blinking playing indicator.
- **Auto-adaptive dither**: each cover is classified (dark/mid/light) and tuned so
  highlights hold and shadows stay hairline-delicate.
- **Settings built in**: open the profile (account) menu → *ASCII EDITION* to toggle
  the plate, the vinyl deck, auto-tune, paper grain, and motion at runtime. Choices persist.
- **Moods**: *ASCII EDITION → MOOD* lets you pick the palette — Studio, Morning Edition,
  Neon Dusk, After Hours, Forest Floor, Midnight Press. The theme never changes color on
  its own; whatever mood you select stays until you pick another.
- **Instrument Serif** for editorial headings (paired with Fragment Mono).

## Install

Requires [Spicetify](https://spicetify.app/).

```sh
mkdir -p ~/.config/spicetify/Themes ~/.config/spicetify/Extensions
cp -r Themes/ASCII ~/.config/spicetify/Themes/
cp Extensions/ascii-ink.js ~/.config/spicetify/Extensions/
```

then in `~/.config/spicetify/config-xpui.ini`:

```ini
[Setting]
current_theme = ASCII
color_scheme  = paper-ink

[AdditionalOptions]
extensions = ascii-ink.js
```

Apply and restart:

```sh
spicetify apply
```

## Structure

- `Themes/ASCII/user.css` — theme, plate/card/vinyl styles, motion.
- `Themes/ASCII/color.ini` — `[paper-ink]` color scheme.
- `Extensions/ascii-ink.js` — ordered-dither renderer, adaptive tuning, UI.