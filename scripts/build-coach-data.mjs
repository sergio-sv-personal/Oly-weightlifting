// Assembles public/coach-data.json — a single machine-readable bundle of
// the full training history, served at /coach-data.json. Runs automatically
// before every build (npm prebuild), so the feed always matches the site.
// Consumed by Sergio's "Oly Coach" AI assistant (and anything else).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const checkinsDir = join(root, 'docs', 'checkins');
let checkins = [];
try {
  checkins = readdirSync(checkinsDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ file: f, markdown: readFileSync(join(checkinsDir, f), 'utf8') }));
} catch {
  // no check-ins archived yet
}

const bundle = {
  meta: {
    athlete: 'Sergio',
    coach: 'Seb',
    bodyweightKg: 80,
    generatedAt: new Date().toISOString(),
    source: 'https://oly-weightlifting.vercel.app',
    notes:
      'Entries in videos[] are per-set; sets group by (lift, date). Tags carry week/cycle/location. ' +
      'Weights in kg. whoopDays keyed by wake date. maxes history is append-only; ref = program reference, est = estimated, otherwise tested.',
  },
  health: {
    concerns: [
      'Left knee ITB pain, progressively worsening as of Aug 2026 — flagged to coach in the cycle 2 check-in.',
    ],
  },
  maxes: read('src/maxes.json'),
  athleteNotes: read('src/coachNotes.json'),
  dayNotes: read('src/dayNotes.json'),
  whoopDays: read('src/whoopDays.json'),
  crossfitSessions: read('src/crossfitSessions.json'),
  videos: read('src/videos.json'),
  checkins,
};

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public', 'coach-data.json'), JSON.stringify(bundle));
console.log(
  `coach-data.json written: ${bundle.videos.length} sets, ${Object.keys(bundle.crossfitSessions).length} classes, ${checkins.length} check-in(s)`,
);
