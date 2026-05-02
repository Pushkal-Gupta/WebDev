# Frost Fight — ambient bed

Drop a single ambient music loop here as `bed.mp3`. The game probes
this file at startup; if present, `frostMusic.start()` plays it on a
loop with per-room playback-rate variation. If absent, the WebAudio
synth bed falls back automatically — no code changes needed.

## Source recommendation

Use a CC0 / public-domain track from one of:

- [Pixabay free game music](https://pixabay.com/music/search/genre/ambient/) — CC0
- [Kevin MacLeod — Snowfall](https://incompetech.com/music/royalty-free/) — CC-BY (add attribution)
- [Free Music Archive — Ambient](https://freemusicarchive.org/genre/Ambient/) — varies

Target spec: 30–90 s loop, ambient / cinematic / low-BPM, ice or
fantasy mood, mastered around -16 LUFS, MP3 192 kbps stereo.

## Attribution

If the chosen track is CC-BY, add a credit line to
`docs/THIRD_PARTY_ASSETS.md` (artist, title, license, source URL).
CC0 tracks don't strictly require attribution but a credit is welcome.
