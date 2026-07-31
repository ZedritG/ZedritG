import { readFile, writeFile } from 'node:fs/promises';

const files = process.argv.slice(2);
const factor = Number(process.env.SNAKE_SPEED_FACTOR ?? '1.4');

if (!files.length) {
  throw new Error('Pass at least one generated SVG path.');
}

if (!Number.isFinite(factor) || factor <= 1) {
  throw new Error('SNAKE_SPEED_FACTOR must be a number greater than 1.');
}

for (const file of files) {
  const source = await readFile(file, 'utf8');
  let replacements = 0;
  const slowed = source.replace(/(\d+)ms/g, (_, duration) => {
    replacements += 1;
    return `${Math.round(Number(duration) * factor)}ms`;
  });

  if (!replacements) {
    throw new Error(`No animation durations found in ${file}.`);
  }

  await writeFile(file, slowed, 'utf8');
  console.log(`${file}: slowed ${replacements} animation durations by ${factor}x`);
}
