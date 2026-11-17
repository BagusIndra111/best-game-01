// Starfall Salvage — the entrypoint (Node 22, standard library only).
// It hands the game in: the static files under game/ and the screenshots/
// beside this file are copied to the output directory, and dossier.json is
// written there with the vendored make.fun library, so the judge can read the
// game without ever running it.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's caps, exactly as the bounty states them: the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB each, and game/ holds
// at most 993 entries and 48 MiB, with no path longer than 1000 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIntoOut(name: string) {
  const source = join(repoRoot, name);
  if (existsSync(source)) cpSync(source, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyIntoOut('game');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyIntoOut('screenshots');

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
