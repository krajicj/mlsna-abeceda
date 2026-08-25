# Mlsná abeceda

A small educational web game for a preschooler: animals visit a magic kitchen and order cakes,
ice creams and other treats, and the child fulfils the orders — counting fruit and picking the
gingerbread cookie with the right letter — and learns digits and letters along the way.
The game speaks Czech and contains no readable UI text: every instruction is voice and picture.

Live: https://krajicj.github.io/mlsna-abeceda/

Static site, no backend, no runtime dependencies, no external requests. Progress is kept in
`localStorage`.

## Development

The whole toolchain runs in Docker; nothing from npm is ever installed or executed on the host.

```
docker compose build                     # toolchain image (Node 22 by digest + pinned pnpm)
docker compose run --rm install pnpm install   # first time (no lockfile yet)
docker compose run --rm install          # afterwards: pnpm install --frozen-lockfile
docker compose --profile dev up          # dev server → http://localhost:5173/mlsna-abeceda/
docker compose run --rm test             # vitest
docker compose run --rm check            # tsc + prettier
docker compose run --rm build            # vite build → dist/
docker compose run --rm voice --dry-run  # what the missing voice lines would cost
docker compose run --rm voice            # generate them into public/audio/voice/
docker compose run --rm normalize        # re-gain the committed clips to a common loudness
```

The dev, test, check and build containers have no network access, run as a non-root user and
install only package versions older than 14 days. Why: see `CLAUDE.md › Supply-chain security`.

## Voice

The game speaks Czech and every sentence is a pre-generated MP3 — the running game makes no
requests and needs no key. The manifest of all lines is `src/data/lines.cs.ts` and the narrators
are listed in `src/data/voices.ts`; each one gets a full set of clips in
`public/audio/voice/<slug>/`, so more voices can be added later and the child can pick one.
Adding a line or a voice means editing those tables and running `docker compose run --rm voice`,
which generates only what changed (the fingerprints live in `public/audio/voice/index.json`).
Sentences are always generated whole: Czech declines, so fragments must never be stitched
together at playback. Every clip also goes through a loudness pass (ffmpeg, EBU R128, -18 LUFS with
a -1.5 dBTP ceiling, one constant gain per clip — no compression): the API returns each sentence at
its own level, and without it "Jedna." was 15 dB quieter than "Ef je tady!".

The clips are produced with [ElevenLabs](https://elevenlabs.io) and committed. The API key lives
outside this repository, in `~/.config/mlsna-abeceda/elevenlabs.env`, and reaches only the `voice`
container.

## Documentation

Game design and roadmap live in `docs/` (in Czech): `docs/navrh-hry.md`, `docs/plan.md`.

## License

Code: MIT (`LICENSE`). Graphics and audio: CC BY-NC 4.0 (`LICENSE-ASSETS.md`).
