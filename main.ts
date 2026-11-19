// Beach Heist entry for gta6-cover-art-01 (Node 22, standard library only).
// This program is the entrypoint that hands the app in: it copies this repo's
// app/ and screenshots/ into the output folder and writes /output/dossier.json,
// the summary the judge reads, using the vendored make.fun dossier library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The app itself is plain static files (app/index.html plus its ES modules) that
// run offline in a desktop browser with no network request: a three-band beach
// cover maker — sky, pier and sand — where the user loads their own photos,
// crops and positions each band, writes a sticker-style caption, and exports
// a PNG in 1080x1080, 1080x1350 or 1920x1080. Its two sample photos under
// app/samples/ were made for make.fun with an image model and are free to use.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps (from the kit's reference/gate.json): text_max_bytes shapes
// the dossier text; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB; app/ over 993 files or 48 MiB in
// all, or a path under app/ over 1000 bytes. app/ counts beside /output's own
// 1000-entry cap, shared with screenshots/ and dossier.json.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
