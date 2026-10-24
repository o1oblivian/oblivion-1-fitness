import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';

/** Each file shows one movement. The first matching name wins. */
const STILL = {
  bench: '/photos/exercise-push.jpg',
  ohp: '/photos/exercise-ohp.jpg',
  incline: '/photos/exercise-incline-f.jpg',
  dip: '/photos/exercise-dip.jpg',
  pushup: '/photos/exercise-pushup-f.jpg',
  row: '/photos/exercise-pull.jpg',
  pullup: '/photos/exercise-pullup-f.jpg',
  curl: '/photos/exercise-curl.jpg',
  raise: '/photos/exercise-raise-f.jpg',
  tricep: '/photos/exercise-tricep-f.jpg',
  squat: '/photos/exercise-squat.jpg',
  lunge: '/photos/exercise-lunge-f.jpg',
  deadlift: '/photos/exercise-hinge.jpg',
  hipthrust: '/photos/exercise-hipthrust-f.jpg',
  swing: '/photos/exercise-swing-f.jpg',
  carry: '/photos/exercise-carry.jpg',
  core: '/photos/exercise-core-f.jpg',
  run: '/photos/exercise-run.jpg',
  bike: '/photos/exercise-bike.jpg',
  rower: '/photos/exercise-rower-f.jpg',
  ski: '/photos/exercise-ski-f.jpg',
  sled: '/photos/exercise-sled.jpg',
  jump: '/photos/exercise-jump.jpg',
  mobility: '/photos/exercise-mobility-f.jpg',
} as const;

type StillKey = keyof typeof STILL;

const PATTERN: Record<string, StillKey> = {
  push: 'bench',
  pull: 'row',
  squat: 'squat',
  hinge: 'deadlift',
  carry: 'carry',
  core: 'core',
  locomotion: 'run',
  mobility: 'mobility',
};

/** More specific movements come first so "incline curl" is a curl, not a press. */
const RULES: ReadonlyArray<readonly [RegExp, StillKey]> = [
  [/ski/, 'ski'],
  [/rower|rowing|row erg/, 'rower'],
  [/bike|assault|echo bike|\bcycle\b/, 'bike'],
  [/sled/, 'sled'],
  [/pull-?up|chin-?up|pulldown/, 'pullup'],
  [/curl-up|crunch|sit-?up|plank|leg raise|dead bug|rollout|pallof|woodchop|ab wheel|bird-dog|side bridge|dragon flag|hollow/, 'core'],
  [/curl/, 'curl'],
  [/pushdown|tricep|skull|tate press|jm press/, 'tricep'],
  [/\bdip/, 'dip'],
  [/face pull|lateral raise|rear delt|y-raise|w-raise/, 'raise'],
  [/flye?|push-?up|pushup/, 'pushup'],
  [/hip thrust/, 'hipthrust'],
  [/swing/, 'swing'],
  [/lunge|split squat|step-?up|bulgarian/, 'lunge'],
  [/leg press|squat|wall ball/, 'squat'],
  [/deadlift|romanian|\brdl\b|good morning|nordic|leg curl/, 'deadlift'],
  [/carry|farmer|suitcase/, 'carry'],
  [/overhead|military|shoulder press|z-press|push press|\bjerk\b/, 'ohp'],
  [/incline/, 'incline'],
  [/bench|floor press|chest press/, 'bench'],
  [/\brow\b/, 'row'],
  [/jump|burpee|bound|\bhop\b|pogo/, 'jump'],
  [/sprint|\brun\b|shuttle|agility|treadmill/, 'run'],
  [/stretch|mobil|yoga|breath|cat-cow|couch|pigeon|90\/90|hip flexor/, 'mobility'],
];

const byName = new Map(EXERCISE_DATABASE.map((exercise) => [exercise.name.toLowerCase(), exercise]));

/** Photo of the movement this exercise actually is. */
export function exerciseStill(name: string, pattern?: string): string {
  const n = name.toLowerCase();
  for (const [rule, key] of RULES) {
    if (rule.test(n)) return STILL[key];
  }
  const known = String(pattern || byName.get(n.trim())?.movementPattern || '');
  if (known in PATTERN) return STILL[PATTERN[known]];
  const discipline = byName.get(n.trim())?.discipline;
  if (discipline === 'recovery') return STILL.mobility;
  if (discipline === 'sports') return STILL.run;
  return STILL.bench;
}
