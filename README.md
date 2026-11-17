# Starfall Salvage

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/BagusIndra111/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/BagusIndra111/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original arcade game for the make.fun **best-game-01** bounty: pilot a
salvage skiff along the bottom of the screen, catch falling star-shards for
score, and dodge the tumbling debris that wants your hull.

## How to play

- **Move** — `←` `→` or `A` `D`, or move the mouse. The skiff eases toward the pointer.
- **Catch shards** — each one pays 10 points times your combo. Catch shards in a row and the combo climbs to x5; let one hit the ground and the combo breaks.
- **Dodge debris** — a hit costs 1 hull. You have 3. A shield power-up absorbs one hit for free.
- **Power-ups** — Shield (one free hit), Magnet (pulls shards toward you for 7s), Slow-Time (falling slows for 6s).
- **Waves** — catch the wave's quota of shards to clear it. Waves get faster and denser. Clear wave 10 to win the run — or keep salvaging endlessly.
- **Pause** `P` / `Esc` · **Mute** `M` · **Restart** `R` on the game-over screen.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network
requests, no libraries. Sound is synthesized live with WebAudio.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=pqve0qe3&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
