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
```

The dev, test, check and build containers have no network access, run as a non-root user and
install only package versions older than 14 days. Why: see `CLAUDE.md › Supply-chain security`.

## Documentation

Game design and roadmap live in `docs/` (in Czech): `docs/navrh-hry.md`, `docs/plan.md`.

## License

Code: MIT (`LICENSE`). Graphics and audio: CC BY-NC 4.0 (`LICENSE-ASSETS.md`).
